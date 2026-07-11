export type CompanyBrand =
  | "google"
  | "meta"
  | "amazon"
  | "stripe"
  | "netflix"
  | "microsoft"
  | "apple"
  | "airbnb"
  | "databricks"
  | "notion";

export type SourceBrand = "reddit" | "discord" | "x" | "slack" | "linkedin" | "github";

export type SocialBrand = "x" | "linkedin" | "github" | "discord";

export const HIRED_AT_BRANDS: CompanyBrand[] = [
  "google",
  "meta",
  "amazon",
  "stripe",
  "netflix",
  "microsoft",
  "apple",
  "airbnb",
];

export const COMPANY_LABELS: Record<CompanyBrand, string> = {
  google: "Google",
  meta: "Meta",
  amazon: "Amazon",
  stripe: "Stripe",
  netflix: "Netflix",
  microsoft: "Microsoft",
  apple: "Apple",
  airbnb: "Airbnb",
  databricks: "Databricks",
  notion: "Notion",
};

export const SOURCE_LABELS: Record<SourceBrand, string> = {
  reddit: "Reddit",
  discord: "Discord",
  x: "X",
  slack: "Slack",
  linkedin: "LinkedIn",
  github: "GitHub",
};
