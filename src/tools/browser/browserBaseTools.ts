/**
 * @file Browser Base Tools
 */

import { Page } from "playwright";
import { logger } from "../../utils/logger";
import { ensureBrowser, resetBrowserState } from "../playwrightToolHandler";

/**
 * Export resetBrowserState for use by other modules
 */
export { resetBrowserState };

/**
 * Safely execute a browser operation with error handling
 */
export async function safeBrowserOperation<T>(
  context: any, // Keep parameter for backward compatibility
  operation: (page: Page) => Promise<T>,
  maxRetries: number = 1
): Promise<T> {
  let retries = 0;
  let lastError: Error | null = null;

  while (retries <= maxRetries) {
    try {
      // Use the singleton-based ensureBrowser function
      const { page } = await ensureBrowser();

      // Wait for page to be stable
      await page.waitForLoadState("domcontentloaded").catch(() => {
        logger.warn(
          "Page did not reach domcontentloaded state, continuing anyway"
        );
      });

      // Execute the requested operation
      const result = await operation(page);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.error("Browser operation failed:", error);

      // Increment retry counter
      retries++;

      if (retries <= maxRetries) {
        logger.info(`Retrying operation (${retries}/${maxRetries})...`);
        // Short delay before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // If we get here, all retries failed
  throw lastError || new Error("Operation failed after retries");
}

/**
 * Handle common popups and dialogs that might appear during browser automation
 * @param page The Playwright page
 */
export async function handleCommonPopups(page: Page): Promise<void> {
  logger.info("Setting up popup handlers and checking for existing popups");

  // Setup dialog handler (for alerts, confirms, prompts)
  page.on("dialog", async (dialog) => {
    logger.info(`Dialog appeared: ${dialog.type()} - ${dialog.message()}`);
    await dialog.dismiss();
  });

  // Handle cookie consent popups - most common patterns
  const commonConsentSelectors = [
    'button[aria-label*="Accept"]',
    'button[aria-label*="Cookie"]',
    'button:has-text("Accept")',
    'button:has-text("Accept All")',
    'button:has-text("I Agree")',
    'button:has-text("I Accept")',
    'button:has-text("Allow")',
    'button:has-text("Close")',
    'button:has-text("Got it")',
    ".cookie-consent button",
    "#consent button",
    "#consent-popup button",
    ".consent-banner button",
  ];

  // Try each selector
  for (const selector of commonConsentSelectors) {
    const button = page.locator(selector).first();
    const count = await button.count();
    if (count > 0) {
      logger.info(`Found consent button with selector: ${selector}`);
      await button.click().catch((e) => {
        logger.info(`Failed to click consent button: ${e.message}`);
      });
      break;
    }
  }
}
