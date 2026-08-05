import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import { emailCopy, type Locale } from './copy';

export type ConvocationEmailProps = {
  candidateName: string;
  target: string;
  startsAt?: string;
  location?: string;
  pdfUrl: string;
  locale?: Locale;
};

export function ConvocationEmail({
  candidateName,
  target,
  startsAt,
  location,
  pdfUrl,
  locale,
}: ConvocationEmailProps) {
  const c = emailCopy('convocation', locale);
  return (
    <Html>
      <Head />
      <Preview>{c.preview}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, maxWidth: 520 }}>
          <Heading as="h1">{c.heading(target)}</Heading>
          <Text>{c.greeting(candidateName)}</Text>
          <Text>
            {c.body}
            {startsAt ? c.when(startsAt) : ''}
            {location ? c.where(location) : ''}
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
            {c.cta}
          </Button>

          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 24 }}>{c.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}
