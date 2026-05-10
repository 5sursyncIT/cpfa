-- Trois formules d'abonnement bibliothèque — tarifs et règles différenciés
-- (cf. lib/library-rules.ts). Les rows existants prennent PROFESSIONAL, qui
-- conserve les règles historiques (3 prêts simultanés, durée 14 j, pénalité
-- 500 FCFA/jour).

CREATE TYPE "SubscriptionTier" AS ENUM ('STUDENT', 'PROFESSIONAL', 'HOME_LOAN');

ALTER TABLE "Subscription"
  ADD COLUMN "tier" "SubscriptionTier" NOT NULL DEFAULT 'PROFESSIONAL';
