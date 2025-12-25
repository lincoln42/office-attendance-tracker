/**
 * Basic setup test to verify testing framework is working
 */

describe('Testing Framework Setup', () => {
  it('should run basic tests', () => {
    expect(true).toBe(true);
  });

  it('should have access to fast-check', async () => {
    const fc = await import('fast-check');
    expect(fc).toBeDefined();
  });
});