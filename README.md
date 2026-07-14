# AegisAgent — AI-Native Agent Sandbox & Quality Gate

AegisAgent is a premium, browser-based interactive IDE and evaluation playground designed to showcase advanced skills in AI-Native software engineering, automated QA validation, and systems architecture.

Instead of treating AI as a simple autocomplete helper, AegisAgent demonstrates how to **architect, delegate to, supervise, and validate AI agents** using structured engineering practices.

---

## 🌟 Core Features

1. **Agentic Workflows Visualizer**: Tracks a multi-agent loop (**Architect**, **Developer**, **Tester**, and **Validator**) via an animated node graph with real-time progress pulses.
2. **Model Context Protocol (MCP) Trace**: Displays visual logs showing simulated agent tool invocations (`read_spec`, `write_file`, `execute_assertions`, `analyze_ast`) to model modern tool-use protocols.
3. **In-Browser Sandbox Executor**: Compiles and runs generated JavaScript modules against synthesized test suites directly in an isolated browser harness, measuring exact execution duration.
4. **AST Code Governance Analytics**: Runs static code reviews checking for banned patterns (e.g., direct `eval` or legacy `var` declarations) and evaluates Cyclomatic Complexity, Cognitive Complexity, and comment density metrics.
5. **First-Principles Review Chat**: An interactive interface where users can "grill" the agent's code design. The agent defends its choice of data structures, algorithm complexities (e.g., Map + Doubly Linked List for LRU Cache), and event-handler safety.
6. **Gemini Live Mode (Optional)**: Includes a configuration panel where you can paste a Google Gemini API Key. When present, the workspace switches from simulated traces to running actual multi-agent prompts in real time.

---

## 🛠️ Showcase Scenarios Included

* **Robust LRU Cache**: Integrates a Map with a Doubly Linked List for $O(1)$ operations, incorporating an eviction callback bounded in a safe `try-catch` buffer.
* **Safe URL Parser & Sanitizer**: Decodes hostname whitelists and applies regex scrubbing to strip reflective XSS script tags and inline events (e.g., `onload`), avoiding unsafe custom parsers.
* **Token Bucket Rate Limiter**: Throttles incoming calls using lazy mathematical updates based on time deltas rather than CPU-polling `setInterval` threads.

---

## 💻 Tech Stack

* **Core**: React 19 + TypeScript
* **Build System**: Vite
* **Styling**: Vanilla CSS (Cyberpunk dark theme, glassmorphism layers, and custom CSS transition animations)
* **Icons**: Lucide React

---

## 🚀 Setup & Execution Instructions

### Prerequisites
* **Node.js** (v18.0.0 or higher is recommended)
* **npm** (v9.0.0 or higher)

### Setup Steps
1. Navigate to the project directory:
   ```bash
   cd AegisAgent
   ```
2. Install the project dependencies:
   ```bash
   npm install
   ```

### Running Locally
To launch the Vite development server locally, run:
```bash
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your web browser.

### Building for Production
To verify TypeScript compile safety and bundle static files for deployment, run:
```bash
npm run build
```
This generates optimized assets inside the `dist/` folder.

---

## 💡 Demonstration of Core Technical Competencies

| Technical Competency | How AegisAgent Demonstrates This |
| :--- | :--- |
| **Agentic Development Practices** | Implements and visualizes the complete loop: requirements analysis (Architect) ➔ implementation writing (Developer) ➔ validation synthesis (Tester) ➔ execution. |
| **Tool/MCP Design** | Visualizes MCP tool logs and models local sandboxed tools (`execute_code`, `analyze_ast`) as modular interfaces. |
| **Quality & Governance** | Runs automated AST analysis, checks limits (e.g. max nesting depth <= 4), and flags unsafe syntax rather than relying only on code prompts. |
| **First-Principles Thinking** | Features the "First-Principles QA Chat" prompting the agent to explain its Big-O performance, data structure choices, and security compromises. |
| **LLM API Integration** | Implements browser-side API headers to interact directly with Gemini models in live generation modes. |
