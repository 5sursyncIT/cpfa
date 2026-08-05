import { Body, Container, Head, Heading, Html, Link, Preview, Text } from '@react-email/components';
import { emailCopy, type Locale } from './copy';

export type JobApplicationRecruiterEmailProps = {
  companyName: string;
  jobTitle: string;
  candidateFirstName: string;
  candidateLastName: string;
  candidateEmail: string;
  candidatePhone?: string | null;
  motivation: string;
  cvUrl: string;
  applicationsUrl: string;
  locale?: Locale;
};

export function JobApplicationRecruiterEmail({
  companyName,
  jobTitle,
  candidateFirstName,
  candidateLastName,
  candidateEmail,
  candidatePhone,
  motivation,
  cvUrl,
  applicationsUrl,
  locale,
}: JobApplicationRecruiterEmailProps) {
  const c = emailCopy('jobApplicationRecruiter', locale);
  return (
    <Html>
      <Head />
      <Preview>{c.preview(jobTitle)}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, maxWidth: 560 }}>
          <Heading as="h1">{c.heading}</Heading>
          <Text>{c.greeting}</Text>
          <Text>
            {c.bodyBefore}
            <strong>{companyName}</strong>
            {c.bodyMiddle}
            <strong>{jobTitle}</strong>
            {c.bodyAfter}
          </Text>
          <Text style={{ background: '#f1f5f9', padding: 12, borderRadius: 6 }}>
            <strong>
              {candidateFirstName} {candidateLastName}
            </strong>
            <br />
            <Link href={`mailto:${candidateEmail}`}>{candidateEmail}</Link>
            {candidatePhone ? (
              <>
                <br />
                {candidatePhone}
              </>
            ) : null}
          </Text>
          <Text style={{ marginTop: 16 }}>
            <strong>{c.motivationLabel}</strong>
          </Text>
          <Text style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{motivation}</Text>
          <Text style={{ marginTop: 16 }}>
            <Link href={cvUrl}>{c.cvCta}</Link>
          </Text>
          <Text>
            <Link href={applicationsUrl}>{c.allApplicationsCta}</Link>
          </Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 24 }}>{c.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}
