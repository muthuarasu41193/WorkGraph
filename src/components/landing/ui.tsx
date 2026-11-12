import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";
import "./landing.css";

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "ghost";

export type LandingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

/**
 * Landing-scoped button. Must render inside a `.wg-landing` wrapper
 * so design tokens resolve.
 */
export function Button({
  variant = "primary",
  className,
  type = "button",
  children,
  ...props
}: LandingButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "wg-landing-btn",
        variant === "primary" && "wg-landing-btn--primary",
        variant === "ghost" && "wg-landing-btn--ghost",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export type LandingCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

/**
 * Landing-scoped surface card. Must render inside a `.wg-landing` wrapper.
 */
export function Card({ className, children, ...props }: LandingCardProps) {
  return (
    <div className={cx("wg-landing-card", className)} {...props}>
      {children}
    </div>
  );
}
