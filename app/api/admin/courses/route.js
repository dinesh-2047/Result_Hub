import { ensureBootstrap } from '@/lib/bootstrap';
import { requireUser } from '@/lib/auth';
import { fail, ok, parseSearchParams, serializeDocument } from '@/lib/api';
import { buildCourseIdentity } from '@/lib/course-utils';
import { validate, courseSchema } from '@/lib/validators/schemas';
import Course from '@/models/Course';
import Notice from '@/models/Notice';
import Result from '@/models/Result';
import Subject from '@/models/Subject';
import User from '@/models/User';

async function updateCourseReferences(previousCode, nextCode) {
  if (!previousCode || previousCode === nextCode) {
    return;
  }

  await Promise.all([
    Subject.updateMany({ courseCode: previousCode }, { $set: { courseCode: nextCode } }),
    Result.updateMany({ courseCode: previousCode }, { $set: { courseCode: nextCode } }),
    User.updateMany({ courseCode: previousCode }, { $set: { courseCode: nextCode } }),
    Notice.updateMany({ relatedCourseCode: previousCode }, { $set: { relatedCourseCode: nextCode } }),
  ]);
}

export async function GET() {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const courses = await Course.find({}).sort({ createdAt: -1 }).lean();
  return ok({ courses: serializeDocument(courses) });
}

export async function POST(request) {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = validate(courseSchema, body);
  if (!parsed.success) return fail(parsed.message, 400);

  const identity = buildCourseIdentity(parsed.data.name);
  if (!identity.slug || !identity.code) return fail('A valid course name is required.', 400);

  const existing = await Course.findOne({ $or: [{ code: identity.code }, { slug: identity.slug }] });
  if (existing) return fail('A course with this name already exists.', 409);

  const course = await Course.create({
    name: parsed.data.name,
    code: identity.code,
    slug: identity.slug,
    semesterCount: parsed.data.semesterCount,
    description: '',
  });
  return ok({ course: serializeDocument(course), message: 'Course created.' }, 201);
}

export async function PATCH(request) {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.id) return fail('Course id is required.', 400);

  const course = await Course.findById(body.id);
  if (!course) return fail('Course not found.', 404);

  const previousCode = course.code;
  const nextName = body.name ?? course.name;
  const identity = buildCourseIdentity(nextName);
  if (!identity.slug || !identity.code) return fail('A valid course name is required.', 400);

  const duplicate = await Course.findOne({
    _id: { $ne: course._id },
    $or: [{ code: identity.code }, { slug: identity.slug }],
  });
  if (duplicate) return fail('A course with this name already exists.', 409);

  course.name = nextName;
  course.slug = identity.slug;
  course.code = identity.code;
  course.description = '';
  course.semesterCount = body.semesterCount ?? course.semesterCount;
  course.isActive = typeof body.isActive === 'boolean' ? body.isActive : course.isActive;
  await course.save();
  await updateCourseReferences(previousCode, course.code);

  return ok({ course: serializeDocument(course), message: 'Course updated.' });
}

export async function DELETE(request) {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const params = parseSearchParams(request);
  const id = params.get('id');
  if (!id) return fail('Course id is required.', 400);

  const course = await Course.findById(id);
  if (!course) return fail('Course not found.', 404);

  await Promise.all([
    Course.deleteOne({ _id: id }),
    Subject.deleteMany({ courseCode: course.code }),
    Result.deleteMany({ courseCode: course.code }),
    User.updateMany({ courseCode: course.code }, { $set: { courseCode: '' } }),
    Notice.deleteMany({ relatedCourseCode: course.code }),
  ]);

  return ok({ message: 'Course deleted.' });
}