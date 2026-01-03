/**
 * Sanity Test
 * 
 * Basic test to ensure Jest is configured correctly
 */

describe('Jest Configuration', () => {
  test('should be able to run tests', () => {
    expect(true).toBe(true);
  });

  test('should have test environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.TELEGRAM_BOT_TOKEN).toBeDefined();
  });

  test('should support basic math operations', () => {
    expect(1 + 1).toBe(2);
    expect(5 * 5).toBe(25);
  });

  test('should support async/await', async () => {
    const promise = Promise.resolve('success');
    const result = await promise;
    expect(result).toBe('success');
  });
});
