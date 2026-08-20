import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executeQueryAndWaitTool, listQueriesTool } from '../../src/tools/query';
import { RedashClient } from '../../src/redash-client';
import type { QueryResult, Query } from '../../src/types';

vi.mock('../../src/redash-client');

describe('Query Tools', () => {
  let mockClient: RedashClient;

  beforeEach(() => {
    mockClient = new RedashClient({
      apiKey: 'test-key',
      baseUrl: 'https://test.redash.example.com',
    });
  });

  describe('executeQueryAndWaitTool', () => {
    it('should have correct tool definition', () => {
      expect(executeQueryAndWaitTool.name).toBe('execute_query_and_wait');
      expect(executeQueryAndWaitTool.description).toBeDefined();
      expect(executeQueryAndWaitTool.inputSchema).toBeDefined();
      expect(executeQueryAndWaitTool.inputSchema.required).toContain('query');
      expect(executeQueryAndWaitTool.inputSchema.required).toContain('data_source_id');
    });

    it('should execute query and return results', async () => {
      const mockResult: QueryResult = {
        id: 'result-123',
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

      vi.spyOn(mockClient, 'executeQueryAndWait').mockResolvedValue(mockResult);

      const result = await executeQueryAndWaitTool.handler(
        {
          query: 'SELECT * FROM users',
          data_source_id: 1,
        },
        mockClient
      );

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockResult, null, 2),
          },
        ],
      });
      expect(mockClient.executeQueryAndWait).toHaveBeenCalledWith({
        query: 'SELECT * FROM users',
        data_source_id: 1,
      });
    });

    it('should support max_age parameter', async () => {
      const mockResult: QueryResult = {
        id: 'result-456',
        query_hash: 'hash',
        query: 'SELECT COUNT(*) FROM users',
        data: {
          columns: [{ name: 'count', friendly_name: 'Count', type: 'integer' }],
          rows: [{ count: 100 }],
        },
        data_source_id: 1,
        runtime: 0.1,
        retrieved_at: new Date().toISOString(),
      };

      vi.spyOn(mockClient, 'executeQueryAndWait').mockResolvedValue(mockResult);

      await executeQueryAndWaitTool.handler(
        {
          query: 'SELECT COUNT(*) FROM users',
          data_source_id: 1,
          max_age: 3600,
        },
        mockClient
      );

      expect(mockClient.executeQueryAndWait).toHaveBeenCalledWith({
        query: 'SELECT COUNT(*) FROM users',
        data_source_id: 1,
        max_age: 3600,
      });
    });

    it('should validate required parameters', async () => {
      const result = await executeQueryAndWaitTool.handler({ query: 'SELECT 1' }, mockClient);

      expect(result.isError).toBe(true);
      expect(result.content[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('data_source_id is required'),
      });
    });

    it('should handle query execution errors', async () => {
      vi.spyOn(mockClient, 'executeQueryAndWait').mockRejectedValue(new Error('Query timeout'));

      const result = await executeQueryAndWaitTool.handler(
        {
          query: 'SELECT * FROM invalid_table',
          data_source_id: 1,
        },
        mockClient
      );

      expect(result.isError).toBe(true);
      expect(result.content[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Query timeout'),
      });
    });
  });

  describe('listQueriesTool', () => {
    it('should have correct tool definition', () => {
      expect(listQueriesTool.name).toBe('list_queries');
      expect(listQueriesTool.description).toBeDefined();
      expect(listQueriesTool.inputSchema).toBeDefined();
    });

    it('should list queries', async () => {
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

      vi.spyOn(mockClient, 'listQueries').mockResolvedValue(mockQueries);

      const result = await listQueriesTool.handler({}, mockClient);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockQueries, null, 2),
          },
        ],
      });
      expect(mockClient.listQueries).toHaveBeenCalled();
    });

    it('should support pagination parameters', async () => {
      const mockQueries: Query[] = [];

      vi.spyOn(mockClient, 'listQueries').mockResolvedValue(mockQueries);

      await listQueriesTool.handler({ page: 2, page_size: 50 }, mockClient);

      expect(mockClient.listQueries).toHaveBeenCalledWith(2, 50);
    });

    it('should handle errors gracefully', async () => {
      vi.spyOn(mockClient, 'listQueries').mockRejectedValue(new Error('API error'));

      const result = await listQueriesTool.handler({}, mockClient);

      expect(result.isError).toBe(true);
      expect(result.content[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('API error'),
      });
    });
  });
});
