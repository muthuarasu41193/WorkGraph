export const VAULT_DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type VaultDifficulty = (typeof VAULT_DIFFICULTIES)[number];

export const VAULT_RESULTS = ["offer", "rejected", "ongoing", "withdrawn"] as const;
export type VaultResult = (typeof VAULT_RESULTS)[number];

export const VAULT_STATUSES = ["draft", "published", "archived"] as const;
export type VaultExperienceStatus = (typeof VAULT_STATUSES)[number];

export type VaultRound = {
  name: string;
  description: string;
  duration?: string;
};

export type VaultExperience = {
  id: string;
  seller_id: string;
  company: string;
  role: string;
  level: string | null;
  difficulty: VaultDifficulty | null;
  rounds: number | null;
  result: VaultResult | null;
  interview_date: string | null;
  rounds_data: VaultRound[];
  questions_html: string;
  tips_html: string;
  price_inr: number;
  status: VaultExperienceStatus;
  draft_step: number;
  view_count: number;
  sales_count: number;
  avg_rating: number | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type VaultExperienceListItem = Pick<
  VaultExperience,
  | "id"
  | "seller_id"
  | "company"
  | "role"
  | "level"
  | "difficulty"
  | "rounds"
  | "result"
  | "interview_date"
  | "price_inr"
  | "view_count"
  | "sales_count"
  | "avg_rating"
  | "published_at"
  | "questions_html"
  | "tips_html"
  | "rounds_data"
>;

export type VaultExperienceInsert = {
  company?: string;
  role?: string;
  level?: string | null;
  difficulty?: VaultDifficulty | null;
  rounds?: number | null;
  result?: VaultResult | null;
  interview_date?: string | null;
  rounds_data?: VaultRound[];
  questions_html?: string;
  tips_html?: string;
  price_inr?: number;
  status?: VaultExperienceStatus;
  draft_step?: number;
};

export type VaultReview = {
  id: string;
  experience_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type VaultPurchase = {
  id: string;
  experience_id: string;
  buyer_id: string;
  amount_inr: number;
  created_at: string;
};

export type VaultDashboardStats = {
  total_earnings_inr: number;
  total_views: number;
  total_sales: number;
  experiences: Array<
    VaultExperienceListItem & {
      earnings_inr: number;
    }
  >;
  sales_by_day: Array<{ date: string; sales: number; earnings_inr: number }>;
};

export const VAULT_DIFFICULTY_LABELS: Record<VaultDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const VAULT_RESULT_LABELS: Record<VaultResult, string> = {
  offer: "Got Offer",
  rejected: "Rejected",
  ongoing: "Ongoing",
  withdrawn: "Withdrawn",
};

export const VAULT_SELL_STEPS = [
  { id: 0, label: "Company" },
  { id: 1, label: "Role" },
  { id: 2, label: "Rounds" },
  { id: 3, label: "Questions" },
  { id: 4, label: "Tips" },
  { id: 5, label: "Pricing" },
] as const;

export function isVaultDifficulty(value: string): value is VaultDifficulty {
  return (VAULT_DIFFICULTIES as readonly string[]).includes(value);
}

export function isVaultResult(value: string): value is VaultResult {
  return (VAULT_RESULTS as readonly string[]).includes(value);
}

export function isVaultStatus(value: string): value is VaultExperienceStatus {
  return (VAULT_STATUSES as readonly string[]).includes(value);
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildFullContent(experience: Pick<VaultExperience, "rounds_data" | "questions_html" | "tips_html">): string {
  const parts: string[] = [];

  if (experience.rounds_data.length > 0) {
    parts.push("<h2>Interview Rounds</h2>");
    for (const round of experience.rounds_data) {
      parts.push(`<h3>${round.name}</h3>`);
      if (round.duration) parts.push(`<p><em>Duration: ${round.duration}</em></p>`);
      if (round.description) parts.push(`<p>${round.description}</p>`);
    }
  }

  if (experience.questions_html.trim()) {
    parts.push("<h2>Questions Asked</h2>");
    parts.push(experience.questions_html);
  }

  if (experience.tips_html.trim()) {
    parts.push("<h2>Tips & Preparation</h2>");
    parts.push(experience.tips_html);
  }

  return parts.join("\n");
}

export function buildPreviewContent(fullHtml: string, ratio = 0.2): string {
  const plain = stripHtml(fullHtml);
  if (!plain) return "";
  const cut = Math.max(120, Math.floor(plain.length * ratio));
  const preview = plain.slice(0, cut);
  return preview.length < plain.length ? `${preview}…` : preview;
}

export function mapVaultExperienceRow(row: Record<string, unknown>): VaultExperience {
  return {
    id: String(row.id),
    seller_id: String(row.seller_id),
    company: String(row.company ?? ""),
    role: String(row.role ?? ""),
    level: row.level != null ? String(row.level) : null,
    difficulty: row.difficulty != null && isVaultDifficulty(String(row.difficulty)) ? (row.difficulty as VaultDifficulty) : null,
    rounds: typeof row.rounds === "number" ? row.rounds : row.rounds != null ? Number(row.rounds) : null,
    result: row.result != null && isVaultResult(String(row.result)) ? (row.result as VaultResult) : null,
    interview_date: row.interview_date != null ? String(row.interview_date) : null,
    rounds_data: Array.isArray(row.rounds_data) ? (row.rounds_data as VaultRound[]) : [],
    questions_html: String(row.questions_html ?? ""),
    tips_html: String(row.tips_html ?? ""),
    price_inr: Number(row.price_inr ?? 0),
    status: isVaultStatus(String(row.status)) ? (row.status as VaultExperienceStatus) : "draft",
    draft_step: Number(row.draft_step ?? 0),
    view_count: Number(row.view_count ?? 0),
    sales_count: Number(row.sales_count ?? 0),
    avg_rating: row.avg_rating != null ? Number(row.avg_rating) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    published_at: row.published_at != null ? String(row.published_at) : null,
  };
}

export function mapVaultReviewRow(row: Record<string, unknown>): VaultReview {
  return {
    id: String(row.id),
    experience_id: String(row.experience_id),
    user_id: String(row.user_id),
    rating: Number(row.rating),
    comment: row.comment != null ? String(row.comment) : null,
    created_at: String(row.created_at),
  };
}

export type VaultListFilters = {
  q?: string;
  difficulty?: VaultDifficulty;
  rounds?: number;
  result?: VaultResult;
  date_from?: string;
  date_to?: string;
};

export const VAULT_LIST_SELECT =
  "id,seller_id,company,role,level,difficulty,rounds,result,interview_date,price_inr,view_count,sales_count,avg_rating,published_at,questions_html,tips_html,rounds_data";
