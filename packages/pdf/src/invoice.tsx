import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';

export type InvoiceProps = {
  number: string;
  customerName: string;
  amountXof: number;
  description: string;
  issuedAt: string;
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: 'Helvetica' },
  h1: { fontSize: 18, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#64748b' },
  total: { marginTop: 16, fontSize: 14, fontWeight: 700 },
});

const fmt = (xof: number) => `${xof.toLocaleString('fr-FR')} FCFA`;

export function Invoice({ number, customerName, amountXof, description, issuedAt }: InvoiceProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Reçu N° {number}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Client</Text>
          <Text>{customerName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text>{issuedAt}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Description</Text>
          <Text>{description}</Text>
        </View>
        <Text style={styles.total}>Total : {fmt(amountXof)}</Text>
      </Page>
    </Document>
  );
}

export async function renderInvoice(props: InvoiceProps): Promise<Buffer> {
  return renderToBuffer(<Invoice {...props} />);
}
