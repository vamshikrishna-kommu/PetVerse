/**
 * Regression tests for the shared Axios API client:
 *  - Timeout / ECONNABORTED
 *  - Network disconnection (no response)
 *  - HTTP 500 server errors
 *  - getApiErrorMessage, isTimeoutError, isNetworkError helpers
 */
import { describe, it, expect } from 'vitest';
import axios from 'axios';
import { getApiErrorMessage, isTimeoutError, isNetworkError } from '../axios';

// ─── isTimeoutError ────────────────────────────────────────────────────────────

describe('isTimeoutError', () => {
  it('returns true for ECONNABORTED code', () => {
    const err = new axios.AxiosError('timeout of 15000ms exceeded', 'ECONNABORTED');
    expect(isTimeoutError(err)).toBe(true);
  });

  it('returns true for ERR_CANCELED code', () => {
    const err = new axios.AxiosError('canceled', 'ERR_CANCELED');
    expect(isTimeoutError(err)).toBe(true);
  });

  it('returns true when message contains timeout', () => {
    const err = new axios.AxiosError('timeout of 15000ms exceeded');
    expect(isTimeoutError(err)).toBe(true);
  });

  it('returns false for a regular HTTP error', () => {
    const err = new axios.AxiosError(
      'Request failed with status 500',
      undefined,
      undefined,
      undefined,
      {
        status: 500,
        data: {},
        headers: {},
        config: {} as any,
        statusText: 'Internal Server Error',
      }
    );
    expect(isTimeoutError(err)).toBe(false);
  });

  it('returns false for non-axios errors', () => {
    expect(isTimeoutError(new Error('generic error'))).toBe(false);
    expect(isTimeoutError('string error')).toBe(false);
  });
});

// ─── isNetworkError ────────────────────────────────────────────────────────────

describe('isNetworkError', () => {
  it('returns true when there is no response and error is not a timeout', () => {
    const err = new axios.AxiosError('Network Error', 'ERR_NETWORK');
    expect(isNetworkError(err)).toBe(true);
  });

  it('returns false for timeout errors (ECONNABORTED)', () => {
    const err = new axios.AxiosError('timeout', 'ECONNABORTED');
    expect(isNetworkError(err)).toBe(false);
  });

  it('returns false for errors with a response', () => {
    const err = new axios.AxiosError('Request failed', undefined, undefined, undefined, {
      status: 403,
      data: {},
      headers: {},
      config: {} as any,
      statusText: 'Forbidden',
    });
    expect(isNetworkError(err)).toBe(false);
  });

  it('returns false for non-axios errors', () => {
    expect(isNetworkError(new Error('generic'))).toBe(false);
  });
});

// ─── getApiErrorMessage ────────────────────────────────────────────────────────

describe('getApiErrorMessage', () => {
  it('returns friendly message for ECONNABORTED timeout', () => {
    const err = new axios.AxiosError('timeout of 15000ms exceeded', 'ECONNABORTED');
    expect(getApiErrorMessage(err)).toBe(
      'The request is taking longer than expected. Please try again.'
    );
  });

  it('returns friendly message for ERR_CANCELED timeout', () => {
    const err = new axios.AxiosError('canceled', 'ERR_CANCELED');
    expect(getApiErrorMessage(err)).toBe(
      'The request is taking longer than expected. Please try again.'
    );
  });

  it('returns friendly message for network error (no response)', () => {
    const err = new axios.AxiosError('Network Error', 'ERR_NETWORK');
    expect(getApiErrorMessage(err)).toBe(
      'A network error occurred. Please check your connection and try again.'
    );
  });

  it('extracts error.message from server error body', () => {
    const err = new axios.AxiosError('Request failed', undefined, undefined, undefined, {
      status: 400,
      data: { error: { message: 'Pet not found' } },
      headers: {},
      config: {} as any,
      statusText: 'Bad Request',
    });
    expect(getApiErrorMessage(err)).toBe('Pet not found');
  });

  it('extracts top-level message from server error body', () => {
    const err = new axios.AxiosError('Request failed', undefined, undefined, undefined, {
      status: 422,
      data: { message: 'Validation failed' },
      headers: {},
      config: {} as any,
      statusText: 'Unprocessable Entity',
    });
    expect(getApiErrorMessage(err)).toBe('Validation failed');
  });

  it('falls back to generic message for unknown error shapes', () => {
    expect(getApiErrorMessage('unexpected string')).toBe('Something went wrong');
    expect(getApiErrorMessage(null)).toBe('Something went wrong');
  });

  it('returns Error.message for plain Error instances', () => {
    expect(getApiErrorMessage(new Error('some plain error'))).toBe('some plain error');
  });

  it('does not expose raw ECONNABORTED code to the user', () => {
    const err = new axios.AxiosError('timeout of 15000ms exceeded', 'ECONNABORTED');
    const msg = getApiErrorMessage(err);
    expect(msg).not.toContain('ECONNABORTED');
    expect(msg).not.toContain('15000ms');
  });

  it('returns correct message for HTTP 500 server error with body', () => {
    const err = new axios.AxiosError('Internal Server Error', undefined, undefined, undefined, {
      status: 500,
      data: { error: { message: 'Database connection failed' } },
      headers: {},
      config: {} as any,
      statusText: 'Internal Server Error',
    });
    expect(getApiErrorMessage(err)).toBe('Database connection failed');
  });
});
