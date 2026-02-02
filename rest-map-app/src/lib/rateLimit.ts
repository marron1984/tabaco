import { supabase } from './supabase';

const LIMITS = {
  spot: { max: 5, window: 'day' },
  review: { max: 20, window: 'day' },
  report: { max: 10, window: 'day' },
} as const;

type ActionType = keyof typeof LIMITS;

function getDateKey(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

export async function checkRateLimit(anonymousId: string, action: ActionType): Promise<boolean> {
  const key = `${anonymousId}:${action}:${getDateKey()}`;
  const limit = LIMITS[action];

  const { data } = await supabase
    .from('rate_limits')
    .select('count')
    .eq('key', key)
    .single();

  return !data || data.count < limit.max;
}

export async function incrementRateLimit(anonymousId: string, action: ActionType): Promise<void> {
  const key = `${anonymousId}:${action}:${getDateKey()}`;

  await supabase.rpc('increment_rate_limit', { p_key: key });
}

// Note: This RPC function needs to be created in Supabase:
// CREATE OR REPLACE FUNCTION increment_rate_limit(p_key text)
// RETURNS void AS $$
// BEGIN
//   INSERT INTO rate_limits (key, count, updated_at)
//   VALUES (p_key, 1, now())
//   ON CONFLICT (key)
//   DO UPDATE SET count = rate_limits.count + 1, updated_at = now();
// END;
// $$ LANGUAGE plpgsql;
