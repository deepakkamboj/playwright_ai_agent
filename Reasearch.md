# 📌 Step-by-Step Guidelines

---

## 1. **Requirements**

First, ensure:

| Requirement           | Details                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Node.js               | v18+ recommended                                                                                                        |
| TypeScript            | Latest (5.x is fine)                                                                                                    |
| langchain package     | Install with npm install langchain                                                                                      |
| LLM SDKs (optional)   | Install what you need: Anthropic: npm install @anthropic-ai/sdkGroq: npm install groq-sdkMistral: npm install mistralai |
| Environment variables | API keys for OpenAI / Anthropic / Groq / Mistral                                                                        |

Example `package.json` dependencies:

```json
"dependencies": {
  "langchain": "^0.2.0",
  "@anthropic-ai/sdk": "^0.6.0",
  "groq-sdk": "^1.0.0",
  "mistralai": "^0.2.3"
}
```

---

## 2. **Setting up your project**

```bash
`mkdir langchain-agents cd langchain-agents
npm init -y
npm install langchain @anthropic-ai/sdk groq-sdk mistralai
tsc --init`
```

Create `.env`:

```bash
`OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GROQ_API_KEY=your-groq-api-key
MISTRAL_API_KEY=your-mistral-api-key`
```

---

## 3. **Common Setup: Loading LLMs**

✅ Load models easily based on what you want:

```typescript
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ChatAnthropic } from "langchain/chat_models/anthropic";
import { ChatGroq } from "langchain/chat_models/groq";
import { ChatMistralAI } from "langchain/chat_models/mistral";

const openaiModel = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0,
});

const anthropicModel = new ChatAnthropic({
  modelName: "claude-3-opus-20240229",
  temperature: 0,
});

const groqModel = new ChatGroq({
  modelName: "llama3-70b-8192",
  temperature: 0,
});

const mistralModel = new ChatMistralAI({
  modelName: "mistral-small",
  temperature: 0,
});
```

---

# 📋 Agents Setup (One-by-One)

---

## 1. `AgentExecutor`

- **Purpose**: Base executor for any agent + tools combo.

```typescript
import { AgentExecutor } from "langchain/agents";

const executor = AgentExecutor.fromAgentAndTools({
  agent: myAgent, // your agent (see below)
  tools: myTools, // your tools (functions/APIs)
});
const result = await executor.invoke({ input: "your prompt" });
```

---

## 2. `createOpenAIFunctionsAgent`

- **Purpose**: Uses OpenAI function-calling natively.

```typescript
import { createOpenAIFunctionsAgent } from "langchain/agents";
import { ChatOpenAI } from "langchain/chat_models/openai";

const agent = await createOpenAIFunctionsAgent({
  llm: openaiModel,
  tools: myTools,
});
```

- 🛑 **Only works with OpenAI models that support function-calling** (e.g., `gpt-4o`, `gpt-4-1106-preview`).

---

## 3. `createReactAgent`

- **Purpose**: Reason and Act (ReAct) framework (older style)

```typescript
import { createReactAgent } from "langchain/agents";

const agent = await createReactAgent({
  llm: openaiModel,
  tools: myTools,
});
```

- ⚠️ Old-school style. No special function-calling.

---

## 4. `createToolCallingAgent`

- **Purpose**: Generic tool-calling agent
- **Best for**: Groq, Anthropic, Mistral

```typescript
import { createToolCallingAgent } from "langchain/agents";

const agent = await createToolCallingAgent({
  llm: anthropicModel, // works with Anthropic, Groq, Mistral
  tools: myTools,
});
```

- 🏆 **Newer**; supports OpenAI tool calling, Anthropic tool use, etc.

---

## 5. `createOpenAIToolsAgent`

- **Purpose**: **OpenAI-specific** tool agent

```typescript
import { createOpenAIToolsAgent } from "langchain/agents";

const agent = await createOpenAIToolsAgent({
  llm: openaiModel,
  tools: myTools,
});
```

- ✅ Works only with OpenAI tool-calling models.

---

## 6. `createStructuredChatAgent`

- **Purpose**: Structured input-output chat

```typescript
import { createStructuredChatAgent } from "langchain/agents";

const agent = await createStructuredChatAgent({
  llm: openaiModel, // or any LLM
  tools: myTools,
});
```

- ➡️ Allows tightly controlled structured conversation.

---

## 7. `createZeroShotAgent`

- **Purpose**: Zero-shot reasoning (cheapest, simplest)

```typescript
import { createStructuredChatAgent } from "langchain/agents";

const agent = await createStructuredChatAgent({
  llm: openaiModel, // or any LLM
  tools: myTools,
});
```

- ✅ Works with any model.

---

## 8. `createChatAgent`

- **Purpose**: General chat-based agent

