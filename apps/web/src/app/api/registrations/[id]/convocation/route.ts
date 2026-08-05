import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { renderConvocation } from '@cpfa/pdf';
import { formatDateTime } from '@cpfa/lib/i18n';
import { recipientLocale } from '@/lib/recipient-locale';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { id } = await params;
  const reg = await prisma.registration.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, locale: true } },
      course: { select: { title: true } },
      seminar: { select: { title: true, startsAt: true, location: true } },
      exam: { select: { title: true, examAt: true } },
      session: { select: { startsAt: true, location: true } },
    },
  });
  if (!reg) return new Response('Not found', { status: 404 });

  // Owner can always download. Admin/comptable can download anyone's.
  const isOwner = reg.user.id === session.user.id;
  if (!isOwner && !hasPermission(session.user.roles, 'admin:any')) {
    return new Response('Forbidden', { status: 403 });
  }

  if (reg.status !== 'VALIDATED') {
    return new Response('Registration not yet validated', { status: 409 });
  }

  const candidateName =
    [reg.user.firstName, reg.user.lastName].filter(Boolean).join(' ') || reg.user.email;
  const target = reg.course?.title ?? reg.seminar?.title ?? reg.exam?.title ?? '—';
  const kind: 'course' | 'seminar' | 'exam' = reg.courseId ? 'course' : reg.seminarId ? 'seminar' : 'exam';

  const date = reg.session?.startsAt ?? reg.seminar?.startsAt ?? reg.exam?.examAt ?? null;
  // La convocation appartient au candidat, pas à qui la télécharge : un admin
  // qui la récupère obtient le document dans la langue du candidat.
  const locale = recipientLocale(reg.user);
  const startsAt = date ? formatDateTime(date, locale) : undefined;
  const location = reg.session?.location ?? reg.seminar?.location ?? undefined;

  const pdf = await renderConvocation({
    registrationId: reg.id,
    candidateName,
    target,
    kind,
    startsAt,
    location,
    locale,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="convocation-${reg.id}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
