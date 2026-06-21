import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('analytics', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('does not throw when provider is not set', async () => {
    const analytics = await import('../app/analytics');
    expect(() => analytics.loadAnalytics()).not.toThrow();
  });

  it('does not throw when provider is disabled', async () => {
    const originalProvider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER;
    process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER = 'disabled';

    const analytics = await import('../app/analytics');
    expect(() => analytics.loadAnalytics()).not.toThrow();

    process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER = originalProvider;
  });
});
