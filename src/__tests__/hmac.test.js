/**
 * Unit Tests for HMAC Signature Utilities
 *
 * This module tests the HMAC-SHA256 signing logic used for webhook authentication.
 *
 * Test Coverage:
 * - Signature generation with valid inputs
 * - Signature format validation (hex string)
 * - Timestamp format validation
 * - Signature determinism (same input = same signature at same timestamp)
 * - Signature uniqueness (different timestamps = different signatures)
 *
 * Target Coverage: 100%
 */
import { signRequest } from '../hmac.js';
import { createHmac } from 'crypto';
describe('HMAC Signature Utilities', () => {
    const testSecret = 'a3f2b8c9d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0';
    describe('signRequest', () => {
        test('returns timestamp and signature', () => {
            const payload = { postId: 't3_test123', title: 'Test Post' };
            const result = signRequest(payload, testSecret);
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('signature');
            expect(typeof result.timestamp).toBe('string');
            expect(typeof result.signature).toBe('string');
        });
        test('generates valid hex signature', () => {
            const payload = { postId: 't3_test123' };
            const { signature } = signRequest(payload, testSecret);
            // SHA-256 hex digest is 64 characters
            expect(signature).toMatch(/^[0-9a-f]{64}$/);
        });
        test('timestamp is numeric string', () => {
            const payload = { postId: 't3_test123' };
            const { timestamp } = signRequest(payload, testSecret);
            expect(timestamp).toMatch(/^\d+$/);
            expect(parseInt(timestamp)).toBeGreaterThan(0);
        });
        test('generates correct signature for known input', () => {
            const payload = { postId: 't3_test123', title: 'Test' };
            // Get the signature from signRequest
            const result = signRequest(payload, testSecret);
            // Manually compute what the signature should be
            const body = JSON.stringify(payload);
            const message = result.timestamp + body;
            const expectedSignature = createHmac('sha256', testSecret)
                .update(message)
                .digest('hex');
            expect(result.signature).toBe(expectedSignature);
        });
        test('different timestamps produce different signatures', () => {
            const payload = { postId: 't3_test123' };
            // Call signRequest twice with a small delay to get different timestamps
            const result1 = signRequest(payload, testSecret);
            // Sleep for at least 1ms to ensure different timestamp
            const start = Date.now();
            while (Date.now() === start) {
                // Busy wait
            }
            const result2 = signRequest(payload, testSecret);
            // Timestamps and signatures should be different
            expect(result1.signature).not.toBe(result2.signature);
            expect(result1.timestamp).not.toBe(result2.timestamp);
        });
        test('different payloads produce different signatures', () => {
            const payload1 = { postId: 't3_test123' };
            const payload2 = { postId: 't3_test456' };
            // Call both very quickly to likely get the same timestamp
            const result1 = signRequest(payload1, testSecret);
            const result2 = signRequest(payload2, testSecret);
            // Signatures should be different even if timestamps are the same
            expect(result1.signature).not.toBe(result2.signature);
            // Note: Timestamps might be the same or different depending on timing,
            // but signatures must always be different for different payloads
        });
        test('different secrets produce different signatures', () => {
            const payload = { postId: 't3_test123' };
            const secret1 = testSecret;
            const secret2 = 'differentSecret123456789abcdef0123456789abcdef0123456789abcdef012';
            // Call both very quickly to likely get the same timestamp
            const result1 = signRequest(payload, secret1);
            const result2 = signRequest(payload, secret2);
            // Signatures should be different even if timestamps and payloads are the same
            expect(result1.signature).not.toBe(result2.signature);
            // Note: Timestamps might be the same or different depending on timing,
            // but signatures must always be different for different secrets
        });
        test('handles complex payload objects', () => {
            const payload = {
                postId: 't3_abc123',
                title: 'Test Post with Special Characters: !@#$%^&*()',
                author: 'testuser',
                subreddit: 'Drumkits',
                url: 'https://drive.google.com/file/d/1abc/view',
                metadata: {
                    score: 42,
                    nested: {
                        value: true,
                    },
                },
            };
            const result = signRequest(payload, testSecret);
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('signature');
            expect(result.signature).toMatch(/^[0-9a-f]{64}$/);
        });
        test('handles empty payload object', () => {
            const payload = {};
            const result = signRequest(payload, testSecret);
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('signature');
            expect(result.signature).toMatch(/^[0-9a-f]{64}$/);
        });
    });
});
