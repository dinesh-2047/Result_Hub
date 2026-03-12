import { ensureBootstrap } from '@/lib/bootstrap';
import { ok, serializeDocument } from '@/lib/api';
import Course from '@/models/Course';
import Result from '@/models/Result';

export async function GET() {
  await ensureBootstrap();

  const batches = await Result.aggregate([
    { $match: { visibility: 'public' } },
    {
      $addFields: {
        sortDate: { $ifNull: ['$publishedAt', '$createdAt'] },
      },
    },
    {
      $group: {
        _id: {
          courseCode: '$courseCode',
          semester: '$semester',
          examYear: '$examYear',
        },
        resultCount: { $sum: 1 },
        latestAddedAt: { $max: '$sortDate' },
      },
    },
    { $sort: { latestAddedAt: -1, '_id.examYear': -1, '_id.semester': -1, '_id.courseCode': 1 } },
    { $limit: 60 },
  ]);

  const courseCodes = [...new Set(batches.map((batch) => batch._id.courseCode))];
  const courseDocs = await Course.find({ code: { $in: courseCodes } }).lean();
  const courseMap = courseDocs.reduce((accumulator, course) => {
    accumulator[course.code] = course;
    return accumulator;
  }, {});

  return ok({
    batches: serializeDocument(
      batches.map((batch) => ({
        courseCode: batch._id.courseCode,
        courseName: courseMap[batch._id.courseCode]?.name || batch._id.courseCode,
        semester: batch._id.semester,
        examYear: batch._id.examYear,
        resultCount: batch.resultCount,
        latestAddedAt: batch.latestAddedAt,
      }))
    ),
  });
}
