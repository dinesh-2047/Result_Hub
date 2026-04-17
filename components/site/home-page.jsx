'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { HomePageSkeleton } from '@/components/shared/site/loading-skeletons';

export function HomePage() {
  const [courses, setCourses] = useState([]);
  const [notices, setNotices] = useState([]);
  const [toppers, setToppers] = useState([]);
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      fetch('/api/public/courses').then((r) => r.json()),
      fetch('/api/public/notices').then((r) => r.json()),
      fetch('/api/public/toppers').then((r) => r.json()),
    ])
      .then(([coursesResult, noticesResult, toppersResult]) => {
        if (coursesResult.status === 'fulfilled') {
          setCourses(coursesResult.value.courses || []);
        }

        if (noticesResult.status === 'fulfilled') {
          setNotices(noticesResult.value.notices || []);
        }

        if (toppersResult.status === 'fulfilled') {
          setToppers(toppersResult.value.toppers || []);
        }

        setContentReady(true);
      })
      .catch(() => setContentReady(true));
  }, []);

  if (!contentReady) {
    return <HomePageSkeleton />;
  }

  return (
    <main className="site-shell">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero__inner">
          <div className="hero__badge fade-in-up">
            <span className="hero__badge-dot" />
            Live Results
          </div>
          <h1 className="hero__title fade-in-up-delay-1">
            Your semester results,<br />
            <span className="hero__title-accent">one search away.</span>
          </h1>
          <p className="hero__subtitle fade-in-up-delay-2">
            Search by roll number, view subject-wise marks, track semester history, and check topper lists.
          </p>
          <div className="hero__tape fade-in-up-delay-2" aria-hidden="true">
            FAST. CLEAR. VERIFIED. 
          </div>
          <div className="hero__actions fade-in-up-delay-3">
            <Link href="/results" className="primary-button">
              Check Result
            </Link>
            <Link href="/sign-in" className="secondary-button">
              Sign In
            </Link>
          </div>
          <div className="hero__stats fade-in-up-delay-3">
            <div className="metric-card">
              <span>Courses</span>
              <strong>{courses.length}</strong>
            </div>
            <div className="metric-card">
              <span>Notices</span>
              <strong>{notices.length}</strong>
            </div>
            <div className="metric-card">
              <span>Toppers</span>
              <strong>{toppers.length}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ── Notices Strip ── */}
      {notices.length > 0 && (
        <section className="section">
          <div className="notice-strip">
            <div className="notice-strip__track">
              {notices.concat(notices).map((notice, i) => (
                <span className="notice-strip__item" key={`${notice._id}-${i}`}>
                  <span className="notice-strip__dot" />
                  {notice.title || notice.summary || 'Important Notice'}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Courses ── */}
      {courses.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <h2 className="section-title">Available Courses</h2>
              <p className="section-copy">Courses currently listed on the result portal.</p>
            </div>
          </div>
          <div className="course-grid">
            {courses.map((course) => (
              <div key={course._id} className="course-card">
                <strong>{course.name}</strong>
                <span>{course.semesterCount} Semesters</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Notice Board ── */}
      <section className="section">
        <div className="section-head">
          <div>
            <h2 className="section-title">Notice Board</h2>
            <p className="section-copy">Latest announcements</p>
          </div>
        </div>
        {!contentReady ? (
          <div className="surface empty-state">Loading notices...</div>
        ) : notices.length === 0 ? (
          <div className="surface empty-state">No notices published yet.</div>
        ) : (
          <div className="list-card">
            <ul>
              {notices.map((notice) => (
                <li key={notice._id}>
                  <div className="notice-list-card__row">
                    <strong>{notice.title || notice.summary || 'Important Notice'}</strong>
                    {notice.isPinned && <span className="status-chip">Pinned</span>}
                  </div>
                  {notice.summary && <div className="muted">{notice.summary}</div>}
                  {notice.actionUrl ? (
                    <div className="notice-list-card__action-row">
                      <Link href={notice.actionUrl} className="notice-list-card__action">
                        {notice.actionLabel || 'Open link'}
                      </Link>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ── Toppers ── */}
      {toppers.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <h2 className="section-title">Top Performers</h2>
              <p className="section-copy">Highest CGPA this session</p>
            </div>
            <Link href="/wall-of-toppers" className="ghost-button">View All →</Link>
          </div>
          <div className="toppers-grid">
            {toppers.slice(0, 6).map((t) => (
              <article className="topper-card" key={t._id}>
                <div className="topper-card__head">
                  <div>
                    <strong>{t.studentName}</strong>
                    <div className="muted">{t.courseName} · Semester {t.semester}</div>
                  </div>
                  <span className="status-chip status-pass">{t.rankLabel} · CGPA {t.cgpa || t.sgpa}</span>
                </div>
                <div className="topper-meta">
                  <span>Roll: {t.rollNumber}</span>
                  <span>{t.examYear}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="section">
        <div className="surface cta-surface">
          <h2 className="section-title">Need Help?</h2>
          <p className="muted cta-surface__copy">
            Reach out for portal support, account issues, or result queries.
          </p>
          <Link href="/contact" className="primary-button">Contact Us</Link>
        </div>
      </section>
    </main>
  );
}