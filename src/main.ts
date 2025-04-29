import "dotenv/config";
import { runAgent, forceCloseBrowser } from "./lib/langchain-agent";
import { logger } from "./utils/logger";
import path from "path";

// Add process handlers for graceful shutdown
process.on("uncaughtException", async (error) => {
  logger.error("Unhandled exception:", error);
  console.log(`\x1b[31m💥 UNHANDLED EXCEPTION: ${error.message}\x1b[0m`);

  // Try to close any open browsers
  await forceCloseBrowser();
  process.exit(1);
});

process.on("SIGINT", async () => {
  logger.info("Process interrupted, cleaning up resources...");
  console.log("\x1b[33m⚠️ Process interrupted, cleaning up...\x1b[0m");

  // Close any open browsers
  await forceCloseBrowser();
  process.exit(0);
});

// Example usage
async function main() {
  try {
    // Initialize logger with file logging
    const logPath = path.join(process.cwd(), "logs", "application.log");
    logger.enableFileLogging(logPath);
    logger.info("Starting application");

    logger.info(
      `Running agent with task: visit Playwright website and explore documentation`
    );

    const response = await runAgent(
      "Navigate to playwright.dev, click on the 'Docs' link in the navigation menu, then click on 'Installation' in the sidebar. Then click on the 'How to install Playwright' link "
    );

    logger.info("Agent response received");
    console.log("Agent response:", response);
  } catch (error) {
    logger.error("An error occurred in main execution:", error);
    console.error("Error:", error);

    // Try to clean up any remaining browser instances
    try {
      const { closeBrowserTool } = require("./tools/browser/navigationTool");
      await closeBrowserTool.invoke({});
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error("Unhandled exception:", error);
    console.error(error);
  });
}

/*
  const response = await runAgent(
      `Given I navigate to website http://eaapp.somee.com and click 'Login' link
And I enter username and password as "admin" and "password" respectively and perform login
Then click the 'Employee List' page 
And click "Create New" button and enter realistic employee details to create for Name, Salary, DurationWorked,
Select dropdown for Grade as CLevel and Email. Close the browser after completion.`
      //"Navigate to playwright.dev, click on the 'Docs' link in the navigation menu, then click on 'Installation' in the sidebar. Finally, extract the installation command for npm and return it."
    );
    */
