import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { formatXofExact } from '@cpfa/lib/i18n';
import { pdfCopy, type Locale } from './copy';

export type InvoiceProps = {
  number: string;
  customerName: string;
  amountXof: number;
  description: string;
  issuedAt: string;
  locale?: Locale;
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: 'Helvetica' },
  h1: { fontSize: 18, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#64748b' },
  total: { marginTop: 16, fontSize: 14, fontWeight: 700 },
});

export function Invoice({
  number,
  customerName,
  amountXof,
  description,
  issuedAt,
  locale,
}: InvoiceProps) {
  const c = pdfCopy('invoice', locale);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>{c.title(number)}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>{c.customer}</Text>
          <Text>{customerName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{c.date}</Text>
          <Text>{issuedAt}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{c.description}</Text>
          <Text>{description}</Text>
        </View>
        <Text style={styles.total}>
          {c.total} {formatXofExact(amountXof, locale)}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderInvoice(props: InvoiceProps): Promise<Buffer> {
  return renderToBuffer(<Invoice {...props} />);
}
