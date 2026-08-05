import { Body, Container, Head, Heading, Html, Link, Preview, Text } from '@react-email/components';
import { emailCopy, type Locale } from './copy';

export type JobPostedEmailProps = {
  companyName: string;
  jobTitle: string;
  publicUrl: string;
  locale?: Locale;
};

export function JobPostedEmail({ companyName, jobTitle, publicUrl, locale }: JobPostedEmailProps) {
  const c = emailCopy('jobPosted', locale);
  return (
    <Html>
      <Head />
      <Preview>{c.preview(jobTitle)}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, maxWidth: 480 }}>
          <Heading as="h1">{c.heading}</Heading>
          <Text>{c.greeting}</Text>
          <Text>
            {c.bodyBefore}
            <strong>{jobTitle}</strong>
            {c.bodyMiddle}
            <strong>{companyName}</strong>
            {c.bodyAfter}
          </Text>
          <Text>
            <Link href={publicUrl}>{c.cta}</Link>
          </Text>
          <Text>{c.notice}</Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 24 }}>{c.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}
