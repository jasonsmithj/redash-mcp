import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RedashClient } from '../src/redash-client';
import type { DataSource, Query, QueryResult, Job } from '../src/types';

// Mock fetch
global.fetch = vi.fn();

describe('RedashClient', () => {
  let client: RedashClient;
  const mockApiKey = 'test-api-key';
  const mockBaseUrl = 'https://test.redash.example.com';

  beforeEach(() => {
    vi.clearAllMocks();
    client = new RedashClient({
      apiKey: mockApiKey,
      baseUrl: mockBaseUrl,
      timeout: 30000,
    });
  });

  describe('Constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(client).toBeDefined();
    });

    it('should load configuration from environment variables', () => {
      process.env.REDASH_API_KEY = 'env-api-key';
      process.env.REDASH_BASE_URL = 'https://env.redash.example.com';

      const envClient = RedashClient.fromEnv();
      expect(envClient).toBeDefined();
    });

    it('should throw error when environment variables are not set', () => {
      delete process.env.REDASH_API_KEY;
      delete process.env.REDASH_BASE_URL;

      expect(() => RedashClient.fromEnv()).toThrow();
    });
  });

  describe('listDataSources', () => {
    it('should fetch list of data sources', async () => {
      const mockResponse: DataSource[] = [
        { id: 1, name: 'PostgreSQL', type: 'pg' },
        { id: 2, name: 'MySQL', type: 'mysql' },
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.listDataSources();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/data_sources`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Key ${mockApiKey}`,
          }),
        })
      );
    });

    it('should throw error on API failure', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(client.listDataSources()).rejects.toThrow();
    });

    it('should include a JSON response body in API errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: { get: () => 'application/json' },
        json: async () => ({ error: 'Invalid query' }),
      });

      await expect(client.listDataSources()).rejects.toMatchObject({
        message: expect.stringContaining('Invalid query'),
        status: 400,
      });
    });

    it('should preserve the timeout error as the cause', async () => {
      vi.useFakeTimers();
      const timeoutClient = new RedashClient({
        apiKey: mockApiKey,
        baseUrl: mockBaseUrl,
        timeout: 1,
      });
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
        (_url: string, options: RequestInit) =>
          new Promise((_resolve, reject) => {
            options.signal?.addEventListener('abort', () => {
              const abortError = new Error('Aborted');
              abortError.name = 'AbortError';
              reject(abortError);
            });
          })
      );

      const request = timeoutClient.listDataSources();
      const rejection = expect(request).rejects.toMatchObject({
        message: 'Request timeout after 1ms',
        cause: expect.objectContaining({ name: 'AbortError' }),
      });
      await vi.advanceTimersByTimeAsync(1);
      await rejection;
      vi.useRealTimers();
    });
  });

  describe('getDataSource', () => {
    it('should fetch specific data source', async () => {
      const mockDataSource: DataSource = {
        id: 1,
        name: 'PostgreSQL',
        type: 'pg',
        syntax: 'sql',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDataSource,
      });

      const result = await client.getDataSource(1);

      expect(result).toEqual(mockDataSource);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/data_sources/1`,
        expect.any(Object)
      );
    });

    it('should throw error for non-existent data source', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(client.getDataSource(999)).rejects.toThrow();
    });
  });

  describe('executeQuery', () => {
    it('should execute query', async () => {
      const mockJob: Job = {
        id: 'job-123',
        status: 1, // pending
        updated_at: Date.now(),
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ job: mockJob }),
      });

      const result = await client.executeQuery({
        query: 'SELECT * FROM users',
        data_source_id: 1,
      });

      expect(result.job).toEqual(mockJob);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/query_results`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('SELECT * FROM users'),
        })
      );
    });

    it('should support max_age parameter', async () => {
      const mockJob: Job = {
        id: 'job-456',
        status: 1,
        updated_at: Date.now(),
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ job: mockJob }),
      });

      await client.executeQuery({
        query: 'SELECT COUNT(*) FROM users',
        data_source_id: 1,
        max_age: 3600,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"max_age":3600'),
        })
      );
    });
  });

  describe('getJob', () => {
    it('should fetch job status', async () => {
      const mockJob: Job = {
        id: 'job-123',
        status: 3, // success
        query_result_id: 'result-456',
        updated_at: Date.now(),
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ job: mockJob }),
      });

      const result = await client.getJob('job-123');

      expect(result.job).toEqual(mockJob);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/jobs/job-123`,
        expect.any(Object)
      );
    });
  });

  describe('getQueryResult', () => {
    it('should fetch query result', async () => {
      const mockResult: QueryResult = {
        id: 'result-123',
        query_hash: 'hash-456',
        query: 'SELECT * FROM users',
        data: {
          columns: [{ name: 'id', friendly_name: 'ID', type: 'integer' }],
          rows: [{ id: 1 }],
        },
        data_source_id: 1,
        runtime: 0.1,
        retrieved_at: new Date().toISOString(),
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ query_result: mockResult }),
      });

      const result = await client.getQueryResult('result-123');

      expect(result).toEqual(mockResult);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/query_results/result-123`,
        expect.any(Object)
      );
    });
  });

  describe('executeQueryAndWait', () => {
    it('should return cached result directly when available', async () => {
      const mockResult: QueryResult = {
        id: 'result-cached',
        query_hash: 'hash-cached',
        query: 'SELECT * FROM users',
        data: {
          columns: [{ name: 'id', friendly_name: 'ID', type: 'integer' }],
          rows: [{ id: 1 }, { id: 2 }],
        },
        data_source_id: 1,
        runtime: 0.05,
        retrieved_at: new Date().toISOString(),
      };

      // When cached result is available, API returns query_result directly
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ query_result: mockResult }),
      });

      const result = await client.executeQueryAndWait({
        query: 'SELECT * FROM users',
        data_source_id: 1,
      });

      expect(result).toEqual(mockResult);
      expect(result.data.rows).toHaveLength(2);
      // Should only call fetch once (no polling needed)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should execute query and wait for result', async () => {
      const mockJob: Job = {
        id: 'job-123',
        status: 1, // pending
        updated_at: Date.now(),
      };

      const mockJobSuccess: Job = {
        id: 'job-123',
        status: 3,
        query_result_id: 'result-456',
        updated_at: Date.now(),
      };

      const mockResult: QueryResult = {
        id: 'result-456',
        query_hash: 'hash',
        query: 'SELECT * FROM users',
        data: {
          columns: [{ name: 'id', friendly_name: 'ID', type: 'integer' }],
          rows: [{ id: 1 }, { id: 2 }],
        },
        data_source_id: 1,
        runtime: 0.5,
        retrieved_at: new Date().toISOString(),
      };

      // First call: executeQuery
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ job: mockJob }),
      });

      // Second call: getJob (success)
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ job: mockJobSuccess }),
      });

      // Third call: getQueryResult
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ query_result: mockResult }),
      });

      const result = await client.executeQueryAndWait({
        query: 'SELECT * FROM users',
        data_source_id: 1,
      });

      expect(result).toEqual(mockResult);
      expect(result.data.rows).toHaveLength(2);
    });

    it('should throw error when response has neither job nor query_result', async () => {
      // Invalid response with neither job nor query_result
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await expect(
        client.executeQueryAndWait({
          query: 'SELECT * FROM users',
          data_source_id: 1,
        })
      ).rejects.toThrow('Invalid response: neither job nor query_result found');
    });

    it('should throw error when job fails', async () => {
      const mockJob: Job = {
        id: 'job-fail',
        status: 1,
        updated_at: Date.now(),
      };

      const mockJobFail: Job = {
        id: 'job-fail',
        status: 4, // failure
        error: 'Query timeout',
        updated_at: Date.now(),
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ job: mockJob }),
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ job: mockJobFail }),
      });

      await expect(
        client.executeQueryAndWait({
          query: 'SELECT * FROM invalid_table',
          data_source_id: 1,
        })
      ).rejects.toThrow('Query timeout');
    });

    it('should poll pending jobs before returning the result', async () => {
      const pendingJob: Job = { id: 'job-pending', status: 1, updated_at: Date.now() };
      const successfulJob: Job = {
        id: 'job-pending',
        status: 3,
        query_result_id: 'result-pending',
        updated_at: Date.now(),
      };
      const mockResult = { id: 'result-pending' } as QueryResult;

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ job: pendingJob }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ job: pendingJob }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ job: successfulJob }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ query_result: mockResult }) });

      await expect(
        client.executeQueryAndWait({ query: 'SELECT 1', data_source_id: 1 }, 0)
      ).resolves.toBe(mockResult);
    });

    it('should reject successful jobs without a result ID', async () => {
      const pendingJob: Job = { id: 'job-empty', status: 1, updated_at: Date.now() };
      const invalidSuccess: Job = { id: 'job-empty', status: 3, updated_at: Date.now() };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ job: pendingJob }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ job: invalidSuccess }) });

      await expect(
        client.executeQueryAndWait({ query: 'SELECT 1', data_source_id: 1 })
      ).rejects.toThrow('Query completed but no result ID found');
    });
  });

  describe('listQueries', () => {
    it('should fetch list of queries', async () => {
      const mockQueries: Query[] = [
        {
          id: 1,
          name: 'Test Query 1',
          query: 'SELECT 1',
          data_source_id: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          is_archived: false,
          is_draft: false,
          user: { id: 1, name: 'Test', email: 'test@example.com' },
        },
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: mockQueries }),
      });

      const result = await client.listQueries();

      expect(result).toEqual(mockQueries);
    });
  });

  describe('getQuery', () => {
    it('should fetch specific query', async () => {
      const mockQuery: Query = {
        id: 1,
        name: 'Test Query',
        query: 'SELECT * FROM users',
        data_source_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        is_archived: false,
        is_draft: false,
        user: { id: 1, name: 'Test', email: 'test@example.com' },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuery,
      });

      const result = await client.getQuery(1);

      expect(result).toEqual(mockQuery);
    });
  });
});
