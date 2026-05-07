import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from '@react-email/components';

export type ContactFormEmailProps = {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
};

export function ContactFormEmail({ name, email, phone, subject, message }: ContactFormEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Nouveau message — ${subject}`}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, maxWidth: 560 }}>
          <Heading as="h1" style={{ fontSize: 18 }}>
            Nouveau message — formulaire de contact
          </Heading>
          <Text style={{ fontSize: 12, color: '#64748b' }}>Reçu via le site CPFA</Text>

          <Hr />

          <Row label="Nom" value={name} />
          <Row label="Email" value={email} />
          {phone ? <Row label="Téléphone" value={phone} /> : null}
          <Row label="Sujet" value={subject} />

          <Hr />

          <Text style={{ whiteSpace: 'pre-wrap' }}>{message}</Text>
        </Container>
      </Body>
    </Html>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={{ margin: '4px 0' }}>
      <strong>{label} :</strong> {value}
    </Text>
  );
}
