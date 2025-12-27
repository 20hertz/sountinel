/**
 * HMAC Signature Utilities
 *
 * Implements HMAC-SHA256 request signing for secure webhook authentication.
 * This follows the same pattern used by Stripe, GitHub, and Slack webhooks.
 *
 * Security Properties:
 * - Message authentication (proves sender has the shared secret)
 * - Integrity verification (detects payload tampering)
 * - Replay attack prevention (via timestamp validation)
 */

import { createHmac } from 'crypto';

/**
 * Signs a request payload with HMAC-SHA256
 *
 * The signature is computed over: timestamp + JSON(payload)
 * This prevents both payload tampering and replay attacks.
 *
 * @param payload - The request payload to sign (will be JSON stringified)
 * @param secret - The HMAC shared secret (256-bit hex string)
 * @returns Object containing timestamp and hex-encoded signature
 *
 * @example
 * const { timestamp, signature } = signRequest({ postId: 't3_abc123' }, secret);
 * // Send in headers: X-Timestamp: timestamp, X-Signature: signature
 */
export function signRequest(payload: any, secret: string): { timestamp: string; signature: string } {
  const timestamp = Date.now().toString();
  const body = JSON.stringify(payload);
  const message = timestamp + body;

  const signature = createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  return { timestamp, signature };
}
