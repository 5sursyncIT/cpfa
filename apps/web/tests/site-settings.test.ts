import { describe, expect, it } from 'vitest';
import {
  parseSettingValue,
  settingsRegistry,
  isKnownKey,
  SETTING_KEYS,
} from '@/lib/site-settings/registry';

describe('site-settings registry', () => {
  it('isKnownKey is strict — only registry entries pass', () => {
    expect(isKnownKey('home.hero')).toBe(true);
    expect(isKnownKey('does.not.exist')).toBe(false);
    expect(isKnownKey('')).toBe(false);
  });

  it('every registry default round-trips through its own schema', () => {
    for (const key of SETTING_KEYS) {
      const entry = settingsRegistry[key];
      expect(() => entry.schema.parse(entry.default)).not.toThrow();
    }
  });

  it('parseSettingValue returns the parsed value for a valid input', () => {
    const value = parseSettingValue('footer.contact', {
      address1: '1 rue Léon Gontran Damas',
      address2: 'BP 1234',
      phone: '+221 33 800 00 00',
      email: 'hello@cpfa.sn',
    });
    expect(value.email).toBe('hello@cpfa.sn');
  });

  it('parseSettingValue falls back to the default when the input is malformed', () => {
    const value = parseSettingValue('home.testimonials', 'not-an-array');
    expect(Array.isArray(value)).toBe(true);
    expect(value.length).toBe(settingsRegistry['home.testimonials'].default.length);
  });

  it('rejects an invalid email in footer.contact via the schema (used by the router)', () => {
    const result = settingsRegistry['footer.contact'].schema.safeParse({
      address1: '1 rue',
      address2: 'BP 1',
      phone: '+221',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});
