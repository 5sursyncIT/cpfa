import { router } from '../trpc';
import { articlesRouter } from './articles';
import { contactRouter } from './contact';
import { healthRouter } from './health';
import { libraryRouter } from './library';
import { loansRouter } from './loans';
import { pagesRouter } from './pages';
import { subscriptionsRouter } from './subscriptions';

export const appRouter = router({
  health: healthRouter,
  library: libraryRouter,
  loans: loansRouter,
  subscriptions: subscriptionsRouter,
  pages: pagesRouter,
  articles: articlesRouter,
  contact: contactRouter,
});

export type AppRouter = typeof appRouter;