```typescript
import { createChatAgent } from "langchain/agents";

const agent = await createChatAgent({
  llm: openaiModel,
  tools: myTools,
});
```

- 🧠 Compatible with any chat model.

---

## 9. `createChatOpenAIFunctionsAgent`

- **Purpose**: OpenAI function calling (chat-based)

```typescript
import { createChatOpenAIFunctionsAgent } from "langchain/agents";

const agent = await createChatOpenAIFunctionsAgent({
  llm: openaiModel,
  tools: myTools,
});
```

- ✅ Only OpenAI with function-calling.

---

# 🏆 Comparison Table

| Agent Name                     | Best for Models                  | Function/Tools Support   | Type            | Notes                        |
| ------------------------------ | -------------------------------- | ------------------------ | --------------- | ---------------------------- |
| AgentExecutor                  | All                              | Any tools                | Wrapper         | Base class                   |
| createOpenAIFunctionsAgent     | OpenAI                           | Functions (OpenAI style) | Specialized     | Needs function-calling model |
| createReactAgent               | Any                              | No structured tools      | Reasoning       | Older method                 |
| createToolCallingAgent         | OpenAI, Anthropic, Groq, Mistral | Tools                    | Flexible        | Best for non-OpenAI          |
| createOpenAIToolsAgent         | OpenAI                           | Tools (OpenAI spec)      | Specialized     | Only for OpenAI              |
| createStructuredChatAgent      | All                              | Structured input-output  | Structured Chat | &nbsp;                       |
| createZeroShotAgent            | All                              | Basic tools              | Simple          | Zero-shot learning           |
| createChatAgent                | All                              | Chat+Tools               | Flexible        | Good default                 |
| createChatOpenAIFunctionsAgent | OpenAI                           | Function Calling         | Specialized     | Chat-based OpenAI functions  |

---

# ⚡ Final Notes

| Model                          | Best Agent Type                                             |
| ------------------------------ | ----------------------------------------------------------- |
| OpenAI (GPT-4o, GPT-4)         | createOpenAIFunctionsAgent / createChatOpenAIFunctionsAgent |
| Anthropic (Claude 3)           | createToolCallingAgent                                      |
| Groq (Llama3-70b)              | createToolCallingAgent                                      |
| Mistral (Mistral-Small, Large) | createToolCallingAgent                                      |
| Any LLM (generic)              | createChatAgent / createZeroShotAgent                       |

---

# ✅ Example Full Flow

```typescript
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatAnthropic } from "langchain/chat_models/anthropic";
import { Calculator } from "langchain/tools/calculator"; // Example tool

const model = new ChatAnthropic({ modelName: "claude-3-opus-20240229" });
const tools = [new Calculator()];

async function main() {
  const agent = await createToolCallingAgent({ llm: model, tools });
  const executor = AgentExecutor.fromAgentAndTools({ agent, tools });

  const result = await executor.invoke({ input: "What's 25 * 17?" });
  console.log(result);
}

main();
```

# 1. Adding Chat History (Memory)

- In LangChain, you use a **memory** object to keep **chat history**.
- `BufferMemory` is most common.

```typescript
import { BufferMemory } from "langchain/memory";

const memory = new BufferMemory({
  memoryKey: "chat_history",
  returnMessages: true, // Important: returns messages not plain strings
});
```

When creating `AgentExecutor`:

```typescript
const executor = AgentExecutor.fromAgentAndTools({
  agent,
  tools,
  memory,
});
```

✅ Now the agent will "remember" past interactions.

---

# 📘 2. Using Prompt Template from `prompt.ts`

- LangChain supports **prompt templates**.

Example `prompt.ts`:

```typescript
import { PromptTemplate } from "langchain/prompts";

export const customPrompt = PromptTemplate.fromTemplate(`
You are an assistant. You have access to the following tools:

{tools}

When needed, call them appropriately.
User input: {input}
`);
```

In your main agent:

```typescript
import { customPrompt } from "./prompt";

const agent = await createToolCallingAgent({
  llm: model,
  tools,
  prompt: customPrompt,
});
```

🔵 **NOTE**: Some agents auto-generate prompts. Some allow custom prompts.  
We'll mention which ones later.

---

# 📘 3. Do We Need to Mention Tool Names in Prompt?

- **Depends on Agent Type!**
- Here's the rule:

| Agent Type                     | Tool Names Mentioned in Prompt? | Why?                                                              |
| ------------------------------ | ------------------------------- | ----------------------------------------------------------------- |
| createOpenAIFunctionsAgent     | ❌ No                           | OpenAI models are given tool definitions automatically            |
| createChatOpenAIFunctionsAgent | ❌ No                           | Same as above                                                     |
| createOpenAIToolsAgent         | ❌ No                           | Same                                                              |
| createToolCallingAgent         | ✅ Yes (if custom prompt)       | You have to tell Anthropic, Groq, Mistral what tools they can use |
| createReactAgent               | ✅ Yes                          | Classic ReAct agents need to be told tool names                   |
| createStructuredChatAgent      | ✅ Yes                          | Needs structured tool instructions                                |
| createZeroShotAgent            | ✅ Yes                          | You must tell what tools available                                |
| createChatAgent                | ✅ Yes                          | Default, unless prompt is system-handled                          |
| AgentExecutor                  | Depends on agent                | Agent-specific                                                    |

