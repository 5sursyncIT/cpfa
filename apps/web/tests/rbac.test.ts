import { describe, expect, it } from 'vitest';
import { hasPermission } from '@/lib/auth/rbac';

describe('rbac.hasPermission', () => {
  it('grants library:manage to BIBLIOTHECAIRE', () => {
    expect(hasPermission(['BIBLIOTHECAIRE'], 'library:manage')).toBe(true);
  });

  it('denies admin:any to a plain CANDIDAT', () => {
    expect(hasPermission(['CANDIDAT'], 'admin:any')).toBe(false);
  });

  it('SUPER_ADMIN gets every permission', () => {
    expect(hasPermission(['SUPER_ADMIN'], 'audit:read')).toBe(true);
    expect(hasPermission(['SUPER_ADMIN'], 'payment:validate')).toBe(true);
  });

  it('trainer:manage is reserved for ADMIN and SUPER_ADMIN', () => {
    expect(hasPermission(['ADMIN'], 'trainer:manage')).toBe(true);
    expect(hasPermission(['SUPER_ADMIN'], 'trainer:manage')).toBe(true);
    expect(hasPermission(['EDITEUR'], 'trainer:manage')).toBe(false);
    expect(hasPermission(['FORMATEUR'], 'trainer:manage')).toBe(false);
  });
});
