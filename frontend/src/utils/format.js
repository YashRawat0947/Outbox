const EMAIL_RE = /[^\s,;"'<>]+@[^\s,;"'<>]+\.[^\s,;"'<>]+/g;

/** Pull every unique email address out of a CSV / plain-text file. */
export function extractEmails(text) {
  return [...new Set((text.match(EMAIL_RE) || []).map((e) => e.toLowerCase()))];
}

export const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', second: '2-digit' })
    : '-';

/** Value for <input type="datetime-local"> in local time. */
export function toLocalInputValue(date = new Date()) {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}

/** "Tue 9:15:12 AM" - the pill format used in the list. */
export const formatPill = (iso) =>
  iso
    ? new Date(iso).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit', second: '2-digit' }).replace(',', '')
    : '-';

export const formatFull = (iso) =>
  iso ? new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '-';

/** Plain-text preview of an HTML body. */
export function htmlToText(html) {
  return (new DOMParser().parseFromString(html || '', 'text/html').body.textContent || '').replace(/\s+/g, ' ').trim();
}
