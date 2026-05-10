import type { Role } from '@cpfa/db';

export type Permission =
  | 'cms:write'
  | 'library:manage'
  | 'library:borrow'
  | 'training:register'
  | 'payment:validate'
  | 'audit:read'
  | 'trainer:manage'
  | 'admin:any';

const grants: Record<Role, Permission[]> = {
  VISITEUR: [],
  CANDIDAT: ['training:register'],
  ABONNE_BIBLIOTHEQUE: ['library:borrow'],
  FORMATEUR: [],
  EDITEUR: ['cms:write'],
  BIBLIOTHECAIRE: ['library:manage'],
  COMPTABLE: ['payment:validate'],
  ADMIN: [
    'cms:write',
    'library:manage',
    'payment:validate',
    'audit:read',
    'trainer:manage',
    'admin:any',
  ],
  SUPER_ADMIN: [
    'cms:write',
    'library:manage',
    'library:borrow',
    'training:register',
    'payment:validate',
    'audit:read',
    'trainer:manage',
    'admin:any',
  ],
};

export function hasPermission(roles: Role[], required: Permission): boolean {
  return roles.some((role) => grants[role]?.includes(required));
}
