export interface ASTMetrics {
  linesOfCode: number;
  commentLines: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  functionsCount: number;
  classesCount: number;
  maxNestingDepth: number;
  bannedPatterns: string[];
}

export function analyzeJS(code: string): ASTMetrics {
  const lines = code.split('\n');
  let linesOfCode = 0;
  let commentLines = 0;
  let cyclomaticComplexity = 1; // base complexity
  let functionsCount = 0;
  let classesCount = 0;
  let maxNestingDepth = 0;
  let currentDepth = 0;
  const bannedPatterns: string[] = [];

  // Static audits
  if (code.includes('eval(') || code.includes('eval (')) {
    bannedPatterns.push('Security Alert: Usage of eval() is banned.');
  }
  if (/\bvar\b/.test(code)) {
    bannedPatterns.push('Style Alert: Banned "var" declaration; use "let" or "const" instead.');
  }
  if (code.includes('console.log') && !code.includes('// console.log')) {
    bannedPatterns.push('Log Alert: console.log should not be left in production code; use structured logger.');
  }
  if (code.includes('debugger;')) {
    bannedPatterns.push('Debug Alert: "debugger" statement left in code.');
  }

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check comments
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.endsWith('*/')) {
      commentLines++;
      continue;
    } else {
      linesOfCode++;
    }

    // Complexity counts:
    // If statements
    const ifMatches = trimmed.match(/\bif\b/g);
    if (ifMatches) cyclomaticComplexity += ifMatches.length;

    // Loops (for, while, do)
    const loopMatches = trimmed.match(/\b(for|while|do)\b/g);
    if (loopMatches) cyclomaticComplexity += loopMatches.length;

    // Switch cases
    const caseMatches = trimmed.match(/\bcase\b/g);
    if (caseMatches) cyclomaticComplexity += caseMatches.length;

    // Catch blocks
    const catchMatches = trimmed.match(/\bcatch\b/g);
    if (catchMatches) cyclomaticComplexity += catchMatches.length;

    // Logical branch operators
    const logicalMatches = trimmed.match(/(&&|\|\||\?\?)/g);
    if (logicalMatches) cyclomaticComplexity += logicalMatches.length;

    // Ternary operator
    const ternaryMatches = trimmed.match(/\s\?\s/g);
    if (ternaryMatches) cyclomaticComplexity += ternaryMatches.length;

    // Functions
    const funcMatches = trimmed.match(/\b(function)\b/g) || trimmed.match(/=>/g);
    if (funcMatches) functionsCount += funcMatches.length;

    // Classes
    const classMatches = trimmed.match(/\b(class)\b/g);
    if (classMatches) classesCount += classMatches.length;

    // Depth checks
    for (let char of trimmed) {
      if (char === '{') {
        currentDepth++;
        if (currentDepth > maxNestingDepth) {
          maxNestingDepth = currentDepth;
        }
      } else if (char === '}') {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }
  }

  // Calculate a loose cognitive complexity
  const cognitiveComplexity = Math.max(
    1,
    Math.round(
      (cyclomaticComplexity - 1) * 0.75 + 
      (maxNestingDepth > 2 ? (maxNestingDepth - 2) * 1.5 : 0)
    )
  );

  return {
    linesOfCode,
    commentLines,
    cyclomaticComplexity,
    cognitiveComplexity,
    functionsCount,
    classesCount,
    maxNestingDepth,
    bannedPatterns,
  };
}
