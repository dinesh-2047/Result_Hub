import { RESULT_META_FIELDS } from '@/lib/constants';

function normalizeHeaderToken(value = '') {
  return String(value)
    .replace(/^\uFEFF/, '')
    .replace(/_/g, ' ')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const RESULT_META_PATTERNS = [
  /^sr ?no$/,
  /^s ?no$/,
  /^serial ?no$/,
  /^serial ?number$/,
  /^student ?name$/,
  /^father ?name$/,
  /^guardian ?name$/,
  /^parent ?name$/,
  /^roll ?no$/,
  /^roll ?number$/,
  /^registration ?no$/,
  /^registration ?number$/,
  /^reg ?no$/,
  /^enrollment ?no$/,
  /^enrolment ?no$/,
  /^total ?credit ?points? ?earned(?: ?b)?$/,
  /^total ?credit ?points?$/,
  /^credit ?points? ?earned(?: ?b)?$/,
  /^semester ?credit ?points? ?average(?: ?b ?a)?$/,
  /^credit ?points? ?average(?: ?b ?a)?$/,
  /^cgpa$/,
  /^sgpa$/,
  /^semester ?average$/,
  /^grade ?point ?average$/,
  /^result$/,
  /^remarks?$/,
  /^status$/,
  /^outcome$/,
];

export function isResultMetaField(value = '') {
  const token = normalizeHeaderToken(value);
  const metaFieldSet = new Set(RESULT_META_FIELDS.map((field) => normalizeHeaderToken(field)));

  return metaFieldSet.has(token) || RESULT_META_PATTERNS.some((pattern) => pattern.test(token));
}

export function filterResultSubjects(subjects = []) {
  return subjects.filter((subject) => !isResultMetaField(subject.code) && !isResultMetaField(subject.name));
}

export function extractSubjectCodes(headers = []) {
  return headers.filter((header) => !isResultMetaField(header));
}

export function buildSubjectEntries(row, subjectCodes, subjectMap = {}) {
  return subjectCodes.filter((code) => !isResultMetaField(code)).map((code) => ({
    code,
    name: subjectMap[code]?.name || subjectMap[code] || code,
    credits: Number(subjectMap[code]?.credits || 0),
    score: String(row[code] || '').trim(),
  }));
}

export function inferResultStatus(remarks = '') {
  return remarks.toUpperCase().includes('PASS') ? 'pass' : 'review';
}

export function normalizeBulkRollNumbers(value = '') {
  return value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatResultPayload(result, subjects = []) {
  const subjectMap = new Map(subjects.map((subject) => [subject.code, subject.name]));
  const cgpa = result.cgpa || result.sgpa || '';

  return {
    id: result._id?.toString?.() || result.id,
    courseCode: result.courseCode,
    rollNumber: result.rollNumber,
    studentName: result.studentName,
    fatherName: result.fatherName,
    semester: result.semester,
    examYear: result.examYear,
    totalCreditPoints: result.totalCreditPoints || '',
    cgpa,
    sgpa: result.sgpa || '',
    remarks: result.remarks || '',
    visibility: result.visibility,
    publishedAt: result.publishedAt || null,
    subjects: (result.subjects || []).map((subject) => ({
      code: subject.code,
      name: subjectMap.get(subject.code) || subject.name || subject.code,
      credits: Number(subject.credits || 0),
      score: subject.score,
    })),
  };
}