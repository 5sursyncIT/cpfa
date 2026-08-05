import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { pdfCopy, type Locale } from './copy';

export type ConvocationProps = {
  registrationId: string;
  candidateName: string;
  target: string; // course/seminar/exam title
  kind: 'course' | 'seminar' | 'exam';
  startsAt?: string; // formatted date
  location?: string;
  locale?: Locale;
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica' },
  header: { borderBottomWidth: 1, borderColor: '#0f172a', paddingBottom: 12, marginBottom: 24 },
  brand: { fontSize: 14, fontWeight: 700 },
  brandSub: { fontSize: 9, color: '#64748b', marginTop: 2 },
  h1: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  meta: { fontSize: 9, color: '#64748b' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#64748b' },
  block: { marginTop: 16 },
  signature: { marginTop: 48, fontSize: 10, color: '#475569' },
});

export function Convocation({
  registrationId,
  candidateName,
  target,
  kind,
  startsAt,
  location,
  locale,
}: ConvocationProps) {
  const c = pdfCopy('convocation', locale);
  const kindLabel = {
    course: c.kindCourse,
    seminar: c.kindSeminar,
    exam: c.kindExam,
  }[kind];
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>{c.brand}</Text>
          <Text style={styles.brandSub}>{c.brandSub}</Text>
        </View>

        <Text style={styles.h1}>{c.title}</Text>
        <Text style={styles.meta}>{c.reference(registrationId)}</Text>

        <View style={styles.block}>
          <View style={styles.row}>
            <Text style={styles.label}>{c.candidate}</Text>
            <Text>{candidateName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{c.subject}</Text>
            <Text>
              {kindLabel} — {target}
            </Text>
          </View>
          {startsAt ? (
            <View style={styles.row}>
              <Text style={styles.label}>{c.date}</Text>
              <Text>{startsAt}</Text>
            </View>
          ) : null}
          {location ? (
            <View style={styles.row}>
              <Text style={styles.label}>{c.place}</Text>
              <Text>{location}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.block}>
          <Text>{c.body}</Text>
        </View>

        <Text style={styles.signature}>{c.signature}</Text>
      </Page>
    </Document>
  );
}

export async function renderConvocation(props: ConvocationProps): Promise<Buffer> {
  return renderToBuffer(<Convocation {...props} />);
}
