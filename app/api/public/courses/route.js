import { ensureBootstrap } from '@/lib/bootstrap';
import { ok, serializeDocument } from '@/lib/api';
import Course from '@/models/Course';

export async function GET() {
  await ensureBootstrap();
  const courses = await Course.find({ isActive: true }).sort({ name: 1 }).lean();
  return ok({ courses: serializeDocument(courses) });
}