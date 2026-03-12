import fs from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';
import { connectToDatabase } from '@/lib/db';
import { COURSE_NAME_MAP, RESULT_VISIBILITY, ROLES } from '@/lib/constants';
import { extractSubjectCodes, buildSubjectEntries, inferResultStatus } from '@/lib/result-utils';
import { hashPassword } from '@/lib/password';
import Course from '@/models/Course';
import Notice from '@/models/Notice';
import BootstrapState from '@/models/BootstrapState';
import Result from '@/models/Result';
import Subject from '@/models/Subject';
import User from '@/models/User';

let bootstrapPromise;

function slugToCode(slug) {
  return slug.replace(/-/g, '_').toUpperCase();
}

function titleFromSlug(slug) {
  return COURSE_NAME_MAP[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

async function ensureDefaultAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';
  const existingAdmin = await User.findOne({ role: ROLES.ADMIN });

  if (existingAdmin) {
    return existingAdmin;
  }

  return User.create({
    role: ROLES.ADMIN,
    name: 'System Admin',
    email: adminEmail,
    passwordHash: await hashPassword(adminPassword),
    profileCompleted: true,
  });
}

async function importLegacyCsvResults() {
  const csvRoot = path.join(process.cwd(), 'assets', 'csvs');
  const rootStat = await fs.stat(csvRoot).catch(() => null);

  if (!rootStat) {
    return;
  }

  const courseFolders = await fs.readdir(csvRoot, { withFileTypes: true });

  for (const folder of courseFolders) {
    if (!folder.isDirectory()) {
      continue;
    }

    const slug = folder.name;
    const courseCode = slugToCode(slug);
    const courseDir = path.join(csvRoot, slug);
    const files = await fs.readdir(courseDir);
    const semesterCount = files.reduce((count, file) => {
      const match = file.match(/sem(\d+)\.csv$/i);
      return match ? Math.max(count, Number(match[1])) : count;
    }, 1);

    await Course.findOneAndUpdate(
      { code: courseCode },
      {
        name: titleFromSlug(slug),
        code: courseCode,
        slug,
        semesterCount,
        description: `Imported legacy course for ${titleFromSlug(slug)}.`,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    for (const file of files) {
      if (!file.endsWith('.csv')) {
        continue;
      }

      const match = file.match(/results_(\d+)_sem(\d+)\.csv$/i);
      if (!match) {
        continue;
      }

      const examYear = Number(match[1]);
      const semester = Number(match[2]);
      const raw = await fs.readFile(path.join(courseDir, file), 'utf8');
      const parsed = Papa.parse(raw, { header: true, skipEmptyLines: true });
      const rows = parsed.data || [];
      const headers = parsed.meta.fields || [];
      const subjectCodes = extractSubjectCodes(headers);

      for (const code of subjectCodes) {
        await Subject.findOneAndUpdate(
          { code },
          { name: code, credits: 0 },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      for (const row of rows) {
        const rollNumber = String(row['Roll No'] || '').trim().toUpperCase();
        if (!rollNumber) {
          continue;
        }

        const subjects = buildSubjectEntries(row, subjectCodes);

        await Result.findOneAndUpdate(
          { courseCode, semester, examYear, rollNumber },
          {
            courseCode,
            semester,
            examYear,
            rollNumber,
            studentName: String(row['Student Name'] || '').trim(),
            fatherName: String(row['Father Name'] || '').trim(),
            totalCreditPoints: String(row['TOTAL CREDIT POINT EARNED (B)'] || '').trim(),
            sgpa: String(row['SEMESTER CREDIT POINT AVERAGE (B/A)'] || '').trim(),
            remarks: String(row['Remarks'] || '').trim(),
            status: inferResultStatus(String(row['Remarks'] || '')),
            visibility: RESULT_VISIBILITY.PUBLIC,
            subjects,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }
  }
}

async function cleanupGeneratedNotices() {
  await Notice.deleteMany({
    type: 'result',
    summary: { $regex: '^Legacy result import for ', $options: 'i' },
  });
}

async function hasCompletedBootstrap(key) {
  const state = await BootstrapState.findOne({ key }).lean();
  return Boolean(state);
}

async function markBootstrapComplete(key) {
  await BootstrapState.findOneAndUpdate(
    { key },
    { completedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function ensureLegacyImportOnce() {
  const bootstrapKey = 'legacy-csv-import-v1';

  if (await hasCompletedBootstrap(bootstrapKey)) {
    return;
  }

  const [courseCount, resultCount, subjectCount] = await Promise.all([
    Course.countDocuments({}),
    Result.countDocuments({}),
    Subject.countDocuments({}),
  ]);

  if (courseCount > 0 || resultCount > 0 || subjectCount > 0) {
    await markBootstrapComplete(bootstrapKey);
    return;
  }

  await importLegacyCsvResults();
  await markBootstrapComplete(bootstrapKey);
}

export async function ensureBootstrap() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await connectToDatabase();
      await ensureDefaultAdmin();
      await cleanupGeneratedNotices();
      await ensureLegacyImportOnce();
    })().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  return bootstrapPromise;
}