import { ensureBootstrap } from '@/lib/bootstrap';
import { requireUser } from '@/lib/auth';
import { fail, ok } from '@/lib/api';
import { hashPassword } from '@/lib/password';
import { validate, bulkStudentSchema } from '@/lib/validators/schemas';
import User from '@/models/User';

export async function POST(request) {
  await ensureBootstrap();
  const auth = await requireUser(['admin']);
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = validate(bulkStudentSchema, body);
  if (!parsed.success) return fail(parsed.message, 400);

  const created = [];
  const skipped = [];

  for (const value of parsed.data.rollNumbers) {
    const rollNumber = value.trim().toUpperCase();
    const existing = await User.findOne({ rollNumber });

    if (existing) {
      skipped.push(rollNumber);
      continue;
    }

    const student = await User.create({
      role: 'student',
      name: '',
      courseCode: parsed.data.courseCode,
      rollNumber,
      passwordHash: await hashPassword(rollNumber),
      profileCompleted: false,
    });

    created.push(student.rollNumber);
  }

  return ok({
    created,
    skipped,
    message: `Bulk creation completed. Created ${created.length} students.`,
  }, 201);
}