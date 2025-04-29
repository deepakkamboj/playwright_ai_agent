# Playwright AI Agent 🤖

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)
![Node](https://img.shields.io/badge/node-v18%2B-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-v5.8.3-blue)
![Playwright](https://img.shields.io/badge/playwright-v1.51.1-green)
![LangChain](https://img.shields.io/badge/langchain-v0.3.23-orange)

A powerful automation tool that uses LLMs to generate and execute Playwright browser tests from plain English instructions. This agent can navigate websites, fill forms, click elements, and perform complex test scenarios without requiring you to write a single line of test code.

## 🚀 Technology Stack

| Technology | Version | Description                    |
| ---------- | ------- | ------------------------------ |
| TypeScript | 5.8.3   | Programming language           |
| Playwright | 1.51.1  | Browser automation framework   |
| LangChain  | 0.3.23  | Framework for LLM applications |
| Groq       | 0.2.2   | LLM provider                   |
| Mistral AI | 0.2.0   | LLM provider                   |
| OpenAI     | 0.5.6   | LLM provider (optional)        |
| Zod        | 3.24.3  | Schema validation              |

## 🏗️ Architecture

The application follows a multi-agent architecture to generate and run Playwright browser tests:

1. **LLM Agent** - Processes natural language instructions and determines test steps
2. **Tool Manager** - Provides specialized tools for browser interaction
3. **Browser Manager** - Manages browser instances and handles navigation
4. **Logger** - Records all operations and test results

```
┌─────────────┐     ┌─────────────┐
│ User Input  │────▶│  LLM Agent  │
└─────────────┘     └──────┬──────┘
                          │
                          ▼
┌─────────────┐     ┌─────────────┐
│   Logger    │◀───▶│Tool Manager │
└─────────────┘     └──────┬──────┘
                          │
                    ┌─────┴─────┐
                    │           │
          ┌─────────▼─┐   ┌─────▼──────┐
          │Navigation │   │Interaction │
          │  Tools    │   │   Tools    │
          └─────┬─────┘   └──────┬─────┘
                │                │
                └───────┬────────┘
                        │
                        ▼
                ┌───────────────┐
                │    Browser    │
                │    Manager    │
                └───────────────┘
```

### Available Tools

#### Navigation Tools:

- **playwright_navigate**: Navigate to a specified URL
- **playwright_goBack**: Navigate back in browser history
- **playwright_goForward**: Navigate forward in browser history
- **playwright_refreshPage**: Refresh the current page
- **playwright_closeBrowser**: Close the current browser instance

#### Interaction Tools:

- **playwright_click**: Click on an element using a selector
- **playwright_type**: Type text into an input field
- **playwright_getText**: Extract text content from an element
- **playwright_selectOption**: Select options from dropdown menus
- **playwright_check**: Check checkboxes or radio buttons
- **playwright_uncheck**: Uncheck checkboxes
- **playwright_hover**: Hover over an element
- **playwright_pressKey**: Press keyboard keys or key combinations
- **playwright_waitForElement**: Wait for an element to appear or change state

## ⚙️ Setup and Installation

### Requirements

- Node.js v18 or higher
- NPM or Yarn

### Installation

1. Clone the repository:

   ```bash
   git clone [repository-url]
   cd agent_chat
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with:

   ```env
   GROQ_API_KEY=your-groq-api-key
   MISTRAL_API_KEY=your-mistral-api-key
   OPENAI_API_KEY=your-openai-api-key (optional)
   ```

4. Build the project:
   ```bash
   npm run build
   ```

## 🧪 How to Use

1. Start the application:

   ```bash
   npm start
   ```

2. Enter your test instructions in plain English.

3. The agent will:
   - Parse your instructions
   - Generate a sequence of browser actions
   - Execute the actions in a real browser
   - Provide a detailed log of all operations
   - Return test results and any requested data

## 📝 Example Test Prompts

Try these example prompts to see the agent in action:

```
Navigate to playwright.dev and click on the Docs link
```

```
Go to github.com, search for "playwright", and return the number of results
```

```
Visit example.com, fill out the contact form with name "John Doe", email "john@example.com", message "Hello World", and submit it
```

```
Navigate to google.com, search for "playwright automation", then click on the first search result
```

### Detailed BDD Example

For more complex test scenarios, you can provide Gherkin-style test specifications:

```gherkin
Feature: Create a New Employee in EAApp

  Scenario: Successfully create a new employee record
    Given I navigate to the website "http://eaapp.somee.com"
    And I click the "Login" link
    And I enter username "admin" and password "password"
    And I click the "Log in" button
    Then I should be logged in successfully

    When I click the "Employee List" link
    And I click the "Create New" button
    And I enter the following employee details:
      | Name           | Salary  | DurationWorked | Grade  | Email                 |
      | John Doe       | 95000   | 24             | CLevel | john.doe@example.com |
    And I submit the new employee form

    Then I should see the new employee listed in the employee list
    And I close the browser
```

The same test in plain English:

```
Navigate to http://eaapp.somee.com. Click on the 'Login' link. Enter 'admin' as the username and 'password' as the password and click the 'Log in' button. Verify that I'm successfully logged in.

Now click on the 'Employee List' link and then click the 'Create New' button. Fill out the new employee form with the following information:
- Name: John Doe
- Salary: 95000
- Duration Worked: 24
- Grade: CLevel
- Email: john.doe@example.com

Submit the form and verify that John Doe appears in the employee list. Finally, close the browser.
```

The AI agent will automatically:

1. Navigate to the site and perform the login
2. Access the employee creation functionality
3. Fill out the complex form with multiple fields
4. Verify the creation was successful
5. Close the browser properly after the test is complete

## 🧠 Agent Types

The application supports various LangChain agent types based on your requirements:

| Agent Type         | Best For       | When To Use                                      |
| ------------------ | -------------- | ------------------------------------------------ |
| Tool Calling Agent | Most scenarios | Best for Playwright automation with Groq/Mistral |
| Chat Agent         | Simple flows   | When you need lightweight interactions           |
| Zero Shot Agent    | Basic tests    | For straightforward automation tasks             |

## 🔍 Troubleshooting

Common issues and solutions:

- **Browser initialization issues**: Check if you have the correct Playwright browsers installed
- **LLM errors**: Verify your API keys in the .env file
- **Selector errors**: If elements aren't found, try using more robust selectors

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.
