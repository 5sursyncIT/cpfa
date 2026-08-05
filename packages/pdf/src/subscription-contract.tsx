import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';

// « Contrat d'abonnement à la bibliothèque » — document contractuel remis à
// l'abonné(e) à l'activation de son abonnement. Il reprend mot pour mot les
// huit articles du contrat papier ; seuls le titulaire, la formule et les
// dates sont renseignés par le système. L'adresse et la ligne « demeurant à »
// restent à compléter et à signer à la main, comme sur l'original.
export type ContractArticle = { number: string; title: string; items: string[] };
export type SubscriptionContractProps = {
  /** Titulaire tel qu'il figurera après « M./Mme ». */
  subscriberName: string;
  /** Domicile de l'abonné(e) ; vide = pointillés à remplir à la main. */
  subscriberAddress?: string;
  cardNumber: string;
  libraryAddress: string;
  managerName: string;
  city: string;
  /** Date de prise d'effet, déjà formatée. */
  startedAt: string;
  /** Échéance annuelle, déjà formatée. */
  expiresAt: string;
  tierLabel: string;
  articles: ContractArticle[];
};

const NAVY = '#012a5e';
const DOTS = '…'.repeat(28);

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 52,
    fontSize: 10.5,
    fontFamily: 'Helvetica',
    color: '#14213d',
    lineHeight: 1.55,
  },
  header: { borderBottom: `1.5pt solid ${NAVY}`, paddingBottom: 12, marginBottom: 22 },
  brand: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: NAVY },
  brandSub: { fontSize: 8.5, color: '#64748b', marginTop: 3 },
  title: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    textAlign: 'center',
    marginBottom: 20,
  },
  paragraph: { marginBottom: 8, textAlign: 'justify' },
  party: { marginBottom: 6 },
  between: { fontFamily: 'Helvetica-Bold', marginVertical: 6 },
  articleTitle: { fontFamily: 'Helvetica-Bold', color: NAVY, marginTop: 14, marginBottom: 5 },
  bulletRow: { flexDirection: 'row', marginBottom: 3 },
  bullet: { width: 12, color: NAVY },
  itemText: { flex: 1, textAlign: 'justify' },
  recap: {
    marginTop: 16,
    padding: 12,
    border: '0.75pt solid #cbd5e1',
    borderRadius: 4,
    backgroundColor: '#f8fafc',
  },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  recapLabel: { color: '#64748b' },
  signature: { marginTop: 32 },
  signatureLine: { marginTop: 10 },
  bold: { fontFamily: 'Helvetica-Bold' },
  pageNumber: {
    position: 'absolute',
    bottom: 28,
    left: 52,
    right: 52,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
  },
});

export function SubscriptionContract({
  subscriberName,
  subscriberAddress,
  cardNumber,
  libraryAddress,
  managerName,
  city,
  startedAt,
  expiresAt,
  tierLabel,
  articles,
}: SubscriptionContractProps) {
  return (
    <Document title="Contrat d'abonnement à la bibliothèque — CPFA" author="CPFA">
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.brand}>Centre Professionnel de Formation en Assurance</Text>
          <Text style={styles.brandSub}>
            Unité décentralisée de l&apos;Institut International des Assurances (IIA) de Yaoundé
            (République du Cameroun)
          </Text>
        </View>

        <Text style={styles.title}>CONTRAT D&apos;ABONNEMENT A LA BIBLIOTHEQUE</Text>

        <Text style={styles.party}>
          Entre <Text style={styles.bold}>la bibliothèque du CPFA</Text>, sise à {libraryAddress},
          représentée par sa gérante {managerName}, ci-après dénommée « la Bibliothèque »,
        </Text>
        <Text style={styles.between}>ET</Text>
        <Text style={styles.party}>
          M./Mme <Text style={styles.bold}>{subscriberName}</Text>, demeurant à{' '}
          {subscriberAddress || DOTS}, ci-après dénommé(e) « l&apos;Abonné(e) »
        </Text>

        {articles.map((article) => (
          <View key={article.number} wrap={false}>
            <Text style={styles.articleTitle}>
              Article {article.number} – {article.title}
            </Text>
            {article.items.map((item, i) =>
              article.items.length === 1 ? (
                <Text key={i} style={styles.paragraph}>
                  {item}
                </Text>
              ) : (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.itemText}>{item}</Text>
                </View>
              ),
            )}
          </View>
        ))}

        {/* Récapitulatif de l'abonnement souscrit — la partie que le système
            connaît et que l'abonné n'a pas à recopier. */}
        <View style={styles.recap} wrap={false}>
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Formule souscrite</Text>
            <Text style={styles.bold}>{tierLabel}</Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>N° de carte d&apos;abonné(e)</Text>
            <Text>{cardNumber}</Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Prise d&apos;effet</Text>
            <Text>{startedAt}</Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Échéance</Text>
            <Text>{expiresAt}</Text>
          </View>
        </View>

        <View style={styles.signature} wrap={false}>
          <Text style={styles.bold}>Fait à {city}</Text>
          <Text style={styles.signatureLine}>Lu et approuvé le {DOTS}</Text>
          <Text style={[styles.bold, styles.signatureLine]}>Signature de l&apos;Abonné(e)</Text>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}

export async function renderSubscriptionContract(
  props: SubscriptionContractProps,
): Promise<Buffer> {
  return renderToBuffer(<SubscriptionContract {...props} />);
}
