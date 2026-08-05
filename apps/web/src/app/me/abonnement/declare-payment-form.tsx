'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import { CHANNEL_LABEL, type MobileChannel } from '@/lib/payment-declaration';

// « J'ai payé » : l'abonné choisit l'opérateur et recopie la référence de sa
// transaction. Le paiement reste en attente — c'est la comptabilité qui le
// confirme — mais elle dispose désormais de quoi le retrouver.
export function DeclarePaymentForm({
  paymentId,
  channels,
}: {
  paymentId: string;
  channels: MobileChannel[];
}) {
  const router = useRouter();
  const t = useTranslations('meAbonnement');
  const [channel, setChannel] = useState<MobileChannel>(channels[0] ?? 'WAVE');
  const [reference, setReference] = useState('');

  const declare = trpc.payments.declare.useMutation({ onSuccess: () => router.refresh() });
  const tooShort = reference.trim().length < 3;

  return (
    <form
      className="col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (tooShort || declare.isPending) return;
        declare.mutate({ paymentId, channel, reference: reference.trim() });
      }}
    >
      <div className="label">{t('declareHeading')}</div>

      {channels.length > 1 ? (
        <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
          {channels.map((c) => (
            <label key={c} className={c === channel ? 'tier-option is-selected' : 'tier-option'}>
              <input
                type="radio"
                name="channel"
                value={c}
                checked={c === channel}
                onChange={() => setChannel(c)}
              />
              <span className="fs-15">{CHANNEL_LABEL[c]}</span>
            </label>
          ))}
        </div>
      ) : null}

      <label className="col gap-2" style={{ maxWidth: 360 }}>
        <span className="fs-14">{t('declareReferenceLabel')}</span>
        <input
          type="text"
          className="input"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder={t('declareReferencePlaceholder')}
          maxLength={60}
          required
        />
      </label>

      <button
        type="submit"
        className="btn btn-primary"
        style={{ alignSelf: 'flex-start' }}
        disabled={tooShort || declare.isPending}
      >
        {declare.isPending ? t('declareSending') : t('declareSubmit')}
      </button>

      {declare.error ? (
        <p className="fs-13" style={{ color: 'var(--danger)' }}>
          {declare.error.message}
        </p>
      ) : null}
    </form>
  );
}
