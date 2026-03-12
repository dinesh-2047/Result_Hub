'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { ResultsDetailSkeleton, ResultsExplorerSkeleton } from '@/components/shared/site/loading-skeletons';

function isAlertScore(value = '') {
  const normalized = String(value).trim().toUpperCase();
  return normalized === 'F' || normalized === 'AB' || normalized === 'ABSENT';
}

function formatBatchDate(value) {
  if (!value) {
    return 'Recently published';
  }

  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return 'Recently published';
  }
}

function compareRollNumber(left, right) {
  return String(left.rollNumber || '').localeCompare(String(right.rollNumber || ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

export function PublicResultsExplorer() {
  const PAGE_SIZE = 10;
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [classResults, setClassResults] = useState([]);
  const [sortBy, setSortBy] = useState('rank');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedStudentRoll, setSelectedStudentRoll] = useState('');
  const [selectedStudentResult, setSelectedStudentResult] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch('/api/public/results/batches')
      .then((response) => response.json())
      .then((payload) => {
        const nextBatches = payload.batches || [];
        setBatches(nextBatches);
        if (nextBatches.length > 0) {
          loadBatch(nextBatches[0]);
        }
      })
      .catch(() => {
        setBatches([]);
        toast.error('Unable to load published result batches.');
      })
      .finally(() => setIsBootLoading(false));
  }, []);

  function loadBatch(batch) {
    setSelectedBatch(batch);
    setSearchTerm('');
    setPage(1);
    setSelectedStudentRoll('');
    setSelectedStudentResult(null);

    startTransition(async () => {
      const params = new URLSearchParams({
        courseCode: batch.courseCode,
        semester: String(batch.semester),
        examYear: String(batch.examYear),
      });

      const response = await fetch(`/api/public/results/class?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        setClassResults([]);
        toast.error(payload.message || 'Unable to load class results.');
        return;
      }

      setClassResults(payload.results || []);
    });
  }

  async function openStudentResult(result) {
    if (!selectedBatch) {
      return;
    }

    setSelectedStudentRoll(result.rollNumber);
    setDetailLoading(true);

    const params = new URLSearchParams({
      rollNumber: result.rollNumber,
      courseCode: selectedBatch.courseCode,
      semester: String(selectedBatch.semester),
      examYear: String(selectedBatch.examYear),
    });

    try {
      const response = await fetch(`/api/public/results?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.message || 'Unable to load student result details.');
        return;
      }

      setSelectedStudentResult(payload.result || null);
      toast.success(`Loaded ${payload.result?.studentName || result.rollNumber}.`);
    } catch {
      toast.error('Unable to load student result details.');
    } finally {
      setDetailLoading(false);
    }
  }

  const sortedClassResults = useMemo(() => {
    const items = [...classResults];
    if (sortBy === 'rollNumber') {
      return items.sort(compareRollNumber);
    }

    return items.sort((left, right) => {
      const leftRank = left.rank ?? Number.MAX_SAFE_INTEGER;
      const rightRank = right.rank ?? Number.MAX_SAFE_INTEGER;
      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }
      return compareRollNumber(left, right);
    });
  }, [classResults, sortBy]);

  const visibleClassResults = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    if (!normalizedQuery) {
      return sortedClassResults;
    }

    return sortedClassResults.filter((result) => {
      const rollNumber = String(result.rollNumber || '').toLowerCase();
      const studentName = String(result.studentName || '').toLowerCase();
      return rollNumber.includes(normalizedQuery) || studentName.includes(normalizedQuery);
    });
  }, [searchTerm, sortedClassResults]);

  const totalPages = Math.max(1, Math.ceil(visibleClassResults.length / PAGE_SIZE));
  const paginatedResults = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return visibleClassResults.slice(startIndex, startIndex + PAGE_SIZE);
  }, [page, visibleClassResults]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortBy, selectedBatch]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setSelectedStudentResult(null);
        setSelectedStudentRoll('');
      }
    }

    if (!selectedStudentResult) {
      return undefined;
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedStudentResult]);

  if (isBootLoading) {
    return <ResultsExplorerSkeleton />;
  }

  return (
    <section className="results-explorer-grid section">
      <article className="surface results-batch-panel">
        <div className="section-head section-head--tight">
          <div>
            <h2 className="section-title">Available Results</h2>
            <p className="section-copy">Latest published batches appear first.</p>
          </div>
        </div>

        {batches.length === 0 ? (
          <div className="empty-state">No published result batches yet.</div>
        ) : (
          <div className="results-batch-list">
            {batches.map((batch) => {
              const isActive = selectedBatch
                && selectedBatch.courseCode === batch.courseCode
                && selectedBatch.semester === batch.semester
                && selectedBatch.examYear === batch.examYear;

              return (
                <button
                  key={`${batch.courseCode}-${batch.semester}-${batch.examYear}`}
                  type="button"
                  className={`results-batch-card ${isActive ? 'active' : ''}`}
                  onClick={() => loadBatch(batch)}
                >
                  <div className="results-batch-card__head">
                    <strong>{batch.courseName}</strong>
                    <span className="status-chip">Sem {batch.semester}</span>
                  </div>
                  <div className="muted">Exam Year {batch.examYear}</div>
                  <div className="results-batch-card__meta">
                    <span>{batch.resultCount} students</span>
                    <span>{formatBatchDate(batch.latestAddedAt)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </article>

      <article className="surface results-class-panel">
        <div className="section-head section-head--tight">
          <div>
            <h2 className="section-title">Class Result View</h2>
            <p className="section-copy">
              {selectedBatch
                ? `${selectedBatch.courseName} · Semester ${selectedBatch.semester} · ${selectedBatch.examYear}`
                : 'Choose a published batch to view the full class result.'}
            </p>
          </div>
          <div className="results-class-toolbar">
            <input
              className="results-search-input"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by roll number or name"
            />
            <div className="results-sort-toolbar">
              <button
                type="button"
                className={`course-pill ${sortBy === 'rank' ? 'active' : ''}`}
                onClick={() => setSortBy('rank')}
              >
                Sort by Rank
              </button>
              <button
                type="button"
                className={`course-pill ${sortBy === 'rollNumber' ? 'active' : ''}`}
                onClick={() => setSortBy('rollNumber')}
              >
                Sort by Roll Number
              </button>
            </div>
          </div>
        </div>

        {!selectedBatch ? (
          <div className="empty-state">Select a result batch from the left.</div>
        ) : null}

        {selectedBatch ? (
          <>
            <div className="results-class-summary">
              <span className="status-chip">{visibleClassResults.length} Students</span>
              <span className="status-chip">Sorted by {sortBy === 'rank' ? 'Rank' : 'Roll Number'}</span>
              <span className="status-chip">Page {page} of {totalPages}</span>
              {isPending ? <span className="status-chip">Loading...</span> : null}
            </div>

            <div className="results-table-wrap">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Roll Number</th>
                    <th>Student Name</th>
                    <th>CGPA</th>
                    <th>Total Credits</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedResults.map((result) => (
                    <tr
                      key={`${result.rollNumber}-${result.examYear}-${result.semester}`}
                      className={selectedStudentRoll === result.rollNumber ? 'results-table__row results-table__row--active' : 'results-table__row'}
                      onClick={() => openStudentResult(result)}
                    >
                      <td>{result.rank || '-'}</td>
                      <td>{result.rollNumber}</td>
                      <td>{result.studentName}</td>
                      <td>{result.cgpa || result.sgpa || 'N/A'}</td>
                      <td>{result.totalCreditPoints || 'N/A'}</td>
                      <td>
                        <span className={`status-chip ${result.remarks?.toUpperCase().includes('PASS') ? 'status-pass' : 'status-review'}`}>
                          {result.remarks || 'Published'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {isPending ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <tr key={`loading-row-${index}`}>
                        <td colSpan="6" className="results-table__empty results-table__empty--loading">
                          <div className="skeleton-table-row">
                            <div className="skeleton-block skeleton-line skeleton-table-row__cell skeleton-table-row__cell--sm" />
                            <div className="skeleton-block skeleton-line skeleton-table-row__cell" />
                            <div className="skeleton-block skeleton-line skeleton-table-row__cell skeleton-table-row__cell--lg" />
                            <div className="skeleton-block skeleton-line skeleton-table-row__cell" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : null}
                  {paginatedResults.length === 0 && !isPending ? (
                    <tr>
                      <td colSpan="6" className="results-table__empty">No students match this search.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="results-mobile-list">
              {paginatedResults.map((result) => (
                <button
                  key={`mobile-${result.rollNumber}-${result.examYear}-${result.semester}`}
                  type="button"
                  className={`results-mobile-card ${selectedStudentRoll === result.rollNumber ? 'active' : ''}`}
                  onClick={() => openStudentResult(result)}
                >
                  <div className="results-mobile-card__head">
                    <strong>{result.studentName}</strong>
                    <span className="status-chip">Rank {result.rank || '-'}</span>
                  </div>
                  <div className="results-mobile-card__grid">
                    <span>Roll: {result.rollNumber}</span>
                    <span>CGPA: {result.cgpa || result.sgpa || 'N/A'}</span>
                    <span>Credits: {result.totalCreditPoints || 'N/A'}</span>
                    <span>{result.remarks || 'Published'}</span>
                  </div>
                </button>
              ))}
              {isPending ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div className="results-mobile-card" key={`mobile-loading-${index}`}>
                    <div className="skeleton-card-stack">
                      <div className="skeleton-block skeleton-line skeleton-card__title" />
                      <div className="skeleton-block skeleton-line skeleton-card__copy" />
                    </div>
                  </div>
                ))
              ) : null}
              {paginatedResults.length === 0 && !isPending ? (
                <div className="results-table__empty">No students match this search.</div>
              ) : null}
            </div>

            <div className="results-pagination">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <div className="muted">Showing {(page - 1) * PAGE_SIZE + (paginatedResults.length ? 1 : 0)}-{(page - 1) * PAGE_SIZE + paginatedResults.length} of {visibleClassResults.length}</div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>

            {detailLoading ? <ResultsDetailSkeleton /> : null}
          </>
        ) : null}
      </article>

      {selectedStudentResult ? (
        <div className="results-modal" role="dialog" aria-modal="true" aria-label="Student result details" onClick={() => { setSelectedStudentResult(null); setSelectedStudentRoll(''); }}>
          <div className="results-modal__panel" onClick={(event) => event.stopPropagation()}>
            <div className="results-modal__header">
              <div>
                <h3>{selectedStudentResult.studentName}</h3>
                <p className="muted">
                  {selectedStudentResult.courseCode} · Semester {selectedStudentResult.semester} · {selectedStudentResult.examYear}
                </p>
              </div>
              <div className="results-modal__header-actions">
                <span className={`status-chip status-chip--bold ${selectedStudentResult.remarks?.toUpperCase().includes('PASS') ? 'status-pass' : 'status-review'}`}>
                  {selectedStudentResult.remarks || 'Published'}
                </span>
                <button
                  type="button"
                  className="results-modal__close"
                  aria-label="Close result popup"
                  onClick={() => { setSelectedStudentResult(null); setSelectedStudentRoll(''); }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="detail-grid">
              <div>
                <strong>Roll Number</strong>
                <div>{selectedStudentResult.rollNumber}</div>
              </div>
              <div>
                <strong>Father Name</strong>
                <div>{selectedStudentResult.fatherName || 'Not updated'}</div>
              </div>
              <div>
                <strong>Total Credit Points</strong>
                <div>{selectedStudentResult.totalCreditPoints || 'N/A'}</div>
              </div>
              <div>
                <strong>CGPA</strong>
                <div>{selectedStudentResult.cgpa || selectedStudentResult.sgpa || 'N/A'}</div>
              </div>
            </div>

            <div className="result-subjects">
              {selectedStudentResult.subjects.map((subject) => (
                <div className="subject-chip" key={`${subject.code}-${subject.score}`}>
                  <strong>{subject.code}</strong>
                  <div>{subject.name}</div>
                  <div className={isAlertScore(subject.score) ? 'subject-score subject-score--alert' : 'muted'}>{subject.score || 'N/A'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
