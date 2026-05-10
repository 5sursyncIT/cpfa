// Pure rules around the Course application window. Used by:
//   - the public catalogue / detail pages to render a "fermées" badge
//   - the tRPC `registrations.create` mutation to reject out-of-window posts
//   - the admin form to validate input before sending
//
// Both bounds are optional. Semantics:
//   - both null  → form always open (default)
//   - openAt only → opens when reached, never closes
//   - closeAt only → open until that date
//   - both → open within the window
//
// All bounds are inclusive on the open side and exclusive on the close side
// so an editor scheduling close=2026-09-01T00:00:00Z does NOT need to
// remember "23:59:59"; setting the next-day midnight closes correctly.

export type ApplicationWindow = {
  applicationsOpenAt: Date | null;
  applicationsCloseAt: Date | null;
};

export type ApplicationStatus =
  | { state: 'open'; closesAt: Date | null }
  | { state: 'before'; opensAt: Date }
  | { state: 'closed'; closedAt: Date };

export function applicationStatusAt(
  course: ApplicationWindow,
  now: Date = new Date(),
): ApplicationStatus {
  const { applicationsOpenAt: open, applicationsCloseAt: close } = course;
  if (open && now < open) return { state: 'before', opensAt: open };
  if (close && now >= close) return { state: 'closed', closedAt: close };
  return { state: 'open', closesAt: close };
}

export function isApplicationsOpen(
  course: ApplicationWindow,
  now: Date = new Date(),
): boolean {
  return applicationStatusAt(course, now).state === 'open';
}
