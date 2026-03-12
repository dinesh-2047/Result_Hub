import { ensureBootstrap } from '@/lib/bootstrap';
import { requireUser } from '@/lib/auth';
import { fail, ok, parseSearchParams, serializeDocument } from '@/lib/api';
import { hashPassword } from '@/lib/password';
import { validate, singleStudentSchema } from '@/lib/validators/schemas';
import Result from '@/models/Result';
import User from '@/models/User';

async function cascadeStudentIdentity(previous, nextValues) {
  const update = {};

  if (previous.rollNumber !== nextValues.rollNumber) {
    update.rollNumber = nextValues.rollNumber;
  }

  if (previous.courseCode !== nextValues.courseCode) {
    update.courseCode = nextValues.courseCode;
  }

  if (Object.keys(update).length === 0) {
    return;
  }

  await Result.updateMany(
    {
      rollNumber: previous.rollNumber,
      courseCode: previous.courseCode,
    },
    { $set: update }
  );
}

export async function GET(request) {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const params = parseSearchParams(request);
  const courseCode = params.get('courseCode');
  const query = { role: 'student' };
  if (courseCode) query.courseCode = courseCode.toUpperCase();

  const students = await User.find(query)
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .lean();

  return ok({ students: serializeDocument(students) });
}

export async function POST(request) {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = validate(singleStudentSchema, body);
  if (!parsed.success) return fail(parsed.message, 400);

  const existingRoll = await User.findOne({ rollNumber: parsed.data.rollNumber });
  if (existingRoll) return fail('Student with this roll number already exists.', 409);

  const normalizedEmail = parsed.data.email ? parsed.data.email.toLowerCase() : '';
  if (normalizedEmail) {
    const emailTaken = await User.findOne({ email: normalizedEmail });
    if (emailTaken) return fail('Student email already exists.', 409);
  }

  const studentPayload = {
    ...parsed.data,
    passwordHash: await hashPassword(parsed.data.rollNumber),
  };

  if (normalizedEmail) {
    studentPayload.email = normalizedEmail;
  } else {
    delete studentPayload.email;
  }

  const student = await User.create(studentPayload);

  return ok({ student: serializeDocument({ ...student.toObject(), passwordHash: undefined }), message: 'Student account created. Default password matches roll number.' }, 201);
}

export async function PATCH(request) {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.id) return fail('Student id is required.', 400);

  const student = await User.findById(body.id);
  if (!student || student.role !== 'student') return fail('Student not found.', 404);

  if (body.rollNumber !== undefined) {
    const nextRollNumber = String(body.rollNumber || '').trim().toUpperCase();
    if (!nextRollNumber) return fail('Roll number is required.', 400);

    const rollTaken = await User.findOne({ rollNumber: nextRollNumber, _id: { $ne: student._id } });
    if (rollTaken) return fail('Student with this roll number already exists.', 409);
  }

  if (body.email !== undefined) {
    const nextEmail = String(body.email || '').trim().toLowerCase();
    if (nextEmail) {
      const emailTaken = await User.findOne({ email: nextEmail, _id: { $ne: student._id } });
      if (emailTaken) return fail('Student email already exists.', 409);
      student.email = nextEmail;
    } else {
      student.email = undefined;
    }
  }

  const previousIdentity = {
    rollNumber: student.rollNumber,
    courseCode: student.courseCode,
  };

  student.name = body.name ?? student.name;
  student.courseCode = body.courseCode ? body.courseCode.toUpperCase() : student.courseCode;
  student.rollNumber = body.rollNumber ? body.rollNumber.toUpperCase() : student.rollNumber;
  student.parentEmail = body.parentEmail ?? student.parentEmail;
  student.parentPhone = body.parentPhone ?? student.parentPhone;
  student.currentSemester = body.currentSemester ? Number(body.currentSemester) : student.currentSemester;
  student.profileCompleted = typeof body.profileCompleted === 'boolean' ? body.profileCompleted : student.profileCompleted;
  if (body.password) {
    student.passwordHash = await hashPassword(body.password);
  }
  await student.save();
  await cascadeStudentIdentity(previousIdentity, { rollNumber: student.rollNumber, courseCode: student.courseCode });

  return ok({ student: serializeDocument({ ...student.toObject(), passwordHash: undefined }), message: 'Student updated.' });
}

export async function DELETE(request) {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const params = parseSearchParams(request);
  const id = params.get('id');
  if (!id) return fail('Student id is required.', 400);

  const student = await User.findById(id);
  if (!student || student.role !== 'student') return fail('Student not found.', 404);

  await User.deleteOne({ _id: id });
  return ok({ message: 'Student deleted.' });
}