import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { pdfCopy, type Locale } from './copy';

export type SubscriberCardProps = {
  fullName: string;
  cardNumber: string;
  validUntil: string;
  qrDataUrl: string;
  locale?: Locale;
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

export function SubscriberCard({
  fullName,
  cardNumber,
  validUntil,
  qrDataUrl,
  locale,
}: SubscriberCardProps) {
  const c = pdfCopy('card', locale);
  return (
    <Document>
      <Page size="A6" orientation="landscape" style={styles.page}>
        <View style={styles.card}>
          <View>
            <Text style={styles.title}>{c.title}</Text>
            <Text style={styles.label}>{c.holder}</Text>
            <Text>{fullName}</Text>
            <Text style={styles.label}>{c.cardNumber}</Text>
            <Text>{cardNumber}</Text>
            <Text style={styles.label}>{c.validUntil}</Text>
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
