import { SiteShell } from '@/components/site/site-shell';

export default function AboutPage() {
  return (
    <SiteShell>
      <main className="site-shell section">
        <div className="surface" style={{ maxWidth: 640, margin: '0 auto' }}>
          <span className="eyebrow">About</span>
          <h1 className="page-title">Campus Result Portal</h1>
          <p className="page-intro">
            A centralized platform for students to check semester results, view subject-wise marks, and track academic performance across all courses.
          </p>
          <div className="card-grid" style={{ marginTop: '1.5rem' }}>
            <div className="metric-card">
              <span>Courses</span>
              <strong>Multi-stream</strong>
            </div>
            <div className="metric-card">
              <span>Results</span>
              <strong>Semester-wise</strong>
            </div>
            <div className="metric-card">
              <span>Access</span>
              <strong>Roll No Search</strong>
            </div>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}