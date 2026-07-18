import { analyzeJS } from './astAnalyzer';
import type { ASTMetrics } from './astAnalyzer';

export interface TestAssertion {
  description: string;
  passed: boolean;
  message?: string;
  error?: string;
}

export interface ValidationReport {
  success: boolean;
  logs: string[];
  assertions: TestAssertion[];
  durationMs: number;
  ast: ASTMetrics;
  score: number; // 0 to 100
  checklistResults: {
    id: string;
    passed: boolean;
  }[];
}

/**
 * Executes developer code and test code inside a client-side sandbox
 */
export function runSandbox(code: string, testCode: string, checklist: any[] = []): ValidationReport {
  const logs: string[] = [];
  const assertions: TestAssertion[] = [];
  const start = performance.now();

  // Perform AST Analysis first
  const astMetrics = analyzeJS(code);

  try {
    const module = { exports: {} as any };
    const requireMock = (_path: string) => {
      return module.exports;
    };

    const consoleMock = {
      log: (...args: any[]) => {
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      },
      error: (...args: any[]) => {
        logs.push('[ERROR] ' + args.join(' '));
      },
      warn: (...args: any[]) => {
        logs.push('[WARN] ' + args.join(' '));
      }
    };

    // Execute developer code
    const devFn = new Function('module', 'exports', 'require', 'console', code);
    devFn(module, module.exports, requireMock, consoleMock);

    // Execute tests
    const describeMock = (desc: string, testFn: (assert: any) => void) => {
      logs.push(`[EXECUTION] Running test suite: "${desc}"`);
      
      const assertMock = {
        equal: (actual: any, expected: any, msg: string) => {
          const passed = actual === expected;
          assertions.push({
            description: msg || 'Check equality',
            passed,
            message: passed ? 'Passed' : `Failed: Expected "${expected}", but got "${actual}"`
          });
        },
        ok: (val: any, msg: string) => {
          const passed = !!val;
          assertions.push({
            description: msg || 'Check truthiness',
            passed,
            message: passed ? 'Passed' : 'Failed: Expected truthy value'
          });
        },
        fail: (msg: string) => {
          assertions.push({
            description: msg || 'Explicit failure assertion',
            passed: false,
            message: `Failed: ${msg}`
          });
        }
      };

      try {
        testFn(assertMock);
      } catch (err: any) {
        assertions.push({
          description: 'Harness Execution',
          passed: false,
          error: err.message || String(err)
        });
      }
    };

    const testFn = new Function('describe', 'require', 'console', testCode);
    testFn(describeMock, requireMock, consoleMock);

  } catch (err: any) {
    logs.push(`[FATAL COMPILE ERROR] ${err.message}`);
    assertions.push({
      description: 'Harness Compile',
      passed: false,
      error: err.message || String(err)
    });
  }

  const durationMs = parseFloat((performance.now() - start).toFixed(2));
  
  // Grade checklists
  const checklistResults = checklist.map(chk => {
    let passed = false;
    if (chk.checkType === 'test') {
      passed = assertions.length > 0 && assertions.every(a => a.passed);
    } else if (chk.checkType === 'ast') {
      // checking for banned rules
      passed = astMetrics.bannedPatterns.filter(p => p.toLowerCase().includes(chk.id.split('-')[1])).length === 0;
      if (chk.id === 'chk-lru-3') {
        passed = !code.includes('var ');
      }
    } else if (chk.checkType === 'pattern' && chk.targetPattern) {
      passed = code.includes(chk.targetPattern) || testCode.includes(chk.targetPattern);
    }
    return { id: chk.id, passed };
  });

  // Calculate Quality Score
  let score = 0;
  if (assertions.length > 0) {
    const passedTests = assertions.filter(a => a.passed).length;
    score += (passedTests / assertions.length) * 50; // Tests weigh 50%
  }
  
  const checklistPassedCount = checklistResults.filter(c => c.passed).length;
  if (checklist.length > 0) {
    score += (checklistPassedCount / checklist.length) * 30; // Checklist weighs 30%
  } else {
    score += 30;
  }

  // AST quality deducts for complexity or bad patterns
  let astScore = 20;
  if (astMetrics.cyclomaticComplexity > 15) astScore -= 5;
  if (astMetrics.maxNestingDepth > 4) astScore -= 5;
  astScore -= Math.min(10, astMetrics.bannedPatterns.length * 5);
  score += Math.max(0, astScore);

  score = Math.round(score);
  const success = score >= 80;

  return {
    success,
    logs,
    assertions,
    durationMs,
    ast: astMetrics,
    score,
    checklistResults
  };
}

