/**
 * Admin surfaces are unlisted. No product nav links here.
 * Access is enforced per page (ADMIN_EMAILS → notFound).
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
