/**
 * Query Tools
 */

import type { Tool } from './datasource';
import type { TextContent } from '@modelcontextprotocol/sdk/types.js';

/**
 * Execute query and wait for result
 */
export const executeQueryAndWaitTool: Tool = {
  name: 'execute_query_and_wait',
  description: 'Execute a SQL query and wait for the result',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The SQL query to execute',
        minLength: 1,
      },
      data_source_id: {
        type: 'number',
        description: 'The ID of the data source to query',
        minimum: 1,
      },
      max_age: {
        type: 'number',
        description: 'Maximum age of cached results in seconds',
        minimum: 0,
      },
    },
    required: ['query', 'data_source_id'],
    additionalProperties: false,
  },
  handler: async (args, client) => {
    try {
      const { query, data_source_id, max_age } = args;

      if (typeof query !== 'string') {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: query is required and must be a string',
            } as TextContent,
          ],
          isError: true,
        };
      }

      if (typeof data_source_id !== 'number') {
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

      const request = {
        query,
        data_source_id,
        ...(typeof max_age === 'number' ? { max_age } : {}),
      };

      const result = await client.executeQueryAndWait(request);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          } as TextContent,
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error executing query: ${error instanceof Error ? error.message : String(error)}`,
          } as TextContent,
        ],
        isError: true,
      };
    }
  },
};

/**
 * List queries
 */
export const listQueriesTool: Tool = {
  name: 'list_queries',
  description: 'List all queries in Redash',
  inputSchema: {
    type: 'object',
    properties: {
      page: {
        type: 'number',
        description: 'Page number (default: 1)',
        minimum: 1,
      },
      page_size: {
        type: 'number',
        description: 'Number of results per page (default: 25)',
        minimum: 1,
        maximum: 100,
      },
    },
    additionalProperties: false,
  },
  handler: async (args, client) => {
    try {
      const page = typeof args.page === 'number' ? args.page : 1;
      const pageSize = typeof args.page_size === 'number' ? args.page_size : 25;

      const queries = await client.listQueries(page, pageSize);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(queries, null, 2),
          } as TextContent,
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error listing queries: ${error instanceof Error ? error.message : String(error)}`,
          } as TextContent,
        ],
        isError: true,
      };
    }
  },
};
