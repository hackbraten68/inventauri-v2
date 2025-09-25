import { describe, it, expect } from 'vitest';
import { getJson } from '../util';

/**
 * Contract tests for DELETE /api/theme/preference endpoint
 * These tests verify the API contract but will fail until the endpoint is implemented
 */

describe('DELETE /api/theme/preference', () => {
  it('should clear user theme preference and return 200 status', async () => {
    const { status, body } = await getJson('/api/theme/preference', {
      method: 'DELETE'
    });

    expect(status).toBe(200);
    expect(body).toBeDefined();
    expect(body).toHaveProperty('theme');
    expect(body).toHaveProperty('source', 'system'); // Should revert to system
    expect(body).toHaveProperty('timestamp');

    // Validate theme enum values
    expect(['light', 'dark']).toContain(body.theme);

    // Validate timestamp format (ISO 8601)
    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(timestampRegex.test(body.timestamp)).toBe(true);
  });

  it('should handle server errors gracefully', async () => {
    const { status, body } = await getJson('/api/theme/preference', {
      method: 'DELETE'
    });

    if (status === 500) {
      expect(body).toBeDefined();
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('message');
      expect(typeof body.error).toBe('string');
      expect(typeof body.message).toBe('string');
    }
  });
});
