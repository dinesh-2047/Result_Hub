export function slugifyCourseName(name = '') {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function buildCourseIdentity(name = '') {
  const slug = slugifyCourseName(name);

  return {
    slug,
    code: slug.replace(/-/g, '_').toUpperCase(),
  };
}