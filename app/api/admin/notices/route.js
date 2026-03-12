import { ensureBootstrap } from '@/lib/bootstrap';
import { requireUser } from '@/lib/auth';
import { fail, ok, parseSearchParams, serializeDocument } from '@/lib/api';
import { validate, noticeSchema } from '@/lib/validators/schemas';
import Notice from '@/models/Notice';

export async function GET() {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const notices = await Notice.find({}).sort({ isPinned: -1, createdAt: -1 }).lean();
  return ok({ notices: serializeDocument(notices) });
}

export async function POST(request) {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = validate(noticeSchema, body);
  if (!parsed.success) return fail(parsed.message, 400);

  const notice = await Notice.create({
    ...parsed.data,
    status: 'published',
  });

  return ok({ notice: serializeDocument(notice), message: 'Notice published.' }, 201);
}

export async function PATCH(request) {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.id) return fail('Notice id is required.', 400);

  const notice = await Notice.findById(body.id);
  if (!notice) return fail('Notice not found.', 404);

  notice.title = body.title ?? notice.title;
  notice.summary = body.summary ?? notice.summary;
  notice.isPinned = typeof body.isPinned === 'boolean' ? body.isPinned : notice.isPinned;
  notice.status = body.status ?? notice.status;
  await notice.save();

  return ok({ notice: serializeDocument(notice), message: 'Notice updated.' });
}

export async function DELETE(request) {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const params = parseSearchParams(request);
  const id = params.get('id');
  if (!id) return fail('Notice id is required.', 400);

  await Notice.deleteOne({ _id: id });
  return ok({ message: 'Notice deleted.' });
}