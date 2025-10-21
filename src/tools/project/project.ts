import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PingCodeClientFactory } from '../../clients/pingcode.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from "zod";
import { Toolset } from 'src/toolset.js';

export class ToolsetProject implements Toolset {

    public register(server: McpServer): void {
        server.tool(
            "pingcode_get_projects",
            "当需要获取项目信息或者项目列表的时候，调用此工具。",
            {
                identifier: z.string({
                    description: "项目编号，以井号开头，例如用户输入#TINFR，则编号为TINFR",
                }).optional(),
                type: z.string({
                    description: "项目的类型"
                }).optional()
            },
            async args => {
                return handleSearchProjects(args);
            }
        );
    }
}

async function handleSearchProjects(args): Promise<CallToolResult> {
  try {
    const client = PingCodeClientFactory.pingcodeClient;
    const projects = await client.searchProjects({
      identifier: args.identifier,
      type: args.type
    });

    return {
      content: [
        {
            type: 'text',
            text: `找到 ${projects.length} 个项目:\n\n${projects.map(item => 
                `• ${item.identifier}[${item.type}]: ${item.name} (${item.state?.name}) - 负责人: ${item.assignee?.name || '未指派'}`
            ).join('\n')}`
        }
      ],
    };
  } catch (error) {
    return {
      content: [
        {
            type: 'text',
            text: `搜索项目时出错: ${error instanceof Error ? error.message : '未知错误'}`
        }
      ],
      isError: true,
    };
  }
}
