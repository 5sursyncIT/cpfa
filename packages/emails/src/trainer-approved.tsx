import { Body, Container, Head, Heading, Html, Link, Preview, Text } from '@react-email/components';
import { emailCopy, type Locale } from './copy';

export type TrainerApprovedEmailProps = {
  firstName?: string | null;
  spaceUrl: string;
  locale?: Locale;
};

export function TrainerApprovedEmail({ firstName, spaceUrl, locale }: TrainerApprovedEmailProps) {
  const c = emailCopy('trainerApproved', locale);
  return (
    <Html>
      <Head />
      <Preview>{c.preview}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, maxWidth: 480 }}>
          <Heading as="h1">{c.heading}</Heading>
          <Text>{c.greeting(firstName ?? '')}</Text>
          <Text>
            {c.bodyBefore}
            <strong>{c.bodyStrong}</strong>
            {c.bodyAfter}
          </Text>
          <Text>
            <Link href={spaceUrl}>{c.cta}</Link>
          </Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 24 }}>{c.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}
