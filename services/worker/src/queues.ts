import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379/0";

export const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

export const QUEUE_NAMES = {
  scrape: "workgraph:scrape",
  embed: "workgraph:embed",
  ats: "workgraph:ats",
  notify: "workgraph:notify",
  email: "workgraph:email",
} as const;

export function createQueue(name: string) {
  return new Queue(name, { connection });
}

export type ScrapeJobData = { source: string; full?: boolean };
export type EmbedJobData = { batchSize?: number };
export type AtsJobData = { userId: string; resumeText: string; jobDescription: string };

const API_URL = (process.env.WORKGRAPH_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

async function callApi(path: string, init?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${body}`);
  }
  return res.json();
}

export function registerWorkers() {
  const scrapeWorker = new Worker<ScrapeJobData>(
    QUEUE_NAMES.scrape,
    async (job: Job<ScrapeJobData>) => {
      const key = process.env.JOB_AGGREGATOR_API_KEY ?? process.env.CRON_SECRET ?? "";
      const path = job.data.source === "community" ? "/ingest/community" : "/ingest/community";
      await callApi(path, {
        method: "POST",
        headers: {
          Authorization: key ? `Bearer ${key}` : "",
          "Content-Type": "application/json",
        },
      });
      return { ok: true };
    },
    { connection },
  );

  const atsWorker = new Worker<AtsJobData>(
    QUEUE_NAMES.ats,
    async (job: Job<AtsJobData>) => {
      const result = await callApi("/ats/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: job.data.resumeText,
          job_description: job.data.jobDescription,
          user_id: job.data.userId,
        }),
      });
      return result;
    },
    { connection },
  );

  scrapeWorker.on("failed", (job, err) => {
    console.error(`[scrape] job ${job?.id} failed:`, err);
  });
  atsWorker.on("failed", (job, err) => {
    console.error(`[ats] job ${job?.id} failed:`, err);
  });

  return { scrapeWorker, atsWorker };
}
