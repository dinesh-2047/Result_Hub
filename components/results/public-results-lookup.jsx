'use client';

import { useEffect, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ResultsDetailSkeleton, ResultsLookupSkeleton } from '@/components/shared/site/loading-skeletons';

function isAlertScore(value = '') {
  const normalized = String(value).trim().toUpperCase();
  return normalized === 'F' || normalized === 'AB' || normalized === 'ABSENT';
}

export function PublicResultsLookup({ title = 'Student Result Search', showHistory = true }) {
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ rollNumber: '', courseCode: '', semester: '', examYear: '' });
  const [resultData, setResultData] = useState(null);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  async function lookupResult(nextForm, { silent = false } = {}) {
    const params = new URLSearchParams({
      rollNumber: nextForm.rollNumber,
      courseCode: nextForm.courseCode,
      semester: nextForm.semester,
    });

    if (nextForm.examYear) {
      params.set('examYear', nextForm.examYear);
    }

    const response = await fetch(`/api/public/results?${params.toString()}`);
    const payload = await response.json();

    if (!response.ok) {
      setResultData(null);
      if (!silent) {
        toast.error(payload.message || 'Unable to fetch result.');
      }
      return;
    }

    if (!silent) {
      toast.success('Result loaded.');
    }
    setResultData(payload);
  }

  useEffect(() => {
    fetch('/api/public/courses')
      .then((response) => response.json())
      .then((data) => setCourses(data.courses || []))
      .catch(() => setCourses([]))
      .finally(() => setIsBootLoading(false));
  }, []);

  useEffect(() => {
    const nextForm = {
      rollNumber: searchParams.get('rollNumber') || '',
      courseCode: searchParams.get('courseCode') || '',
      semester: searchParams.get('semester') || '',
      examYear: searchParams.get('examYear') || '',
    };

    const hasLookupValues = nextForm.rollNumber && nextForm.courseCode && nextForm.semester;
    if (!hasLookupValues) {
      return;
    }

    setForm(nextForm);
    startTransition(async () => {
      await lookupResult(nextForm, { silent: true });
    });
  }, [searchParams]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submitLookup(event) {
    event.preventDefault();

    startTransition(async () => {
      await lookupResult(form);
    });
  }

  if (isBootLoading) {
    return <ResultsLookupSkeleton />;
  }

  return (
    <section className="surface lookup-surface">
      <div className="section-head section-head--tight">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="section-copy">Enter your details below</p>
        </div>
      </div>

      <form onSubmit={submitLookup} className="form-grid form-grid--3">
        <label className="field">
          <span>Roll Number</span>
          <input name="rollNumber" value={form.rollNumber} onChange={updateField} placeholder="Enter roll number" required />
        </label>
        <label className="field">
          <span>Course</span>
          <select name="courseCode" value={form.courseCode} onChange={updateField} required>
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course._id} value={course.code}>
                {course.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Semester</span>
          <input name="semester" type="number" min="1" max="16" value={form.semester} onChange={updateField} required />
        </label>
        <label className="field">
          <span>Exam Year</span>
          <input name="examYear" type="number" min="2000" max="2100" value={form.examYear} onChange={updateField} placeholder="Optional" />
        </label>
        <div className="field">
          <span>&nbsp;</span>
          <button className="primary-button lookup-button" type="submit" disabled={isPending}>
            {isPending ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>
      {isPending && !resultData ? <ResultsDetailSkeleton /> : null}
      {resultData?.result ? (
        <div className="dashboard-stack">
          <article className="result-card result-card--featured">
            <div className="result-card__head">
              <div>
                <h3>{resultData.result.studentName}</h3>
                <p className="muted">
                  {resultData.result.courseCode} · Semester {resultData.result.semester} · {resultData.result.examYear}
                </p>
              </div>
              <span className={`status-chip status-chip--bold ${resultData.result.remarks?.toUpperCase().includes('PASS') ? 'status-pass' : 'status-review'}`}>
                {resultData.result.remarks || 'Published'}
              </span>
            </div>

            <div className="detail-grid">
              <div>
                <strong>Roll Number</strong>
                <div>{resultData.result.rollNumber}</div>
              </div>
              <div>
                <strong>Father Name</strong>
                <div>{resultData.result.fatherName || 'Not updated'}</div>
              </div>
              <div>
                <strong>Total Credit Points</strong>
                <div>{resultData.result.totalCreditPoints || 'N/A'}</div>
              </div>
              <div>
                <strong>CGPA</strong>
                <div>{resultData.result.cgpa || resultData.result.sgpa || 'N/A'}</div>
              </div>
            </div>

            <div className="result-subjects">
              {resultData.result.subjects.map((subject) => (
                <div className="subject-chip" key={`${subject.code}-${subject.score}`}>
                  <strong>{subject.code}</strong>
                  <div>{subject.name}</div>
                  <div className={isAlertScore(subject.score) ? 'subject-score subject-score--alert' : 'muted'}>{subject.score || 'N/A'}</div>
                </div>
              ))}
            </div>
          </article>

          {showHistory ? (
            <div>
              <div className="section-head">
                <div>
                  <h3 className="section-title">Semester History</h3>
                  <p className="section-copy">All published semesters.</p>
                </div>
              </div>
              <div className="result-history">
                {resultData.history.map((item) => (
                  <article className="result-card" key={item._id || `${item.semester}-${item.examYear}`}>
                    <div className="result-card__head">
                      <div>
                        <strong>Semester {item.semester}</strong>
                        <div className="muted">{item.examYear}</div>
                      </div>
                      <span className={`status-chip ${item.remarks?.toUpperCase().includes('PASS') ? 'status-pass' : 'status-review'}`}>
                        {item.remarks || 'Published'}
                      </span>
                    </div>
                    <div className="muted">CGPA: {item.cgpa || item.sgpa || 'N/A'}</div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}