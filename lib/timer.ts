/**
 * Server-side timer utilities for quiz attempts.
 */

/**
 * Compute the expiry timestamp for a quiz attempt.
 */
export function computeExpiresAt(startedAt: Date, durationMinutes: number): Date {
  return new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
}

/**
 * Check whether a quiz attempt has expired.
 */
export function isExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Remaining seconds from now until expiry. Returns 0 if expired.
 */
export function remainingSeconds(expiresAt: Date): number {
  const diff = expiresAt.getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
}

/**
 * Validate that a submission timestamp is within the allowed window.
 * Grace period of 10 seconds past expiry to account for network latency.
 */
export function isSubmissionValid(
  submittedAt: Date,
  expiresAt: Date,
  gracePeriodSeconds = 10
): boolean {
  const grace = expiresAt.getTime() + gracePeriodSeconds * 1000;
  return submittedAt.getTime() <= grace;
}
