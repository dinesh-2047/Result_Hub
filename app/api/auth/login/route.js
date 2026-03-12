import { ensureBootstrap } from '@/lib/bootstrap';
import { createAuthResponse } from '@/lib/auth';
import { fail } from '@/lib/api';
import { comparePassword } from '@/lib/password';
import { validate, loginSchema } from '@/lib/validators/schemas';
import User from '@/models/User';

export async function POST(request) {
  await ensureBootstrap();

  const body = await request.json();
  const parsed = validate(loginSchema, body);

  if (!parsed.success) {
    return fail(parsed.message, 400);
  }

  const identifier = parsed.data.identifier.trim();
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { rollNumber: identifier.toUpperCase() },
    ],
  });

  if (!user) {
    return fail('Invalid email or roll number, or password.', 401);
  }

  const passwordMatches = await comparePassword(parsed.data.password, user.passwordHash);

  if (!passwordMatches) {
    return fail('Invalid email or roll number, or password.', 401);
  }

  return createAuthResponse(user, { message: 'Login successful.' });
}