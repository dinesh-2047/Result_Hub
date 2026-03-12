'use client';

import { useEffect, useState } from 'react';
import { SiteShell } from '@/components/site/site-shell';

export default function WallOfToppersPage() {
  const [toppers, setToppers] = useState([]);

  useEffect(() => {
    fetch('/api/public/toppers')
      .then((r) => r.json())
      .then((d) => setToppers(d.toppers || []))
      .catch(() => {});
  }, []);

  return (
    <SiteShell>
      <main className="site-shell section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Achievements</span>
            <h1 className="page-title">Wall of Toppers</h1>
          </div>
        </div>
        {toppers.length === 0 ? (
          <div className="surface empty-state">No toppers published yet.</div>
        ) : (
          <div className="toppers-grid">
            {toppers.map((topper) => (
              <article className="topper-card" key={topper._id}>
                <div className="topper-card__head">
                  <div>
                    <strong>{topper.studentName}</strong>
                    <div className="muted">{topper.courseName} · Semester {topper.semester}</div>
                  </div>
                  <span className="status-chip status-pass">{topper.rankLabel} · CGPA {topper.cgpa || topper.sgpa}</span>
                </div>
                <div className="topper-meta">
                  <span>Roll: {topper.rollNumber}</span>
                  <span>{topper.examYear}</span>
                  <span>Sem {topper.semester}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </SiteShell>
  );
}