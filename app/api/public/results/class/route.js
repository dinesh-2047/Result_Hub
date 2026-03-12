import { ensureBootstrap } from '@/lib/bootstrap';
import { fail, ok, parseSearchParams, serializeDocument } from '@/lib/api';
import Result from '@/models/Result';

function toCgpaNumber(result) {
  const raw = String(result.cgpa || result.sgpa || '').trim();
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function compareRollNumber(left, right) {
  return String(left.rollNumber || '').localeCompare(String(right.rollNumber || ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function buildRankedResults(results = []) {
  const ranked = [...results]
    .map((result) => ({
      ...result,
      cgpa: result.cgpa || result.sgpa || '',
      cgpaNumber: toCgpaNumber(result),
    }))
    .sort((left, right) => {
      const leftValue = left.cgpaNumber ?? -Infinity;
      const rightValue = right.cgpaNumber ?? -Infinity;
      if (rightValue !== leftValue) {
        return rightValue - leftValue;
      }
      return compareRollNumber(left, right);
    });

  let previousCgpa = null;
  let previousRank = 0;

  return ranked.map((result, index) => {
    const currentValue = result.cgpaNumber ?? -Infinity;
    if (previousCgpa === null || currentValue !== previousCgpa) {
      previousRank = index + 1;
      previousCgpa = currentValue;
    }

    return {
      ...result,
      rank: result.cgpaNumber === null ? null : previousRank,
    };
  });
}

export async function GET(request) {
  await ensureBootstrap();

  const params = parseSearchParams(request);
  const courseCode = String(params.get('courseCode') || '').trim().toUpperCase();
  const semester = Number(params.get('semester'));
  const examYear = Number(params.get('examYear'));

  if (!courseCode || !semester || !examYear) {
    return fail('Course code, semester, and exam year are required.', 400);
  }

  const results = await Result.find({
    visibility: 'public',
    courseCode,
    semester,
    examYear,
  })
    .select('courseCode rollNumber semester examYear studentName fatherName totalCreditPoints sgpa remarks publishedAt createdAt')
    .lean();

  if (results.length === 0) {
    return fail('No public class results found for this batch.', 404);
  }

  const rankedResults = buildRankedResults(results);

  return ok({
    batch: serializeDocument({
      courseCode,
      semester,
      examYear,
      resultCount: rankedResults.length,
      latestAddedAt: rankedResults.reduce((latest, item) => {
        const value = item.publishedAt || item.createdAt;
        return !latest || new Date(value) > new Date(latest) ? value : latest;
      }, null),
    }),
    results: serializeDocument(rankedResults),
  });
}
