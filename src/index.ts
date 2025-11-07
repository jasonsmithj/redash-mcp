/**
 * Redash MCP Server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  TextContent,
} from '@modelcontextprotocol/sdk/types.js';
import { RedashClient } from './redash-client.js';
import { listDataSourcesTool, getDataSourceTool } from './tools/datasource.js';
import { executeQueryAndWaitTool, listQueriesTool } from './tools/query.js';

/**
 * MCP Server instance
 */
const server = new Server(
  {
    name: 'redash-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Initialize Redash client
 */
let redashClient: RedashClient;

try {
  redashClient = RedashClient.fromEnv();
} catch (error) {
  console.error('Failed to initialize Redash client:', error);
  process.exit(1);
}

/**
 * Register tools
 */
const tools = [listDataSourcesTool, getDataSourceTool, executeQueryAndWaitTool, listQueriesTool];

/**
 * Handle list_tools request
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

/**
 * Handle call_tool request
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools.find((t) => t.name === request.params.name);

  if (!tool) {
    return {
      content: [
        {
          type: 'text',
          text: `Unknown tool: ${request.params.name}`,
        } as TextContent,
      ],
      isError: true,
    };
  }

  try {
    const result = await tool.handler(request.params.arguments ?? {}, redashClient);
    return result;
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool: ${error instanceof Error ? error.message : String(error)}`,
        } as TextContent,
      ],
      isError: true,
    };
  }
});

/**
 * Start server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Redash MCP server started');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
