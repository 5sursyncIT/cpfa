import { router } from '../trpc';
import { articlesRouter } from './articles';
import { contactRouter } from './contact';
import { healthRouter } from './health';
import { libraryRouter } from './library';
import { pagesRouter } from './pages';

export const appRouter = router({
  health: healthRouter,
  library: libraryRouter,
  pages: pagesRouter,
  articles: articlesRouter,
  contact: contactRouter,
});

export type AppRouter = typeof appRouter;
