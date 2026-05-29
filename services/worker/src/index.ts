import { createQueue, QUEUE_NAMES, registerWorkers } from "./queues.js";

console.log("[workgraph-worker] starting…");
registerWorkers();

const scrapeQueue = createQueue(QUEUE_NAMES.scrape);

/** Schedule recurring community + ATS ingest when CRON enabled */
const cronEnabled = process.env.WORKER_CRON_ENABLED === "true";
if (cronEnabled) {
  const intervalMs = Number(process.env.WORKER_SCRAPE_INTERVAL_MS ?? "3600000");
  setInterval(async () => {
    try {
      await scrapeQueue.add("scheduled-ingest", { source: "all", full: true }, { removeOnComplete: 100 });
      console.log("[workgraph-worker] scheduled scrape enqueued");
    } catch (err) {
      console.error("[workgraph-worker] cron enqueue failed:", err);
    }
  }, intervalMs);
}

console.log("[workgraph-worker] listening on queues:", Object.values(QUEUE_NAMES).join(", "));
