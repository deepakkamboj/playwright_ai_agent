import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { BufferMemory } from "langchain/memory";
import {
  CallbackHandlerMethods,
  BaseCallbackHandler,
} from "@langchain/core/callbacks/base";
import { ChainValues } from "@langchain/core/utils/types";

import { ChatGroq } from "@langchain/groq";
import { logger } from "../utils/logger";

import {
  navigationTool,
  goBackTool,
  goForwardTool,
  refreshPageTool,
  closeBrowserTool,
  clickTool,
  typeTool,
  getTextTool,
  selectOptionTool,
  checkTool,
  uncheckTool,
  hoverTool,
  pressKeyTool,
  waitForElementTool,
} from "../tools/browser";
import {
  initialMessageSystemPrompt,
  performNextStepSystemPrompt,
} from "../prompts/prompt";
import { Serialized } from "@langchain/core/load/serializable";

// Custom callback handler to log tool calls
class ToolCallLogger
  extends BaseCallbackHandler
  implements CallbackHandlerMethods
{
  name = "ToolCallLogger";

  // Called when a tool starts executing
  async handleToolStart(
    tool: Serialized,
    input: string,
    runId: string,
    parentRunId?: string,
    tags?: string[],
    metadata?: Record<string, unknown>,
    runName?: string
  ): Promise<void> {
    logger.info(`🔧 TOOL_CALLED: ${tool.name}`, { input });
    console.log(`\x1b[36m🔧 TOOL CALLED: ${tool.name}\x1b[0m`);
  }

  // Called when a tool successfully completes
  async handleToolEnd(output: string): Promise<void> {
    logger.info(`✅ TOOL_COMPLETED`, { result: output });
    console.log(`\x1b[32m✅ TOOL COMPLETED\x1b[0m`);
  }

  // Called when a tool fails
  async handleToolError(error: Error): Promise<void> {
    logger.error(`❌ TOOL_FAILED`, error);
    console.log(`\x1b[31m❌ TOOL FAILED: ${error.message}\x1b[0m`);

    // Attempt to close the browser on tool failure
    try {
      console.log(
        `\x1b[33m⚠️ Attempting to close browser due to test failure\x1b[0m`
      );
      await closeBrowserTool.invoke("{}");
      logger.info("Browser closed due to test failure");
    } catch (closeError) {
      logger.error("Failed to close browser after test failure", closeError);
    }

    // Exit with error code for critical failures
    if (
      error.message.includes("critical") ||
      error.message.includes("timeout")
    ) {
      console.log(`\x1b[31m🛑 CRITICAL TEST FAILURE - EXITING PROCESS\x1b[0m`);
      process.exit(1);
    }
  }

  // Called when the chain (agent) starts
  async handleChainStart(): Promise<void> {
    logger.info(`🚀 TEST_STARTED`);
    console.log(`\x1b[34m🚀 TEST EXECUTION STARTED\x1b[0m`);
  }

  // Called when the chain (agent) ends
  async handleChainEnd(output: ChainValues): Promise<void> {
    const testResult = output.output ? output.output.toString() : "";

    if (testResult.includes("PASSED")) {
      logger.info(`✅ TEST_PASSED`, { result: testResult });
      console.log(`\x1b[32m✅ TEST PASSED: ${testResult}\x1b[0m`);
    } else if (testResult.includes("FAILED")) {
      logger.error(`❌ TEST_FAILED`, { result: testResult });
      console.log(`\x1b[31m❌ TEST FAILED: ${testResult}\x1b[0m`);
    } else {
      logger.info(`🏁 TEST_COMPLETED`, { result: testResult });
      console.log(`\x1b[34m🏁 TEST COMPLETED: ${testResult}\x1b[0m`);
    }
  }

  // Called when an agent encounters an error
  async handleChainError(error: Error): Promise<void> {
    logger.error(`💥 TEST_ERROR`, error);
    console.log(`\x1b[31m💥 TEST ERROR: ${error.message}\x1b[0m`);

    // Attempt to close browser on test error
    try {
      console.log(`\x1b[33m⚠️ Closing browser due to test error\x1b[0m`);
      await closeBrowserTool.invoke("{}");
    } catch (closeError) {
      logger.error("Failed to close browser after test error", closeError);
    }

    // Exit process on critical errors
    process.exit(1);
  }
}

// Agent setup with memory
const createAgentWithMemory = async () => {
  // Set up memory
  const memory = new BufferMemory({
    returnMessages: true,
    memoryKey: "chat_history",
    inputKey: "input",
    outputKey: "output",
  });

  // Create prompt template with both imported system prompts
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", initialMessageSystemPrompt],
    ["system", performNextStepSystemPrompt],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  // Configure the LLM (Claude)
  const groqModel = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    // Fix for "Non string message content not supported" error
    // streaming: false,
  });

  const tools = [
    // Navigation tools
    navigationTool,
    goBackTool,
    goForwardTool,
    refreshPageTool,
    closeBrowserTool,

    // Interaction tools
    clickTool,
    typeTool,
    getTextTool,
    selectOptionTool,
    checkTool,
    uncheckTool,
    hoverTool,
    pressKeyTool,
    waitForElementTool,
  ];

  const agent = await createToolCallingAgent({
    llm: groqModel,
    tools,
    prompt,
  });

  // Create the agent executor with the custom callback handler
  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    memory,
    //verbose: true,
    callbacks: [new ToolCallLogger()],
    returnIntermediateSteps: true,
  });

  return agentExecutor;
};

// Main function to run the agent
export async function runAgent(input: string) {
  try {
    console.log(`\x1b[35m📝 TEST INSTRUCTION: ${input}\x1b[0m`);
    logger.info("Starting test execution", { input });

    const agentExecutor = await createAgentWithMemory();
    const result = await agentExecutor.invoke({ input });

    // Ensure browser is properly closed after test completion
    try {
      await closeBrowserTool.invoke({});
      logger.info("Browser closed after test completion");
    } catch (error) {
      logger.warn("Warning: Browser might already be closed", {
        error,
      });
    }

    return result;
  } catch (error) {
    logger.error("Failed to execute test", error);
    console.log(`\x1b[31m💥 TEST ERROR: ${error}\x1b[0m`);

    // Attempt to close browser with proper empty object
    try {
      // Using an empty object that matches the schema
      await closeBrowserTool.invoke({});
    } catch (closeError) {
      // Browser might already be closed
      logger.debug("Note: Browser might already be closed");
    }

    throw error;
  }
}

// Export a method to force close the browser (can be called from outside)
export async function forceCloseBrowser() {
  try {
    await closeBrowserTool.invoke("{}");
    logger.info("Browser force closed successfully");
    return true;
  } catch (error) {
    logger.error("Failed to force close browser", error);
    return false;
  }
}
