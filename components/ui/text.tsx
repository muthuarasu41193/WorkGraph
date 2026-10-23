import * as React from "react";
import { cn } from "@/lib/utils";

export const TEXT_ROLES = [
  "display",
  "title",
  "heading",
  "subheading",
  "body",
  "body-small",
  "caption",
  "code",
] as const;

export type TextRole = (typeof TEXT_ROLES)[number];

const DEFAULT_TAG: Record<TextRole, keyof React.JSX.IntrinsicElements> = {
  display: "h1",
  title: "h2",
  heading: "h3",
  subheading: "h4",
  body: "p",
  "body-small": "p",
  caption: "p",
  code: "code",
};

type TextProps = React.HTMLAttributes<HTMLElement> & {
  role: TextRole;
  as?: keyof React.JSX.IntrinsicElements;
};

function withoutFontSize(className?: string) {
  if (!className) return className;
  return className
    .replace(/\btext-(?:xs|sm|base|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/g, "")
    .replace(/\btext-\[[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const Text = React.forwardRef<HTMLElement, TextProps>(function Text(
  { role, as, className, ...props },
  ref,
) {
  const Comp = (as ?? DEFAULT_TAG[role]) as React.ElementType;
  return (
    <Comp
      ref={ref}
      className={cn(`text-role-${role}`, withoutFontSize(className))}
      {...props}
    />
  );
});
