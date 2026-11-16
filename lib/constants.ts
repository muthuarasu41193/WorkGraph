import { messages } from "@/lib/messages"
import { getSiteUrl } from "./site-url";

export const SITE = {
  name: "WorkGraph",
  tagline: "Interview prep and a live job index",
  description:
    "Build a free interview prep pack, read Interview Vault guides, and search the live job index. Match notes and skill gaps are estimates.",
  url: getSiteUrl(),
  email: "hello@getworkgraph.com",
} as const;

export const NAV_ITEMS = [
  { label: "Prep pack", href: "/prep-pack" },
  { label: "Interview Vault", href: "/interview-vault" },
  { label: "Jobs", href: "/jobs" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/#contact" },
] as const;

export const NAV_ANNOUNCEMENT = {
  message: messages.announceMessage,
  cta: messages.announceCta,
  href: "/waitlist",
} as const;

export const ANNOUNCEMENT = {
  message: "Build a free interview prep pack",
  cta: "Open prep pack",
  href: "/prep-pack",
} as const;

export const HERO = {
  badge: "Interview prep first",
  headline: "Prep for the interview. Then search the index.",
  subheadline:
    "Build a free prep pack from a role or posting, open matching Interview Vault guides, and browse the live job index when you are ready.",
  primaryCta: { label: "Build a prep pack", href: "/prep-pack" },
  secondaryCta: { label: "Browse Interview Vault", href: "/interview-vault" },
  stats: [
    { value: "Prep pack", label: "Skills, guides, checklist" },
    { value: "Interview Vault", label: "Firsthand guides" },
    { value: "Job index", label: "Search when you need it" },
  ],
} as const;

export const FEATURES = [
  {
    icon: "Vault" as const,
    title: "Interview prep pack",
    description:
      "Paste a posting or choose a role. You get a skills estimate, matching published guides, and a checklist. Estimates only — not a hiring probability.",
    accent: "success",
  },
  {
    icon: "Brain" as const,
    title: "Interview Vault",
    description:
      "Read firsthand interview guides from contributors. Paid guides unlock after entitlement checks. Selling a guide does not promise income.",
    accent: "blue",
  },
  {
    icon: "Radar" as const,
    title: "Live job index",
    description:
      "Search listings already in the index. Source links open the original posting. Posted dates are stored dates, not a live verification time.",
    accent: "primary",
  },
  {
    icon: "TrendingUp" as const,
    title: "Resume Intelligence",
    description:
      "Compare a resume to a posting with evidence-based notes. Scores are estimates, not offer odds.",
    accent: "warning",
  },
  {
    icon: "Kanban" as const,
    title: "Application Tracker",
    description: "Log applications and move stages on a Kanban board for roles you already applied to.",
    accent: "primary",
  },
  {
    icon: "Shield" as const,
    title: "Profile",
    description: "Keep skills and experience on your account so match notes have something to compare.",
    accent: "blue",
  },
] as const;

export const STEPS = [
  {
    step: "01",
    title: "Build a prep pack",
    description: "Choose a role or paste a posting. The checklist and guide matches are estimates.",
  },
  {
    step: "02",
    title: "Read Interview Vault guides",
    description: "Open published guides that match. Locked content stays locked without entitlement.",
  },
  {
    step: "03",
    title: "Search the job index",
    description: "Browse listings when you want openings. Apply links go to the original source.",
  },
] as const;

export const CTA = {
  headline: "Start with interview prep",
  subheadline: "Build a free prep pack, then use Interview Vault and the job index as needed.",
  primaryCta: { label: "Build a prep pack", href: "/prep-pack" },
  secondaryCta: { label: "Sign in", href: "/login" },
} as const;

export const FOOTER_LINKS = {
  product: [
    { label: "Prep pack", href: "/prep-pack" },
    { label: "Interview Vault", href: "/interview-vault" },
    { label: "Jobs", href: "/jobs" },
    { label: "Pricing", href: "/pricing" },
  ],
  resources: [
    { label: "Interview Vault", href: "/interview-vault" },
    { label: "Prep pack", href: "/prep-pack" },
    { label: "Job discovery", href: "/discovery" },
    { label: "Create profile", href: "/create-profile" },
    { label: "Employer signup", href: "/employer/signup" },
  ],
  company: [
    { label: "Contact", href: "/#contact" },
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Terms of Service", href: "/legal/terms" },
    { label: "Cookie Policy", href: "/legal/cookies" },
    { label: "Acceptable Use", href: "/legal/acceptable-use" },
    { label: "Data Processing Addendum", href: "/legal/dpa" },
  ],
} as const;

export const SOCIAL_LINKS = [
  { label: "Twitter", href: "https://twitter.com/workgraph" },
  { label: "LinkedIn", href: "https://linkedin.com/company/workgraph" },
  { label: "GitHub", href: "https://github.com/workgraph" },
  { label: "Discord", href: "https://discord.gg/workgraph" },
] as const;

export const CONTACT_INFO = [
  {
    icon: "mail" as const,
    label: "General Inquiries",
    value: "hello@getworkgraph.com",
    href: "mailto:hello@getworkgraph.com",
  },
  {
    icon: "message" as const,
    label: "Support",
    value: "support@getworkgraph.com",
    href: "mailto:support@getworkgraph.com",
  },
  {
    icon: "contact" as const,
    label: "Contact",
    value: "contact@getworkgraph.com",
    href: "mailto:contact@getworkgraph.com",
  },
  {
    icon: "handshake" as const,
    label: "Partnerships & Enterprise",
    value: "partners@getworkgraph.com",
    href: "mailto:partners@getworkgraph.com",
  },
] as const;

export const CONTACT_SUBJECTS = [
  { value: "general", label: "General Question" },
  { value: "support", label: "Technical Support" },
  { value: "partnership", label: "Partnership" },
  { value: "enterprise", label: "Enterprise Plan" },
  { value: "press", label: "Press / Media" },
  { value: "other", label: "Other" },
] as const;
