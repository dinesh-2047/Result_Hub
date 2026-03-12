import { ensureBootstrap } from '@/lib/bootstrap';
import { ok, serializeDocument } from '@/lib/api';
import Notice from '@/models/Notice';

export async function GET() {
  await ensureBootstrap();
  const notices = await Notice.find({ status: 'published', audience: 'public' })
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(12)
    .lean();
  return ok({ notices: serializeDocument(notices) });
}