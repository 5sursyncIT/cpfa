export function Marquee() {
  const items = [
    "Concours d'entrée 2026 · Inscriptions ouvertes",
    'Nouveau : Certificat Bancassurance',
    'Séminaire CIMA · 14 juin',
    'Bibliothèque · 3 200 références',
    'Partenariat Institut des Actuaires',
  ];
  const all = [...items, ...items];
  return (
    <div className="full-bleed-bar">
      <div className="marquee">
        {all.map((it, i) => (
          <span key={i}>{it}</span>
        ))}
      </div>
    </div>
  );
}
