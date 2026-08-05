import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import { emailCopy, type Locale } from './copy';

export type TrainerRejectedEmailProps = {
  firstName?: string | null;
  reason?: string | null;
  locale?: Locale;
};

export function TrainerRejectedEmail({ firstName, reason, locale }: TrainerRejectedEmailProps) {
  const c = emailCopy('trainerRejected', locale);
  return (
    <Html>
      <Head />
      <Preview>{c.preview}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, maxWidth: 480 }}>
          <Heading as="h1">{c.heading}</Heading>
          <Text>{c.greeting(firstName ?? '')}</Text>
          <Text>{c.body}</Text>
          {reason ? (
            <Text style={{ background: '#f1f5f9', padding: 12, borderRadius: 6 }}>
              <strong>{c.reasonLabel}</strong> {reason}
            </Text>
          ) : null}
          <Text>{c.closing}</Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 24 }}>{c.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}
