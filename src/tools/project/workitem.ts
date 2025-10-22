import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PingCodeClientFactory } from '../../clients/pingcode.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from "zod";
import { Toolset } from 'src/toolset.js';

export class ToolsetProjectWorkitem implements Toolset {

    public register(server: McpServer): void {
        server.tool(
            "pingcode_get_workitems",
            "当需要获取工作项列表，或工作项详细信息的时候，调用此工具。此工具返回工作项的编号、类型、标题、状态、状态类型、负责人、完成时间等信息",
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
                start_between: z.string({
                  description: "开始时间介于的时间范围，通过','分割起始时间。比如1580000000,1590000000表示开始时间介于两个时间之间；,1590000000表示开始时间小于该时间；1580000000表示开始时间大于该时间。"
                }).optional(),
                end_between: z.string({
                  description: "结束时间介于的时间范围，通过','分割起始时间。比如1580000000,1590000000表示开始时间介于两个时间之间；,1590000000表示开始时间小于该时间；1580000000表示开始时间大于该时间。"
                }).optional(),
            },
            async args => {
                return handleSearchWorkItems(args);
            }
        );

        server.tool(
          "pingcode_get_workitem_states",
          "当需要获取工作项状态信息或者状态列表的时候，调用此工具。",
          {
              project_id: z.string({
                description: "项目的id",
                required_error: "项目id是必须的参数"
              }),
              work_item_type_id: z.string({
                description: "工作项类型的id",
                required_error: "工作项类型id是必须的参数"
              }),
          },
          async args => {
              return handleSearchWorkItemStates(args);
          }
        );

        server.tool(
          "pingcode_get_workitem_types",
          "当需要获取工作项类型信息或者类型列表的时候，调用此工具。",
          {
              project_id: z.string({
                description: "项目的id",
                required_error: "项目id是必须的参数"
              }),
          },
          async args => {
              return handleSearchWorkItemTypes(args);
          }
        );
    }
}

async function handleSearchWorkItems(args): Promise<CallToolResult> {
  try {
    const client = PingCodeClientFactory.pingcodeClient;
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
                `• ${item.identifier}[${item.type}]: ${item.title} 状态: ${item.state?.name}(状态类型: ${item.state?.type}) 完成时间: ${item.completed_at ?? "未完成"}  - 负责人: ${item.assignee?.name || '未指派'}`
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

async function handleSearchWorkItemStates(args): Promise<CallToolResult> {
  try {
    const client = PingCodeClientFactory.pingcodeClient;
    const states = await client.searchWorkItemStates({
      project_id: args.project_id,
      work_item_type_id: args.work_item_type_id
    });

    return {
      content: [
        {
            type: 'text',
            text: `找到 ${states.length} 个状态:\n\n${states.map(item => 
                `• ${item._id}: ${item.name} (${item.type})`
            ).join('\n')}`
        }
      ],
    };
  } catch (error) {
    return {
      content: [
        {
            type: 'text',
            text: `搜索工作项状态时出错: ${error instanceof Error ? error.message : '未知错误'}`
        }
      ],
      isError: true,
    };
  }
}

async function handleSearchWorkItemTypes(args): Promise<CallToolResult> {
  try {
    const client = PingCodeClientFactory.pingcodeClient;
    const types = await client.searchWorkItemTypes({
      project_id: args.project_id
    });

    return {
      content: [
        {
            type: 'text',
            text: `找到 ${types.length} 个类型:\n\n${types.map(item => 
                `• ${item._id}: ${item.name} (${item.group})`
            ).join('\n')}`
        }
      ],
    };
  } catch (error) {
    return {
      content: [
        {
            type: 'text',
            text: `搜索工作项类型时出错: ${error instanceof Error ? error.message : '未知错误'}`
        }
      ],
      isError: true,
    };
  }
}
