import { platformBrandColors } from "@/lib/tokens/brands";

type Props = {
  className?: string;
};

/** Reddit Snoo mark — uses platform brand token */
export function RedditLogo({ className = "h-4 w-4" }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" fill={platformBrandColors.reddit} />
      <circle cx="9" cy="12.5" r="1.3" fill="white" />
      <circle cx="15" cy="12.5" r="1.3" fill="white" />
      <path
        d="M8.4 15.3c1 .8 2.2 1.2 3.6 1.2s2.6-.4 3.6-1.2"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9.8 9.6 10.7 7l3 .6"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16.8" cy="8.8" r="1.4" fill="white" />
      <path d="M8 10.8c-1.2 0-2.2.9-2.2 2s1 2 2.2 2" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 10.8c1.2 0 2.2.9 2.2 2s-1 2-2.2 2" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
