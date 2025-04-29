/**
 * @file Browser Interaction Tools
 * @description VoltAgent tools for interacting with page elements using Playwright
 *
 * This module provides tools for:
 * - Element clicking (playwright_click)
 * - Text input (playwright_type)
 * - Text extraction (playwright_getText)
 * - Dropdown selection (playwright_selectOption)
 * - Checkbox/radio control (playwright_check, playwright_uncheck)
 * - Mouse hovering (playwright_hover)
 * - Keyboard interaction (playwright_pressKey)
 * - Element waiting (playwright_waitForElement)
 *
 * Each tool is created using DynamicStructuredTool with:
 * - Zod validation schemas for parameters
 * - Safe browser operation handling
 * - Consistent error reporting
 */

import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { resetBrowserState, ToolContext } from "../playwrightToolHandler";
import { safeBrowserOperation } from "./browserBaseTools";
import { logger } from "../../utils/logger";

/**
 * Tool for clicking on an element
 */
export const clickTool = new DynamicStructuredTool({
  name: "playwright_click",
  description: "Click on an element on the page",
  schema: z.object({
    selector: z.string().describe("CSS or XPath selector for the element"),
    timeout: z
      .number()
      .positive()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
    button: z
      .enum(["left", "right", "middle"])
      .optional()
      .default("left")
      .describe("Mouse button to use"),
    clickCount: z
      .number()
      .positive()
      .optional()
      .default(1)
      .describe("Number of clicks"),
    force: z
      .boolean()
      .optional()
      .default(false)
      .describe("Bypass actionability checks"),
  }),
  func: async ({ selector, timeout, button, clickCount, force }, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      logger.info(`Clicking on element with selector: ${selector}`);
      await page.click(selector, {
        button: button,
        clickCount: clickCount,
        force: force,
        timeout: timeout,
      });

      return { result: `Clicked on element with selector: ${selector}` };
    });
  },
});

/**
 * Tool for typing text into an input field
 */
export const typeTool = new DynamicStructuredTool({
  name: "playwright_type",
  description: "Type text into an input field",
  schema: z.object({
    selector: z
      .string()
      .describe("CSS or XPath selector for the input element"),
    text: z.string().describe("Text to type"),
    delay: z
      .number()
      .optional()
      .default(0)
      .describe("Delay between keystrokes in milliseconds"),
    timeout: z
      .number()
      .positive()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
  }),
  func: async ({ selector, text, delay, timeout }, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      logger.info(`Typing text: ${text} into selector: ${selector}`);

      // get the element and focus it
      await page.waitForSelector(selector, { timeout: timeout });
      await page.focus(selector, { timeout: timeout });
      await page.fill(selector, text, { timeout: timeout });

      logger.info(`Typed text: ${text} into selector: ${selector}`);

      return {
        result: `Typed "${text}" into element with selector: ${selector}`,
      };
    });
  },
});

/**
 * Tool for extracting text content from an element
 */
export const getTextTool = new DynamicStructuredTool({
  name: "playwright_getText",
  description: "Get text content from an element",
  schema: z.object({
    selector: z.string().describe("CSS or XPath selector for the element"),
    timeout: z
      .number()
      .positive()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
  }),
  func: async ({ selector, timeout }, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      await page.waitForSelector(selector, { timeout: timeout });
      const text = await page.$eval(
        selector,
        (el) => el.textContent?.trim() || ""
      );

      return {
        result: `Text content: ${text}`,
        text,
      };
    });
  },
});

/**
 * Tool for selecting options from dropdown or select elements
 */
export const selectOptionTool = new DynamicStructuredTool({
  name: "playwright_selectOption",
  description: "Select one or more options from a dropdown or select element",
  schema: z.object({
    selector: z
      .string()
      .describe("CSS or XPath selector for the select element"),
    values: z
      .union([
        z.string().array().describe("Array of values to select"),
        z.string().describe("Single value to select"),
      ])
      .describe("Option value(s) to select"),
    timeout: z
      .number()
      .positive()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
  }),
  func: async ({ selector, values, timeout }, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      logger.info(
        `Selecting option(s): ${values} from dropdown with selector: ${selector}`
      );

      // Convert single value to array if needed
      const valuesArray = typeof values === "string" ? [values] : values;

      await page.selectOption(selector, valuesArray, { timeout: timeout });
      return {
        result: `Selected option(s): ${
          Array.isArray(valuesArray) ? valuesArray.join(", ") : valuesArray
        } in dropdown with selector: ${selector}`,
      };
    });
  },
});

