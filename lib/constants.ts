import { getSiteUrl } from "./site-url";

export const SITE = {
  name: "WorkGraph",
  tagline: "AI-powered job intelligence",
  description:
    "Discover hidden roles, sharpen your resume, and make smarter career moves — before everyone else sees the opportunity.",
  url: getSiteUrl(),
  email: "hello@getworkgraph.com",
} as const;

export const NAV_ITEMS = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Interview Vault", href: "#interview-vault" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
] as const;

export const NAV_ANNOUNCEMENT = {
  message: "We launched this month. Be one of the first.",
  cta: "Join waitlist →",
  href: "/waitlist",
} as const;

export const ANNOUNCEMENT = {
  message: "Now scanning 50+ hidden job sources in real time",
  cta: "See what's new",
  href: "#features",
} as const;

export const HERO = {
  badge: "AI Job Intelligence Platform",
  headline: "Find jobs that never hit LinkedIn",
  subheadline:
    "WorkGraph surfaces hidden roles from Reddit, Twitter, Discord, and private networks — then helps you prep, apply, and win.",
  primaryCta: { label: "Start free", href: "/signup" },
  secondaryCta: { label: "See how it works", href: "#how-it-works" },
  stats: [
    { value: "Hidden roles", label: "From public communities" },
    { value: "AI matching", label: "Against your resume" },
    { value: "Interview Vault", label: "Guides you can sell" },
  ],
} as const;

export const FEATURES = [
  {
    icon: "Radar" as const,
    title: "Hidden Job Radar",
    description:
      "AI scans Reddit, Twitter, Discord, and niche communities for roles posted before they reach job boards.",
    accent: "primary",
  },
  {
    icon: "Brain" as const,
    title: "Resume Intelligence",
    description:
      "Get ATS scoring, gap analysis, and tailored rewrites so every application lands with impact.",
    accent: "blue",
  },
  {
    icon: "Vault" as const,
    title: "Interview Vault",
    description:
      "Access real interview experiences from candidates who've been there — and earn by sharing yours.",
    accent: "success",
  },
  {
    icon: "TrendingUp" as const,
    title: "Market Pulse",
    description:
      "Track hiring signals, salary trends, and company momentum so you apply at the right moment.",
    accent: "warning",
  },
  {
    icon: "Kanban" as const,
    title: "Application Tracker",
    description:
      "Kanban-style pipeline with AI nudges — never lose track of where you stand with each company.",
    accent: "primary",
  },
  {
    icon: "Shield" as const,
    title: "Career Graph",
    description:
      "Your skills, experience, and goals mapped into a living profile that gets smarter over time.",
    accent: "blue",
  },
] as const;

export const STEPS = [
  {
    step: "01",
    title: "Connect your profile",
    description: "Upload your resume or build your WorkGraph profile in minutes.",
  },
  {
    step: "02",
    title: "AI scans the market",
    description: "Our engine monitors 50+ sources and matches roles to your skills.",
  },
  {
    step: "03",
    title: "Apply with confidence",
    description: "Get tailored prep, ATS-optimized resumes, and interview intel.",
  },
] as const;

export const CTA = {
  headline: "Your next role is already out there",
  subheadline: "Join WorkGraph to find opportunities others miss.",
  primaryCta: { label: "Get started free", href: "/signup" },
  secondaryCta: { label: "Sign in", href: "/login" },
} as const;

export const FOOTER_LINKS = {
  product: [
    { label: "Features", href: "/#features" },
    { label: "How it Works", href: "/#how-it-works" },
    { label: "Interview Vault", href: "/interview-vault" },
    { label: "Pricing", href: "/#pricing" },
  ],
  resources: [
    { label: "Job discovery", href: "/discovery" },
    { label: "Interview Vault", href: "/interview-vault" },
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
