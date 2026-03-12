import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ensureBootstrap } from '@/lib/bootstrap';
import { requireUser } from '@/lib/auth';
import { fail, ok } from '@/lib/api';
import { sendEmail } from '@/lib/mailer';
import { buildSubjectEntries, inferResultStatus, isResultMetaField } from '@/lib/result-utils';
import Notice from '@/models/Notice';
import Result from '@/models/Result';
import Subject from '@/models/Subject';
import User from '@/models/User';

const HEADER_PATTERNS = {
  serialNumber: [/^srno$/, /^sno$/, /^serialno$/, /^serialnumber$/],
  studentName: [/^studentname$/, /^name$/, /^student$/],
  fatherName: [/^fathername$/, /^father$/, /^guardianname$/, /^parentname$/],
  rollNumber: [/^rollno$/, /^rollnumber$/, /^roll$/, /^registrationno$/, /^registrationnumber$/, /^regno$/, /^enrollmentno$/, /^enrolmentno$/],
  totalCreditPoints: [/^totalcreditpoints?earned(?:b)?$/, /^totalcreditpoints?$/, /^totalcredits$/, /^creditpoints?earned(?:b)?$/],
  cgpa: [/^semestercreditpoints?average(?:ba)?$/, /^creditpoints?average(?:ba)?$/, /^cgpa$/, /^sgpa$/, /^semesteraverage$/, /^gradepointaverage$/],
  remarks: [/^remarks$/, /^remark$/, /^result$/, /^status$/, /^outcome$/],
};

function normalizeToken(value = '') {
  return normalizeHeader(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function detectHeader(headers, patterns) {
  return headers.find((header) => {
    const token = normalizeToken(header);
    return patterns.some((pattern) => pattern.test(token));
  }) || null;
}

function detectSchema(headers = []) {
  const detected = {
    serialNumber: detectHeader(headers, HEADER_PATTERNS.serialNumber),
    studentName: detectHeader(headers, HEADER_PATTERNS.studentName),
    fatherName: detectHeader(headers, HEADER_PATTERNS.fatherName),
    rollNumber: detectHeader(headers, HEADER_PATTERNS.rollNumber),
    totalCreditPoints: detectHeader(headers, HEADER_PATTERNS.totalCreditPoints),
    cgpa: detectHeader(headers, HEADER_PATTERNS.cgpa),
    remarks: detectHeader(headers, HEADER_PATTERNS.remarks),
  };

  const metaHeaders = new Set(Object.values(detected).filter(Boolean));
  const subjectCodes = headers.filter((header) => !metaHeaders.has(header) && !isResultMetaField(header));

  return { detected, subjectCodes };
}

function normalizeHeader(value = '') {
  return String(value)
    .replace(/^\uFEFF/, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeRow(row = {}) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), value])
  );
}

function getRowValue(row, keys) {
  if (!Array.isArray(keys)) {
    return keys ? row[keys] ?? '' : '';
  }

  for (const key of keys) {
    const normalizedKey = normalizeHeader(key);
    if (normalizedKey in row) {
      return row[normalizedKey];
    }
  }

  return '';
}

async function parseUploadRows(file) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = String(file.name || '').toLowerCase();
  const fileType = String(file.type || '').toLowerCase();

  if (fileName.endsWith('.csv') || fileType.includes('csv')) {
    const parsed = Papa.parse(buffer.toString('utf8'), {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
    });

    return {
      rows: (parsed.data || []).map((row) => normalizeRow(row)),
      headers: (parsed.meta.fields || []).map((header) => normalizeHeader(header)),
    };
  }

  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' }).map((row) => normalizeRow(row));

  return {
    rows,
    headers: Object.keys(rows[0] || {}).map((header) => normalizeHeader(header)),
  };
}

