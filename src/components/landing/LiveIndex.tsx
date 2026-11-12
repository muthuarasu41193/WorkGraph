import { HeroSearch } from "@/components/marketing/HeroSearch";
import {
  getIndexStats,
  type IndexStats,
} from "@/lib/social-proof-server";
import { Card } from "./ui";
import "./landing.css";

/**
 * Live job index band for the landing redesign.
 * Reuses the marketing home search (`HeroSearch`) and index counts
 * (`getIndexStats`) without copying or altering their logic.
 */

type StatRow = {
  value: number | null;
  label: string;
};

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="wg-landing-live-stat">
      <p className="wg-landing-live-stat__value">
        {value.toLocaleString("en-US")}
      </p>
      <p className="wg-landing-live-stat__label">{label}</p>
    </div>
  );
}

function IndexStatsCard({ stats }: { stats: IndexStats }) {
  const rows: StatRow[] = [
    { value: stats.liveJobs, label: "Jobs in the index" },
    { value: stats.postedLast24Hours, label: "Posted in the last 24 hours" },
    { value: stats.verifiedEmployers, label: "Verified employers" },
  ];

  const loaded = rows.filter(
    (row): row is { value: number; label: string } => row.value != null,
  );

  if (loaded.length === 0) {
    return (
      <Card className="wg-landing-live-index__stats" aria-live="polite">
        <h3 className="wg-landing-live-index__stats-title">Index</h3>
        <p className="wg-landing-live-index__stats-empty">
          Index counts could not be loaded.
        </p>
      </Card>
    );
  }

  return (
    <Card className="wg-landing-live-index__stats" aria-live="polite">
      <h3 className="wg-landing-live-index__stats-title">Index</h3>
      <div className="wg-landing-live-index__stats-grid">
        {loaded.map((row) => (
          <Stat key={row.label} value={row.value} label={row.label} />
        ))}
      </div>
      <p className="wg-landing-live-index__stats-note">
        Posted means the listing date we stored. It is not a verification time.
      </p>
    </Card>
  );
}

export async function LiveIndex() {
  const stats = await getIndexStats();

  return (
    <section
      id="live-index"
      aria-labelledby="live-index-heading"
      className="wg-landing-live-index"
    >
      <div className="wg-landing-live-index__inner">
        <h2 id="live-index-heading" className="wg-landing-live-index__heading">
          Search the live index
          <span className="wg-accent-dot">.</span>
        </h2>
        <div className="wg-landing-live-index__layout">
          <div className="wg-landing-live-index__search wg-landing-live-index__search-panel">
            <HeroSearch />
          </div>
          <IndexStatsCard stats={stats} />
        </div>
      </div>
    </section>
  );
}
