import { Body, Container, Head, Heading, Html, Link, Preview, Text } from '@react-email/components';

export type JobPostedEmailProps = {
  companyName: string;
  jobTitle: string;
  publicUrl: string;
};

export function JobPostedEmail({ companyName, jobTitle, publicUrl }: JobPostedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Votre offre « {jobTitle} » est publiée</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '24px' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 24, maxWidth: 480 }}>
          <Heading as="h1">Votre offre est en ligne</Heading>
          <Text>Bonjour,</Text>
          <Text>
            L&apos;offre <strong>{jobTitle}</strong> publiée par <strong>{companyName}</strong> est
            désormais visible sur le job board du CPFA.
          </Text>
          <Text>
            <Link href={publicUrl}>Consulter l&apos;offre en ligne</Link>
          </Text>
          <Text>
            Vous recevrez un email dès qu&apos;une candidature sera déposée, avec les
            coordonnées du candidat et son CV en lien sécurisé.
          </Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 24 }}>
            Notification automatique — équipe CPFA.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
