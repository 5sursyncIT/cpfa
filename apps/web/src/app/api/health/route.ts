import { NextResponse } from 'next/server';
import { prisma } from '@cpfa/db';
import { getRedis } from '@cpfa/lib/queues';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type ProbeResult = { ok: true } | { ok: false; error: string };

async function probeDb(): Promise<ProbeResult> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function probeRedis(): Promise<ProbeResult> {
  try {
    const reply = await getRedis().ping();
    return reply === 'PONG' ? { ok: true } : { ok: false, error: `unexpected reply: ${reply}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function GET() {
  const [db, redis] = await Promise.all([probeDb(), probeRedis()]);
  const ok = db.ok && redis.ok;
  return NextResponse.json(
    { ok, ts: new Date().toISOString(), db, redis },
    { status: ok ? 200 : 503 },
  );
}
