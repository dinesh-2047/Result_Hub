import { ensureBootstrap } from '@/lib/bootstrap';
import { requireUser } from '@/lib/auth';
import { fail, ok } from '@/lib/api';
import { sendResultEmails } from '@/lib/mailer';
import Notice from '@/models/Notice';
import Result from '@/models/Result';
import User from '@/models/User';

export async function POST(request) {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const body = await request.json();
  const resultIds = Array.isArray(body.resultIds) ? body.resultIds : [];
  const visibility = body.visibility === 'public' ? 'public' : 'private';
  const notify = body.notify !== false;

  if (resultIds.length === 0) {
    return fail('At least one result id is required.', 400);
  }

  const results = await Result.find({ _id: { $in: resultIds } });
  if (results.length === 0) return fail('No results found.', 404);

  for (const result of results) {
    result.visibility = visibility;
    result.publishedAt = visibility === 'public' ? new Date() : null;
    await result.save();

    if (visibility === 'public') {
      await Notice.findOneAndUpdate(
        { title: `${result.courseCode} Semester ${result.semester} Result ${result.examYear}` },
        {
          summary: `${result.studentName} result for semester ${result.semester} is now published.`,
          type: 'result',
          audience: 'public',
          status: 'published',
          relatedCourseCode: result.courseCode,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    if (notify && visibility === 'public') {
      const student = await User.findOne({ rollNumber: result.rollNumber, courseCode: result.courseCode });
      const recipients = [student?.email, student?.parentEmail].filter(Boolean);
      await sendResultEmails(
        recipients,
        `Result published for ${result.rollNumber}`,
        `<p>Your semester ${result.semester} result for ${result.courseCode} is now available on the portal.</p>`
      );
    }
  }

  return ok({ message: `Updated ${results.length} results.` });
}