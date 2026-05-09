export type LoanListItem = {
  id: string;
  title: string;
  author: string;
  due: string;
  late: boolean;
  cover: 'navy' | 'orange' | 'ink' | 'cream' | 'olive';
};

export function LoanList({ items }: { items: LoanListItem[] }) {
  return (
    <div className="loan-list">
      {items.map((l) => (
        <div key={l.id} className="loan-item">
          <div className={'loan-cover ' + l.cover}></div>
          <div>
            <div className="loan-title">{l.title}</div>
            <div className="loan-author">{l.author}</div>
          </div>
          <span className={'pill ' + (l.late ? 'pill-warning' : '')}>
            {l.late ? 'En retard' : 'En cours'}
          </span>
          <div className={'loan-due' + (l.late ? ' loan-due-late' : '')}>
            <div
              className="text-soft fs-13"
              style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 10 }}
            >
              À rendre
            </div>
            <div style={{ fontSize: 14, marginTop: 2 }}>{l.due}</div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm">
            Prolonger
          </button>
        </div>
      ))}
    </div>
  );
}
