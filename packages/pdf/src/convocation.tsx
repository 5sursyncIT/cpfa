import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';

export type ConvocationProps = {
  registrationId: string;
  candidateName: string;
  target: string; // course/seminar/exam title
  kind: 'course' | 'seminar' | 'exam';
  startsAt?: string; // formatted date
  location?: string;
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

const KIND_LABEL: Record<ConvocationProps['kind'], string> = {
  course: 'Formation',
  seminar: 'Séminaire',
  exam: 'Concours / Examen',
};

export function Convocation({
  registrationId,
  candidateName,
  target,
  kind,
  startsAt,
  location,
}: ConvocationProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>CPFA — Centre Professionnel de Formation à l’Assurance</Text>
          <Text style={styles.brandSub}>Dakar, Sénégal</Text>
        </View>

        <Text style={styles.h1}>Convocation officielle</Text>
        <Text style={styles.meta}>Référence : {registrationId}</Text>

        <View style={styles.block}>
          <View style={styles.row}>
            <Text style={styles.label}>Candidat·e</Text>
            <Text>{candidateName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Objet</Text>
            <Text>
              {KIND_LABEL[kind]} — {target}
            </Text>
          </View>
          {startsAt ? (
            <View style={styles.row}>
              <Text style={styles.label}>Date</Text>
              <Text>{startsAt}</Text>
            </View>
          ) : null}
          {location ? (
            <View style={styles.row}>
              <Text style={styles.label}>Lieu</Text>
              <Text>{location}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.block}>
          <Text>
            Vous êtes officiellement convoqué·e pour la session ci-dessus. Présentez ce document
            ainsi qu’une pièce d’identité valide à l’accueil.
          </Text>
        </View>

        <Text style={styles.signature}>La Direction des études — CPFA</Text>
      </Page>
    </Document>
  );
}

export async function renderConvocation(props: ConvocationProps): Promise<Buffer> {
  return renderToBuffer(<Convocation {...props} />);
}
