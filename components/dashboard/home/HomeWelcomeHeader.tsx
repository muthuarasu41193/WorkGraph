export default function HomeWelcomeHeader({
  greeting,
  displayName,
}: {
  greeting: string;
  displayName: string;
}) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {greeting}, <span className="text-[var(--dash-accent)]">{displayName}</span>
      </h1>
      <p className="text-sm text-muted-foreground">
        Your hiring command center — matches, hidden roles, and interview vault at a glance.
      </p>
    </header>
  );
}
