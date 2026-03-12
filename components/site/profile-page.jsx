'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ProfilePageSkeleton } from '@/components/shared/site/loading-skeletons';

function emptyForm() {
  return {
    name: '',
    email: '',
    courseCode: '',
    rollNumber: '',
    currentSemester: 1,
    parentEmail: '',
    parentPhone: '',
    currentPassword: '',
    newPassword: '',
  };
}

export function ProfilePage() {
  const [authUser, setAuthUser] = useState(undefined);
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [courseName, setCourseName] = useState('');
  const [courseSemesterCount, setCourseSemesterCount] = useState(0);
  const [form, setForm] = useState(emptyForm());
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  async function loadStudentProfile() {
    const [profileRes, coursesRes] = await Promise.all([
      fetch('/api/student/profile', { cache: 'no-store' }),
      fetch('/api/public/courses'),
    ]);

    const [profileData, coursesData] = await Promise.all([
      profileRes.json(),
      coursesRes.json(),
    ]);

    if (!profileRes.ok || !profileData.user) {
      setProfile(null);
      return;
    }

    const matchedCourse = (coursesData.courses || []).find((course) => course.code === (profileData.user.courseCode || ''));
    setProfile(profileData.user);
    setCourseName(matchedCourse?.name || '');
    setCourseSemesterCount(Number(matchedCourse?.semesterCount || 0));
    setForm({
      name: profileData.user.name || '',
      email: profileData.user.email || '',
      courseCode: profileData.user.courseCode || '',
      rollNumber: profileData.user.rollNumber || '',
      currentSemester: Number(profileData.user.currentSemester || 1),
      parentEmail: profileData.user.parentEmail || '',
      parentPhone: profileData.user.parentPhone || '',
      currentPassword: '',
      newPassword: '',
    });
  }

  async function loadPage() {
    setIsLoading(true);
    const response = await fetch('/api/auth/me', { cache: 'no-store' });
    const payload = await response.json();

    setAuthUser(payload.user || null);
    setStats(payload.stats || null);

    if (payload.user?.role === 'student') {
      await loadStudentProfile();
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadPage().catch(() => {
      setIsLoading(false);
      setAuthUser(null);
      toast.error('Unable to load profile.');
    });
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === 'currentSemester' ? Number(value || 1) : value,
    }));
  }

  const semesterOptions = Array.from(
    { length: Math.max(courseSemesterCount, Number(form.currentSemester || 1), Number(profile?.currentSemester || 1), 1) },
    (_, index) => index + 1,
  );

  function submitStudentProfile(event) {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await response.json();
      if (!response.ok) {
        toast.error(payload.message || 'Profile update failed.');
        return;
      }

      setProfile(payload.user || null);
      setAuthUser((current) => (current ? { ...current, currentSemester: Number(payload.user?.currentSemester || current.currentSemester || 1) } : current));
      setForm((current) => ({
        ...current,
        currentSemester: Number(payload.user?.currentSemester || current.currentSemester || 1),
        currentPassword: '',
        newPassword: '',
      }));
      toast.success(payload.message || 'Profile updated.');
      await loadStudentProfile();
    });
  }

  if (isLoading || authUser === undefined) {
    return <ProfilePageSkeleton />;
  }

  if (!authUser) {
    return (
      <main className="site-shell section">
        <div className="empty-state">
          <h1 className="dashboard-title">Sign-in required</h1>
          <p className="page-intro">Sign in to access your profile and dashboard.</p>
        </div>
      </main>
    );
  }

  if (authUser.role === 'admin') {
    return (
      <main className="site-shell section">
        <section className="profile-page-grid">
          <article className="dashboard-panel profile-summary-card">
            <span className="eyebrow">Admin Profile</span>
            <h1 className="dashboard-title">{authUser.name || 'Administrator'}</h1>
            <p className="page-intro">Your account is separate from the admin control center now. Use the dashboard for operations and this page for account identity.</p>

            <ul className="simple-list profile-facts">
              <li><strong>Email</strong><span>{authUser.email || 'Not available'}</span></li>
              <li><strong>Role</strong><span>Administrator</span></li>
            </ul>

            <div className="inline-actions" style={{ marginTop: '1rem' }}>
              <Link href="/admin" className="primary-button">Open Dashboard</Link>
              <Link href="/" className="ghost-button">Back Home</Link>
            </div>
          </article>

          <section className="card-grid profile-stats-grid">
            <div className="metric-card">
              <span>Students</span>
              <strong>{stats?.studentCount || 0}</strong>
            </div>
            <div className="metric-card">
              <span>Courses</span>
              <strong>{stats?.courseCount || 0}</strong>
            </div>
            <div className="metric-card">
              <span>Results</span>
              <strong>{stats?.resultCount || 0}</strong>
            </div>
            <div className="metric-card">
              <span>Notices</span>
              <strong>{stats?.noticeCount || 0}</strong>
            </div>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="site-shell section">
      <section className="student-hero">
        <div>
          <span className="eyebrow">Student Profile</span>
          <h1 className="dashboard-title">{profile?.name || authUser.name || 'Profile'}</h1>
          <p className="page-intro">Manage your personal details and password here. Your result history stays on the dashboard.</p>
        </div>
        <div className="student-hero__stats">
          <div className="metric-card metric-card--course">
            <span>Course</span>
            <div className="metric-card__value metric-card__value--compact">{courseName || 'Not assigned'}</div>
          </div>
          <div className="metric-card">
            <span>Current Semester</span>
            <strong>{profile?.currentSemester || 1}</strong>
          </div>
        </div>
      </section>

      <div className="student-panel-toolbar">
        <Link href="/dashboard" className="ghost-button">Open Dashboard</Link>
      </div>

      <form className="dashboard-panel student-profile-panel student-profile-panel--page" onSubmit={submitStudentProfile}>
        <div className="section-head section-head--tight">
          <div>
            <h2 className="section-title">Profile Settings</h2>
            <p className="section-copy">Update your basic account details and change your password when needed.</p>
          </div>
        </div>

        <div className="form-grid">
          <label className="field"><span>Name</span><input name="name" value={form.name} onChange={updateField} /></label>
          <label className="field"><span>Email</span><input name="email" type="email" value={form.email} onChange={updateField} /></label>
          <label className="field"><span>Course</span><input value={courseName || 'Not assigned'} readOnly /></label>
          <label className="field"><span>Roll Number</span><input name="rollNumber" value={form.rollNumber} onChange={updateField} /></label>
          <label className="field"><span>Current Semester</span><select name="currentSemester" value={form.currentSemester} onChange={updateField}>{semesterOptions.map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}</select></label>
          <label className="field"><span>Parent Email</span><input name="parentEmail" type="email" value={form.parentEmail} onChange={updateField} /></label>
          <label className="field"><span>Parent Phone</span><input name="parentPhone" value={form.parentPhone} onChange={updateField} /></label>
          <label className="field"><span>Current Password</span><input name="currentPassword" type="password" value={form.currentPassword} onChange={updateField} /></label>
          <label className="field"><span>New Password</span><input name="newPassword" type="password" value={form.newPassword} onChange={updateField} /></label>
        </div>

        <div className="student-profile-panel__footer">
          <div className="muted">Status: {profile?.profileCompleted ? 'Completed' : 'Pending'} · Semester {profile?.currentSemester || 1}</div>
          <button className="primary-button" type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>
    </main>
  );
}