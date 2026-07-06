/**
 * Formats a timestamp into a standard locale date string.
 */
export function formatDate(dateInput) {
  if (!dateInput) return "-";
  try {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
  } catch (e) {
    return "-";
  }
}

/**
 * Truncates a string to a specific length.
 */
export function truncateString(str, length = 60) {
  if (!str) return "";
  return str.length <= length ? str : str.slice(0, length) + "...";
}
