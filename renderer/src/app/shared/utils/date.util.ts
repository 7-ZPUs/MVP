/**
 * Formats a date string into "yyyy/mm/dd hh:mm".
 * @param dateStr The date string to format.
 * @returns The formatted date string, or the original if parsing fails or it is falsy.
 */
export function formatReadableDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    // If it's an invalid date format, just return the original string
    return dateStr;
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');

  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}
