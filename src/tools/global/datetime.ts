import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import moment from 'moment-timezone';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Toolset } from 'src/toolset.js';

export class ToolsetDatetime implements Toolset {

    public register(server: McpServer): void {
        server.tool(
            "pingcode_get_datetime",
            "当需要获取时间信息时，调用此工具，此工具会返回当前时间",
            async args => {
                return handleSearchDatetime(args);
            }
        );
    }
}

async function handleSearchDatetime(args): Promise<CallToolResult> {
  try {
    const today = moment.tz("Asia/Shanghai").format("YYYY-MM-DD(dddd)");

    return {
      content: [
        {
            type: 'text',
            text: `当前日期是：${today}`
        }
      ],
    };
  } catch (error) {
    return {
      content: [
        {
            type: 'text',
            text: `获取当前时间出错: ${error instanceof Error ? error.message : '未知错误'}`
        }
      ],
      isError: true,
    };
  }
}
