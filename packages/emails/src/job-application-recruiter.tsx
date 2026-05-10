import { Body, Container, Head, Heading, Html, Link, Preview, Text } from '@react-email/components';

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
}: JobApplicationRecruiterEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Nouvelle candidature pour « {jobTitle} »</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, maxWidth: 560 }}>
          <Heading as="h1">Nouvelle candidature</Heading>
          <Text>Bonjour,</Text>
          <Text>
            <strong>{companyName}</strong> a reçu une nouvelle candidature pour l&apos;offre{' '}
            <strong>{jobTitle}</strong>.
          </Text>
          <Text style={{ background: '#f1f5f9', padding: 12, borderRadius: 6 }}>
            <strong>{candidateFirstName} {candidateLastName}</strong>
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
            <strong>Motivation</strong>
          </Text>
          <Text style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{motivation}</Text>
          <Text style={{ marginTop: 16 }}>
            <Link href={cvUrl}>Télécharger le CV (PDF)</Link>
          </Text>
          <Text>
            <Link href={applicationsUrl}>
              Voir toutes les candidatures sur la plateforme CPFA
            </Link>
          </Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 24 }}>
            Notification automatique du job board CPFA — ne répondez pas à cet email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
