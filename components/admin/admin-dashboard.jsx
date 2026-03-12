'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Bell, BookOpenText, ChevronDown, ChevronUp, FileSpreadsheet, GraduationCap, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Users, X } from 'lucide-react';
import { normalizeBulkRollNumbers } from '@/lib/result-utils';
import { toast } from 'sonner';
import { AdminDashboardSkeleton } from '@/components/shared/site/loading-skeletons';

const tabs = ['overview', 'courses', 'students', 'subjects', 'results', 'notices'];
const tabMeta = {
  overview: { label: 'Overview', icon: LayoutDashboard },
  courses: { label: 'Courses', icon: GraduationCap },
  students: { label: 'Students', icon: Users },
  subjects: { label: 'Subjects', icon: BookOpenText },
  results: { label: 'Results', icon: FileSpreadsheet },
  notices: { label: 'Notices', icon: Bell },
};
const SIDEBAR_MIN = 240;
const SIDEBAR_MAX = 360;
const SIDEBAR_COLLAPSED = 92;

function emptyManualSubject() {
  return { code: '', name: '', score: '' };
}

function CollapsiblePanel({ title, description, actions, className = '', defaultCollapsed = false, children }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className={className}>
      <div className="panel-head collapsible-panel__head">
        <div>
          <h3>{title}</h3>
          {description ? <p className="muted">{description}</p> : null}
        </div>
        <div className="inline-actions collapsible-panel__actions">
          {actions}
          <button
            className="ghost-button collapsible-panel__toggle"
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            <span>{collapsed ? 'Expand' : 'Minimize'}</span>
          </button>
        </div>
      </div>

      {collapsed ? (
        <div className="collapsible-panel__summary muted">Panel minimized. Expand when you need it.</div>
      ) : (
        <div className="collapsible-panel__body">{children}</div>
      )}
    </div>
  );
}

