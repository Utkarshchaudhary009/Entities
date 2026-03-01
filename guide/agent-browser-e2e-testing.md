# Agent-Browser E2E Testing Guide (for Kilo Code)

A guide for using [Vercel's agent-browser](https://github.com/vercel-labs/agent-browser) with Kilo Code for AI-driven E2E testing.

---

## Quick Setup Sequence

### Step 1: Install Dependencies

```bash
# Install agent-browser globally
bun add -g agent-browser
agent-browser install

# Install Kilo CLI globally
bun add -g @kilocode/cli
```

### Step 2: Configure Kilo Code

Create `~/.config/kilo/opencode.json`:

```json
{
  "$schema": "https://kilo.ai/config.json",
  "model": "minimax/minimax-m2.1:free",
  "permission": {
    "*": "allow",
    "bash": {
      "*": "allow",
      "agent-browser *": "allow"
    }
  }
}
```

### Step 3: Login to Kilo

```bash
kilo
# Run /connect → select "Kilo Code" → authenticate
# Run /models → select "minimax/minimax-m2.1:free"
```

### Step 4: Create Test Script

Create `scripts/e2e-test.ts` (see full script below).

### Step 5: Add GitHub Action

Create `.github/workflows/e2e.yml` (see full workflow below).

---

## Overview

**agent-browser** is a headless browser automation CLI built for AI agents. It provides:
- Fast Rust CLI with Node.js fallback
- Snapshot-based element selection (refs like `@e1`, `@e2`)
- Full browser control (click, fill, scroll, screenshot, etc.)
- JSON output for machine-readable results

---

## Installation

```bash
# Global install (recommended for performance)
bun add -g agent-browser
agent-browser install  # Download Chromium

# Or quick start with bunx
bunx agent-browser install
bunx agent-browser open example.com
```

---

## Core Workflow for E2E Testing

### 1. Navigate to Page

```bash
agent-browser open http://localhost:3000
```

### 2. Get Interactive Elements (Snapshot)

```bash
agent-browser snapshot -i
# Output:
# - button "Sign In" [ref=e1]
# - textbox "Email" [ref=e2]
# - textbox "Password" [ref=e3]
```

### 3. Interact Using Refs

```bash
agent-browser fill @e2 "test@example.com"
agent-browser fill @e3 "password123"
agent-browser click @e1
```

### 4. Verify Results

```bash
agent-browser get text @e4        # Get element text
agent-browser is visible @e5      # Check visibility
agent-browser get url             # Verify URL changed
agent-browser screenshot test.png # Visual verification
```

---

## Kilo Code Integration

### Prompt Templates for Kilo Code

Use these prompts with Kilo Code to drive E2E tests:

#### Basic Test Flow

```
Use agent-browser to test the login flow:
1. Open http://localhost:3000/login
2. Get a snapshot of interactive elements
3. Fill in email "test@example.com" and password "password123"
4. Click the sign-in button
5. Verify redirect to /dashboard
6. Take a screenshot for verification
```

#### Form Validation Test

```
Use agent-browser to test form validation:
1. Open http://localhost:3000/signup
2. Snapshot interactive elements
3. Click submit without filling fields
4. Verify error messages appear
5. Fill only email, click submit
6. Verify password error shows
```

#### Navigation Test

```
Use agent-browser to verify navigation:
1. Open http://localhost:3000
2. Snapshot to find nav links
3. Click "About" link
4. Verify URL contains /about
5. Click "Home" link
6. Verify URL is /
```

---

## Common Commands Reference

### Navigation

| Command                       | Description                |
| ----------------------------- | -------------------------- |
| `agent-browser open <url>`    | Navigate to URL            |
| `agent-browser back`          | Go back                    |
| `agent-browser forward`       | Go forward                 |
| `agent-browser reload`        | Reload page                |
| `agent-browser get url`       | Get current URL            |
| `agent-browser get title`     | Get page title             |

### Interactions

| Command                           | Description            |
| --------------------------------- | ---------------------- |
| `agent-browser click @e1`         | Click element          |
| `agent-browser fill @e1 "text"`   | Clear and fill input   |
| `agent-browser type @e1 "text"`   | Type into element      |
| `agent-browser press Enter`       | Press keyboard key     |
| `agent-browser hover @e1`         | Hover element          |
| `agent-browser check @e1`         | Check checkbox         |
| `agent-browser uncheck @e1`       | Uncheck checkbox       |
| `agent-browser select @e1 "val"`  | Select dropdown option |

### Assertions

| Command                     | Description          |
| --------------------------- | -------------------- |
| `agent-browser get text @e1`| Get text content     |
| `agent-browser is visible @e1` | Check visibility  |
| `agent-browser is enabled @e1` | Check if enabled  |
| `agent-browser is checked @e1` | Check if checked  |
| `agent-browser get count ".item"` | Count elements  |

### Waiting

| Command                              | Description                  |
| ------------------------------------ | ---------------------------- |
| `agent-browser wait @e1`             | Wait for element visible     |
| `agent-browser wait 1000`            | Wait 1 second                |
| `agent-browser wait --text "Welcome"`| Wait for text to appear      |
| `agent-browser wait --url "**/dash"` | Wait for URL pattern         |
| `agent-browser wait --load networkidle` | Wait for network idle     |

### Screenshots & Debugging

| Command                              | Description                  |
| ------------------------------------ | ---------------------------- |
| `agent-browser screenshot page.png`  | Take screenshot              |
| `agent-browser screenshot --full`    | Full page screenshot         |
| `agent-browser screenshot --annotate`| Numbered element labels      |
| `agent-browser console`              | View console messages        |
| `agent-browser errors`               | View page errors             |

---

## Snapshot Options

```bash
agent-browser snapshot           # Full accessibility tree
agent-browser snapshot -i        # Interactive elements only (recommended)
agent-browser snapshot -i -c     # Compact (remove empty elements)
agent-browser snapshot -i --json # JSON output for parsing
agent-browser snapshot -s "#main"# Scope to CSS selector
```

---

## JSON Mode for Automation

Add `--json` for machine-readable output:

```bash
agent-browser snapshot --json
# Returns: {"success":true,"data":{"snapshot":"...","refs":{...}}}

agent-browser get text @e1 --json
agent-browser is visible @e2 --json
```

---

## Sessions (Isolated Browser Instances)

```bash
# Run parallel tests in isolated sessions
agent-browser --session test1 open http://localhost:3000/login
agent-browser --session test2 open http://localhost:3000/signup

# List active sessions
agent-browser session list

# Clean up
agent-browser --session test1 close
agent-browser --session test2 close
```

---

## Command Chaining

```bash
# Single shell command for efficiency
agent-browser open http://localhost:3000 && \
agent-browser wait --load networkidle && \
agent-browser snapshot -i

# Login flow in one command
agent-browser fill @e1 "user@test.com" && \
agent-browser fill @e2 "password" && \
agent-browser click @e3 && \
agent-browser wait --url "**/dashboard"
```

---

## Environment Variables

| Variable                     | Description                        |
| ---------------------------- | ---------------------------------- |
| `AGENT_BROWSER_SESSION`      | Default session name               |
| `AGENT_BROWSER_DEFAULT_TIMEOUT` | Timeout in ms (default: 25000)  |
| `AGENT_BROWSER_ALLOWED_DOMAINS` | Restrict navigation domains     |

---

## Example E2E Test Scenarios

### Authentication Flow

```bash
# 1. Open login page
agent-browser open http://localhost:3000/login

# 2. Get interactive elements
agent-browser snapshot -i

# 3. Fill credentials
agent-browser fill @e1 "test@example.com"
agent-browser fill @e2 "password123"

# 4. Submit
agent-browser click @e3

# 5. Wait for redirect
agent-browser wait --url "**/dashboard"

# 6. Verify dashboard loaded
agent-browser get title
agent-browser screenshot login-success.png
```

### CRUD Operations

```bash
# Create
agent-browser open http://localhost:3000/items/new
agent-browser snapshot -i
agent-browser fill @e1 "New Item"
agent-browser click @e2  # Save button
agent-browser wait --text "Item created"

# Read
agent-browser get text ".item-list"

# Update
agent-browser click @e5  # Edit button
agent-browser fill @e1 "Updated Item"
agent-browser click @e2
agent-browser wait --text "Item updated"

# Delete
agent-browser click @e6  # Delete button
agent-browser click @e7  # Confirm
agent-browser wait --text "Item deleted"
```

### Responsive Testing

```bash
# Mobile viewport
agent-browser set viewport 375 667
agent-browser screenshot mobile.png

# Tablet viewport
agent-browser set viewport 768 1024
agent-browser screenshot tablet.png

# Desktop viewport
agent-browser set viewport 1920 1080
agent-browser screenshot desktop.png
```

---

## Diff & Visual Regression

```bash
# Compare current vs baseline snapshot
agent-browser diff snapshot --baseline before.txt

# Visual pixel diff
agent-browser diff screenshot --baseline baseline.png

# Save diff image
agent-browser diff screenshot --baseline baseline.png -o diff.png

# Compare two URLs
agent-browser diff url http://localhost:3000 http://staging.example.com
```

---

## Troubleshooting

| Issue                        | Solution                                      |
| ---------------------------- | --------------------------------------------- |
| Element not found            | Re-run `snapshot -i` to get fresh refs        |
| Timeout errors               | Increase timeout or add explicit `wait`       |
| Session conflicts            | Use `--session <name>` for isolation          |
| Chromium not installed       | Run `agent-browser install`                   |
| Linux deps missing           | Run `agent-browser install --with-deps`       |

---

---

## Kilo Code Integration for E2E Tests

### Setup: Add agent-browser Skill to Kilo Code
bunx skills add vercel-labs/agent-browser -g -a kilo -y

### create AGENTS.md
""" 
Use `agent-browser` for testing or web automation. run `agent-browser --help` for all commands.

core workflow:
1> `agent-browser open <url>` - Navigate to page.
2> `agebt-browser snapshot -i` - Get interactive elements with refs (@e1 , @e2)
3> `agent-broswer click @e1` / `fill @e2 "text"` - Interact using refs
4> Re-snapshot after page changes 

Before Doing any thing, It is must to invoke agent-browser skill.

 """

## Writing Integrated Test Scripts

### Option 1: Shell Script Runner

Create `tests/e2e/auth.sh`:

```bash
#!/bin/bash
set -e

echo "🧪 E2E: Authentication Flow"

# Setup
agent-browser open http://localhost:3000/login
agent-browser wait --load networkidle
agent-browser snapshot -i > /tmp/login-snapshot.txt

# Test: Valid login
echo "→ Testing valid login..."
agent-browser fill @e1 "test@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
agent-browser wait --url "**/dashboard"

URL=$(agent-browser get url)
if [[ "$URL" == *"dashboard"* ]]; then
  echo "✅ Login redirects to dashboard"
else
  echo "❌ Login failed - URL: $URL"
  agent-browser screenshot tests/e2e/screenshots/login-fail.png
  exit 1
fi

agent-browser screenshot tests/e2e/screenshots/login-success.png
echo "✅ Authentication test passed"
```

### Option 2: TypeScript Test Runner

Create `tests/e2e/auth.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { $ } from "bun";

const BASE_URL = "http://localhost:3000";

async function browser(cmd: string): Promise<string> {
  const result = await $`agent-browser ${cmd}`.text();
  return result.trim();
}

async function browserJson(cmd: string): Promise<{ success: boolean; data: unknown }> {
  const result = await $`agent-browser ${cmd} --json`.text();
  return JSON.parse(result);
}

describe("E2E: Authentication", () => {
  beforeAll(async () => {
    await browser(`open ${BASE_URL}/login`);
    await browser("wait --load networkidle");
  });

  afterAll(async () => {
    await browser("close");
  });

  it("should display login form", async () => {
    const snapshot = await browser("snapshot -i");
    
    expect(snapshot).toContain("Email");
    expect(snapshot).toContain("Password");
    expect(snapshot).toContain("Sign In");
  });

  it("should show error on invalid credentials", async () => {
    await browser(`fill @e1 "wrong@email.com"`);
    await browser(`fill @e2 "wrongpassword"`);
    await browser("click @e3");
    await browser(`wait --text "Invalid credentials"`);

    const result = await browserJson(`is visible "[role=alert]"`);
    expect(result.data).toBe(true);
  });

  it("should redirect to dashboard on valid login", async () => {
    await browser(`open ${BASE_URL}/login`);
    await browser("wait --load networkidle");
    await browser("snapshot -i");
    
    await browser(`fill @e1 "test@example.com"`);
    await browser(`fill @e2 "password123"`);
    await browser("click @e3");
    await browser(`wait --url "**/dashboard"`);

    const url = await browser("get url");
    expect(url).toContain("/dashboard");
  });
});
```

### Option 3: JSON Test Definitions

Create `tests/e2e/test-cases.json`:

```json
{
  "name": "Authentication Suite",
  "baseUrl": "http://localhost:3000",
  "tests": [
    {
      "name": "Valid Login",
      "steps": [
        { "action": "open", "value": "/login" },
        { "action": "wait", "value": "--load networkidle" },
        { "action": "snapshot", "value": "-i" },
        { "action": "fill", "ref": "@e1", "value": "test@example.com" },
        { "action": "fill", "ref": "@e2", "value": "password123" },
        { "action": "click", "ref": "@e3" },
        { "action": "wait", "value": "--url **/dashboard" },
        { "action": "assert-url", "contains": "/dashboard" },
        { "action": "screenshot", "value": "login-success.png" }
      ]
    },
    {
      "name": "Invalid Login Shows Error",
      "steps": [
        { "action": "open", "value": "/login" },
        { "action": "snapshot", "value": "-i" },
        { "action": "fill", "ref": "@e1", "value": "wrong@test.com" },
        { "action": "fill", "ref": "@e2", "value": "wrong" },
        { "action": "click", "ref": "@e3" },
        { "action": "wait", "value": "--text Invalid" },
        { "action": "assert-visible", "selector": "[role=alert]" }
      ]
    }
  ]
}
```

Then create a runner `scripts/run-e2e.ts`:

```typescript
import testCases from "../tests/e2e/test-cases.json";
import { $ } from "bun";

async function runTests() {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  for (const test of testCases.tests) {
    console.log(`\n🧪 Running: ${test.name}`);
    
    try {
      for (const step of test.steps) {
        const cmd = buildCommand(step, testCases.baseUrl);
        console.log(`  → ${cmd}`);
        await $`agent-browser ${cmd.split(" ")}`.quiet();
      }
      results.push({ name: test.name, passed: true });
      console.log(`  ✅ Passed`);
    } catch (error) {
      results.push({ name: test.name, passed: false, error: String(error) });
      console.log(`  ❌ Failed: ${error}`);
      await $`agent-browser screenshot tests/e2e/screenshots/${test.name.replace(/\s/g, "-")}-fail.png`.quiet();
    }
  }

  // Summary
  console.log("\n📊 Results:");
  console.log(`Passed: ${results.filter(r => r.passed).length}/${results.length}`);
  
  if (results.some(r => !r.passed)) {
    process.exit(1);
  }
}

function buildCommand(step: Record<string, string>, baseUrl: string): string {
  switch (step.action) {
    case "open":
      return `open ${baseUrl}${step.value}`;
    case "wait":
      return `wait ${step.value}`;
    case "snapshot":
      return `snapshot ${step.value}`;
    case "fill":
      return `fill ${step.ref} "${step.value}"`;
    case "click":
      return `click ${step.ref}`;
    case "screenshot":
      return `screenshot tests/e2e/screenshots/${step.value}`;
    case "assert-url":
      return `get url`; // Handle assertion separately
    case "assert-visible":
      return `is visible "${step.selector}"`;
    default:
      return step.value;
  }
}

runTests();
```

---

## Directory Structure

```
tests/
├── e2e/
│   ├── screenshots/        # Auto-captured screenshots
│   ├── auth.test.ts        # TypeScript test file
│   ├── auth.sh             # Shell script alternative
│   └── test-cases.json     # JSON test definitions
├── integration/
├── unit/
└── helpers/

scripts/
└── run-e2e.ts              # JSON test runner

.kilocode/
└── skills/
    └── agent-browser/
        └── skill.md        # Kilo Code skill
```

---

## Package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test:e2e": "bun test tests/e2e",
    "test:e2e:run": "bun scripts/run-e2e.ts",
    "test:e2e:auth": "bash tests/e2e/auth.sh"
  }
}
```

---

## CI Integration

### GitHub Action: `.github/workflows/e2e.yml`

```yaml
name: E2E Tests