/**
 * Call live Gemini model for generating code
 */
export async function callGemini(apiKey: string, prompt: string, systemInstruction: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.2
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini API');
  }

  return text;
}

/**
 * Runs a live AI agent loop sequence (Architect -> Developer -> Tester) using Gemini API
 */
export async function runLiveAgentWorkflow(
  apiKey: string, 
  spec: string, 
  onLog: (log: { stage: any; message: string; details?: string }) => void
): Promise<{ 'src/index.js': string; 'tests/index.test.js': string }> {
  
  // Phase 1: Architect
  onLog({
    stage: 'architect',
    message: 'Orchestrating agent. Launching Architect to define modules...',
    details: 'System prompt: Analyze specifications and design modular file hierarchy.'
  });

  const architectPrompt = `You are a Principal Software Architect. Read this spec and list key design considerations, structures, and helper functions required to implement it in JavaScript. Keep it short.
SPEC:
${spec}`;

  const architecture = await callGemini(
    apiKey, 
    architectPrompt, 
    'You outline clean OOP/functional JS software architectures based on technical specifications. Be direct.'
  );

  onLog({
    stage: 'architect',
    message: 'Architect generated blueprint.',
    details: architecture
  });

  // Phase 2: Developer
  onLog({
    stage: 'developer',
    message: 'Launching Developer Agent. Coding implementation...',
    details: 'Writing source file for src/index.js. Zero dependencies.'
  });

  const devPrompt = `Write the complete JavaScript implementation code for the spec. Return ONLY the raw JavaScript code inside markdown fences. Do NOT add explanation.
SPEC:
${spec}
ARCHITECT PLAN:
${architecture}`;

  const rawDevCode = await callGemini(
    apiKey,
    devPrompt,
    'You write pure, production-ready vanilla JavaScript modules. Export code using standard CommonJS module.exports. Do not use ES6 imports. Use let/const, no var, no eval. Return markdown codeblock only.'
  );

  const cleanCode = extractCodeBlock(rawDevCode);

  onLog({
    stage: 'developer',
    message: 'Developer completed src/index.js code.',
    details: cleanCode
  });

  // Phase 3: Tester
  onLog({
    stage: 'tester',
    message: 'Launching Tester Agent. Designing unit testing suites...',
    details: 'Writing test spec for tests/index.test.js using the specified test framework.'
  });

  const testPrompt = `Write the unit tests for this implementation of the spec.
Use the following format for writing assertions:
\`\`\`javascript
const { targetExport } = require('./src/index.js');

describe('Feature tests', (assert) => {
  assert.equal(actual, expected, 'Description of test');
  assert.ok(expression, 'Truthy description');
});
\`\`\`
Return ONLY the raw JavaScript tests code inside markdown code blocks.

DEVELOPER IMPLEMENTATION:
${cleanCode}
SPECIFICATION:
${spec}`;

  const rawTestCode = await callGemini(
    apiKey,
    testPrompt,
    'You are a QA automation agent. You write unit tests. Ensure you import using require(\'./src/index.js\') and structure using describe(\'name\', (assert) => { ... }). Return markdown code block only.'
  );

  const cleanTestCode = extractCodeBlock(rawTestCode);

  onLog({
    stage: 'tester',
    message: 'Tester completed tests/index.test.js spec.',
    details: cleanTestCode
  });

  return {
    'src/index.js': cleanCode,
    'tests/index.test.js': cleanTestCode
  };
}

function extractCodeBlock(markdown: string): string {
  const regex = /```javascript([\s\S]*?)```|```js([\s\S]*?)```|```([\s\S]*?)```/;
  const match = markdown.match(regex);
  if (match) {
    return (match[1] || match[2] || match[3] || markdown).trim();
  }
  return markdown.replace(/```/g, '').trim();
}
