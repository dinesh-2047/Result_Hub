import bcrypt from 'bcryptjs';

export async function hashPassword(value) {
  return bcrypt.hash(value, 10);
}

export async function comparePassword(value, hash) {
  return bcrypt.compare(value, hash);
}