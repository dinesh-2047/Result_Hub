import { ensureBootstrap } from '@/lib/bootstrap';
import { fail, ok, parseSearchParams, serializeDocument } from '@/lib/api';
import { filterResultSubjects } from '@/lib/result-utils';
import Result from '@/models/Result';
import Subject from '@/models/Subject';

async function mergeSubjectNames(result) {
  const visibleSubjects = filterResultSubjects(result.subjects || []);
  const subjectDocs = await Subject.find({ code: { $in: visibleSubjects.map((subject) => subject.code) } }).lean();

  const subjectMap = subjectDocs.reduce((accumulator, subject) => {
    accumulator[subject.code] = subject;
    return accumulator;
  }, {});

  return {
    ...result,
    cgpa: result.cgpa || result.sgpa || '',
    subjects: visibleSubjects.map((subject) => ({
      ...subject,
      name: subjectMap[subject.code]?.name || subject.name || subject.code,
      credits: Number(subject.credits || subjectMap[subject.code]?.credits || 0),
    })),
  };
}

export async function GET(request) {
  await ensureBootstrap();
  const params = parseSearchParams(request);
  const rollNumber = String(params.get('rollNumber') || '').trim().toUpperCase();
  const courseCode = String(params.get('courseCode') || '').trim().toUpperCase();
  const semester = Number(params.get('semester'));
  const examYear = params.get('examYear') ? Number(params.get('examYear')) : null;

  if (!rollNumber || !courseCode || !semester) {
    return fail('Roll number, course code, and semester are required.', 400);
  }

  const history = await Result.find({
    rollNumber,
    courseCode,
    visibility: 'public',
  })
    .sort({ semester: 1, examYear: 1 })
    .lean();

  if (history.length === 0) {
    return fail('No public result found for the provided details.', 404);
  }

  const selectedBase = history.find((item) => item.semester === semester && (examYear ? item.examYear === examYear : true));
  if (!selectedBase) {
    return fail('Requested semester result is not available publicly.', 404);
  }

  const selected = await mergeSubjectNames(selectedBase);
  const detailedHistory = await Promise.all(history.map((item) => mergeSubjectNames(item)));

  return ok({
    result: serializeDocument(selected),
    history: serializeDocument(detailedHistory),
  });
}