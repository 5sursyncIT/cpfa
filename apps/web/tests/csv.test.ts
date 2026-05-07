import { describe, expect, it } from 'vitest';
import { toCsv } from '@/lib/csv';

const BOM = '﻿';

describe('csv writer', () => {
  it('prepends a UTF-8 BOM (Excel compatibility)', () => {
    const out = toCsv(['a'], [{ a: 'x' }]);
    expect(out.startsWith(BOM)).toBe(true);
  });

  it('writes header and CRLF line endings (RFC 4180)', () => {
    const out = toCsv(['a', 'b'], [{ a: '1', b: '2' }]);
    expect(out).toContain('a,b\r\n1,2\r\n');
  });

  it('escapes commas, quotes and newlines by wrapping in quotes', () => {
    const out = toCsv(['a'], [{ a: 'hello, "world"\nbye' }]);
    expect(out).toContain('"hello, ""world""\nbye"');
  });

  it('serializes Date values as ISO 8601', () => {
    const d = new Date('2026-05-01T08:00:00Z');
    const out = toCsv(['t'], [{ t: d }]);
    expect(out).toContain('2026-05-01T08:00:00.000Z');
  });

  it('writes empty cell for null / undefined', () => {
    const out = toCsv(['a', 'b', 'c'], [{ a: null, b: undefined, c: 0 }]);
    expect(out).toMatch(/,,0\r\n$/);
  });

  it('handles numbers and booleans without quoting', () => {
    const out = toCsv(['n', 'b'], [{ n: 42, b: true }]);
    expect(out).toContain('42,true\r\n');
  });
});
