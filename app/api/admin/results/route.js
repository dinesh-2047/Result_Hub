import { ensureBootstrap } from '@/lib/bootstrap';
import { requireUser } from '@/lib/auth';
import { fail, ok, parseSearchParams, serializeDocument } from '@/lib/api';
import { validate, manualResultSchema } from '@/lib/validators/schemas';
import { inferResultStatus } from '@/lib/result-utils';
import Result from '@/models/Result';
import Subject from '@/models/Subject';

async function enrichSubjects(courseCode, semester, subjects) {
  const subjectDocs = await Subject.find({ code: { $in: subjects.map((subject) => subject.code) } }).lean();
  const subjectMap = subjectDocs.reduce((accumulator, item) => {
    accumulator[item.code] = item;
    return accumulator;
  }, {});

  return subjects.map((subject) => ({
    code: subject.code,
    name: subject.name || subjectMap[subject.code]?.name || subject.code,
    credits: Number(subjectMap[subject.code]?.credits || 0),
    score: subject.score,
  }));
}

export async function GET(request) {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const params = parseSearchParams(request);
  const query = {};
  if (params.get('courseCode')) query.courseCode = params.get('courseCode').toUpperCase();
  if (params.get('rollNumber')) query.rollNumber = params.get('rollNumber').toUpperCase();
  if (params.get('semester')) query.semester = Number(params.get('semester'));
  if (params.get('examYear')) query.examYear = Number(params.get('examYear'));

  const results = await Result.find(query).sort({ createdAt: -1 }).limit(200).lean();
  return ok({ results: serializeDocument(results) });
}

export async function POST(request) {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = validate(manualResultSchema, body);
  if (!parsed.success) return fail(parsed.message, 400);

  const subjects = await enrichSubjects(parsed.data.courseCode, parsed.data.semester, parsed.data.subjects);
  const result = await Result.findOneAndUpdate(
    {
      courseCode: parsed.data.courseCode,
      rollNumber: parsed.data.rollNumber,
      semester: parsed.data.semester,
      examYear: parsed.data.examYear,
    },
    {
      ...parsed.data,
      subjects,
      status: inferResultStatus(parsed.data.remarks),
      publishedAt: parsed.data.visibility === 'public' ? new Date() : null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return ok({ result: serializeDocument(result), message: 'Result saved.' }, 201);
}

export async function PATCH(request) {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.id) return fail('Result id is required.', 400);

  const result = await Result.findById(body.id);
  if (!result) return fail('Result not found.', 404);

  result.studentName = body.studentName ?? result.studentName;
  result.fatherName = body.fatherName ?? result.fatherName;
  result.totalCreditPoints = body.totalCreditPoints ?? result.totalCreditPoints;
  result.sgpa = body.sgpa ?? result.sgpa;
  result.remarks = body.remarks ?? result.remarks;
  result.visibility = body.visibility ?? result.visibility;
  result.status = inferResultStatus(result.remarks);

  if (Array.isArray(body.subjects) && body.subjects.length > 0) {
    result.subjects = await enrichSubjects(result.courseCode, result.semester, body.subjects);
  }

  if (result.visibility === 'public' && !result.publishedAt) {
    result.publishedAt = new Date();
  }

  await result.save();
  return ok({ result: serializeDocument(result), message: 'Result updated.' });
}

export async function DELETE(request) {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const params = parseSearchParams(request);
  const queryIds = params.getAll('id').filter(Boolean);
  let bodyIds = [];

  if (queryIds.length === 0) {
    try {
      const body = await request.json();
      if (Array.isArray(body?.ids)) {
        bodyIds = body.ids.filter(Boolean);
      } else if (body?.id) {
        bodyIds = [body.id];
      }
    } catch {
      bodyIds = [];
    }
  }

  const ids = [...new Set([...queryIds, ...bodyIds])];
  if (ids.length === 0) return fail('At least one result id is required.', 400);

  const deletion = await Result.deleteMany({ _id: { $in: ids } });
  if (deletion.deletedCount === 0) {
    return fail('Result not found.', 404);
  }

  return ok({
    deletedCount: deletion.deletedCount,
    message: deletion.deletedCount === 1 ? 'Result deleted.' : `${deletion.deletedCount} results deleted.`,
  });
}