function getBaseAppUrl() {
  return String(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function createPublicResultUrl({ courseCode, semester, examYear }) {
  const params = new URLSearchParams({
    courseCode,
    semester: String(semester),
    examYear: String(examYear),
  });

  return `${getBaseAppUrl()}/results?${params.toString()}`;
}

function createPublicStudentResultUrl({ rollNumber, courseCode, semester, examYear }) {
  const params = new URLSearchParams({
    rollNumber,
    courseCode,
    semester: String(semester),
    examYear: String(examYear),
  });

  return `${getBaseAppUrl()}/results?${params.toString()}`;
}

function createStudentPortalUrl() {
  return `${getBaseAppUrl()}/sign-in`;
}

export async function POST(request) {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const formData = await request.formData();
  const file = formData.get('file');
  const courseCode = String(formData.get('courseCode') || '').trim().toUpperCase();
  const semester = Number(formData.get('semester'));
  const examYear = Number(formData.get('examYear'));
  const visibility = String(formData.get('visibility') || 'private');

  if (!file || !courseCode || !semester || !examYear) {
    return fail('File, course code, semester, and exam year are required.', 400);
  }

  const { rows, headers } = await parseUploadRows(file);

  if (rows.length === 0) {
    return fail('Uploaded sheet is empty.', 400);
  }

  const { detected, subjectCodes } = detectSchema(headers);
  if (!detected.rollNumber) {
    return fail('Could not detect the roll number column in the uploaded file.', 400);
  }

  if (subjectCodes.length === 0) {
    return fail('Could not detect subject columns in the uploaded file.', 400);
  }

  const subjectDocs = await Subject.find({ code: { $in: subjectCodes } }).lean();
  const subjectMap = subjectDocs.reduce((accumulator, subject) => {
    accumulator[subject.code] = subject;
    return accumulator;
  }, {});

  for (const code of subjectCodes) {
    if (!subjectMap[code]) {
      await Subject.findOneAndUpdate(
        { code },
        { name: code, credits: 0 },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      subjectMap[code] = { name: code, credits: 0 };
    }
  }

  let processed = 0;
  let skipped = 0;
  const importedRollNumbers = [];

  for (const row of rows) {
    const rollNumber = String(getRowValue(row, detected.rollNumber) || '').trim().toUpperCase();
    if (!rollNumber) {
      skipped += 1;
      continue;
    }

    await Result.findOneAndUpdate(
      { courseCode, semester, examYear, rollNumber },
      {
        courseCode,
        semester,
        examYear,
        rollNumber,
        studentName: String(getRowValue(row, detected.studentName) || '').trim(),
        fatherName: String(getRowValue(row, detected.fatherName) || '').trim(),
        totalCreditPoints: String(getRowValue(row, detected.totalCreditPoints) || '').trim(),
        sgpa: String(getRowValue(row, detected.cgpa) || '').trim(),
        remarks: String(getRowValue(row, detected.remarks) || '').trim(),
        status: inferResultStatus(String(getRowValue(row, detected.remarks) || '')),
        visibility,
        publishedAt: visibility === 'public' ? new Date() : null,
        subjects: buildSubjectEntries(row, subjectCodes, subjectMap),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    processed += 1;
    importedRollNumbers.push(rollNumber);
  }

  if (processed === 0) {
    return fail(`No valid result rows were found in the uploaded file. Skipped ${skipped} rows.`, 400);
  }

  const targetStudents = await User.find({
    role: 'student',
    courseCode,
    currentSemester: semester,
    rollNumber: { $in: importedRollNumbers },
    email: { $exists: true, $ne: '' },
  }).lean();

  const publicResultUrl = createPublicResultUrl({ courseCode, semester, examYear });
  const studentPortalUrl = createStudentPortalUrl();
  const actionUrl = visibility === 'public' ? publicResultUrl : studentPortalUrl;
  const actionLabel = visibility === 'public' ? 'Open Result Lookup' : 'Sign In To View Result';

  await Notice.findOneAndUpdate(
    { title: `${courseCode} Semester ${semester} Result ${examYear}` },
    {
      title: `${courseCode} Semester ${semester} Result ${examYear}`,
      summary: visibility === 'public'
        ? `${processed} results for semester ${semester} are now available. Open the result page to search by roll number.`
        : `${processed} results for semester ${semester} were uploaded. Students can sign in to view their result.`,
      type: 'result',
      audience: 'public',
      status: 'published',
      relatedCourseCode: courseCode,
      actionUrl,
      actionLabel,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (targetStudents.length > 0) {
    await Promise.allSettled(
      targetStudents.map((student) => {
        const studentResultUrl = createPublicStudentResultUrl({
          rollNumber: student.rollNumber,
          courseCode,
          semester,
          examYear,
        });

        return sendEmail({
          to: student.email,
          subject: `${courseCode} semester ${semester} result uploaded`,
          html: visibility === 'public'
            ? `<p>Your ${courseCode} semester ${semester} result for ${examYear} has been uploaded.</p><p><a href="${studentResultUrl}">Open your result link</a> to view it directly.</p>`
            : `<p>Your ${courseCode} semester ${semester} result for ${examYear} has been uploaded.</p><p><a href="${studentPortalUrl}">Sign in to the student portal</a> to view it securely.</p>`,
        });
      })
    );
  }

  return ok({ processed, skipped, notifiedStudents: targetStudents.length, message: `Imported ${processed} results from spreadsheet.` }, 201);
}