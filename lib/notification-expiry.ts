/**
 * Notification Expiration Utilities
 * Ensures notifications are automatically expired and purged based on rules
 * Default rule: Expire after 12:00 PM IST (noon)
 */

export type ExpiryType = '12pm' | '12h' | '24h' | 'never';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30 in milliseconds

/**
 * Calculates the exact ISO expiry date-time for a notification.
 * Default type is '12pm':
 * - If sent before 12:00 PM IST, expires today at 12:00 PM IST.
 * - If sent at or after 12:00 PM IST, expires tomorrow at 12:00 PM IST.
 */
export function calculateNotificationExpiry(
  sentAt: string | Date = new Date(),
  type: ExpiryType = '12pm'
): string | undefined {
  if (type === 'never') return undefined;

  const sentDate = typeof sentAt === 'string' ? new Date(sentAt) : sentAt;
  const sentMs = sentDate.getTime();

  if (isNaN(sentMs)) {
    return undefined;
  }

  if (type === '12h') {
    return new Date(sentMs + 12 * 60 * 60 * 1000).toISOString();
  }

  if (type === '24h') {
    return new Date(sentMs + 24 * 60 * 60 * 1000).toISOString();
  }

  // '12pm' logic in IST (Indian Standard Time):
  const sentIst = new Date(sentMs + IST_OFFSET_MS);
  const istHour = sentIst.getUTCHours();

  const targetIst = new Date(sentIst);
  targetIst.setUTCHours(12, 0, 0, 0); // 12:00:00.000 PM IST

  // If sent at or after 12:00 PM IST, target is next day's 12:00 PM IST
  if (istHour >= 12) {
    targetIst.setUTCDate(targetIst.getUTCDate() + 1);
  }

  const expiryUtc = new Date(targetIst.getTime() - IST_OFFSET_MS);
  return expiryUtc.toISOString();
}

/**
 * Checks whether a notification is currently expired.
 */
export function isNotificationExpired(notif: {
  expiresAt?: string;
  sentAt?: string;
  createdAt?: string;
  expiryType?: string;
}): boolean {
  if (!notif) return false;

  const now = Date.now();

  // If explicit expiresAt is provided
  if (notif.expiresAt) {
    const expMs = new Date(notif.expiresAt).getTime();
    if (!isNaN(expMs)) {
      return now >= expMs;
    }
  }

  // If no expiresAt, evaluate default 12 PM rule from sentAt/createdAt
  const sent = notif.sentAt || notif.createdAt;
  if (!sent) return false;

  const exp = calculateNotificationExpiry(
    sent,
    (notif.expiryType as ExpiryType) || '12pm'
  );

  if (!exp) return false;
  const expMs = new Date(exp).getTime();
  return !isNaN(expMs) && now >= expMs;
}
