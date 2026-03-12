import { SiteShell } from '@/components/site/site-shell';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

export default function AdminPage() {
  return (
    <SiteShell>
      <AdminDashboard />
    </SiteShell>
  );
}