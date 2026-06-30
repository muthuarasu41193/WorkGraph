import { createClient } from "@supabase/supabase-js";
import type {
  AnalyzeResumeIntelligenceInput,
  AnalyzeResumeIntelligenceResult,
  ResumeIntelligenceReportRow,
} from "../types";
import { TALENT_INTELLIGENCE_PROMPT_VERSION } from "../types";
import { buildCacheKey, hashContent } from "../utils";
import { generateResumeIntelligenceReport } from "./report-generator";
import { TALENT_INTELLIGENCE_MODEL } from "./llm-runner";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase configuration for Talent Intelligence.");
  }
  return createClient(url, key);
}

async function ensureResumeVersion(
  supabase: ReturnType<typeof getServiceClient>,
  input: AnalyzeResumeIntelligenceInput,
): Promise<string> {
  const contentHash = hashContent(input.resumeText);
  const { data: existing } = await supabase
    .from("resume_versions")
    .select("id")
    .eq("user_id", input.userId)
    .eq("content_hash", contentHash)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from("resume_versions")
    .insert({
      user_id: input.userId,
      source: "profile",
      content_hash: contentHash,
      storage_path: input.resumeUrl ?? null,
      parsed_snapshot: input.profileSnapshot ?? {},
    })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Failed to store resume version.");
  }
  return created.id;
}

/**
 * ResumeAnalysisService — orchestrates caching, persistence, and report generation.
 */
export async function analyzeResumeIntelligence(
  input: AnalyzeResumeIntelligenceInput,
): Promise<AnalyzeResumeIntelligenceResult> {
  const supabase = getServiceClient();
  const resumeHash = hashContent(input.resumeText);
  const jdHash = hashContent(input.jobDescription);
  const cacheKey = buildCacheKey(resumeHash, jdHash);

  if (!input.forceRefresh) {
    const { data: cached } = await supabase
      .from("resume_intelligence_reports")
      .select("*")
      .eq("user_id", input.userId)
      .eq("cache_key", cacheKey)
      .eq("status", "completed")
      .maybeSingle();

    if (cached?.report) {
      return {
        reportId: cached.id,
        cached: true,
        report: cached.report as AnalyzeResumeIntelligenceResult["report"],
      };
    }
  }

  const resumeVersionId = await ensureResumeVersion(supabase, input);

  const { data: pending, error: pendingError } = await supabase
    .from("resume_intelligence_reports")
    .upsert(
      {
        user_id: input.userId,
        resume_version_id: resumeVersionId,
        job_id: input.jobId ?? null,
        job_title: input.jobTitle ?? null,
        company: input.company ?? null,
        job_description_text: input.jobDescription,
        job_description_hash: jdHash,
        cache_key: cacheKey,
        status: "processing",
        prompt_version: TALENT_INTELLIGENCE_PROMPT_VERSION,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,cache_key" },
    )
    .select("id")
    .single();

  if (pendingError || !pending) {
    throw new Error(pendingError?.message ?? "Failed to create analysis record.");
  }

  try {
    const { report, llmMetadata } = await generateResumeIntelligenceReport({
      resumeText: input.resumeText,
      jobDescription: input.jobDescription,
      jobTitle: input.jobTitle,
      company: input.company,
      profileSkills: input.profileSnapshot?.skills,
    });

    const { error: updateError } = await supabase
      .from("resume_intelligence_reports")
      .update({
        status: "completed",
        overall_score: report.overallMatch.score,
        report,
        llm_model: TALENT_INTELLIGENCE_MODEL,
        llm_metadata: llmMetadata,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pending.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { reportId: pending.id, cached: false, report };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed.";
    await supabase
      .from("resume_intelligence_reports")
      .update({
        status: "failed",
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pending.id);
    throw err;
  }
}

export async function listResumeIntelligenceReports(
  userId: string,
  limit = 20,
): Promise<ResumeIntelligenceReportRow[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("resume_intelligence_reports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as ResumeIntelligenceReportRow[];
}

export async function getResumeIntelligenceReport(
  userId: string,
  reportId: string,
): Promise<ResumeIntelligenceReportRow | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("resume_intelligence_reports")
    .select("*")
    .eq("user_id", userId)
    .eq("id", reportId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as ResumeIntelligenceReportRow | null) ?? null;
}

export async function deleteResumeIntelligenceReport(
  userId: string,
  reportId: string,
): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("resume_intelligence_reports")
    .delete()
    .eq("user_id", userId)
    .eq("id", reportId);

  if (error) throw new Error(error.message);
}

export async function deleteAllTalentIntelligenceData(userId: string): Promise<void> {
  const supabase = getServiceClient();
  await supabase.from("resume_intelligence_reports").delete().eq("user_id", userId);
  await supabase.from("resume_versions").delete().eq("user_id", userId);
}
