/** ATSAnalyzer — deterministic baseline checks before LLM refinement. */
import type { ATSIndicator } from "../types";

export function runDeterministicAtsChecks(resumeText: string): ATSIndicator[] {
  const indicators: ATSIndicator[] = [];
  const lines = resumeText.split(/\n/).filter(Boolean);
  const wordCount = resumeText.split(/\s+/).length;

  indicators.push({
    category: "Length",
    status: wordCount < 200 ? "critical" : wordCount > 1200 ? "warning" : "good",
    observation: `Resume is approximately ${wordCount} words.`,
    recommendation:
      wordCount < 200
        ? "Add more detail about your genuine experience."
        : wordCount > 1200
          ? "Consider tightening — recruiters scan quickly."
          : "Length is within a typical range.",
  });

  const hasEmail = /[\w.+-]+@[\w.-]+\.\w+/.test(resumeText);
  indicators.push({
    category: "Contact Information",
    status: hasEmail ? "good" : "critical",
    observation: hasEmail ? "Email address detected." : "No email address found.",
    recommendation: hasEmail ? "Ensure contact info is at the top." : "Add a professional email address.",
  });

  const bulletCount = lines.filter((l) => /^[\-*•]/.test(l.trim())).length;
  indicators.push({
    category: "Bullet Quality",
    status: bulletCount >= 5 ? "good" : bulletCount >= 2 ? "warning" : "critical",
    observation: `Found ${bulletCount} bullet-style lines.`,
    recommendation: "Use bullets with action verbs and measurable outcomes where you have them.",
  });

  const actionVerbs = /\b(led|built|designed|implemented|improved|reduced|increased|managed|developed|created)\b/gi;
  const verbMatches = resumeText.match(actionVerbs)?.length ?? 0;
  indicators.push({
    category: "Action Verbs",
    status: verbMatches >= 5 ? "good" : verbMatches >= 2 ? "warning" : "critical",
    observation: `Detected ${verbMatches} common action verbs.`,
    recommendation: "Start bullets with strong verbs describing what you actually did.",
  });

  return indicators;
}
