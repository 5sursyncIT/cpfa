import { getTranslations } from 'next-intl/server';
import { LogoMark } from './logo-mark';

export type MemberCardProps = {
  fullName: string;
  cardNumber: string;
  promotion?: string;
  status?: string;
  validUntil?: string;
};

export async function MemberCard({
  fullName,
  cardNumber,
  promotion = '—',
  status,
  validUntil = '—',
}: MemberCardProps) {
  const t = await getTranslations('memberCard');
  return (
    <div className="member-card">
      <div className="member-card-top">
        <div>
          <div className="member-card-name">{fullName}</div>
          <div className="member-card-num">CPFA · {cardNumber}</div>
        </div>
        <div style={{ width: 44, height: 44, position: 'relative', flexShrink: 0 }}>
          <LogoMark size={44} />
        </div>
      </div>
      <div className="member-card-bottom">
        <div>
          <div className="label">{t('promotionLabel')}</div>
          <div className="value">{promotion}</div>
        </div>
        <div>
          <div className="label">{t('statusLabel')}</div>
          <div className="value">{status ?? t('defaultStatus')}</div>
        </div>
        <div>
          <div className="label">{t('validUntilLabel')}</div>
          <div className="value">{validUntil}</div>
        </div>
      </div>
    </div>
  );
}
