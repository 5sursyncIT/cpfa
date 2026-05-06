import { router } from '../trpc';
import { healthRouter } from './health';
import { libraryRouter } from './library';

export const appRouter = router({
  health: healthRouter,
  library: libraryRouter,
});

export type AppRouter = typeof appRouter;
