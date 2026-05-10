import { describe, expect, it } from 'vitest';
import { applicationStatusAt, isApplicationsOpen } from '@/lib/course-rules';

const T0 = new Date('2026-05-15T10:00:00Z');
const before = new Date('2026-05-01T00:00:00Z');
const after = new Date('2026-06-01T00:00:00Z');
const farFuture = new Date('2026-12-01T00:00:00Z');

describe('course-rules — applicationStatusAt', () => {
  it('open when both bounds are null', () => {
    const s = applicationStatusAt(
      { applicationsOpenAt: null, applicationsCloseAt: null },
      T0,
    );
    expect(s.state).toBe('open');
  });

  it('open when within the window', () => {
    const s = applicationStatusAt(
      { applicationsOpenAt: before, applicationsCloseAt: after },
      T0,
    );
    expect(s.state).toBe('open');
  });

  it('before when openAt is in the future', () => {
    const s = applicationStatusAt(
      { applicationsOpenAt: farFuture, applicationsCloseAt: null },
      T0,
    );
    expect(s.state).toBe('before');
    expect(s.state === 'before' && s.opensAt).toEqual(farFuture);
  });

  it('closed when closeAt is in the past', () => {
    const s = applicationStatusAt(
      { applicationsOpenAt: null, applicationsCloseAt: before },
      T0,
    );
    expect(s.state).toBe('closed');
  });

  it('closeAt is exclusive — exactly at the boundary is closed', () => {
    const s = applicationStatusAt(
      { applicationsOpenAt: null, applicationsCloseAt: T0 },
      T0,
    );
    expect(s.state).toBe('closed');
  });

  it('openAt is inclusive — exactly at the boundary is open', () => {
    const s = applicationStatusAt(
      { applicationsOpenAt: T0, applicationsCloseAt: null },
      T0,
    );
    expect(s.state).toBe('open');
  });

  it('isApplicationsOpen helper matches', () => {
    expect(
      isApplicationsOpen({ applicationsOpenAt: null, applicationsCloseAt: null }, T0),
    ).toBe(true);
    expect(
      isApplicationsOpen(
        { applicationsOpenAt: farFuture, applicationsCloseAt: null },
        T0,
      ),
    ).toBe(false);
  });
});
