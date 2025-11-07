/**
 * Data Source Tools
 */

import type { RedashClient } from '../redash-client';
import type { CallToolResult, TextContent } from '@modelcontextprotocol/sdk/types.js';

export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
  handler: (args: Record<string, unknown>, client: RedashClient) => Promise<CallToolResult>;
}

/**
 * List all data sources
 */
export const listDataSourcesTool: Tool = {
  name: 'list_data_sources',
  description: 'List all available data sources in Redash',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
  handler: async (_args, client) => {
    try {
      const dataSources = await client.listDataSources();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(dataSources, null, 2),
          } as TextContent,
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error listing data sources: ${error instanceof Error ? error.message : String(error)}`,
          } as TextContent,
        ],
        isError: true,
      };
    }
  },
};

/**
 * Get specific data source
 */
export const getDataSourceTool: Tool = {
  name: 'get_data_source',
  description: 'Get details about a specific data source',
  inputSchema: {
    type: 'object',
    properties: {
      data_source_id: {
        type: 'number',
        description: 'The ID of the data source',
        minimum: 1,
      },
    },
    required: ['data_source_id'],
    additionalProperties: false,
  },
  handler: async (args, client) => {
    try {
      const dataSourceId = args.data_source_id;

      if (typeof dataSourceId !== 'number') {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: data_source_id is required and must be a number',
            } as TextContent,
          ],
          isError: true,
        };
      }

      const dataSource = await client.getDataSource(dataSourceId);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(dataSource, null, 2),
          } as TextContent,
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error getting data source: ${error instanceof Error ? error.message : String(error)}`,
          } as TextContent,
        ],
        isError: true,
      };
    }
  },
};
