import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function test() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['./built/gaea/index.js'],
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0',
  });

  await client.connect(transport);

  // 测试工具列表
  const tools = await client.listTools();
  console.log('可用工具:', tools);

  // 测试搜索工作项
  const result = await client.callTool({
    name: 'pingcode_get_workitems',
    arguments: {
      identifier: 'GXH2002-2'
    }
  });
  console.log('搜索结果:', result);

  await client.close();
}

test();