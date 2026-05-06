import 'server-only';
import { auth } from './index';
import { hasPermission, type Permission } from './rbac';

export async function requirePermission(required: Permission) {
  const session = await auth();
  if (!session?.user) throw new Error('UNAUTHENTICATED');
  if (!hasPermission(session.user.roles, required)) throw new Error('FORBIDDEN');
  return session;
}