/**
 * Tool for checking a checkbox or radio button
 */
export const checkTool = new DynamicStructuredTool({
  name: "playwright_check",
  description: "Check a checkbox or radio button",
  schema: z.object({
    selector: z
      .string()
      .describe("CSS or XPath selector for the checkbox or radio"),
    timeout: z
      .number()
      .positive()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
    force: z
      .boolean()
      .optional()
      .default(false)
      .describe("Bypass actionability checks"),
  }),
  func: async ({ selector, timeout, force }, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      await page.check(selector, {
        timeout: timeout,
        force: force,
      });
      return { result: `Checked element with selector: ${selector}` };
    });
  },
});

/**
 * Tool for unchecking a checkbox
 */
export const uncheckTool = new DynamicStructuredTool({
  name: "playwright_uncheck",
  description: "Uncheck a checkbox",
  schema: z.object({
    selector: z.string().describe("CSS or XPath selector for the checkbox"),
    timeout: z
      .number()
      .positive()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
    force: z
      .boolean()
      .optional()
      .default(false)
      .describe("Bypass actionability checks"),
  }),
  func: async ({ selector, timeout, force }, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      await page.uncheck(selector, {
        timeout: timeout,
        force: force,
      });
      return { result: `Unchecked element with selector: ${selector}` };
    });
  },
});

/**
 * Tool for hovering over an element
 */
export const hoverTool = new DynamicStructuredTool({
  name: "playwright_hover",
  description: "Hover over an element",
  schema: z.object({
    selector: z.string().describe("CSS or XPath selector for the element"),
    timeout: z
      .number()
      .positive()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
    force: z
      .boolean()
      .optional()
      .default(false)
      .describe("Bypass actionability checks"),
  }),
  func: async ({ selector, timeout, force }, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      await page.hover(selector, {
        timeout: timeout,
        force: force,
      });
      return { result: `Hovered over element with selector: ${selector}` };
    });
  },
});

/**
 * Tool for pressing a keyboard key
 */
export const pressKeyTool = new DynamicStructuredTool({
  name: "playwright_pressKey",
  description: "Press a keyboard key or key combination",
  schema: z.object({
    key: z
      .string()
      .describe("Key or key combination to press (e.g., 'Enter', 'Control+A')"),
    selector: z
      .string()
      .optional()
      .describe("Optional selector to focus before pressing key"),
    delay: z
      .number()
      .optional()
      .default(0)
      .describe("Delay between keystrokes in milliseconds"),
    timeout: z
      .number()
      .positive()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
  }),
  func: async ({ key, selector, delay, timeout }, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      // Focus element if selector provided
      if (selector) {
        await page.focus(selector, { timeout: timeout });
      }

      await page.keyboard.press(key, { delay: delay });
      return {
        result: selector
          ? `Pressed ${key} on element with selector: ${selector}`
          : `Pressed ${key}`,
      };
    });
  },
});

/**
 * Tool for waiting for an element to appear or become visible
 */
export const waitForElementTool = new DynamicStructuredTool({
  name: "playwright_waitForElement",
  description: "Wait for an element to appear or become visible",
  schema: z.object({
    selector: z.string().describe("CSS or XPath selector for the element"),
    state: z
      .enum(["attached", "detached", "visible", "hidden"])
      .optional()
      .default("visible")
      .describe("Element state to wait for"),
    timeout: z
      .number()
      .positive()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds"),
  }),
  func: async ({ selector, state, timeout }, context) => {
    const toolContext = context as unknown as ToolContext;

    return safeBrowserOperation(toolContext, async (page) => {
      logger.info(
        `Waiting for element with selector: ${selector} to be ${state}`
      );
      await page.waitForSelector(selector, {
        state: state,
        timeout: timeout,
      });
      return {
        result: `Element with selector: ${selector} is now in state: ${state}`,
      };
    });
  },
});

/**
 * Export all interaction tools as a group
 */
export const interactionTools = {
  clickTool,
  typeTool,
  getTextTool,
  selectOptionTool,
  checkTool,
  uncheckTool,
  hoverTool,
  pressKeyTool,
  waitForElementTool,
};
