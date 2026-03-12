import { clearAuthResponse } from '@/lib/auth';

export async function POST() {
  return clearAuthResponse({ message: 'Logged out successfully.' });
}