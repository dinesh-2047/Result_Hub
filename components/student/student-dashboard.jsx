'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { StudentDashboardSkeleton } from '@/components/shared/site/loading-skeletons';

function isAlertScore(value = '') {
  const normalized = String(value).trim().toUpperCase();
  return normalized === 'F' || normalized === 'AB' || normalized === 'ABSENT';
}

export function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [results, setResults] = useState([]);
  const [courseName, setCourseName] = useState('');
  const [courseSemesterCount, setCourseSemesterCount] = useState(0);
  const [openResultId, setOpenResultId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  async function loadData() {
    setIsLoading(true);
    const [profileRes, resultsRes, coursesRes] = await Promise.all([
      fetch('/api/student/profile', { cache: 'no-store' }),
      fetch('/api/student/results', { cache: 'no-store' }),
      fetch('/api/public/courses'),
    ]);

    const [profileData, resultsData, coursesData] = await Promise.all([profileRes.json(), resultsRes.json(), coursesRes.json()]);

    if (!profileRes.ok) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setProfile(profileData.user);
    const matchedCourse = (coursesData.courses || []).find((course) => course.code === (profileData.user.courseCode || ''));
    setCourseName(matchedCourse?.name || '');
    setCourseSemesterCount(Number(matchedCourse?.semesterCount || 0));
    setResults(resultsData.results || profileData.results || []);
    setIsLoading(false);
  }

  const semesterOptions = useMemo(() => {
    const maxSemester = Math.max(courseSemesterCount, profile?.currentSemester || 1, 1);
    return Array.from({ length: maxSemester }, (_, index) => index + 1);
  }, [courseSemesterCount, profile?.currentSemester]);

  function updateCurrentSemester(event) {
    const nextSemester = Number(event.target.value);
    setProfile((current) => (current ? { ...current, currentSemester: nextSemester } : current));
  }

  function saveCurrentSemester() {
    if (!profile) {
      return;
    }

    startTransition(async () => {
      const response = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentSemester: profile.currentSemester }),
      });

      const payload = await response.json();
      if (!response.ok) {
        toast.error(payload.message || 'Unable to update semester.');
        await loadData();
        return;
      }

      toast.success(payload.message || 'Semester updated.');
      setProfile(payload.user || profile);
      await loadData();
    });
  }

  useEffect(() => {
    loadData().catch(() => {
      setIsLoading(false);
      toast.error('Unable to load student dashboard.');
    });
  }, []);

  if (isLoading) {
    return <StudentDashboardSkeleton />;
  }

  if (!profile) {
    return (
      <main className="site-shell section">
        <div className="empty-state">
          <h1 className="dashboard-title">Student sign-in required</h1>
          <p className="page-intro">Use the student account issued by admin. The default password is your roll number until you change it.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="site-shell section">
      <section className="student-hero">
        <div>
          <span className="eyebrow">Student Panel</span>
          <h1 className="dashboard-title">{profile.name || 'Student Dashboard'}</h1>
        </div>
        <div className="student-hero__stats">
          <div className="metric-card metric-card--course">
            <span>Course</span>
            <div className="metric-card__value metric-card__value--compact">{courseName || 'Not assigned'}</div>
          </div>
          <div className="metric-card">
            <span>Current Semester</span>
            <strong>{profile.currentSemester || 1}</strong>
          </div>
        </div>
      </section>

      <div className="student-panel-toolbar">
        <div className="semester-selector-card">
          <label className="field semester-selector-field">
            <span>Update Current Semester</span>
            <select value={profile.currentSemester || 1} onChange={updateCurrentSemester}>
              {semesterOptions.map((semester) => (
                <option key={semester} value={semester}>Semester {semester}</option>
              ))}
            </select>
          </label>
          <button className="ghost-button" type="button" onClick={saveCurrentSemester} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Semester'}
          </button>
        </div>
        <Link href="/profile" className="primary-button">Open Profile</Link>
      </div>

      <section className="dashboard-panel student-results-panel">
        <div className="section-head section-head--tight">
          <div>
            <h2 className="section-title">Semester Results</h2>
            <p className="section-copy">Compact by default. Expand a semester for subject details.</p>
          </div>
          <div className="muted">Published semesters: {results.length}</div>
        </div>

        <div className="result-history">
          {results.map((result) => {
            const isOpen = openResultId === result._id;

            return (
              <article className="result-card student-result-card" key={result._id}>
                <button className="student-result-card__summary" type="button" onClick={() => setOpenResultId(isOpen ? null : result._id)}>
                  <span>
                    <strong>Semester {result.semester}</strong>
                    <div className="muted">{result.examYear}</div>
                  </span>

                  <span className="student-result-card__meta">
                    <span className="status-chip">CGPA {result.cgpa || result.sgpa || 'N/A'}</span>
                    <span className={`status-chip ${result.remarks?.toUpperCase().includes('PASS') ? 'status-pass' : 'status-review'}`}>
                      {result.remarks || 'Published'}
                    </span>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </button>

                {isOpen ? (
                  <div className="student-result-card__details">
                    <div className="detail-grid">
                      <div>
                        <strong>Total Credit Points</strong>
                        <div>{result.totalCreditPoints || 'N/A'}</div>
                      </div>
                      <div>
                        <strong>Roll Number</strong>
                        <div>{result.rollNumber}</div>
                      </div>
                    </div>

                    <div className="subject-list">
                      {result.subjects.map((subject) => (
                        <div className="subject-row" key={`${result._id}-${subject.code}`}>
                          <div className="subject-row__main">
                            <strong>{subject.name}</strong>
                            <div className="muted">{subject.code}</div>
                          </div>
                          <div className="subject-row__meta">
                            <span>Credit {subject.credits || 0}</span>
                            <strong className={isAlertScore(subject.score) ? 'subject-score subject-score--alert' : ''}>{subject.score || 'N/A'}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}