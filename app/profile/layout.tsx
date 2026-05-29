import "../../components/profile/profile-theme.css";
import WorkGraphProviders from "../../components/providers/WorkGraphProviders";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkGraphProviders>
      <div className="wg-profile-root">{children}</div>
    </WorkGraphProviders>
  );
}
