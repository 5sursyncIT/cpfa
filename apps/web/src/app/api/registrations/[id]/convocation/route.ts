import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/rbac';
import { prisma } from '@cpfa/db';
import { renderConvocation } from '@cpfa/pdf';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { id } = await params;
  const reg = await prisma.registration.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
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
  const startsAt = date
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(date)
    : undefined;
  const location = reg.session?.location ?? reg.seminar?.location ?? undefined;

  const pdf = await renderConvocation({
    registrationId: reg.id,
    candidateName,
    target,
    kind,
    startsAt,
    location,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="convocation-${reg.id}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
