// Déclaration de paiement mobile — l'abonné a payé par Wave ou Orange Money
// et transmet sa référence de transaction ; la comptabilité vérifie puis
// confirme. Tant que PayTech n'est pas actif, c'est ce qui remplace le
// webhook : le paiement reste PENDING, mais il porte de quoi être retrouvé.
//
// Rangé dans `Payment.metadata` (Json) plutôt que dans de nouvelles colonnes :
// c'est un état de transition, pas un modèle durable — le jour où PayTech
// confirme tout seul, il suffira d'arrêter d'écrire ce bloc.

export const MOBILE_CHANNELS = ['WAVE', 'ORANGE_MONEY'] as const;
export type MobileChannel = (typeof MOBILE_CHANNELS)[number];

export const CHANNEL_LABEL: Record<MobileChannel, string> = {
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
};

export type PaymentDeclaration = {
  channel: MobileChannel;
  /** Référence de transaction saisie par l'abonné, telle quelle. */
  reference: string;
  /** Horodatage ISO de la déclaration. */
  declaredAt: string;
};

function isChannel(value: unknown): value is MobileChannel {
  return typeof value === 'string' && (MOBILE_CHANNELS as readonly string[]).includes(value);
}

/** Relit la déclaration éventuelle d'un paiement. `null` si absente ou illisible. */
export function declarationFromMetadata(metadata: unknown): PaymentDeclaration | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const raw = (metadata as Record<string, unknown>).declaration;
  if (!raw || typeof raw !== 'object') return null;
  const { channel, reference, declaredAt } = raw as Record<string, unknown>;
  if (!isChannel(channel)) return null;
  if (typeof reference !== 'string' || reference.trim().length === 0) return null;
  return {
    channel,
    reference: reference.trim(),
    declaredAt: typeof declaredAt === 'string' ? declaredAt : '',
  };
}

/**
 * Ajoute la déclaration aux métadonnées existantes sans rien écraser d'autre
 * (le bloc porte déjà `redirectUrl`, `qrPayload`, `tier`…).
 */
export function withDeclaration(
  metadata: unknown,
  declaration: PaymentDeclaration,
): Record<string, unknown> {
  const base =
    metadata && typeof metadata === 'object' ? { ...(metadata as Record<string, unknown>) } : {};
  return { ...base, declaration };
}
