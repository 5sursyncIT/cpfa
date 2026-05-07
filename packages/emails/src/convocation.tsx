import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';

export type ConvocationEmailProps = {
  candidateName: string;
  target: string;
  startsAt?: string;
  location?: string;
  pdfUrl: string;
};

export function ConvocationEmail({
  candidateName,
  target,
  startsAt,
  location,
  pdfUrl,
}: ConvocationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Votre convocation officielle CPFA</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, maxWidth: 520 }}>
          <Heading as="h1">Convocation — {target}</Heading>
          <Text>Bonjour {candidateName},</Text>
          <Text>
            Votre dossier est validé. Vous trouverez ci-joint votre convocation officielle.
            {startsAt ? ` La session se tient le ${startsAt}.` : ''}
            {location ? ` Lieu : ${location}.` : ''}
          </Text>

          <Button
            href={pdfUrl}
            style={{
              backgroundColor: '#0f172a',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: 6,
            }}
          >
            Télécharger la convocation (PDF)
          </Button>

          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 24 }}>
            Pensez à présenter cette convocation et une pièce d&apos;identité valide à l&apos;accueil.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
