'use client';

export function SkeletonBlock({ className = '' }) {
  return <div className={`skeleton-block ${className}`.trim()} aria-hidden="true" />;
}

export function HeaderActionsSkeleton() {
  return (
    <div className="header-skeleton" aria-hidden="true">
      <SkeletonBlock className="header-skeleton__theme" />
      <SkeletonBlock className="header-skeleton__button" />
      <SkeletonBlock className="header-skeleton__button header-skeleton__button--short" />
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <main className="site-shell skeleton-page">
      <section className="hero">
        <SkeletonBlock className="skeleton-pill skeleton-home__badge" />
        <SkeletonBlock className="skeleton-line skeleton-home__title" />
        <SkeletonBlock className="skeleton-line skeleton-home__title skeleton-home__title--short" />
        <SkeletonBlock className="skeleton-line skeleton-home__subtitle" />
        <SkeletonBlock className="skeleton-line skeleton-home__subtitle skeleton-home__subtitle--short" />
        <div className="hero__actions">
          <SkeletonBlock className="skeleton-button" />
          <SkeletonBlock className="skeleton-button skeleton-button--secondary" />
        </div>
        <div className="hero__stats">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="metric-card" key={`home-stat-${index}`}>
              <SkeletonBlock className="skeleton-line skeleton-metric__label" />
              <SkeletonBlock className="skeleton-line skeleton-metric__value" />
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <SkeletonBlock className="skeleton-strip" />
      </section>

      <section className="section">
        <div className="section-head">
          <div className="dashboard-stack">
            <SkeletonBlock className="skeleton-line skeleton-section__title" />
            <SkeletonBlock className="skeleton-line skeleton-section__copy" />
          </div>
        </div>
        <div className="course-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="course-card" key={`home-course-${index}`}>
              <SkeletonBlock className="skeleton-line skeleton-card__title" />
              <SkeletonBlock className="skeleton-line skeleton-card__copy" />
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="dashboard-stack">
            <SkeletonBlock className="skeleton-line skeleton-section__title" />
            <SkeletonBlock className="skeleton-line skeleton-section__copy" />
          </div>
        </div>
        <div className="list-card">
          <div className="simple-list">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="skeleton-list-row" key={`home-notice-${index}`}>
                <SkeletonBlock className="skeleton-line skeleton-list-row__title" />
                <SkeletonBlock className="skeleton-line skeleton-list-row__copy" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function StudentDashboardSkeleton() {
  return (
    <main className="site-shell section skeleton-page">
      <section className="student-hero">
        <div className="dashboard-stack">
          <SkeletonBlock className="skeleton-pill skeleton-home__badge" />
          <SkeletonBlock className="skeleton-line skeleton-page__title" />
          <SkeletonBlock className="skeleton-line skeleton-page__copy" />
        </div>
        <div className="student-hero__stats">
          {Array.from({ length: 2 }).map((_, index) => (
            <div className="metric-card" key={`student-stat-${index}`}>
              <SkeletonBlock className="skeleton-line skeleton-metric__label" />
              <SkeletonBlock className="skeleton-line skeleton-metric__value" />
            </div>
          ))}
        </div>
      </section>

      <div className="student-panel-toolbar">
        <SkeletonBlock className="skeleton-button skeleton-toolbar__wide" />
        <SkeletonBlock className="skeleton-button" />
      </div>

      <section className="dashboard-panel">
        <div className="dashboard-stack">
          <SkeletonBlock className="skeleton-line skeleton-section__title" />
          <SkeletonBlock className="skeleton-line skeleton-section__copy" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="result-card" key={`student-result-${index}`}>
              <div className="skeleton-card-stack">
                <SkeletonBlock className="skeleton-line skeleton-card__title" />
                <SkeletonBlock className="skeleton-line skeleton-card__copy" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export function ProfilePageSkeleton() {
  return (
    <main className="site-shell section skeleton-page">
      <section className="student-hero">
        <div className="dashboard-stack">
          <SkeletonBlock className="skeleton-pill skeleton-home__badge" />
          <SkeletonBlock className="skeleton-line skeleton-page__title" />
          <SkeletonBlock className="skeleton-line skeleton-page__copy" />
        </div>
        <div className="student-hero__stats">
          {Array.from({ length: 2 }).map((_, index) => (
            <div className="metric-card" key={`profile-stat-${index}`}>
              <SkeletonBlock className="skeleton-line skeleton-metric__label" />
              <SkeletonBlock className="skeleton-line skeleton-metric__value" />
            </div>
          ))}
        </div>
      </section>

      <div className="student-panel-toolbar">
        <SkeletonBlock className="skeleton-button" />
      </div>

      <section className="dashboard-panel">
        <div className="form-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <div className="field" key={`profile-field-${index}`}>
              <SkeletonBlock className="skeleton-line skeleton-field__label" />
              <SkeletonBlock className="skeleton-input" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <main className="site-shell section skeleton-page">
      <div className="section-head">
        <div className="dashboard-stack">
          <SkeletonBlock className="skeleton-line skeleton-page__title" />
          <SkeletonBlock className="skeleton-line skeleton-page__copy" />
        </div>
      </div>

      <div className="dashboard-grid admin-dashboard-grid">
        <aside className="dashboard-stack admin-sidebar">
          <div className="dashboard-panel admin-sidebar__panel">
            <SkeletonBlock className="skeleton-line skeleton-sidebar__title" />
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonBlock className="skeleton-input skeleton-sidebar__item" key={`admin-nav-${index}`} />
            ))}
          </div>
        </aside>

        <section className="dashboard-stack">
          <div className="card-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="metric-card" key={`admin-stat-${index}`}>
                <SkeletonBlock className="skeleton-line skeleton-metric__label" />
                <SkeletonBlock className="skeleton-line skeleton-metric__value" />
              </div>
            ))}
          </div>
          <div className="dashboard-panel">
            <div className="form-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <div className="field" key={`admin-field-${index}`}>
                  <SkeletonBlock className="skeleton-line skeleton-field__label" />
                  <SkeletonBlock className="skeleton-input" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export function ResultsLookupSkeleton() {
  return (
    <section className="surface lookup-surface skeleton-surface">
      <div className="dashboard-stack">
        <SkeletonBlock className="skeleton-line skeleton-section__title" />
        <SkeletonBlock className="skeleton-line skeleton-section__copy" />
        <div className="form-grid form-grid--3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div className="field" key={`lookup-field-${index}`}>
              <SkeletonBlock className="skeleton-line skeleton-field__label" />
              <SkeletonBlock className="skeleton-input" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ResultsExplorerSkeleton() {
  return (
    <section className="results-explorer-grid section skeleton-page">
      <article className="surface results-batch-panel skeleton-surface">
        <div className="dashboard-stack">
          <SkeletonBlock className="skeleton-line skeleton-section__title" />
          <SkeletonBlock className="skeleton-line skeleton-section__copy" />
          <div className="results-batch-list">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="results-batch-card" key={`batch-skeleton-${index}`}>
                <SkeletonBlock className="skeleton-line skeleton-card__title" />
                <SkeletonBlock className="skeleton-line skeleton-card__copy" />
                <SkeletonBlock className="skeleton-line skeleton-card__copy skeleton-card__copy--short" />
              </div>
            ))}
          </div>
        </div>
      </article>

      <article className="surface results-class-panel skeleton-surface">
        <div className="dashboard-stack">
          <SkeletonBlock className="skeleton-line skeleton-section__title" />
          <SkeletonBlock className="skeleton-line skeleton-section__copy" />
          <div className="results-class-summary">
            <SkeletonBlock className="skeleton-pill skeleton-summary__pill" />
            <SkeletonBlock className="skeleton-pill skeleton-summary__pill" />
            <SkeletonBlock className="skeleton-pill skeleton-summary__pill" />
          </div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div className="skeleton-table-row" key={`results-row-${index}`}>
              <SkeletonBlock className="skeleton-line skeleton-table-row__cell skeleton-table-row__cell--sm" />
              <SkeletonBlock className="skeleton-line skeleton-table-row__cell" />
              <SkeletonBlock className="skeleton-line skeleton-table-row__cell skeleton-table-row__cell--lg" />
              <SkeletonBlock className="skeleton-line skeleton-table-row__cell" />
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

export function ResultsDetailSkeleton() {
  return (
    <div className="results-detail-skeleton" aria-hidden="true">
      <SkeletonBlock className="skeleton-line skeleton-card__title" />
      <SkeletonBlock className="skeleton-line skeleton-card__copy" />
      <div className="detail-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`detail-skeleton-${index}`}>
            <SkeletonBlock className="skeleton-line skeleton-field__label" />
            <SkeletonBlock className="skeleton-line skeleton-card__copy" />
          </div>
        ))}
      </div>
      <div className="result-subjects">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="subject-chip" key={`subject-skeleton-${index}`}>
            <SkeletonBlock className="skeleton-line skeleton-field__label" />
            <SkeletonBlock className="skeleton-line skeleton-card__copy" />
          </div>
        ))}
      </div>
    </div>
  );
}