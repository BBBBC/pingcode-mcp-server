import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PingCodeClient } from '../../clients/pingcode.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from "zod";
import { Toolset } from 'src/toolset.js';

export class ToolsetProjectWorkitem implements Toolset {

    public register(server: McpServer): void {
        server.tool(
            "pingcode_get_workitems",
            "当需要获取工作项列表，或工作项详细信息的时候，调用此工具。",
            {
                identifier: z.string({
                  description: "工作项编号，以井号开头，例如用户输入#TINFR-1234，则编号为TINFR-1234"
                }).optional(),
                project_ids: z.string({
                  description: "项目的id，使用','分割，最多只能20个"
                }).optional(),
                type_ids: z.string({
                  description: "工作项类型的id，使用','分割，最多只能20个"
                }).optional(),
                state_ids: z.string({
                  description: "工作项状态的id，使用','分割，最多只能20个"
                }).optional(),
                assignee_ids: z.string({
                  description: "工作项负责人的id，使用','分割，最多只能20个"
                }).optional(),
            },
            async args => {
                return handleSearchWorkItems(args);
            }
        );
    }
}

export async function handleSearchWorkItems(args): Promise<CallToolResult> {
  try {
    const client = new PingCodeClient();
    const workItems = await client.searchWorkItems({
        identifier: args.identifier,
        project_ids: args.project_ids,
        type_ids: args.type_ids,
        state_ids: args.state_ids,
        assignee_ids: args.assignee_ids
    });

    return {
      content: [
        {
            type: 'text',
            text: `找到 ${workItems.length} 个工作项:\n\n${workItems.map(item => 
                `• ${item.identifier}: ${item.title} (${item.state?.name}) - 负责人: ${item.assignee?.name || '未指派'}`
            ).join('\n')}`
        }
      ],
    };
  } catch (error) {
    return {
      content: [
        {
            type: 'text',
            text: `搜索工作项时出错: ${error instanceof Error ? error.message : '未知错误'}`
        }
      ],
      isError: true,
    };
  }
}
