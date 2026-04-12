export function normalizeDisplayFileName(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return '';
  }

  const normalizedPath = trimmed.replace(/\\/g, '/').replace(/^\.\//, '');
  const segments = normalizedPath.split('/').filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return normalizedPath;
  }

  return segments[segments.length - 1];
}
