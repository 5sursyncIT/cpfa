import { LogoMark } from './logo-mark';

export type MemberCardProps = {
  fullName: string;
  cardNumber: string;
  promotion?: string;
  status?: string;
  validUntil?: string;
};

export function MemberCard({
  fullName,
  cardNumber,
  promotion = '—',
  status = 'Abonné',
  validUntil = '—',
}: MemberCardProps) {
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
          <div className="label">Promotion</div>
          <div className="value">{promotion}</div>
        </div>
        <div>
          <div className="label">Statut</div>
          <div className="value">{status}</div>
        </div>
        <div>
          <div className="label">Valide jusqu&apos;au</div>
          <div className="value">{validUntil}</div>
        </div>
      </div>
    </div>
  );
}
