import { logger, LogCategory } from '@/utils/logging';
import type { Session } from '@supabase/supabase-js';

export class SessionValidator {
  private static readonly SESSION_CHECK_INTERVAL = 30000; // 30 seconds

  public static validateSession(session: Session | null): boolean {
    if (!session) {
      logger.error(LogCategory.AUTH, 'SessionValidator', 'No session available', {
        timestamp: new Date().toISOString()
      });
      return false;
    }

    if (!session.user?.id) {
      logger.error(LogCategory.AUTH, 'SessionValidator', 'Invalid session user', {
        session: session.user,
        timestamp: new Date().toISOString()
      });
      return false;
    }

    const now = Date.now() / 1000;
    if (session.expires_at && session.expires_at < now) {
      logger.error(LogCategory.AUTH, 'SessionValidator', 'Session expired', {
        expiresAt: session.expires_at,
        now,
        timestamp: new Date().toISOString()
      });
      return false;
    }

    return true;
  }

  public static logSessionValidation(session: Session | null, componentId: string): void {
    logger.info(LogCategory.AUTH, 'SessionValidator', 'Session validation check', {
      hasSession: !!session,
      userId: session?.user?.id,
      componentId,
      timestamp: new Date().toISOString()
    });
  }
}