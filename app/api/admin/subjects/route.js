import { ensureBootstrap } from '@/lib/bootstrap';
import { requireUser } from '@/lib/auth';
import { fail, ok, serializeDocument } from '@/lib/api';
import { validate, subjectSchema } from '@/lib/validators/schemas';
import Result from '@/models/Result';
import Subject from '@/models/Subject';

async function syncSubjectReferences(previousCode, nextSubject) {
  const results = await Result.find({ 'subjects.code': previousCode });

  await Promise.all(
    results.map(async (result) => {
      result.subjects = result.subjects.map((subject) =>
        subject.code === previousCode
          ? {
              code: nextSubject.code,
              name: nextSubject.name,
              credits: nextSubject.credits,
              score: subject.score,
            }
          : subject
      );

      await result.save();
    })
  );
}

export async function GET() {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const subjects = await Subject.aggregate([
    { $sort: { updatedAt: -1, createdAt: -1 } },
    {
      $group: {
        _id: '$code',
        subject: { $first: '$$ROOT' },
      },
    },
    { $replaceRoot: { newRoot: '$subject' } },
    { $sort: { code: 1 } },
  ]);

  return ok({ subjects: serializeDocument(subjects) });
}

export async function POST(request) {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = validate(subjectSchema, body);
  if (!parsed.success) return fail(parsed.message, 400);

  const existingByCode = await Subject.findOne({ code: parsed.data.code });

  if (existingByCode) {
    existingByCode.name = parsed.data.name;
    existingByCode.credits = parsed.data.credits;
    await existingByCode.save();
    await syncSubjectReferences(existingByCode.code, existingByCode);
    return ok({ subject: serializeDocument(existingByCode), message: 'Subject updated.' }, 201);
  }

  const subject = await Subject.create(parsed.data);

  return ok({ subject: serializeDocument(subject), message: 'Subject saved.' }, 201);
}

export async function PATCH(request) {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.id) return fail('Subject id is required.', 400);

  const subject = await Subject.findById(body.id);
  if (!subject) return fail('Subject not found.', 404);

  const previousCode = subject.code;
  if (body.code) {
    const nextCode = body.code.toUpperCase();
    const duplicate = await Subject.findOne({ _id: { $ne: body.id }, code: nextCode });
    if (duplicate) return fail('Subject code already exists.', 409);
    subject.code = nextCode;
  }
  subject.name = body.name ?? subject.name;
  subject.credits = body.credits ?? subject.credits;
  await subject.save();
  await syncSubjectReferences(previousCode, subject);

  return ok({ subject: serializeDocument(subject), message: 'Subject updated.' });
}

export async function DELETE(request) {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const params = parseSearchParams(request);
  const id = params.get('id');
  if (!id) return fail('Subject id is required.', 400);

  await Subject.deleteOne({ _id: id });
  return ok({ message: 'Subject deleted.' });
}