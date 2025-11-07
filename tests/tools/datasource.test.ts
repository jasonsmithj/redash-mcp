import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listDataSourcesTool, getDataSourceTool } from '../../src/tools/datasource';
import { RedashClient } from '../../src/redash-client';
import type { DataSource } from '../../src/types';

vi.mock('../../src/redash-client');

describe('DataSource Tools', () => {
  let mockClient: RedashClient;

  beforeEach(() => {
    mockClient = new RedashClient({
      apiKey: 'test-key',
      baseUrl: 'https://test.redash.example.com',
    });
  });

  describe('listDataSourcesTool', () => {
    it('should have correct tool definition', () => {
      expect(listDataSourcesTool.name).toBe('list_data_sources');
      expect(listDataSourcesTool.description).toBeDefined();
      expect(listDataSourcesTool.inputSchema).toBeDefined();
    });

    it('should list all data sources', async () => {
      const mockDataSources: DataSource[] = [
        { id: 1, name: 'PostgreSQL', type: 'pg' },
        { id: 2, name: 'MySQL', type: 'mysql' },
      ];

      vi.spyOn(mockClient, 'listDataSources').mockResolvedValue(mockDataSources);

      const result = await listDataSourcesTool.handler({}, mockClient);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockDataSources, null, 2),
          },
        ],
      });
      expect(mockClient.listDataSources).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      vi.spyOn(mockClient, 'listDataSources').mockRejectedValue(new Error('API error'));

      const result = await listDataSourcesTool.handler({}, mockClient);

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('API error');
    });
  });

  describe('getDataSourceTool', () => {
    it('should have correct tool definition', () => {
      expect(getDataSourceTool.name).toBe('get_data_source');
      expect(getDataSourceTool.description).toBeDefined();
      expect(getDataSourceTool.inputSchema).toBeDefined();
      expect(getDataSourceTool.inputSchema.required).toContain('data_source_id');
    });

    it('should get specific data source', async () => {
      const mockDataSource: DataSource = {
        id: 1,
        name: 'PostgreSQL',
        type: 'pg',
        syntax: 'sql',
      };

      vi.spyOn(mockClient, 'getDataSource').mockResolvedValue(mockDataSource);

      const result = await getDataSourceTool.handler({ data_source_id: 1 }, mockClient);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockDataSource, null, 2),
          },
        ],
      });
      expect(mockClient.getDataSource).toHaveBeenCalledWith(1);
    });

    it('should validate required parameters', async () => {
      const result = await getDataSourceTool.handler({}, mockClient);

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('data_source_id is required');
    });

    it('should handle errors gracefully', async () => {
      vi.spyOn(mockClient, 'getDataSource').mockRejectedValue(new Error('Not found'));

      const result = await getDataSourceTool.handler({ data_source_id: 999 }, mockClient);

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Not found');
    });
  });
});
