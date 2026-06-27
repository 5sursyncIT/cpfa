import type { Role } from '@cpfa/db';

// Centralised French labels for enum-like values shown in the back-office.
// CPFA admins are not technical — never surface raw CODES (VISITEUR,
// ABONNE_BIBLIOTHEQUE, PENDING…) in the UI. Always pass them through here.

export const ROLE_LABEL: Record<Role, string> = {
  VISITEUR: 'Visiteur',
  CANDIDAT: 'Candidat',
  ABONNE_BIBLIOTHEQUE: 'Abonné bibliothèque',
  FORMATEUR: 'Formateur',
  EDITEUR: 'Éditeur',
  BIBLIOTHECAIRE: 'Bibliothécaire',
  COMPTABLE: 'Comptable',
  ADMIN: 'Administrateur',
  SUPER_ADMIN: 'Super-administrateur',
};

export const roleLabel = (r: Role | string): string =>
  ROLE_LABEL[r as Role] ?? String(r);

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  FAILED: 'Échoué',
  REFUNDED: 'Remboursé',
};

export const REGISTRATION_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumise',
  PAID: 'Réglée',
  VALIDATED: 'Validée',
  REJECTED: 'Refusée',
  CANCELLED: 'Annulée',
};

export const TRAINER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvée',
  REJECTED: 'Refusée',
};

export const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  ACTIVE: 'Actif',
  EXPIRED: 'Expiré',
  CANCELLED: 'Annulé',
  SUSPENDED: 'Suspendu',
};

export const labelFor = (
  map: Record<string, string>,
  value: string | null | undefined,
): string => (value ? (map[value] ?? value) : '—');
