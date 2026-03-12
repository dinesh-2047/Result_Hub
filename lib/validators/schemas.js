import { z } from 'zod';
import { RESULT_VISIBILITY, ROLES } from '@/lib/constants';

export const loginSchema = z.object({
  identifier: z.string().min(2).transform((value) => value.trim()),
  password: z.string().min(6),
});

export const courseSchema = z.object({
  name: z.string().min(2),
  semesterCount: z.coerce.number().min(1).max(16),
});

export const subjectSchema = z.object({
  code: z.string().min(2).transform((value) => value.trim().toUpperCase()),
  name: z.string().min(2),
  credits: z.coerce.number().min(0).max(50).optional().default(0),
});

export const singleStudentSchema = z.object({
  name: z.string().optional().default(''),
  email: z.string().email().optional().or(z.literal('')).default(''),
  courseCode: z.string().min(2).transform((value) => value.trim().toUpperCase()),
  rollNumber: z.string().min(2).transform((value) => value.trim().toUpperCase()),
  parentEmail: z.string().email().optional().or(z.literal('')).default(''),
  parentPhone: z.string().optional().default(''),
  role: z.enum([ROLES.STUDENT]).default(ROLES.STUDENT),
});

export const bulkStudentSchema = z.object({
  courseCode: z.string().min(2).transform((value) => value.trim().toUpperCase()),
  rollNumbers: z.array(z.string().min(2)).min(1),
});

export const resultSubjectSchema = z.object({
  code: z.string().min(2).transform((value) => value.trim().toUpperCase()),
  name: z.string().optional().default(''),
  score: z.string().optional().default(''),
});

export const manualResultSchema = z.object({
  courseCode: z.string().min(2).transform((value) => value.trim().toUpperCase()),
  rollNumber: z.string().min(2).transform((value) => value.trim().toUpperCase()),
  semester: z.coerce.number().min(1).max(16),
  examYear: z.coerce.number().min(2000).max(2100),
  studentName: z.string().min(1),
  fatherName: z.string().optional().default(''),
  sgpa: z.string().optional().default(''),
  totalCreditPoints: z.string().optional().default(''),
  remarks: z.string().optional().default(''),
  visibility: z.enum([RESULT_VISIBILITY.PRIVATE, RESULT_VISIBILITY.PUBLIC]).default(RESULT_VISIBILITY.PRIVATE),
  subjects: z.array(resultSubjectSchema).min(1),
});

export const noticeSchema = z.object({
  title: z.string().min(3),
  summary: z.string().min(3),
  type: z.enum(['general', 'result']).default('general'),
  audience: z.enum(['public', 'students']).default('public'),
  isPinned: z.coerce.boolean().optional().default(false),
  relatedCourseCode: z.string().optional().default(''),
  actionUrl: z.string().url().optional().or(z.literal('')).default(''),
  actionLabel: z.string().optional().default(''),
});

export function validate(schema, payload) {
  const result = schema.safeParse(payload);

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues.map((issue) => issue.message).join(', '),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}