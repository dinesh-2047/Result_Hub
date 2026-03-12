import { ensureBootstrap } from '@/lib/bootstrap';
import { requireUser } from '@/lib/auth';
import { ok, serializeDocument } from '@/lib/api';
import { filterResultSubjects } from '@/lib/result-utils';
import Result from '@/models/Result';
import Subject from '@/models/Subject';

export async function GET() {
  await ensureBootstrap();
  const auth = await requireUser(['student']);
  if (auth.error) return auth.error;

  const user = auth.user;
  const results = await Result.find({
    rollNumber: user.rollNumber,
    courseCode: user.courseCode,
  })
    .sort({ semester: 1, examYear: 1 })
    .lean();

  const subjectCodes = [...new Set(results.flatMap((result) => filterResultSubjects(result.subjects || []).map((subject) => subject.code)))];
  const subjectDocs = await Subject.find({ code: { $in: subjectCodes } }).lean();
  const subjectMap = subjectDocs.reduce((accumulator, subject) => {
    accumulator[subject.code] = subject;
    return accumulator;
  }, {});

  const merged = results.map((result) => ({
    ...result,
    cgpa: result.cgpa || result.sgpa || '',
    subjects: filterResultSubjects(result.subjects || []).map((subject) => ({
      ...subject,
      name: subjectMap[subject.code]?.name || subject.name || subject.code,
      credits: Number(subject.credits || subjectMap[subject.code]?.credits || 0),
    })),
  }));

  return ok({ results: serializeDocument(merged) });
}