-- Set AI monthly token limit to 150k (was 50k or null)
-- Default for new profiles; update existing where null or 50000

ALTER TABLE public.profiles
  ALTER COLUMN ai_token_monthly_limit SET DEFAULT 150000;

UPDATE public.profiles
SET ai_token_monthly_limit = 150000
WHERE ai_token_monthly_limit IS NULL
   OR ai_token_monthly_limit = 50000;
