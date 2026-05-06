import { router } from '../trpc';
import { articlesRouter } from './articles';
import { attachmentsRouter } from './attachments';
import { contactRouter } from './contact';
import { coursesRouter } from './courses';
import { examsRouter } from './exams';
import { examPapersRouter } from './exam-papers';
import { healthRouter } from './health';
import { libraryRouter } from './library';
import { loansRouter } from './loans';
import { pagesRouter } from './pages';
import { registrationsRouter } from './registrations';
import { seminarsRouter } from './seminars';
import { subscriptionsRouter } from './subscriptions';

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
  pages: pagesRouter,
  articles: articlesRouter,
  contact: contactRouter,
});

export type AppRouter = typeof appRouter;
