import type { HiddenOpportunity, HiddenOpportunitySource } from "./types";

/** Subreddits focused on employers posting roles (not career advice or resume subs). */
export const REDDIT_HIRING_SUBREDDITS = [
  "forhire",
  "hiring",
  "jobbit",
  "freelance_forhire",
  "remotejobs",
  "remotework",
  "digitalnomad",
  "workonline",
  "Jobs4Bitcoins",
  "slavelabour",
  "gameDevClassifieds",
  "designjobs",
  "webdevjobs",
  "devopsjobs",
  "sysadminjobs",
  "marketingjobs",
  "techjobs",
  "NonTechJobs",
  "jobopenings",
  "salesjobs",
  "recruiting",
] as const;

export type HiringPostKind = "employer" | "candidate" | "discussion";

const CANDIDATE_TITLE_FLAIRS = [
  /^\[for hire\]/i,
  /^\[forhire\]/i,
  /^\[available\]/i,
  /^\[seeking\]/i,
  /^\[open to work\]/i,
];

const EMPLOYER_TITLE_FLAIRS = [
  /^\[hiring\]/i,
  /^\[hire\]/i,
  /^\[job\]/i,
  /^\[paid\]/i,
  /^\[paid project\]/i,
  /^\[offer\]/i,
];

const STRONG_CANDIDATE = [
  /\bwho wants to be hired\b/i,
  /\bavailable for hire\b/i,
  /\bopen to work\b/i,
  /\bopen to opportunities\b/i,
  /\bseeking (work|employment|a job|full[- ]?time|remote work)\b/i,
  /\blooking for (work|a job|employment|an opportunity|opportunities|my next)\b/i,
  /\bhire me\b/i,
  /\bmy resume\b/i,
  /\bportfolio:\s*/i,
  /\bi(?:'m| am) (?:a |an )?(?:senior |junior )?(?:developer|engineer|designer|marketer|writer).{0,40}\blooking for (?:work|a job)\b/i,
  /\bcandidate (available|seeking)\b/i,
  /\bneed (a |an )?job\b/i,
  /\bjob search\b/i,
  /\bunemployed\b/i,
  /\blaid off\b/i,
];

const STRONG_EMPLOYER = [
  /^\[hiring\]/i,
  /\bwe(?:'re| are) hiring\b/i,
  /\bnow hiring\b/i,
  /\bhiring:\s*/i,
  /\bjob opening\b/i,
  /\bposition (?:is )?open\b/i,
  /\b(?:is|are) hiring\b/i,
  /\blooking for (?:a |an |experienced |senior |junior |mid[- ]?level )?(?:remote )?(?:full[- ]?stack |frontend |backend |software |data |product |marketing |sales |devops |designer|developer|engineer|writer|marketer|candidate|freelancer|contractor)\b/i,
  /\bseeking (?:a |an |experienced |senior |junior )?(?:remote )?(?:developer|engineer|designer|freelancer|contractor|candidate)\b/i,
  /\bjoin our team\b/i,
  /\bapply (?:at|here|via|now)\b/i,
  /\bsend (?:us )?your (?:resume|cv|portfolio)\b/i,
  /\bcompensation:\s*/i,
  /\bsalary(?:\s+range)?:\s*/i,
  /\bpaid (?:position|role|gig|project)\b/i,
  /\b(?:full|part)[- ]?time (?:role|position|job)\b/i,
  /\bcontract (?:role|position|opportunity)\b/i,
  /\burgent(?:ly)? hiring\b/i,
  /\brecruiting for\b/i,
];

const DISCUSSION_ONLY = [
  /\bresume review\b/i,
  /\binterview (?:tips|prep|advice)\b/i,
  /\bcareer (?:advice|change|path)\b/i,
  /\bama\b/i,
  /\bweekly (?:thread|discussion)\b/i,
  /\bmeta\b/i,
  /\boff topic\b/i,
];

function compactText(...parts: Array<string | undefined | null>): string {
  return parts
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

/**
 * Classify a community post as employer hiring vs candidate self-promotion vs noise.
 */
export function classifyHiringPost(input: {
  title: string;
  body?: string;
  subreddit?: string;
  source?: HiddenOpportunitySource;
  linkFlair?: string;
}): HiringPostKind {
  const title = input.title.trim();
  const body = (input.body ?? "").trim();
  const flair = (input.linkFlair ?? "").trim();
  const hay = compactText(title, body, flair).toLowerCase();
  const titleHay = title.toLowerCase();

  if (!title || title.length < 8) return "discussion";

  if (hasAny(titleHay, CANDIDATE_TITLE_FLAIRS)) return "candidate";
  if (hasAny(titleHay, EMPLOYER_TITLE_FLAIRS)) return "employer";

  if (/\bfor hire\b/i.test(titleHay) && !/\bhiring\b/i.test(titleHay)) return "candidate";
  if (/\bhiring\b/i.test(titleHay) && !/\bfor hire\b/i.test(titleHay)) return "employer";

  if (hasAny(hay, DISCUSSION_ONLY) && !hasAny(hay, STRONG_EMPLOYER)) return "discussion";

  const sub = (input.subreddit ?? "").toLowerCase().replace(/^r\//, "");

  if (sub === "forhire" || sub === "freelance_forhire") {
    if (hasAny(titleHay, EMPLOYER_TITLE_FLAIRS)) return "employer";
    if (hasAny(hay, STRONG_CANDIDATE)) return "candidate";
    if (hasAny(hay, STRONG_EMPLOYER)) return "employer";
    return "discussion";
  }

  if (hasAny(hay, STRONG_CANDIDATE) && !hasAny(hay, STRONG_EMPLOYER)) return "candidate";
  if (hasAny(hay, STRONG_EMPLOYER)) return "employer";

  if (sub === "hiring" || sub === "jobbit" || sub.endsWith("jobs")) {
    if (hasAny(hay, STRONG_CANDIDATE)) return "candidate";
    if (/\b(remote|engineer|developer|designer|marketing|sales|analyst|manager|role|position)\b/i.test(hay)) {
      return "employer";
    }
  }

  if (input.source === "hackernews") {
    if (/\bwho is hiring\b/i.test(titleHay)) return "employer";
    if (/\bwho wants to be hired\b/i.test(titleHay)) return "candidate";
    if (hasAny(hay, STRONG_EMPLOYER)) return "employer";
    if (hasAny(hay, STRONG_CANDIDATE)) return "candidate";
  }

  if (input.source === "github") {
    if (hasAny(hay, STRONG_CANDIDATE) && !hasAny(hay, STRONG_EMPLOYER)) return "candidate";
    if (hasAny(hay, STRONG_EMPLOYER)) return "employer";
    if (/\bhiring\b/i.test(hay)) return "employer";
    return "discussion";
  }

  return "discussion";
}

export function isEmployerHiringPost(input: {
  title: string;
  body?: string;
  subreddit?: string;
  source?: HiddenOpportunitySource;
  linkFlair?: string;
  tags?: string[];
}): boolean {
  if (input.tags?.includes("for-hire")) return false;
  return classifyHiringPost(input) === "employer";
}

export function isEmployerHiringOpportunity(opp: HiddenOpportunity): boolean {
  if (opp.tags.includes("for-hire")) return false;
  if (opp.category === "candidate") return false;

  const subreddit =
    opp.source === "reddit"
      ? opp.category || opp.tags.find((t) => !["reddit", "hiring", "for-hire"].includes(t))
      : undefined;

  return isEmployerHiringPost({
    title: opp.title,
    subreddit,
    source: opp.source,
    tags: opp.tags,
  });
}

export function filterEmployerHiringOpportunities(items: HiddenOpportunity[]): HiddenOpportunity[] {
  return items.filter(isEmployerHiringOpportunity);
}
