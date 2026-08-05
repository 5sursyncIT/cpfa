'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc';
import type { SubscriptionTier } from '@/lib/library-rules';

// Choix de la formule + souscription. Les trois formules et leurs montants
// viennent du serveur (LIBRARY_TIERS) : le bouton affiche exactement ce qui
// sera encaissé, et `initiate` reçoit le tier choisi — sans quoi le back-end
// retombait sur PROFESSIONAL quel que soit le prix annoncé.
export type TierOption = {
  tier: SubscriptionTier;
  priceXof: number;
  feeXof: number;
  depositXof: number;
  homeLoan: boolean;
};

const LABEL_KEY = {
  STUDENT: 'tierStudent',
  PROFESSIONAL: 'tierProfessional',
  HOME_LOAN: 'tierHomeLoan',
} as const;

export function SubscribeButton({ tiers }: { tiers: TierOption[] }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('meAbonnement');
  const tp = useTranslations('libraryProcedure');
  const [selected, setSelected] = useState<SubscriptionTier>(tiers[0]?.tier ?? 'PROFESSIONAL');

  const initiate = trpc.subscriptions.initiate.useMutation({
    onSuccess: () => router.refresh(),
  });

  const money = (xof: number) =>
    `${xof.toString().replace(/\B(?=(\d{3})+(?!\d))/g, locale === 'en' ? ',' : ' ')} FCFA`;
  const current = tiers.find((tier) => tier.tier === selected) ?? tiers[0];

  return (
    <div className="col gap-4">
      <fieldset className="tier-choice">
        <legend className="label">{t('chooseTier')}</legend>
        {tiers.map((tier) => (
          <label
            key={tier.tier}
            className={selected === tier.tier ? 'tier-option is-selected' : 'tier-option'}
          >
            <input
              type="radio"
              name="tier"
              value={tier.tier}
              checked={selected === tier.tier}
              onChange={() => setSelected(tier.tier)}
            />
            <span className="col gap-1">
              <span className="fs-15" style={{ fontWeight: 500 }}>
                {tp(LABEL_KEY[tier.tier])}
              </span>
              <span className="fs-13 text-soft">
                {tier.homeLoan ? tp('tierHomeLoanDesc') : tp('tierOnSiteDesc')}
              </span>
              {tier.depositXof > 0 ? (
                <span className="fs-13 text-soft">
                  {tp('depositBreakdown', {
                    fee: money(tier.feeXof),
                    deposit: money(tier.depositXof),
                  })}
                </span>
              ) : null}
            </span>
            <span className="mono fs-14">{money(tier.priceXof)}</span>
          </label>
        ))}
      </fieldset>

      <button
        type="button"
        className="btn btn-orange btn-lg"
        style={{ alignSelf: 'flex-start' }}
        onClick={() => initiate.mutate({ tier: selected })}
        disabled={initiate.isPending}
      >
        {initiate.isPending
          ? t('subscribeInit')
          : `${t('subscribeCta')} (${money(current?.priceXof ?? 0)})`}{' '}
        {!initiate.isPending ? <span className="arrow">→</span> : null}
      </button>
    </div>
  );
}
