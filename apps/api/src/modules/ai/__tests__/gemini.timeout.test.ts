/**
 * Regression tests for gemini.client._callGemini timeout and budget behavior.
 */
import { geminiClient } from '../services/gemini.client';

jest.mock('../../../shared/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), http: jest.fn() },
}));

jest.mock('../../../config/env', () => ({
  env: {
    GEMINI_API_KEY: 'test-key-1234567890',
    GEMINI_MODEL: '',
    NODE_ENV: 'test',
    AI_SERVICE_URL: 'http://localhost:8000',
    AI_SERVICE_INTERNAL_KEY: undefined,
  },
  isConfiguredCredential: (val: string | undefined) =>
    typeof val === 'string' && val.length > 10 && !val.startsWith('your_'),
}));

const makeResponse = (status: number, body?: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body ?? ''),
  json: async () => body,
});

describe('GeminiClient._callGemini — timeout & budget safety', () => {
  jest.setTimeout(30000);

  const originalFetch = (global as any).fetch;

  beforeEach(() => {
    (global as any).fetch = undefined;
  });

  afterEach(() => {
    (global as any).fetch = originalFetch;
  });

  it('returns null and does not hang when all models return 429', async () => {
    let callCount = 0;
    (global as any).fetch = async () => {
      callCount++;
      return makeResponse(429, 'rate limited');
    };

    const result = await geminiClient._callGemini([{ role: 'user', parts: [{ text: 'hello' }] }]);
    expect(result).toBeNull();
    expect(callCount).toBeGreaterThan(0);
    expect(callCount).toBeLessThanOrEqual(3); // chain has 3 models
  });

  it('returns null immediately and does NOT cascade when 404 is received', async () => {
    let callCount = 0;
    (global as any).fetch = async () => {
      callCount++;
      return makeResponse(404, 'not found');
    };

    const result = await geminiClient._callGemini([{ role: 'user', parts: [{ text: 'hi' }] }]);
    expect(result).toBeNull();
    // 404 should NOT cascade to the next model — only 1 network call expected
    expect(callCount).toBe(1);
  });

  it('returns candidate text on a successful first-model response', async () => {
    (global as any).fetch = async () =>
      makeResponse(200, {
        candidates: [{ content: { parts: [{ text: 'Hello from Gemini!' }] } }],
      });

    const result = await geminiClient._callGemini([{ role: 'user', parts: [{ text: 'hi' }] }]);
    expect(result).toBe('Hello from Gemini!');
  });

  it('falls back to second model after 503 on first model', async () => {
    let callCount = 0;
    (global as any).fetch = async () => {
      callCount++;
      if (callCount === 1) return makeResponse(503, 'overloaded');
      return makeResponse(200, {
        candidates: [{ content: { parts: [{ text: 'Fallback response' }] } }],
      });
    };

    const result = await geminiClient._callGemini([{ role: 'user', parts: [{ text: 'hi' }] }]);
    expect(result).toBe('Fallback response');
    expect(callCount).toBe(2);
  });

  it('respects budget deadline and returns null if budget is already expired', async () => {
    let fetchCalled = false;
    (global as any).fetch = async () => {
      fetchCalled = true;
      return makeResponse(200, { candidates: [] });
    };

    const pastDeadline = Date.now() - 1000;
    const result = await geminiClient._callGemini(
      [{ role: 'user', parts: [{ text: 'hi' }] }],
      0,
      undefined,
      pastDeadline
    );
    expect(result).toBeNull();
    // fetch should not be called when budget is already expired
    expect(fetchCalled).toBe(false);
  });
});

describe('GeminiClient.analyzeSymptoms — falls back to clinical engine on Gemini failure', () => {
  jest.setTimeout(30000);

  it('returns clinical rule engine result when Gemini throws', async () => {
    jest.spyOn(geminiClient, 'analyzeSymptoms').mockRejectedValueOnce(
      Object.assign(new Error('Network error'), { name: 'AbortError' })
    );

    const { aiService } = await import('../services/ai.service');
    const result = await aiService.analyzeSymptoms({
      species: 'dog',
      symptoms: ['seizure', 'collapse'],
      duration: 'hours',
      severity: 'severe',
    });

    expect(result.triageUrgency).toBe('EMERGENCY');
    expect(result.isEmergency).toBe(true);
    expect(result.generatedBy).toBe('clinical_rule_engine');
  });
});
