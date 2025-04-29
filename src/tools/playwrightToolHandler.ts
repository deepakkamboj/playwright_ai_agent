/**
 * @file Playwright Browser Management
 */

import { Browser, BrowserContext, Page, chromium } from "playwright";
import { logger } from "../utils/logger";

// Interface for tool context
export interface ToolContext {
  page: Page;
  browser?: Browser;
  context?: BrowserContext;
}

/**
 * Singleton Browser Manager
 * Maintains a single instance of the browser throughout the application
 */
class BrowserManager {
  private static instance: BrowserManager;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private isInitializing = false;

  private constructor() {}

  public static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  /**
   * Reset browser state
   */
  public async reset(): Promise<void> {
    try {
      if (this.page && !this.page.isClosed()) {
        await this.page.close();
      }
      if (this.context) {
        await this.context.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
    } catch (error) {
      logger.error("Error resetting browser state", error);
    } finally {
      this.page = null;
      this.context = null;
      this.browser = null;
      logger.info("Browser state reset");
    }
  }

  /**
   * Get or initialize browser and page
   */
  public async getBrowser(): Promise<{ browser: Browser; page: Page }> {
    // Return existing browser and page if available
    if (this.browser && this.page && !this.page.isClosed()) {
      logger.info("Reusing existing browser instance");
      return { browser: this.browser, page: this.page };
    }

    // Wait if initialization is in progress
    if (this.isInitializing) {
      // Log the waiting message only once
      logger.info("Browser initialization in progress, waiting...");

      // Wait for initialization to complete without additional logging
      const waitStart = Date.now();
      while (this.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));

        // If waiting too long (over 30 seconds), log progress but only once every 5 seconds
        const waitTime = Date.now() - waitStart;
        if (waitTime > 30000 && waitTime % 5000 < 100) {
          logger.debug(
            `Still waiting for browser initialization (${Math.round(
              waitTime / 1000
            )}s)...`
          );
        }
      }

      // Check again if browser is now available
      if (this.browser && this.page && !this.page.isClosed()) {
        return { browser: this.browser, page: this.page };
      }
    }

    // Initialize the browser
    this.isInitializing = true;
    try {
      logger.info("Launching new browser instance...");
      this.browser = await chromium.launch({
        headless: false,
        channel: "msedge",
        args: [
          "--start-maximized",
          "--no-sandbox",
          "--disable-web-security",
          "--disable-features=IsolateOrigins",
          "--disable-site-isolation-trials",
          "--start-fullscreen",
          "--window-size=1920,1080",
        ],
        // slowMo: 40, // Slow down operations for better visibility during testing
      });

      this.context = await this.browser.newContext({
        viewport: {
          width: 1280,
          height: 720,
        },
        deviceScaleFactor: 1,
        acceptDownloads: true,
      });

      this.page = await this.context.newPage();

      logger.info("Browser launched successfully");
      return { browser: this.browser, page: this.page };
    } catch (error) {
      logger.error("Failed to initialize browser", error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }
}

// Export a singleton instance of the browser manager
export const browserManager = BrowserManager.getInstance();

/**
 * Reset browser state (for backward compatibility)
 */
export function resetBrowserState(): void {
  browserManager.reset();
}

/**
 * Ensures a browser instance is available
 * Simplified to use the singleton browser manager
 */
export async function ensureBrowser(): Promise<{ page: Page }> {
  const { page } = await browserManager.getBrowser();
  return { page };
}
