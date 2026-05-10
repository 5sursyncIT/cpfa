-- Adds PAYTECH to the PaymentProvider enum.
-- PayTech is a Senegalese aggregator covering Wave, Orange Money, Free Money,
-- Wizall, E-money, Visa and Mastercard via a single hosted-checkout API.
-- See docs/projet.md §10.2 — this locks the open mobile-money decision.
ALTER TYPE "PaymentProvider" ADD VALUE 'PAYTECH';
