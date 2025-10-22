import Koa from "koa";
import bodyParser from "koa-bodyparser";
import OpenAI from "openai";
import { ChatCompletionMessageFunctionToolCall, ChatCompletionMessageParam, ChatCompletionToolMessageParam } from "openai/resources/index";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// OneAPI 配置
const openai = new OpenAI({
  apiKey:
    process.env.API_KEY || "a7ea3e353daa45b8ab08e1156ff2bf36.GbtY1H38PVKiCxp9",
  baseURL: process.env.BASE_URL || "https://open.bigmodel.cn/api/paas/v4",
});

class Chat {
  public mcpClient: Client;
  constructor() {
    this.mcpClient = new Client({
      name: "test-client",
      version: "1.0.0",
    });
  }

    async chat(param: { message: ChatCompletionMessageParam | ChatCompletionMessageParam[]; step?: number }) {
    const { message } = param;
    const step = param.step ?? 0;
    if (!message) {
      throw new Error("params invalid");
    }
    if (step && step > 10) {
      throw new Error("Recursive too deep exception");
    }

    const chatCompletionMessage: ChatCompletionMessageParam[] = [];
    if (step === 0) {
      chatCompletionMessage.push({
        role: "system",
        content: `你是一个 pingcode 工作助手。
                    1.  你的主要任务是帮助用户查询一些pingcode系统的数据。
                    2.  等等
                `,
      });
    }
    if (!Array.isArray(message)) {
      chatCompletionMessage.push(message);
    } else {
      chatCompletionMessage.push(...message);
    }

    // mcp列表
    const tools = await this.mcpClient.listTools();
    const completion = await openai.chat.completions.create({
      model: "glm-4.5-flash",
      messages: chatCompletionMessage,
      temperature: 0.5,
      max_tokens: 1024,
      tools: tools.tools.map((item) => ({
        type: "function",
        function: {
          name: item.name,
          description: item.description,
          parameters: item.inputSchema,
        },
      })),
            tool_choice: "auto"
    });

    switch (completion.choices[0].finish_reason) {
      case "tool_calls": {
                for (const toolCall of completion.choices[0].message.tool_calls as ChatCompletionMessageFunctionToolCall[]) {
          const mcpResult = await this.mcpClient.callTool({
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments),
          });
          const toolMessage: ChatCompletionToolMessageParam = {
            tool_call_id: toolCall.id,
            role: 'tool',
            content: JSON.stringify(mcpResult),
          };
          chatCompletionMessage.push(toolMessage);
          return await this.chat({ message: chatCompletionMessage, step: step + 1 });
        }
        break;
      }
      case "stop": {
        return completion.choices[0].message.content;
      }
      default: {
        return completion.choices[0].message.content;
      }
    }
  }

  resolveCommandMsg(message: string) {
    let q: string;
    switch (message) {
      case "work-summary":
        q =
          "分析一下我负责的工作项，哪些完成了，哪些没完成。要求精简一下回复，不说具体工作项，给个综述，和进度提醒";
        break;
      case "morning":
        q = "新的一天工作开始，问候一下小主子";
        break;
      default:
        q = message;
    }
    return q;
  }
}

async function main() {
  const chat = new Chat();
  await chat.mcpClient.connect(
    new StdioClientTransport({
      command: "node",
      args: ["./built/gaea/index.js"],
    })
  );
  const app = new Koa();
  app.use(bodyParser());
  app.use(async (ctx) => {
    if (ctx.method === "POST" && ctx.path === "/api/chat") {
      const { message } = ctx.request.body;
      if (!message) {
        ctx.status = 400;
        ctx.body = { error: "Missing message" };
        return;
      }
      const reply = await chat.chat({ message: { role: "user", content: chat.resolveCommandMsg(message) } });
      ctx.body = { response: reply };
    }
  });

  const PORT = process.env.PORT || 12121;
  app.listen(PORT, () => {
    console.log(`集成 MCP 对话 API 运行在 http://localhost:${PORT}`);
  });
}

main();