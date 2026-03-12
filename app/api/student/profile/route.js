import { ensureBootstrap } from '@/lib/bootstrap';
import { requireUser, sanitizeUser } from '@/lib/auth';
import { fail, ok, serializeDocument } from '@/lib/api';
import { comparePassword, hashPassword } from '@/lib/password';
import Course from '@/models/Course';
import Result from '@/models/Result';
import User from '@/models/User';

export async function GET() {
  await ensureBootstrap();
  const auth = await requireUser(['student', 'admin']);
  if (auth.error) return auth.error;

  const user = auth.user;
  const results = user.role === 'student'
    ? await Result.find({ rollNumber: user.rollNumber, courseCode: user.courseCode }).sort({ semester: 1, examYear: 1 }).lean()
    : [];

  return ok({ user: sanitizeUser(user), results: serializeDocument(results) });
}

export async function PATCH(request) {
  await ensureBootstrap();
  const auth = await requireUser(['student']);
  if (auth.error) return auth.error;

  const body = await request.json();
  const user = await User.findById(auth.user._id);
  if (!user) return fail('User not found.', 404);

  const nextCourseCode = body.courseCode ? body.courseCode.toUpperCase() : user.courseCode;
  let nextSemesterValue = user.currentSemester;
  if (body.currentSemester !== undefined) {
    const nextSemester = Number(body.currentSemester);
    if (!Number.isInteger(nextSemester) || nextSemester < 1) {
      return fail('Current semester must be a valid number.', 400);
    }

    if (nextCourseCode) {
      const course = await Course.findOne({ code: nextCourseCode }).lean();
      if (course?.semesterCount && nextSemester > course.semesterCount) {
        return fail(`Semester cannot be greater than ${course.semesterCount} for this course.`, 400);
      }
    }

    nextSemesterValue = nextSemester;
  }

  if (body.currentPassword && body.newPassword) {
    const passwordMatches = await comparePassword(body.currentPassword, user.passwordHash);
    if (!passwordMatches) {
      return fail('Current password is incorrect.', 400);
    }
    user.passwordHash = await hashPassword(body.newPassword);
  }

  const previousIdentity = { rollNumber: user.rollNumber, courseCode: user.courseCode };
  user.name = body.name ?? user.name;
  if (body.email !== undefined) {
    user.email = body.email ? body.email.toLowerCase() : undefined;
  }
  user.courseCode = body.courseCode ? body.courseCode.toUpperCase() : user.courseCode;
  user.rollNumber = body.rollNumber ? body.rollNumber.toUpperCase() : user.rollNumber;
  user.parentEmail = body.parentEmail ?? user.parentEmail;
  user.parentPhone = body.parentPhone ?? user.parentPhone;
  user.profileCompleted = true;
  user.currentSemester = nextSemesterValue;
  await user.save();

  if (previousIdentity.rollNumber !== user.rollNumber || previousIdentity.courseCode !== user.courseCode) {
    await Result.updateMany(
      {
        rollNumber: previousIdentity.rollNumber,
        courseCode: previousIdentity.courseCode,
      },
      {
        $set: {
          rollNumber: user.rollNumber,
          courseCode: user.courseCode,
        },
      }
    );
  }

  const refreshedUser = await User.findById(user._id);
  return ok({ user: sanitizeUser(refreshedUser || user), message: 'Profile updated.' });
}