on:
  push:
    branches:
      - '**'
  pull_request:
    branches:
      - '**'

concurrency:
  group: e2e-${{ github.ref }}
  cancel-in-progress: true

env:
  KILO_TOKEN: ${{ secrets.KILO_TOKEN }}
  KILOCODE_MODEL: minimax/minimax-m2.1:free
  BASE_URL: http://localhost:3000

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Install agent-browser
        run: |
          bun add -g agent-browser
          agent-browser install --with-deps
      
      - name: Install Kilo CLI
        run: bun add -g @kilocode/cli
      
      - name: Setup Kilo config
        run: |
          mkdir -p ~/.config/kilo
          cat > ~/.config/kilo/opencode.json << 'EOF'
          {
            "$schema": "https://kilo.ai/config.json",
            "model": "minimax/minimax-m2.1:free",
            "permission": {
              "*": "allow",
              "bash": { "*": "allow" },
              "edit": "allow",
              "read": "allow"
            }
          }
          EOF
      
      - name: Start dev server
        run: |
          bun run dev &
          echo "Waiting for server..."
          sleep 15
      
      - name: Run E2E tests
        run: bun run scripts/e2e-test.ts
      
      - name: Upload screenshots
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-screenshots-${{ github.sha }}
          path: tests/e2e/screenshots/
          retention-days: 7
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-results-${{ github.sha }}
          path: tests/e2e/results/
          retention-days: 7
