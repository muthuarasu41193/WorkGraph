import { LegalNav } from "@/components/legal/LegalDocument";

export default function EmployerPublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      {children}
      <footer className="border-t border-border-default px-4 py-4">
        <LegalNav className="mx-auto max-w-6xl" />
      </footer>
    </div>
  );
}
