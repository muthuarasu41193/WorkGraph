export const SITE = {
  name: "WorkGraph",
  tagline: "AI-powered job intelligence",
  description:
    "Discover hidden roles, sharpen your resume, and make smarter career moves — before everyone else sees the opportunity.",
  url: "https://workgraph.ai",
  email: "hello@workgraph.ai",
} as const;

export const NAV_ITEMS = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Interview Vault", href: "#interview-vault" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
] as const;

export const NAV_ANNOUNCEMENT = {
  message: "Early access · 247 of 500 spots left",
  cta: "Join waitlist →",
  href: "/signup",
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
    { value: "50+", label: "Hidden sources" },
    { value: "3×", label: "Faster discovery" },
    { value: "12k+", label: "Roles tracked" },
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

export const INTELLIGENCE_STATS = [
  { value: "94%", label: "Match accuracy", detail: "on hidden role detection" },
  { value: "2.4h", label: "Avg. time saved", detail: "per job search session" },
  { value: "38%", label: "Higher response rate", detail: "with optimized applications" },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "I found a Staff Engineer role on a Discord server three days before it hit LinkedIn. WorkGraph paid for itself instantly.",
    author: "Priya M.",
    role: "Staff Engineer",
    company: "Series B startup",
  },
  {
    quote:
      "The resume intelligence alone bumped my ATS score from 62 to 91. I started getting callbacks within a week.",
    author: "James K.",
    role: "Product Manager",
    company: "Fintech",
  },
  {
    quote:
      "Interview Vault saved me hours of prep. Real questions from real candidates — nothing else comes close.",
    author: "Sarah L.",
    role: "Data Scientist",
    company: "Enterprise SaaS",
  },
] as const;

export const CTA = {
  headline: "Your next role is already out there",
  subheadline: "Join thousands of professionals using AI to find opportunities others miss.",
  primaryCta: { label: "Get started free", href: "/signup" },
  secondaryCta: { label: "Sign in", href: "/login" },
} as const;

export const FOOTER_LINKS = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Interview Vault", href: "/interview-vault" },
    { label: "Hidden Discovery", href: "/discovery" },
    { label: "Pricing", href: "#" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: `mailto:${SITE.email}` },
  ],
  legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
} as const;