```

### Test Script: `scripts/e2e-test.ts`

```typescript
import { $ } from "bun";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SCREENSHOTS_DIR = "tests/e2e/screenshots";
const RESULTS_DIR = "tests/e2e/results";

interface TestCase {
  name: string;
  prompt: string;
}

const testCases: TestCase[] = [
  {
    name: "login-flow",
    prompt: `Use agent-browser to test login flow:
1. Open ${BASE_URL}/login
2. Run: agent-browser snapshot -i
3. Fill email field with "test@example.com"
4. Fill password field with "password123"
5. Click the sign-in button
6. Wait for redirect
7. Verify URL contains /dashboard
8. Take screenshot: ${SCREENSHOTS_DIR}/login-success.png
Report: PASS or FAIL with reason.`,
  },
  {
    name: "navigation",
    prompt: `Use agent-browser to test navigation:
1. Open ${BASE_URL}
2. Run: agent-browser snapshot -i
3. Click the first navigation link
4. Verify URL changed
5. Take screenshot: ${SCREENSHOTS_DIR}/navigation.png
Report: PASS or FAIL with reason.`,
  },
  {
    name: "responsive",
    prompt: `Use agent-browser to test responsive design:
1. Open ${BASE_URL}
2. Set viewport to 375x667 (mobile)
3. Take screenshot: ${SCREENSHOTS_DIR}/mobile.png
4. Set viewport to 1920x1080 (desktop)
5. Take screenshot: ${SCREENSHOTS_DIR}/desktop.png
Report: PASS or FAIL with reason.`,
  },
];


### Add to `package.json`

```json
{
  "scripts": {
    "test:e2e": "bun run scripts/e2e-test.ts",
    "test:e2e:local": "BASE_URL=http://localhost:3000 bun run scripts/e2e-test.ts"
  }
}
```

---

## Resources

- [GitHub Repository](https://github.com/vercel-labs/agent-browser)
- [Security Documentation](https://agent-browser.vercel.app/security)
