import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { AUTH_COOKIE } from '@/lib/constants';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');

export function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: String(user._id),
    name: user.name || '',
    email: user.email || '',
    role: user.role,
    rollNumber: user.rollNumber || '',
    courseCode: user.courseCode || '',
    currentSemester: Number(user.currentSemester || 1),
    profileCompleted: Boolean(user.profileCompleted),
    parentEmail: user.parentEmail || '',
    parentPhone: user.parentPhone || '',
  };
}

export async function signAuthToken(user) {
  return new SignJWT({
    sub: String(user._id),
    role: user.role,
    rollNumber: user.rollNumber || '',
    courseCode: user.courseCode || '',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(jwtSecret);
}

export async function getSessionPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, jwtSecret);
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const payload = await getSessionPayload();

  if (!payload?.sub) {
    return null;
  }

  await connectToDatabase();
  return User.findById(payload.sub);
}

export async function requireUser(roles = []) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: NextResponse.json({ message: 'Authentication required.' }, { status: 401 }) };
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return { error: NextResponse.json({ message: 'You are not allowed to perform this action.' }, { status: 403 }) };
  }

  return { user };
}

export async function createAuthResponse(user, extra = {}) {
  const token = await signAuthToken(user);
  const response = NextResponse.json({ user: sanitizeUser(user), ...extra });

  response.cookies.set({
    name: AUTH_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export function clearAuthResponse(extra = {}) {
  const response = NextResponse.json(extra);
  response.cookies.set({
    name: AUTH_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}