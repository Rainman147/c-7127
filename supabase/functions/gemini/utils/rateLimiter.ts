import { createAppError } from './errorHandler.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function checkRateLimits(supabase: any, userId: string) {
  console.log('[checkRateLimits] Checking rate limits for user:', userId);

  // Get or create rate limit records for this user
  const types = ['requests_per_minute', 'daily_quota', 'concurrent'];
  for (const type of types) {
    const { data, error } = await supabase
      .from('rate_limits')
      .select()
      .eq('user_id', userId)
      .eq('limit_type', type)
      .single();

    if (!data) {
      await supabase
        .from('rate_limits')
        .insert({
          user_id: userId,
          limit_type: type,
          count: 0
        });
    }
  }

  // Check and update limits
  const limits = {
    'requests_per_minute': 30,
    'daily_quota': 1000,
    'concurrent': 3
  };

  // Check each limit type
  for (const [type, limit] of Object.entries(limits)) {
    const { data, error } = await supabase
      .from('rate_limits')
      .select('count, last_reset')
      .eq('user_id', userId)
      .eq('limit_type', type)
      .single();

    if (error) {
      console.error(`[checkRateLimits] Error checking ${type}:`, error);
      throw createAppError(`Error checking rate limits: ${error.message}`, 'RATE_LIMIT_ERROR');
    }

    if (data.count >= limit) {
      const timeUnit = type === 'requests_per_minute' ? 'minute' : 
                      type === 'daily_quota' ? 'day' : 'time';
      throw createAppError(
        `Rate limit exceeded: ${limit} requests per ${timeUnit}`, 
        'RATE_LIMIT_EXCEEDED'
      );
    }

    // Increment the counter
    const { error: updateError } = await supabase
      .from('rate_limits')
      .update({ count: data.count + 1 })
      .eq('user_id', userId)
      .eq('limit_type', type);

    if (updateError) {
      console.error(`[checkRateLimits] Error updating ${type}:`, updateError);
      throw createAppError(`Error updating rate limits: ${updateError.message}`, 'RATE_LIMIT_ERROR');
    }
  }

  console.log('[checkRateLimits] Rate limits checked successfully');
}