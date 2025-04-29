/**
 * @file Browser Navigation Tools
 * @description VoltAgent tools for browser navigation operations
 */

import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { Page } from "playwright";
import { resetBrowserState, ToolContext } from "../playwrightToolHandler";
import { safeBrowserOperation, handleCommonPopups } from "./browserBaseTools";
import { logger } from "../../utils/logger";

// TimeOut constants
const TimeOut = {
  LoadTimeOut: 60000, // 60 seconds for page load timeout
};

/**
 * Robust URL navigation with retry mechanism
 */
export async function navigateToUrl(
  page: Page,
  navigationUrl: string,
  waitToLoadDomContent = true
): Promise<void> {
  const openInternal = async (retryCount = 0): Promise<any> => {
    try {
      // Note that Promise.all prevents a race condition
      await Promise.all([
        page.waitForNavigation(),
        page.goto(navigationUrl, { waitUntil: "domcontentloaded", timeout: 0 }),
      ]);
      logger.info(`Navigate to URL: ${navigationUrl}`);
    } catch (e) {
      if (retryCount < 3) {
        const waitTime = 5000 * (retryCount + 1);
        logger.error(
          "Error occurred while navigating to URL: " + (e as Error).message
        );
        logger.info(
          `Failed to navigate to URL ${navigationUrl}, waiting ${waitTime}ms and retrying. Retry # ${
            retryCount + 1
          }`
        );
        await page.waitForTimeout(waitTime);
        return openInternal(retryCount + 1);
      }
    }
  };
  await openInternal();

  if (waitToLoadDomContent) {
    await page.waitForLoadState("domcontentloaded", {
      timeout: TimeOut.LoadTimeOut,
    });
  }
}

/**
 * Tool for navigating to URLs
 */
const navigationTool = new DynamicStructuredTool({
  name: "playwright_navigate",
  description: "Navigate to a URL in the browser",
  schema: z.object({
    url: z
      .string()
      .url({ message: "Please provide a valid URL" })
      .describe("The URL to navigate to"),
    timeout: z
      .number()
      .positive()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
    waitUntil: z
      .enum(["load", "domcontentloaded", "networkidle", "commit"])
      .optional()
      .default("load")
      .describe("Navigation wait condition"),
  }),
  func: async ({ url, timeout, waitUntil }, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      // Use the more robust navigation function
      await navigateToUrl(page, url, true);

      // After navigation, check for and handle common popups
      // await handleCommonPopups(page);

      return `Navigated to ${url}`;
    });
  },
});

/**
 * Tool for navigating back in browser history
 */
const goBackTool = new DynamicStructuredTool({
  name: "playwright_goBack",
  description: "Navigate back in browser history",
  schema: z.object({
    timeout: z
      .number()
      .positive()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
  }),
  func: async ({ timeout }, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      await page.goBack({ timeout: timeout });
      return "Navigated back in browser history";
    });
  },
});

/**
 * Tool for navigating forward in browser history
 */
const goForwardTool = new DynamicStructuredTool({
  name: "playwright_goForward",
  description: "Navigate forward in browser history",
  schema: z.object({
    timeout: z
      .number()
      .positive()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
  }),
  func: async ({ timeout }, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      await page.goForward({ timeout: timeout });
      return "Navigated forward in browser history";
    });
  },
});

/**
 * Tool for refreshing the current page
 */
const refreshPageTool = new DynamicStructuredTool({
  name: "playwright_refreshPage",
  description: "Refresh the current page",
  schema: z.object({
    timeout: z
      .number()
      .positive()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
  }),
  func: async ({ timeout }, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      await page.reload({ timeout: timeout });
      return "Page refreshed successfully";
    });
  },
});

/**
 * Tool for closing the browser
 */
const closeBrowserTool = new DynamicStructuredTool({
  name: "playwright_closeBrowser",
  description: "Close the current browser instance",
  schema: z.object({}),
  func: async ({}, context) => {
    const toolContext = context as unknown as ToolContext;

    if (toolContext.browser) {
      try {
        if (toolContext.browser.isConnected()) {
          await toolContext.browser.close().catch((error: unknown) => {
            console.error("Error while closing browser:", error);
          });
        } else {
          console.error("Browser already disconnected, cleaning up state");
        }
      } catch (error) {
        console.error("Error during browser close operation:", error);
      } finally {
        resetBrowserState();
      }
      return "Browser closed successfully";
    }
    return "No browser instance to close";
  },
});

// Export all navigation tools
export {
  navigationTool,
  goBackTool,
  goForwardTool,
  refreshPageTool,
  closeBrowserTool,
};
