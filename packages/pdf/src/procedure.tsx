import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';

// Generic renderer for CPFA's administrative procedures (subscription
// procedure, internal rules, …). The content itself lives in the web app —
// this package only knows how to lay a document of sections, paragraphs and
// bullet lists onto A4, so the published page and the downloadable PDF stay
// two views of one text.
export type ProcedureListItem = { text: string; children?: string[] };
export type ProcedureBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: ProcedureListItem[] };
export type ProcedureSubsection = { number: string; title: string; blocks: ProcedureBlock[] };
export type ProcedureSection = {
  number: string;
  title: string;
  blocks: ProcedureBlock[];
  subsections: ProcedureSubsection[];
};
export type ProcedureProps = {
  title: string;
  subtitle: string;
  intro: string;
  sections: ProcedureSection[];
  closing: string[];
  tagline: string;
  signature: string;
  /** Optional « Document mis à jour le … » line under the header. */
  footnote?: string;
};

const NAVY = '#012a5e';

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 10.5,
    fontFamily: 'Helvetica',
    color: '#14213d',
    lineHeight: 1.5,
  },
  header: { borderBottom: `1.5pt solid ${NAVY}`, paddingBottom: 12, marginBottom: 20 },
  brand: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: NAVY },
  subtitle: { fontSize: 8.5, color: '#64748b', marginTop: 3 },
  title: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 12 },
  intro: { marginBottom: 16, textAlign: 'justify' },
  section: { marginTop: 14 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 6 },
  subsection: { marginTop: 10, marginLeft: 10 },
  subsectionTitle: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  paragraph: { marginBottom: 6, textAlign: 'justify' },
  bulletRow: { flexDirection: 'row', marginBottom: 3 },
  bullet: { width: 12, color: NAVY },
  childRow: { flexDirection: 'row', marginBottom: 2, marginLeft: 14 },
  childBullet: { width: 10, color: '#64748b' },
  itemText: { flex: 1, textAlign: 'justify' },
  closing: { marginTop: 18, textAlign: 'justify' },
  tagline: { marginTop: 14, fontFamily: 'Helvetica-BoldOblique', color: NAVY },
  signature: { marginTop: 28, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  footnote: { fontSize: 8, color: '#94a3b8', marginTop: 6 },
  pageNumber: {
    position: 'absolute',
    bottom: 28,
    left: 48,
    right: 48,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
  },
});

function Blocks({ blocks }: { blocks: ProcedureBlock[] }) {
  return (
    <>
      {blocks.map((block, i) =>
        block.kind === 'paragraph' ? (
          <Text key={i} style={styles.paragraph}>
            {block.text}
          </Text>
        ) : (
          <View key={i} style={{ marginBottom: 6 }}>
            {block.items.map((item, j) => (
              <View key={j} wrap={false}>
                <View style={styles.bulletRow}>
                  <Text style={styles.bullet}>›</Text>
                  <Text style={styles.itemText}>{item.text}</Text>
                </View>
                {(item.children ?? []).map((child, k) => (
                  <View key={k} style={styles.childRow}>
                    <Text style={styles.childBullet}>•</Text>
                    <Text style={styles.itemText}>{child}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ),
      )}
    </>
  );
}

export function Procedure({
  title,
  subtitle,
  intro,
  sections,
  closing,
  tagline,
  signature,
  footnote,
}: ProcedureProps) {
  return (
    <Document title={title} author="CPFA">
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.brand}>Centre Professionnel de Formation en Assurance</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.intro}>{intro}</Text>

        {sections.map((section) => (
          <View key={section.number} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {section.number}. {section.title}
            </Text>
            <Blocks blocks={section.blocks} />
            {section.subsections.map((sub) => (
              <View key={sub.number} style={styles.subsection}>
                <Text style={styles.subsectionTitle}>
                  {sub.number}. {sub.title}
                </Text>
                <Blocks blocks={sub.blocks} />
              </View>
            ))}
          </View>
        ))}

        {closing.map((text, i) => (
          <Text key={i} style={styles.closing}>
            {text}
          </Text>
        ))}
        <Text style={styles.tagline}>{tagline}</Text>
        <Text style={styles.signature}>{signature}</Text>
        {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}

export async function renderProcedure(props: ProcedureProps): Promise<Buffer> {
  return renderToBuffer(<Procedure {...props} />);
}
