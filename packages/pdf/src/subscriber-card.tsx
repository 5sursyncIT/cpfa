import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';

export type SubscriberCardProps = {
  fullName: string;
  cardNumber: string;
  validUntil: string;
  qrDataUrl: string;
};

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 11, fontFamily: 'Helvetica' },
  card: {
    border: '1pt solid #0f172a',
    borderRadius: 8,
    padding: 16,
    width: 320,
    height: 200,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: { fontSize: 14, fontWeight: 700, marginBottom: 8 },
  label: { color: '#64748b', fontSize: 9, marginTop: 6 },
  qr: { width: 96, height: 96 },
});

export function SubscriberCard({ fullName, cardNumber, validUntil, qrDataUrl }: SubscriberCardProps) {
  return (
    <Document>
      <Page size="A6" orientation="landscape" style={styles.page}>
        <View style={styles.card}>
          <View>
            <Text style={styles.title}>CPFA — Bibliothèque</Text>
            <Text style={styles.label}>Titulaire</Text>
            <Text>{fullName}</Text>
            <Text style={styles.label}>N° Carte</Text>
            <Text>{cardNumber}</Text>
            <Text style={styles.label}>Valide jusqu&apos;au</Text>
            <Text>{validUntil}</Text>
          </View>
          <Image src={qrDataUrl} style={styles.qr} />
        </View>
      </Page>
    </Document>
  );
}

export async function renderSubscriberCard(props: SubscriberCardProps): Promise<Buffer> {
  return renderToBuffer(<SubscriberCard {...props} />);
}
