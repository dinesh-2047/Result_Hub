import { SiteShell } from '@/components/site/site-shell';
import { PublicResultsExplorer } from '@/components/results/public-results-explorer';
import { PublicResultsLookup } from '@/components/results/public-results-lookup';

export default function ResultsPage() {
  return (
    <SiteShell>
      <main className="site-shell section">
        <section className="result-page-hero surface">
          <div>
            <span className="eyebrow">Results</span>
            <h1 className="page-title">Search Your Result</h1>
          </div>
          <div className="result-page-hero__chips">
            <span className="status-chip">Roll Number</span>
            <span className="status-chip">Course</span>
            <span className="status-chip">Semester</span>
          </div>
        </section>

        <PublicResultsLookup title="Result Lookup" showHistory />
        <PublicResultsExplorer />
      </main>
    </SiteShell>
  );
}