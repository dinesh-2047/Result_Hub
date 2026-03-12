import { ensureBootstrap } from '@/lib/bootstrap';
import { getCurrentUser, sanitizeUser } from '@/lib/auth';
import { ok } from '@/lib/api';
import Course from '@/models/Course';
import Notice from '@/models/Notice';
import Result from '@/models/Result';
import User from '@/models/User';

export async function GET() {
  await ensureBootstrap();
  const user = await getCurrentUser();

  if (!user) {
    return ok({ user: null });
  }

  if (user.role === 'admin') {
    const [studentCount, courseCount, resultCount, noticeCount] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Course.countDocuments({}),
      Result.countDocuments({}),
      Notice.countDocuments({}),
    ]);

    return ok({
      user: sanitizeUser(user),
      stats: { studentCount, courseCount, resultCount, noticeCount },
    });
  }

  const results = await Result.find({
    rollNumber: user.rollNumber,
    courseCode: user.courseCode,
  })
    .sort({ semester: 1, examYear: 1 })
    .lean();

  return ok({
    user: sanitizeUser(user),
    stats: {
      resultsCount: results.length,
      latestResult: results.at(-1) || null,
    },
  });
}