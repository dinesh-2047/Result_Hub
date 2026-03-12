export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Campus Result Hub';

export const AUTH_COOKIE = 'result_portal_auth';

export const COURSE_NAME_MAP = {
  'btech-cse': 'B.Tech Computer Science and Engineering',
  'cse-aiml': 'B.Tech CSE AI and ML',
  bttm: 'Bachelor of Travel and Tourism Management',
  bpes: 'Bachelor of Physical Education and Sports',
};

export const RESULT_META_FIELDS = [
  'Sr No',
  'Student Name',
  'Father Name',
  'Roll No',
  'TOTAL CREDIT POINT EARNED (B)',
  'SEMESTER CREDIT POINT AVERAGE (B/A)',
  'Semester Credit Point Average',
  'Total Credit Points Earned',
  'Result',
  'Remarks',
];

export const ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
};

export const RESULT_VISIBILITY = {
  PRIVATE: 'private',
  PUBLIC: 'public',
};