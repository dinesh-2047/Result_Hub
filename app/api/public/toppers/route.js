import { ensureBootstrap } from '@/lib/bootstrap';
import { ok, serializeDocument } from '@/lib/api';
import Course from '@/models/Course';
import Result from '@/models/Result';

export async function GET() {
  await ensureBootstrap();

  const results = await Result.aggregate([
    { $match: { visibility: 'public', sgpa: { $nin: ['', null] } } },
    {
      $addFields: {
        sgpaNumber: {
          $convert: {
            input: '$sgpa',
            to: 'double',
            onError: null,
            onNull: null,
          },
        },
      },
    },
    { $match: { sgpaNumber: { $ne: null } } },
    { $sort: { courseCode: 1, semester: 1, examYear: 1, sgpaNumber: -1, rollNumber: 1 } },
    {
      $group: {
        _id: {
          courseCode: '$courseCode',
          semester: '$semester',
          examYear: '$examYear',
        },
        toppers: { $push: '$$ROOT' },
      },
    },
    {
      $project: {
        toppers: { $slice: ['$toppers', 2] },
      },
    },
    { $unwind: { path: '$toppers', includeArrayIndex: 'topperIndex' } },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$toppers', { topperRank: { $add: ['$topperIndex', 1] } }],
        },
      },
    },
    { $sort: { examYear: -1, semester: -1, courseCode: 1, topperRank: 1, sgpaNumber: -1 } },
  ]);

  const courseDocs = await Course.find({ code: { $in: [...new Set(results.map((result) => result.courseCode).filter(Boolean))] } }).lean();
  const courseMap = courseDocs.reduce((accumulator, course) => {
    accumulator[course.code] = course.name;
    return accumulator;
  }, {});

  return ok({
    toppers: serializeDocument(results).map((result) => ({
      ...result,
      courseName: courseMap[result.courseCode] || result.courseCode,
      cgpa: result.cgpa || result.sgpa || '',
      rankLabel: result.topperRank === 1 ? '1st' : '2nd',
    })),
  });
}