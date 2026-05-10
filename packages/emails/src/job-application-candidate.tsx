import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';

export type JobApplicationCandidateEmailProps = {
  firstName: string;
  jobTitle: string;
  companyName: string;
};

export function JobApplicationCandidateEmail({
  firstName,
  jobTitle,
  companyName,
}: JobApplicationCandidateEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Candidature reçue — {jobTitle}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, maxWidth: 480 }}>
          <Heading as="h1">Candidature transmise</Heading>
          <Text>Bonjour {firstName},</Text>
          <Text>
            Votre candidature pour <strong>{jobTitle}</strong> chez <strong>{companyName}</strong>{' '}
            a bien été transmise au recruteur. Celui-ci reviendra vers vous directement par email
            ou téléphone selon ses procédures.
          </Text>
          <Text>
            La plateforme CPFA vous remercie pour votre intérêt et vous souhaite bonne chance.
          </Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 24 }}>
            Notification automatique du job board CPFA.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
