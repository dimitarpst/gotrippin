-- AI usage tracking columns on profiles
-- Run this in Supabase SQL Editor or via Supabase CLI

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_tokens_used_total BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_tokens_used_month BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_tokens_month_start DATE NOT NULL DEFAULT date_trunc('month', now())::date,
  ADD COLUMN IF NOT EXISTS ai_token_monthly_limit BIGINT NULL;
