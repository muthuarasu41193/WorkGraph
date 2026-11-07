import * as React from "react";
import { cn } from "@/lib/utils";

export const TEXT_ROLES = [
  "display",
  "title",
  "heading",
  "h1",
  "h2",
  "subheading",
  "card-title",
  "body",
  "body-lg",
  "body-small",
  "caption",
  "button",
  "code",
] as const;

export type TextRole = (typeof TEXT_ROLES)[number];

const DEFAULT_TAG: Record<TextRole, keyof React.JSX.IntrinsicElements> = {
  display: "h1",
  title: "h1",
  heading: "h1",
  h1: "h1",
  h2: "h2",
  subheading: "h2",
  "card-title": "h3",
  body: "p",
  "body-lg": "p",
  "body-small": "p",
  caption: "p",
  button: "span",
  code: "code",
};

/** Roles that share a class with another canonical role. */
const ROLE_CLASS: Record<TextRole, string> = {
  display: "text-role-display",
  title: "text-role-title",
  heading: "text-role-title",
  h1: "text-role-title",
  h2: "text-role-subheading",
  subheading: "text-role-subheading",
  "card-title": "text-role-card-title",
  body: "text-role-body",
  "body-lg": "text-role-body-lg",
  "body-small": "text-role-body",
  caption: "text-role-caption",
  button: "text-role-button",
  code: "text-role-code",
};

function withoutFontSize(className?: string) {
  if (!className) return className;
  return className
    .replace(/\btext-(?:xs|sm|base|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/g, "")
    .replace(/\btext-\[[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const Text = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & {
  role: TextRole;
  as?: keyof React.JSX.IntrinsicElements;
}>(function Text({ role, as, className, ...props }, ref) {
  const Comp = (as ?? DEFAULT_TAG[role]) as React.ElementType;
  return (
    <Comp
      ref={ref}
      className={cn(ROLE_CLASS[role], withoutFontSize(className))}
      {...props}
    />
  );
});
