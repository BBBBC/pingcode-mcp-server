import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PingCodeClientFactory } from '../../clients/pingcode.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Toolset } from 'src/toolset.js';

export class ToolsetPersonal implements Toolset {

    public register(server: McpServer): void {
        server.tool(
            "pingcode_get_myself",
            "当需要获取用户个人信息时，调用此工具。比如‘我’，此工具会返回用户的 userId、name",
            async args => {
                return handleSearchMyself(args);
            }
        );
    }
}

async function handleSearchMyself(args): Promise<CallToolResult> {
  try {
    const client = PingCodeClientFactory.pingcodeClient;
    const userInfo = await client.searchMyself();

    return {
      content: [
        {
            type: 'text',
            text: JSON.stringify(userInfo)
        }
      ],
    };
  } catch (error) {
    return {
      content: [
        {
            type: 'text',
            text: `搜索个人信息时出错: ${error instanceof Error ? error.message : '未知错误'}`
        }
      ],
      isError: true,
    };
  }
}
