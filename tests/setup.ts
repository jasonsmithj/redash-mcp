// Vitest global setup
import { beforeEach } from 'vitest';

beforeEach(() => {
  // Reset environment variables
  process.env.REDASH_API_KEY = 'test-api-key';
  process.env.REDASH_BASE_URL = 'https://test.redash.example.com';
  process.env.REDASH_API_TIMEOUT = '30000';
  process.env.REDASH_MAX_RESULTS = '1000';
});
