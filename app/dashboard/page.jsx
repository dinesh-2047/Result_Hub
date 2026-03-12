import { SiteShell } from '@/components/site/site-shell';
import { StudentDashboard } from '@/components/student/student-dashboard';

export default function DashboardPage() {
  return (
    <SiteShell>
      <StudentDashboard />
    </SiteShell>
  );
}