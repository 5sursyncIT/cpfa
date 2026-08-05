import { describe, expect, it } from 'vitest';
import {
  parseSettingValue,
  settingsRegistry,
  isKnownKey,
  SETTING_KEYS,
} from '@/lib/site-settings/registry';
import { hasLocalizedDefault, settingDefault } from '@/lib/site-settings/defaults';

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

  // Un défaut anglais qui ne satisfait pas son schéma ne casserait rien de
  // visible : `parseSettingValue` le rejetterait en silence et la page
  // repartirait en français. D'où ce test.
  it('every EN default round-trips through its own schema', () => {
    for (const key of SETTING_KEYS) {
      if (!hasLocalizedDefault(key, 'en')) continue;
      const entry = settingsRegistry[key];
      expect(() => entry.schema.parse(settingDefault(key, 'en'))).not.toThrow();
    }
  });

  it('settingDefault serves English copy for translated keys', () => {
    expect(settingDefault('home.hero', 'en').headline).not.toBe(
      settingsRegistry['home.hero'].default.headline,
    );
    expect(settingDefault('home.blocks', 'en').aboutEyebrow).toBe('About us');
  });

  it('settingDefault falls back to French when a key has no translation', () => {
    // `library.pricing` ne contient que des montants : pas de version anglaise.
    expect(hasLocalizedDefault('library.pricing', 'en')).toBe(false);
    expect(settingDefault('library.pricing', 'en')).toEqual(
      settingsRegistry['library.pricing'].default,
    );
  });

  it('defaults to French when no locale is given', () => {
    expect(settingDefault('home.hero')).toEqual(settingsRegistry['home.hero'].default);
  });
});
