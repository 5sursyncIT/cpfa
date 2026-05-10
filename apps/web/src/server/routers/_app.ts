import { router } from '../trpc';
import { adminStatsRouter } from './admin-stats';
import { articlesRouter } from './articles';
import { attachmentsRouter } from './attachments';
import { auditRouter } from './audit';
import { cmsRouter } from './cms';
import { contactRouter } from './contact';
import { coursesRouter } from './courses';
import { examsRouter } from './exams';
import { examPapersRouter } from './exam-papers';
import { healthRouter } from './health';
import { jobsRouter } from './jobs';
import { libraryRouter } from './library';
import { loansRouter } from './loans';
import { pagesRouter } from './pages';
import { paymentsRouter } from './payments';
import { registrationsRouter } from './registrations';
import { seminarsRouter } from './seminars';
import { subscriptionsRouter } from './subscriptions';
import { testimonialsRouter } from './testimonials';
import { trainersRouter } from './trainers';
import { usersRouter } from './users';

export const appRouter = router({
  health: healthRouter,
  library: libraryRouter,
  loans: loansRouter,
  subscriptions: subscriptionsRouter,
  courses: coursesRouter,
  seminars: seminarsRouter,
  exams: examsRouter,
  examPapers: examPapersRouter,
  registrations: registrationsRouter,
  attachments: attachmentsRouter,
  payments: paymentsRouter,
  pages: pagesRouter,
  articles: articlesRouter,
  contact: contactRouter,
  trainers: trainersRouter,
  testimonials: testimonialsRouter,
  jobs: jobsRouter,
  // Admin-only namespaces
  adminStats: adminStatsRouter,
  audit: auditRouter,
  users: usersRouter,
  cms: cmsRouter,
});

export type AppRouter = typeof appRouter;