export function AdminDashboard() {
  const RESULTS_PAGE_SIZE = 8;
  const STUDENTS_PAGE_SIZE = 8;
  const [activeTab, setActiveTab] = useState('overview');
  const [adminState, setAdminState] = useState({ user: null, stats: null });
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [results, setResults] = useState([]);
  const [notices, setNotices] = useState([]);
  const [courseForm, setCourseForm] = useState({ name: '', semesterCount: 8 });
  const [studentForm, setStudentForm] = useState({ name: '', email: '', courseCode: '', rollNumber: '', parentEmail: '', parentPhone: '' });
  const [studentSearch, setStudentSearch] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentEditorForm, setStudentEditorForm] = useState({ id: '', name: '', email: '', courseCode: '', rollNumber: '', parentEmail: '', parentPhone: '', currentSemester: 1, profileCompleted: false, password: '' });
  const [bulkForm, setBulkForm] = useState({ courseCode: '', rollNumbers: '' });
  const [subjectForm, setSubjectForm] = useState({ code: '', name: '', credits: 0 });
  const [subjectSearch, setSubjectSearch] = useState('');
  const [editingSubjectId, setEditingSubjectId] = useState('');
  const [resultForm, setResultForm] = useState({
    courseCode: '',
    rollNumber: '',
    semester: 1,
    examYear: new Date().getFullYear(),
    studentName: '',
    fatherName: '',
    sgpa: '',
    totalCreditPoints: '',
    remarks: '',
    visibility: 'private',
    subjects: [emptyManualSubject()],
  });
  const [publishSelection, setPublishSelection] = useState([]);
  const [resultCourseFilter, setResultCourseFilter] = useState('all');
  const [resultSemesterFilter, setResultSemesterFilter] = useState('all');
  const [resultPage, setResultPage] = useState(1);
  const [noticeForm, setNoticeForm] = useState({ title: '', summary: '', type: 'general', audience: 'public', isPinned: false, relatedCourseCode: '', actionUrl: '', actionLabel: '' });
  const [uploadForm, setUploadForm] = useState({ courseCode: '', semester: 1, examYear: new Date().getFullYear(), visibility: 'private', fileName: '' });
  const [sidebarWidth, setSidebarWidth] = useState(290);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCompactScreen, setIsCompactScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isPending, startTransition] = useTransition();

  const courseOptions = useMemo(() => courses.map((course) => ({ label: course.name, value: course.code })), [courses]);
  const resultCourseTabs = useMemo(() => {
    const uniqueCodes = [...new Set(results.map((result) => result.courseCode).filter(Boolean))];

    return [
      { label: 'All courses', value: 'all' },
      ...uniqueCodes.map((courseCode) => ({
        value: courseCode,
        label: courses.find((course) => course.code === courseCode)?.name || courseCode,
      })),
    ];
  }, [courses, results]);

  const resultSemesterTabs = useMemo(() => {
    const filteredByCourse = resultCourseFilter === 'all'
      ? results
      : results.filter((result) => result.courseCode === resultCourseFilter);

    const uniqueSemesters = [...new Set(filteredByCourse.map((result) => result.semester))].sort((left, right) => left - right);

    return [
      { label: 'All semesters', value: 'all' },
      ...uniqueSemesters.map((semester) => ({ label: `Sem ${semester}`, value: String(semester) })),
    ];
  }, [resultCourseFilter, results]);

  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      if (resultCourseFilter !== 'all' && result.courseCode !== resultCourseFilter) {
        return false;
      }

      if (resultSemesterFilter !== 'all' && String(result.semester) !== resultSemesterFilter) {
        return false;
      }

      return true;
    });
  }, [resultCourseFilter, resultSemesterFilter, results]);

  const totalResultPages = Math.max(1, Math.ceil(filteredResults.length / RESULTS_PAGE_SIZE));
  const paginatedResults = useMemo(() => {
    const startIndex = (resultPage - 1) * RESULTS_PAGE_SIZE;
    return filteredResults.slice(startIndex, startIndex + RESULTS_PAGE_SIZE);
  }, [filteredResults, resultPage]);

  const filteredSubjects = useMemo(() => {
    const query = subjectSearch.trim().toLowerCase();
    if (!query) {
      return subjects;
    }

    return subjects.filter((subject) => {
      const code = String(subject.code || '').toLowerCase();
      const name = String(subject.name || '').toLowerCase();
      return code.includes(query) || name.includes(query);
    });
  }, [subjectSearch, subjects]);

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) {
      return students;
    }

    return students.filter((student) => {
      const name = String(student.name || '').toLowerCase();
      const email = String(student.email || '').toLowerCase();
      const rollNumber = String(student.rollNumber || '').toLowerCase();
      const courseCode = String(student.courseCode || '').toLowerCase();
      return name.includes(query) || email.includes(query) || rollNumber.includes(query) || courseCode.includes(query);
    });
  }, [studentSearch, students]);

  const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PAGE_SIZE));
  const paginatedStudents = useMemo(() => {
    const startIndex = (studentPage - 1) * STUDENTS_PAGE_SIZE;
    return filteredStudents.slice(startIndex, startIndex + STUDENTS_PAGE_SIZE);
  }, [filteredStudents, studentPage]);

  const sidebarGridTemplate = useMemo(() => {
    if (isCompactScreen) {
      return '1fr';
    }

    return `${sidebarCollapsed ? SIDEBAR_COLLAPSED : sidebarWidth}px minmax(0, 1fr)`;
  }, [isCompactScreen, sidebarCollapsed, sidebarWidth]);

  async function loadAdminData({ withSkeleton = false } = {}) {
    if (withSkeleton) {
      setIsLoading(true);
    }

    const [meRes, courseRes, studentRes, subjectRes, resultRes, noticeRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/admin/courses'),
      fetch('/api/admin/students'),
      fetch('/api/admin/subjects'),
      fetch('/api/admin/results'),
      fetch('/api/admin/notices'),
    ]);

    const [me, courseData, studentData, subjectData, resultData, noticeData] = await Promise.all([
      meRes.json(),
      courseRes.json(),
      studentRes.json(),
      subjectRes.json(),
      resultRes.json(),
      noticeRes.json(),
    ]);

    if (me.user?.role !== 'admin') {
      setAdminState({ user: null, stats: null });
      setIsLoading(false);
      setHasLoadedOnce(true);
      return;
    }

    setAdminState({ user: me.user, stats: me.stats });
    setCourses(courseData.courses || []);
    setStudents(studentData.students || []);
    setSubjects(subjectData.subjects || []);
    setResults(resultData.results || []);
    setNotices(noticeData.notices || []);
    setIsLoading(false);
    setHasLoadedOnce(true);
  }

  useEffect(() => {
    loadAdminData({ withSkeleton: true }).catch(() => {
      setIsLoading(false);
      toast.error('Unable to load admin dashboard.');
    });
  }, []);

  useEffect(() => {
    function syncLayout() {
      const compact = window.innerWidth < 980;
      setIsCompactScreen(compact);
      if (compact) {
        setSidebarCollapsed(false);
      }
    }

    syncLayout();
    window.addEventListener('resize', syncLayout);
    return () => window.removeEventListener('resize', syncLayout);
  }, []);

  useEffect(() => {
    setResultSemesterFilter('all');
    setResultPage(1);
  }, [resultCourseFilter]);

  useEffect(() => {
    setStudentPage(1);
  }, [studentSearch]);

  useEffect(() => {
    setResultPage(1);
  }, [resultSemesterFilter]);

  useEffect(() => {
    setPublishSelection((current) => current.filter((id) => filteredResults.some((result) => result._id === id)));
    setResultPage((current) => Math.min(current, totalResultPages));
  }, [filteredResults, totalResultPages]);

  useEffect(() => {
    setStudentPage((current) => Math.min(current, totalStudentPages));
  }, [totalStudentPages]);

  function startSidebarResize(event) {
    if (isCompactScreen || sidebarCollapsed) {
      return;
    }

    event.preventDefault();

    const startX = event.clientX;
    const startWidth = sidebarWidth;

    function onPointerMove(moveEvent) {
      const nextWidth = startWidth + (moveEvent.clientX - startX);
      setSidebarWidth(Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, nextWidth)));
    }

    function stopResize() {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopResize);
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopResize);
  }

  function setSuccess(text) {
    toast.success(text);
  }

  function setError(text) {
    toast.error(text);
  }

  function handleField(setter) {
    return (event) => {
      const { name, value, type, checked } = event.target;
      setter((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    };
  }

  function updateResultSubject(index, key, value) {
    setResultForm((current) => ({
      ...current,
      subjects: current.subjects.map((subject, subjectIndex) =>
        subjectIndex === index ? { ...subject, [key]: value } : subject
      ),
    }));
  }

  function submitJson(url, method, body, successText, reset) {
    startTransition(async () => {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.message || 'Request failed.');
        return;
      }

      setSuccess(successText || payload.message || 'Saved.');
      if (reset) {
        reset();
      }
      await loadAdminData();
    });
  }

  async function publishResults() {
    if (publishSelection.length === 0) {
      setError('Select at least one result to publish.');
      return;
    }

    submitJson('/api/admin/results/publish', 'POST', { resultIds: publishSelection, visibility: 'public', notify: true }, 'Selected results published.', () => setPublishSelection([]));
  }

  async function deleteResults(ids) {
    if (ids.length === 0) {
      setError('Select at least one result to delete.');
      return;
    }

    const shouldDelete = window.confirm(
      ids.length === 1
        ? 'Delete this saved result? This cannot be undone.'
        : `Delete ${ids.length} saved results? This cannot be undone.`
    );

    if (!shouldDelete) {
      return;
    }

    startTransition(async () => {
      const response = await fetch('/api/admin/results', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.message || 'Delete failed.');
        return;
      }

      setSuccess(payload.message || 'Results deleted.');
      setPublishSelection((current) => current.filter((id) => !ids.includes(id)));
      await loadAdminData();
    });
  }

  async function uploadSheet(event) {
    event.preventDefault();
    const submittedForm = event.currentTarget;
    const submittedData = new FormData(submittedForm);
    const selectedFile = submittedData.get('file');

    if (!(selectedFile instanceof File) || selectedFile.size === 0) {
      setError('Choose a spreadsheet file first.');
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set('file', selectedFile);
      formData.set('courseCode', uploadForm.courseCode);
      formData.set('semester', String(uploadForm.semester));
      formData.set('examYear', String(uploadForm.examYear));
      formData.set('visibility', uploadForm.visibility);

      const response = await fetch('/api/admin/results/upload', { method: 'POST', body: formData });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.message || 'Upload failed.');
        return;
      }

      setSuccess(payload.message || 'Result sheet uploaded.');
      submittedForm.reset();
      setUploadForm((current) => ({ ...current, fileName: '' }));
      await loadAdminData();
    });
  }

  function openStudentEditor(student) {
    setEditingStudent(student);
    setStudentEditorForm({
      id: student._id,
      name: student.name || '',
      email: student.email || '',
      courseCode: student.courseCode || '',
      rollNumber: student.rollNumber || '',
      parentEmail: student.parentEmail || '',
      parentPhone: student.parentPhone || '',
      currentSemester: Number(student.currentSemester || 1),
      profileCompleted: Boolean(student.profileCompleted),
      password: '',
    });
  }

  function closeStudentEditor() {
    setEditingStudent(null);
    setStudentEditorForm({ id: '', name: '', email: '', courseCode: '', rollNumber: '', parentEmail: '', parentPhone: '', currentSemester: 1, profileCompleted: false, password: '' });
  }

  async function saveStudentEditor(event) {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch('/api/admin/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...studentEditorForm,
          currentSemester: Number(studentEditorForm.currentSemester || 1),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.message || 'Unable to update student.');
        return;
      }

      setSuccess(payload.message || 'Student updated.');
      closeStudentEditor();
      await loadAdminData();
    });
  }

  async function deleteStudent(student) {
    const shouldDelete = window.confirm(`Delete ${student.rollNumber}? This removes the student login profile.`);
    if (!shouldDelete) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/admin/students?id=${student._id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.message || 'Unable to delete student.');
        return;
      }

      setSuccess(payload.message || 'Student deleted.');
      if (editingStudent?._id === student._id) {
        closeStudentEditor();
      }
      await loadAdminData();
    });
  }

  if (isLoading && !hasLoadedOnce) {
    return <AdminDashboardSkeleton />;
  }

  if (!adminState.user) {
    return (
      <main className="site-shell section">
        <div className="empty-state">
          <h1 className="dashboard-title">Admin access required</h1>
          <p className="page-intro">Sign in with an admin account to manage courses, students, subjects, results, and notices.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="site-shell section">
      <div className="section-head">
        <div>
          <h1 className="dashboard-title">Admin Control Center</h1>
          <p className="page-intro">Manage courses, students, subjects, results, and notices.</p>
        </div>
      </div>
      <div className="dashboard-grid admin-dashboard-grid" style={{ gridTemplateColumns: sidebarGridTemplate }}>
        <aside className={`dashboard-stack admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${isCompactScreen ? 'compact' : ''}`}>
          <div className="dashboard-panel admin-sidebar__panel">
            <div className="admin-sidebar__top">
              <div className="admin-sidebar__identity">
                <span className="admin-sidebar__eyebrow">Control Room</span>
                <strong>{adminState.user.name || 'Admin'}</strong>
                <div className="muted">{adminState.user.email}</div>
              </div>
              <button
                className="ghost-button admin-sidebar__toggle"
                type="button"
                onClick={() => setSidebarCollapsed((current) => !current)}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>
            </div>

            <div className="admin-sidebar__section-label">Workspace</div>
            <nav className="admin-sidebar__nav" aria-label="Admin sections">
              {tabs.map((tab) => {
                const Icon = tabMeta[tab].icon;

                return (
                  <button
                    key={tab}
                    className={`admin-sidebar__item ${activeTab === tab ? 'active' : ''}`}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    title={sidebarCollapsed && !isCompactScreen ? tabMeta[tab].label : undefined}
                  >
                    <span className="admin-sidebar__item-icon"><Icon size={18} /></span>
                    <span className="admin-sidebar__item-text">{tabMeta[tab].label}</span>
                  </button>
                );
              })}
            </nav>

            {!sidebarCollapsed || isCompactScreen ? (
              <div className="admin-sidebar__footer">
                <span className="status-chip">{tabs.length} sections</span>
                <div className="muted">Resize or collapse this sidebar as needed.</div>
              </div>
            ) : null}
          </div>

          {!isCompactScreen ? <div className="admin-sidebar__resizer" onPointerDown={startSidebarResize} aria-hidden="true" /> : null}
        </aside>

        <section className="dashboard-stack">
          {activeTab === 'overview' ? (
            <div className="card-grid">
              <div className="metric-card metric-card--admin-overview">
                <span>Students</span>
                <strong>{adminState.stats?.studentCount || 0}</strong>
              </div>
              <div className="metric-card metric-card--admin-overview">
                <span>Courses</span>
                <strong>{adminState.stats?.courseCount || 0}</strong>
              </div>
              <div className="metric-card metric-card--admin-overview">
                <span>Results</span>
                <strong>{adminState.stats?.resultCount || 0}</strong>
              </div>
              <div className="metric-card metric-card--admin-overview">
                <span>Notices</span>
                <strong>{adminState.stats?.noticeCount || 0}</strong>
              </div>
            </div>
          ) : null}

          {activeTab === 'courses' ? (
            <div className="lookup-grid">
              <CollapsiblePanel className="form-panel collapsible-panel" title="Course Builder" description="Create a new course and define how many semesters it supports.">
                <form className="form-grid" onSubmit={(event) => {
                  event.preventDefault();
                  submitJson('/api/admin/courses', 'POST', { ...courseForm, semesterCount: Number(courseForm.semesterCount) }, 'Course created.', () => setCourseForm({ name: '', semesterCount: 8 }));
                }}>
                  <label className="field"><span>Course Name</span><input name="name" value={courseForm.name} onChange={handleField(setCourseForm)} required /></label>
                  <label className="field"><span>Semester Count</span><input name="semesterCount" type="number" min="1" max="16" value={courseForm.semesterCount} onChange={handleField(setCourseForm)} required /></label>
                  <div className="field-full"><button className="primary-button" type="submit" disabled={isPending}>Save Course</button></div>
                </form>
              </CollapsiblePanel>
              <CollapsiblePanel className="list-card collapsible-panel" title="Course Library" description="Quick overview of all created courses.">
                <ul>
                  {courses.map((course) => (
                    <li key={course._id}>
                      <strong>{course.name}</strong>
                      <div className="muted">{course.semesterCount} semesters</div>
                    </li>
                  ))}
                </ul>
              </CollapsiblePanel>
            </div>
          ) : null}

          {activeTab === 'students' ? (
            <div className="dashboard-stack">
              <div className="lookup-grid">
                <CollapsiblePanel className="form-panel collapsible-panel" title="Create Student" description="Add one student account manually.">
                  <form className="form-grid" onSubmit={(event) => {
                    event.preventDefault();
                    submitJson('/api/admin/students', 'POST', studentForm, 'Student account created.', () => setStudentForm({ name: '', email: '', courseCode: '', rollNumber: '', parentEmail: '', parentPhone: '' }));
                  }}>
                    <label className="field"><span>Name</span><input name="name" value={studentForm.name} onChange={handleField(setStudentForm)} /></label>
                    <label className="field"><span>Email</span><input name="email" type="email" value={studentForm.email} onChange={handleField(setStudentForm)} /></label>
                    <label className="field"><span>Course</span><select name="courseCode" value={studentForm.courseCode} onChange={handleField(setStudentForm)} required><option value="">Select course</option>{courseOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                    <label className="field"><span>Roll Number</span><input name="rollNumber" value={studentForm.rollNumber} onChange={handleField(setStudentForm)} required /></label>
                    <label className="field"><span>Parent Email</span><input name="parentEmail" type="email" value={studentForm.parentEmail} onChange={handleField(setStudentForm)} /></label>
                    <label className="field"><span>Parent Phone</span><input name="parentPhone" value={studentForm.parentPhone} onChange={handleField(setStudentForm)} /></label>
                    <div className="field-full"><button className="primary-button" type="submit" disabled={isPending}>Create Student</button></div>
                  </form>
                </CollapsiblePanel>

                <CollapsiblePanel className="form-panel collapsible-panel" title="Bulk Student Import" description="Paste roll numbers to create multiple student accounts in one run." defaultCollapsed>
                  <form className="form-grid" onSubmit={(event) => {
                    event.preventDefault();
                    submitJson('/api/admin/students/bulk', 'POST', { courseCode: bulkForm.courseCode, rollNumbers: normalizeBulkRollNumbers(bulkForm.rollNumbers) }, 'Bulk student creation completed.', () => setBulkForm({ courseCode: '', rollNumbers: '' }));
                  }}>
                    <label className="field"><span>Course</span><select name="courseCode" value={bulkForm.courseCode} onChange={handleField(setBulkForm)} required><option value="">Select course</option>{courseOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                    <label className="field-full"><span>Roll Numbers</span><textarea name="rollNumbers" value={bulkForm.rollNumbers} onChange={handleField(setBulkForm)} placeholder="Paste roll numbers separated by comma, space, or line break" required /></label>
                    <div className="field-full"><button className="secondary-button" type="submit" disabled={isPending}>Bulk Create</button></div>
                  </form>
                </CollapsiblePanel>
              </div>

              <CollapsiblePanel className="list-card collapsible-panel" title="Student Directory" description="Review recently created student accounts.">
                <div className="panel-head" style={{ marginBottom: '0.75rem' }}>
                  <label className="field student-directory__search">
                    <span>Search</span>
                    <input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Search by roll number, name, email, or course" />
                  </label>
                  <div className="muted">{filteredStudents.length} students</div>
                </div>

                <ul>
                  {paginatedStudents.map((student) => (
                    <li key={student._id}>
                      <div className="student-directory__row">
                        <div className="student-directory__content">
                          <strong>{student.rollNumber}</strong>
                          <div className="muted">{student.name || 'Profile pending'}{student.email ? ` · ${student.email}` : ''}</div>
                          <div className="muted">{student.courseCode || 'Course pending'} · Semester {student.currentSemester || 1}</div>
                        </div>
                        <div className="inline-actions">
                          <button className="ghost-button" type="button" onClick={() => openStudentEditor(student)}>Edit</button>
                          <button className="ghost-button" type="button" onClick={() => deleteStudent(student)} disabled={isPending}>Delete</button>
                        </div>
                      </div>
                    </li>
                  ))}
                  {paginatedStudents.length === 0 ? <li className="muted">No students match this search.</li> : null}
                </ul>

                <div className="panel-head" style={{ marginTop: '1rem', marginBottom: 0 }}>
                  <div className="muted">Page {studentPage} of {totalStudentPages}</div>
                  <div className="inline-actions">
                    <button className="ghost-button" type="button" onClick={() => setStudentPage((current) => Math.max(1, current - 1))} disabled={studentPage === 1}>Previous</button>
                    <button className="ghost-button" type="button" onClick={() => setStudentPage((current) => Math.min(totalStudentPages, current + 1))} disabled={studentPage === totalStudentPages}>Next</button>
                  </div>
                </div>
              </CollapsiblePanel>
            </div>
          ) : null}

          {activeTab === 'subjects' ? (
            <div className="subjects-workspace">
              <CollapsiblePanel className="form-panel collapsible-panel subjects-form-panel" title={editingSubjectId ? 'Edit Subject' : 'Subject Builder'} description="Create or refine a shared subject entry. Code stays visible in the form, but the subject library is simplified to avoid noisy duplicate labels.">
                <form className="form-grid" onSubmit={(event) => {
                  event.preventDefault();
                  const payload = { ...subjectForm, credits: Number(subjectForm.credits) };

                  if (editingSubjectId) {
                    submitJson('/api/admin/subjects', 'PATCH', { ...payload, id: editingSubjectId }, 'Subject updated.', () => {
                      setEditingSubjectId('');
                      setSubjectForm({ code: '', name: '', credits: 0 });
                    });
                    return;
                  }

                  submitJson('/api/admin/subjects', 'POST', payload, 'Subject saved.', () => setSubjectForm({ code: '', name: '', credits: 0 }));
                }}>
                  <label className="field"><span>Subject Code</span><input name="code" value={subjectForm.code} onChange={handleField(setSubjectForm)} required /></label>
                  <label className="field"><span>Subject Name</span><input name="name" value={subjectForm.name} onChange={handleField(setSubjectForm)} required /></label>
                  <label className="field"><span>Credits</span><input name="credits" type="number" min="0" value={subjectForm.credits} onChange={handleField(setSubjectForm)} /></label>
                  <div className="field-full inline-actions">
                    <button className="primary-button" type="submit" disabled={isPending}>{editingSubjectId ? 'Update Subject' : 'Save Subject'}</button>
                    {editingSubjectId ? (
                      <button className="ghost-button" type="button" onClick={() => { setEditingSubjectId(''); setSubjectForm({ code: '', name: '', credits: 0 }); }}>
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </form>
              </CollapsiblePanel>

              <CollapsiblePanel
                className="list-card collapsible-panel subjects-list-card"
                title="Subject Library"
                description="Search by subject code or subject name."
                actions={(
                  <label className="field subjects-search-field">
                    <span>Search</span>
                    <input value={subjectSearch} onChange={(event) => setSubjectSearch(event.target.value)} placeholder="CSE311 or Database" />
                  </label>
                )}
              >
                <ul>
                  {filteredSubjects.map((subject) => {
                    const showSeparateName = subject.name && subject.name.trim().toUpperCase() !== subject.code;

                    return (
                    <li key={subject._id}>
                      <div className="subject-record-row">
                        <div className="subject-record-row__content">
                          <div className="subject-record-row__main">
                            {showSeparateName ? <strong>{subject.name}</strong> : <strong>{subject.code}</strong>}
                            {showSeparateName ? <span className="subject-record-row__code">{subject.code}</span> : null}
                          </div>
                          <div className="muted">Credits {subject.credits || 0}</div>
                        </div>
                        <button className="ghost-button" type="button" onClick={() => { setEditingSubjectId(subject._id); setSubjectForm({ code: subject.code, name: subject.name, credits: subject.credits || 0 }); }}>
                          Edit
                        </button>
                      </div>
                    </li>
                    );
                  })}
                  {filteredSubjects.length === 0 ? <li className="muted">No subjects match this search.</li> : null}
                </ul>
              </CollapsiblePanel>
            </div>
          ) : null}

          {activeTab === 'results' ? (
            <div className="dashboard-stack">
              <CollapsiblePanel className="form-panel collapsible-panel" title="Manual Result Entry" description="Add one student result by hand when you do not want to upload a sheet.">
                <form className="form-grid" onSubmit={(event) => {
                  event.preventDefault();
                  submitJson('/api/admin/results', 'POST', {
                    ...resultForm,
                    semester: Number(resultForm.semester),
                    examYear: Number(resultForm.examYear),
                    subjects: resultForm.subjects.filter((item) => item.code.trim()),
                  }, 'Manual result saved.', () => setResultForm({ courseCode: '', rollNumber: '', semester: 1, examYear: new Date().getFullYear(), studentName: '', fatherName: '', sgpa: '', totalCreditPoints: '', remarks: '', visibility: 'private', subjects: [emptyManualSubject()] }));
                }}>
                  <label className="field"><span>Course</span><select name="courseCode" value={resultForm.courseCode} onChange={handleField(setResultForm)} required><option value="">Select course</option>{courseOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  <label className="field"><span>Roll Number</span><input name="rollNumber" value={resultForm.rollNumber} onChange={handleField(setResultForm)} required /></label>
                  <label className="field"><span>Semester</span><input name="semester" type="number" min="1" max="16" value={resultForm.semester} onChange={handleField(setResultForm)} required /></label>
                  <label className="field"><span>Exam Year</span><input name="examYear" type="number" min="2000" max="2100" value={resultForm.examYear} onChange={handleField(setResultForm)} required /></label>
                  <label className="field"><span>Student Name</span><input name="studentName" value={resultForm.studentName} onChange={handleField(setResultForm)} required /></label>
                  <label className="field"><span>Father Name</span><input name="fatherName" value={resultForm.fatherName} onChange={handleField(setResultForm)} /></label>
                  <label className="field"><span>CGPA</span><input name="sgpa" value={resultForm.sgpa} onChange={handleField(setResultForm)} /></label>
                  <label className="field"><span>Total Credit Points</span><input name="totalCreditPoints" value={resultForm.totalCreditPoints} onChange={handleField(setResultForm)} /></label>
                  <label className="field"><span>Visibility</span><select name="visibility" value={resultForm.visibility} onChange={handleField(setResultForm)}><option value="private">Private</option><option value="public">Public</option></select></label>
                  <label className="field-full"><span>Remarks</span><textarea name="remarks" value={resultForm.remarks} onChange={handleField(setResultForm)} /></label>
                  <div className="field-full dashboard-stack">
                    <strong>Subjects</strong>
                    {resultForm.subjects.map((subject, index) => (
                      <div className="form-grid form-grid--3" key={`subject-${index}`}>
                        <label className="field"><span>Code</span><input value={subject.code} onChange={(event) => updateResultSubject(index, 'code', event.target.value)} /></label>
                        <label className="field"><span>Name</span><input value={subject.name} onChange={(event) => updateResultSubject(index, 'name', event.target.value)} /></label>
                        <label className="field"><span>Score</span><input value={subject.score} onChange={(event) => updateResultSubject(index, 'score', event.target.value)} /></label>
                      </div>
                    ))}
                    <div className="inline-actions">
                      <button type="button" className="ghost-button" onClick={() => setResultForm((current) => ({ ...current, subjects: [...current.subjects, emptyManualSubject()] }))}>Add Subject Row</button>
                    </div>
                  </div>
                  <div className="field-full"><button className="primary-button" type="submit" disabled={isPending}>Save Manual Result</button></div>
                </form>
              </CollapsiblePanel>

              <CollapsiblePanel className="form-panel collapsible-panel" title="Sheet Upload" description="Upload CSV or Excel sheets for faster batch imports." defaultCollapsed>
                <form className="form-grid" onSubmit={uploadSheet}>
                  <label className="field"><span>Course</span><select name="courseCode" value={uploadForm.courseCode} onChange={(event) => setUploadForm((current) => ({ ...current, courseCode: event.target.value }))} required><option value="">Select course</option>{courseOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  <label className="field"><span>Semester</span><input name="semester" type="number" min="1" max="16" value={uploadForm.semester} onChange={(event) => setUploadForm((current) => ({ ...current, semester: event.target.value }))} required /></label>
                  <label className="field"><span>Exam Year</span><input name="examYear" type="number" min="2000" max="2100" value={uploadForm.examYear} onChange={(event) => setUploadForm((current) => ({ ...current, examYear: event.target.value }))} required /></label>
                  <label className="field"><span>Visibility</span><select name="visibility" value={uploadForm.visibility} onChange={(event) => setUploadForm((current) => ({ ...current, visibility: event.target.value }))}><option value="private">Private</option><option value="public">Public</option></select></label>
                  <label className="field-full"><span>Spreadsheet</span><input name="file" type="file" accept=".xlsx,.xls,.csv,text/csv" onChange={(event) => setUploadForm((current) => ({ ...current, fileName: event.target.files?.[0]?.name || '' }))} required /></label>
                  {uploadForm.fileName ? <div className="field-full muted">Selected file: {uploadForm.fileName}</div> : null}
                  <div className="field-full muted">Supports flexible CSV headers. The importer auto-detects roll number, student name, remarks, credit points, CGPA/SGPA, and treats all remaining columns as subject codes.</div>
                  <div className="field-full"><button className="secondary-button" type="submit" disabled={isPending}>Upload Result Sheet</button></div>
                </form>
              </CollapsiblePanel>

              <CollapsiblePanel
                className="list-card collapsible-panel"
                title="Saved Results"
                description="Filter by course and semester so you only publish the batch you want."
                actions={(
                  <>
                    <button className="ghost-button" type="button" onClick={() => setPublishSelection(filteredResults.map((result) => result._id))} disabled={isPending || filteredResults.length === 0}>Select All</button>
                    <button className="ghost-button" type="button" onClick={() => deleteResults(publishSelection)} disabled={isPending || publishSelection.length === 0}>Delete Selected</button>
                    <button className="primary-button" type="button" onClick={publishResults} disabled={isPending}>Publish Selected</button>
                  </>
                )}
              >
                <div className="dashboard-stack" style={{ marginBottom: '1rem' }}>
                  <div className="course-pills">
                    {resultCourseTabs.map((tab) => (
                      <button
                        key={tab.value}
                        className={`course-pill ${resultCourseFilter === tab.value ? 'active' : ''}`}
                        type="button"
                        onClick={() => setResultCourseFilter(tab.value)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="course-pills">
                    {resultSemesterTabs.map((tab) => (
                      <button
                        key={tab.value}
                        className={`course-pill ${resultSemesterFilter === tab.value ? 'active' : ''}`}
                        type="button"
                        onClick={() => setResultSemesterFilter(tab.value)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <ul>
                  {paginatedResults.map((result) => (
                    <li key={result._id}>
                      <div className="list-row" style={{ alignItems: 'flex-start', gap: 12 }}>
                        <label style={{ display: 'grid', gridTemplateColumns: '20px minmax(0, 1fr)', gap: 12, alignItems: 'start', flex: 1 }}>
                          <input
                            type="checkbox"
                            checked={publishSelection.includes(result._id)}
                            onChange={(event) => {
                              setPublishSelection((current) =>
                                event.target.checked ? [...current, result._id] : current.filter((item) => item !== result._id)
                              );
                            }}
                          />
                          <span>
                            <strong>{result.studentName}</strong>
                            <div className="muted">{result.rollNumber} · Semester {result.semester} · {result.examYear}</div>
                            <div className="muted">{result.remarks || 'No remarks'} · {result.visibility} · CGPA {result.cgpa || result.sgpa || 'N/A'}</div>
                          </span>
                        </label>
                        <button className="ghost-button" type="button" onClick={() => deleteResults([result._id])} disabled={isPending}>
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                  {paginatedResults.length === 0 ? <li className="muted">No results found for this selection.</li> : null}
                </ul>

                <div className="panel-head" style={{ marginTop: '1rem', marginBottom: 0 }}>
                  <div className="muted">Page {resultPage} of {totalResultPages}</div>
                  <div className="inline-actions">
                    <button className="ghost-button" type="button" onClick={() => setResultPage((current) => Math.max(1, current - 1))} disabled={resultPage === 1}>Previous</button>
                    <button className="ghost-button" type="button" onClick={() => setResultPage((current) => Math.min(totalResultPages, current + 1))} disabled={resultPage === totalResultPages}>Next</button>
                  </div>
                </div>
              </CollapsiblePanel>
            </div>
          ) : null}

          {activeTab === 'notices' ? (
            <div className="lookup-grid">
              <CollapsiblePanel className="form-panel collapsible-panel" title="Notice Composer" description="Create announcements for the public site or students.">
                <form className="form-grid" onSubmit={(event) => {
                  event.preventDefault();
                  submitJson('/api/admin/notices', 'POST', noticeForm, 'Notice published.', () => setNoticeForm({ title: '', summary: '', type: 'general', audience: 'public', isPinned: false, relatedCourseCode: '', actionUrl: '', actionLabel: '' }));
                }}>
                  <label className="field"><span>Title</span><input name="title" value={noticeForm.title} onChange={handleField(setNoticeForm)} required /></label>
                  <label className="field"><span>Type</span><select name="type" value={noticeForm.type} onChange={handleField(setNoticeForm)}><option value="general">General</option><option value="result">Result</option></select></label>
                  <label className="field"><span>Audience</span><select name="audience" value={noticeForm.audience} onChange={handleField(setNoticeForm)}><option value="public">Public</option><option value="students">Students</option></select></label>
                  <label className="field"><span>Related Course</span><select name="relatedCourseCode" value={noticeForm.relatedCourseCode} onChange={handleField(setNoticeForm)}><option value="">Optional</option>{courseOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  <label className="field-full"><span>Summary</span><textarea name="summary" value={noticeForm.summary} onChange={handleField(setNoticeForm)} required /></label>
                  <label className="field"><span>Action Label</span><input name="actionLabel" value={noticeForm.actionLabel} onChange={handleField(setNoticeForm)} placeholder="Optional button text" /></label>
                  <label className="field"><span>Action Link</span><input name="actionUrl" value={noticeForm.actionUrl} onChange={handleField(setNoticeForm)} placeholder="https://example.com/result" /></label>
                  <label className="field-full field-checkbox"><span><input name="isPinned" type="checkbox" checked={noticeForm.isPinned} onChange={handleField(setNoticeForm)} /> Pin notice</span></label>
                  <div className="field-full"><button className="primary-button" type="submit" disabled={isPending}>Publish Notice</button></div>
                </form>
              </CollapsiblePanel>

              <CollapsiblePanel className="list-card collapsible-panel" title="Notice Feed" description="Latest notices created from the admin panel." defaultCollapsed>
                <ul>
                  {notices.map((notice) => (
                    <li key={notice._id}>
                      <strong>{notice.title}</strong>
                      <div className="muted">{notice.summary}</div>
                      {notice.actionUrl ? <div><a href={notice.actionUrl} className="notice-list-card__action">{notice.actionLabel || 'Open link'}</a></div> : null}
                    </li>
                  ))}
                </ul>
              </CollapsiblePanel>
            </div>
          ) : null}
        </section>
      </div>

      {editingStudent ? (
        <div className="student-editor-modal" role="dialog" aria-modal="true" aria-label="Edit student profile" onClick={closeStudentEditor}>
          <div className="student-editor-modal__panel" onClick={(event) => event.stopPropagation()}>
            <div className="student-editor-modal__header">
              <div>
                <h3>Edit Student</h3>
                <p className="muted">Update profile details, semester, course, and password from one place.</p>
              </div>
              <button className="student-editor-modal__close" type="button" onClick={closeStudentEditor} aria-label="Close student editor">
                <X size={18} />
              </button>
            </div>

            <form className="form-grid" onSubmit={saveStudentEditor}>
              <label className="field"><span>Name</span><input name="name" value={studentEditorForm.name} onChange={handleField(setStudentEditorForm)} /></label>
              <label className="field"><span>Email</span><input name="email" type="email" value={studentEditorForm.email} onChange={handleField(setStudentEditorForm)} /></label>
              <label className="field"><span>Course</span><select name="courseCode" value={studentEditorForm.courseCode} onChange={handleField(setStudentEditorForm)} required><option value="">Select course</option>{courseOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              <label className="field"><span>Roll Number</span><input name="rollNumber" value={studentEditorForm.rollNumber} onChange={handleField(setStudentEditorForm)} required /></label>
              <label className="field"><span>Current Semester</span><input name="currentSemester" type="number" min="1" max="16" value={studentEditorForm.currentSemester} onChange={handleField(setStudentEditorForm)} /></label>
              <label className="field"><span>Reset Password</span><input name="password" type="password" value={studentEditorForm.password} onChange={handleField(setStudentEditorForm)} placeholder="Leave blank to keep current password" /></label>
              <label className="field"><span>Parent Email</span><input name="parentEmail" type="email" value={studentEditorForm.parentEmail} onChange={handleField(setStudentEditorForm)} /></label>
              <label className="field"><span>Parent Phone</span><input name="parentPhone" value={studentEditorForm.parentPhone} onChange={handleField(setStudentEditorForm)} /></label>
              <label className="field-full field-checkbox"><span><input name="profileCompleted" type="checkbox" checked={studentEditorForm.profileCompleted} onChange={handleField(setStudentEditorForm)} /> Profile completed</span></label>
              <div className="field-full inline-actions student-editor-modal__actions">
                <button className="primary-button" type="submit" disabled={isPending}>Save Changes</button>
                <button className="ghost-button" type="button" onClick={() => deleteStudent(editingStudent)} disabled={isPending}>Delete Student</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}