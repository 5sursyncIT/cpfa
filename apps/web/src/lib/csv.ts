// RFC 4180-ish CSV writer. Escapes quotes by doubling, wraps fields containing
// commas/quotes/newlines. UTF-8 BOM is prepended so Excel opens the file in
// the right encoding by default.

const BOM = '﻿';

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = value instanceof Date ? value.toISOString() : String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(headers: string[], rows: Array<Record<string, unknown>>): string {
  const head = headers.map(escapeCell).join(',');
  const body = rows
    .map((r) => headers.map((h) => escapeCell(r[h])).join(','))
    .join('\r\n');
  return `${BOM}${head}\r\n${body}\r\n`;
}

export function csvResponse(filename: string, body: string): Response {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
