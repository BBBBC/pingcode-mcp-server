import Koa from "koa";
import bodyParser from "koa-bodyparser";
import OpenAI from "openai";
import { ChatCompletionMessageFunctionToolCall } from "openai/resources/index";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const app = new Koa();
app.use(bodyParser());

// OneAPI 配置
const openai = new OpenAI({
  apiKey:
    process.env.API_KEY || "a7ea3e353daa45b8ab08e1156ff2bf36.GbtY1H38PVKiCxp9",
  baseURL: process.env.BASE_URL || "https://open.bigmodel.cn/api/paas/v4",
});

// 增强对话 API：LLM + MCP
app.use(async (ctx) => {
  if (ctx.method === "POST" && ctx.path === "/api/chat") {
    const { message } = ctx.request.body;
    if (!message) {
      ctx.status = 400;
      ctx.body = { error: "Missing message" };
      return;
    }

    try {
      const client = new Client({
        name: "test-client",
        version: "1.0.0",
      });

      await client.connect(
        new StdioClientTransport({
          command: "node",
          args: ["./built/gaea/index.js"],
        })
      );

      // mcp列表
      const tools = await client.listTools();

      const completion = await openai.chat.completions.create({
        model: "glm-4.5-flash",
        messages: [{ role: "user", content: message }],
        temperature: 0.5,
        max_tokens: 1024,
        tools: tools.tools.map((item) => ({
          type: "function",
          function: item as any,
        })),
      });

      let reply = completion.choices[0].message.content || "";

      // 如果 LLM 返回工具调用，执行 MCP
      if (completion.choices[0].message.tool_calls) {
        const toolCall = completion.choices[0].message
          .tool_calls[0] as ChatCompletionMessageFunctionToolCall;
        if (toolCall.function.name === "pingcode_get_workitems") {
          const mcpResult = await client.callTool({
            name: "pingcode_get_workitems",
            arguments: {},
          });
          reply += `\nMCP 处理结果: ${JSON.stringify(mcpResult)}`;
        }
      }

      ctx.body = { response: reply };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  } else {
    ctx.status = 404;
    ctx.body = { error: "Not Found" };
  }
});

const PORT = process.env.PORT || 12121;
app.listen(PORT, () => {
  console.log(`集成 MCP 对话 API 运行在 http://localhost:${PORT}`);
});