🔔 **Summary**:

- OpenAI **function-calling agents** — tools embedded automatically.
- **Everything else** — you must **manually describe tools** in the prompt.

---

# 📘 4. Best Agent for Running Playwright Tests (Browser Automation)

- To **invoke browsers**, you will write a **custom Playwright Tool** (like a `TestRunnerTool`).
- **Requirements for agent**:

  - Tool-calling ability
  - Dynamic action generation
  - Robust memory (optional)

**Best agents for Playwright browser running:**

| Priority | Agent Type             | Why?                                                   |
| -------- | ---------------------- | ------------------------------------------------------ |
| 🥇 1     | createToolCallingAgent | Best: Flexible for Playwright, supports external tools |
| 🥈 2     | createChatAgent        | Good fallback, lightweight                             |
| 🥉 3     | createZeroShotAgent    | Simple, but manual tool description needed             |

- ❌ Avoid OpenAI function-calling agents if you need extreme flexibility or are using Anthropic, Groq, Mistral.

---

# 📊 Updated Comparison Table (Expanded)

| Agent Name                     | Best for Models                  | Chat History (Memory)? | Custom Prompt?   | Mention Tools in Prompt? | Best for Playwright? | Notes                                |
| ------------------------------ | -------------------------------- | ---------------------- | ---------------- | ------------------------ | -------------------- | ------------------------------------ |
| AgentExecutor                  | All                              | ✅                     | ✅               | Depends on agent         | ✅                   | Base wrapper                         |
| createOpenAIFunctionsAgent     | OpenAI                           | ✅                     | ❌ (auto prompt) | ❌                       | ❌                   | Best for OpenAI auto-tools           |
| createChatOpenAIFunctionsAgent | OpenAI                           | ✅                     | ❌ (auto prompt) | ❌                       | ❌                   | Same                                 |
| createOpenAIToolsAgent         | OpenAI                           | ✅                     | ❌               | ❌                       | ❌                   | Same                                 |
| createToolCallingAgent         | Anthropic, Groq, Mistral, OpenAI | ✅                     | ✅               | ✅                       | ✅                   | Best for custom tools (like browser) |
| createReactAgent               | All                              | ✅                     | ✅               | ✅                       | ⚠️ (okay)            | Old-school ReAct                     |
| createStructuredChatAgent      | All                              | ✅                     | ✅               | ✅                       | ⚠️ (okay)            | Best when strict I/O needed          |
| createZeroShotAgent            | All                              | ✅                     | ✅               | ✅                       | ✅                   | Simple zero-shot                     |
| createChatAgent                | All                              | ✅                     | ✅               | ✅                       | ✅                   | Flexible chat agent                  |

---

# ✅ Final Flow Example for Playwright Tests

```typescript
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { ChatAnthropic } from "langchain/chat_models/anthropic";
import { BufferMemory } from "langchain/memory";
import { playwrightTestTool } from "./tools/playwrightTool"; // your custom tool
import { customPrompt } from "./prompt";

const model = new ChatAnthropic({ modelName: "claude-3-opus-20240229" });

async function main() {
  const agent = await createToolCallingAgent({
    llm: model,
    tools: [playwrightTestTool],
    prompt: customPrompt,
  });

  const executor = AgentExecutor.fromAgentAndTools({
    agent,
    tools: [playwrightTestTool],
    memory: new BufferMemory({
      memoryKey: "chat_history",
      returnMessages: true,
    }),
  });

  const result = await executor.invoke({
    input: "Launch browser and navigate to google.com",
  });
  console.log(result);
}

main();
```

---

# 🧠 Summary:

| ✅                        | Notes                                            |
| ------------------------- | ------------------------------------------------ |
| Memory                    | Always add BufferMemory to AgentExecutor         |
| Prompt Templates          | Keep templates in prompt.ts for reuse            |
| Tools Mentioned in Prompt | Only if NOT using OpenAI function-calling agents |
| Playwright Tests          | Best with createToolCallingAgent                 |
| OpenAI Agents             | Easy but restrictive (fixed structure)           |

---

# 🚀 Next steps

Would you also like me to:

- 📄 Create sample `prompt.ts` file for Playwright tool-based agent
- 🛠️ Show example how to write a **Playwright tool** in LangChain
- ⚡ Create a **boilerplate repo structure** you can directly clone and start?
