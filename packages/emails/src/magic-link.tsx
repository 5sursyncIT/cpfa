import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import { emailCopy, type Locale } from './copy';

export type MagicLinkEmailProps = {
  url: string;
  expiresInMinutes?: number;
  locale?: Locale;
};

export function MagicLinkEmail({ url, expiresInMinutes = 15, locale }: MagicLinkEmailProps) {
  const c = emailCopy('magicLink', locale);
  return (
    <Html>
      <Head />
      <Preview>{c.preview}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, maxWidth: 480 }}>
          <Heading as="h1">{c.heading}</Heading>
          <Text>{c.body(expiresInMinutes)}</Text>
          <Button href={url} style={{ backgroundColor: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 6 }}>
            {c.cta}
          </Button>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 24 }}>{c.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}
