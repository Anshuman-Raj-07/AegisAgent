export interface Scenario {
  id: string;
  name: string;
  shortDesc: string;
  spec: string;
  files: {
    [path: string]: string;
  };
  logs: {
    stage: 'architect' | 'developer' | 'tester' | 'executor' | 'validator';
    message: string;
    timestamp: string;
    details?: string;
  }[];
  qa: {
    id: string;
    question: string;
    answer: string;
    category: string;
  }[];
  checklist: {
    id: string;
    rule: string;
    description: string;
    checkType: 'test' | 'ast' | 'pattern';
    targetPattern?: string; // used for checking string contents
  }[];
}

export const scenarios: Scenario[] = [
  {
    id: 'lru-cache',
    name: 'Robust LRU Cache',
    shortDesc: 'A Least Recently Used cache demonstrating linked list and map integration with eviction callbacks and O(1) performance.',
    spec: `# Specification: Least Recently Used (LRU) Cache

Implement a class \`LRUCache\` with a fixed capacity that evicts the least recently used items when full.

## Requirements:
1. **Time Complexity**: Both \`get(key)\` and \`put(key, value)\` operations MUST run in O(1) average time complexity.
2. **Eviction Callback**: Allow registering an eviction listener: \`onEvict(callback)\`, where \`callback\` receives \`(key, value)\` when an item is evicted due to capacity.
3. **Data Types**: Keys are strings; values can be any type.
4. **Behavior**:
   - \`get(key)\`: Returns the value of the key if it exists, otherwise returns \`-1\`. Accessing a key updates it to "most recently used".
   - \`put(key, value)\`: Updates the value of the key if it exists, or inserts the key-value pair. If capacity is exceeded, evict the least recently used item.
   - \`size\`: Property or getter returning the current number of items.
5. **No Built-in Map-only Iterators**: Do not cheat by utilizing JS Map's insertion-order keys directly (e.g. \`map.keys().next()\`) for eviction logic. Build a true Doubly Linked List nodes map for O(1) pointer updates.`,
    files: {
      'src/index.js': `/**
 * Double Linked List Node
 */
class Node {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

/**
 * Robust LRU Cache Implementation
 * Fulfills AI-Native Engineering Spec
 */
class LRUCache {
  constructor(capacity) {
    if (typeof capacity !== 'number' || capacity <= 0) {
      throw new Error('Capacity must be a positive integer.');
    }
    this.capacity = capacity;
    this.map = new Map();
    this.evictCallback = null;

    // Dummy Head & Tail for DLL
    this.head = new Node('head', null);
    this.tail = new Node('tail', null);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * Register eviction listener
   */
  onEvict(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function.');
    }
    this.evictCallback = callback;
  }

  /**
   * Get value & mark as most recently used
   */
  get(key) {
    if (!this.map.has(key)) {
      return -1;
    }
    const node = this.map.get(key);
    this._moveToHead(node);
    return node.value;
  }

  /**
   * Insert/update pair, evict if capacity exceeded
   */
  put(key, value) {
    if (this.map.has(key)) {
      const node = this.map.get(key);
      node.value = value;
      this._moveToHead(node);
    } else {
      const newNode = new Node(key, value);
      this.map.set(key, newNode);
      this._addNode(newNode);

      if (this.map.size > this.capacity) {
        // Evict LRU from tail
        const tailNode = this.tail.prev;
        this._removeNode(tailNode);
        this.map.delete(tailNode.key);

        // Fire callback if registered
        if (this.evictCallback) {
          try {
            this.evictCallback(tailNode.key, tailNode.value);
          } catch (e) {
            // Absorb listener exception to preserve core stability
            // standard engineering practice
          }
        }
      }
    }
  }

  get size() {
    return this.map.size;
  }

  // DLL Internal helpers
  _addNode(node) {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
  }

  _removeNode(node) {
    const prev = node.prev;
    const next = node.next;
    prev.next = next;
    next.prev = prev;
  }

  _moveToHead(node) {
    this._removeNode(node);
    this._addNode(node);
  }
}

module.exports = { LRUCache };`,
      'tests/index.test.js': `const { LRUCache } = require('./src/index.js');

describe('LRU Cache Core Functionality', (assert) => {
  // Test 1: Basic Get & Put
  const cache = new LRUCache(2);
  cache.put('a', 1);
  cache.put('b', 2);
  assert.equal(cache.get('a'), 1, 'Retrieve inserted key a');
  
  // Test 2: Eviction on Capacity
  cache.put('c', 3); // evicts 'b' (a was accessed last)
  assert.equal(cache.get('b'), -1, 'Key b should be evicted');
  assert.equal(cache.get('c'), 3, 'Key c should exist');
  assert.equal(cache.get('a'), 1, 'Key a should still exist');

  // Test 3: Eviction Callback
  let evictedKey = null;
  let evictedVal = null;
  const cbCache = new LRUCache(2);
  cbCache.onEvict((k, v) => {
    evictedKey = k;
    evictedVal = v;
  });
  cbCache.put('x', 10);
  cbCache.put('y', 20);
  cbCache.put('z', 30); // evicts 'x'
  assert.equal(evictedKey, 'x', 'Eviction callback received key');
  assert.equal(evictedVal, 10, 'Eviction callback received value');
});`
    },
    logs: [
      {
        stage: 'architect',
        timestamp: '10:02:14 AM',
        message: 'Parsing requirements from spec.md...',
        details: 'Identified core constraint: O(1) time complexity for get/put. This invalidates standard array-scanning and demands a Doubly Linked List (DLL) linked to a Hash Map.'
      },
      {
        stage: 'architect',
        timestamp: '10:02:15 AM',
        message: 'Designing system components and MCP targets...',
        details: 'Plan:\n- Component 1: `Node` data structure (prev, next pointers).\n- Component 2: `LRUCache` class mapping keys to Node references.\n- Component 3: Safe execution boundary preventing listener callbacks from crashing the core put operation.'
      },
      {
        stage: 'developer',
        timestamp: '10:02:16 AM',
        message: 'Calling MCP write_file for `src/index.js`...',
        details: 'Writing LRUCache class and DLL helper functions: _addNode, _removeNode, _moveToHead. Encapsulating capacity exceptions.'
      },
      {
        stage: 'developer',
        timestamp: '10:02:17 AM',
        message: 'Applying code governance templates...',
        details: 'Checking for banned patterns: verified no use of `eval` or `var` variables. Ensured clean module exports.'
      },
      {
        stage: 'tester',
        timestamp: '10:02:18 AM',
        message: 'Writing integration and boundary test suites in `tests/index.test.js`...',
        details: 'Creating assertion test blocks to verify:\n1. Basic retrieval\n2. Capacity boundary evictions\n3. Eviction listener callbacks and error recovery'
      },
      {
        stage: 'executor',
        timestamp: '10:02:19 AM',
        message: 'Executing tests inside browser sandbox worker...',
        details: 'Mounting modules and executing test suite. Execution time: 4.2ms. All assertions passed.'
      },
      {
        stage: 'validator',
        timestamp: '10:02:20 AM',
        message: 'Running AST Quality Governance checks...',
        details: 'Analyzing complexity metrics:\n- Cyclomatic Complexity: 10\n- Cognitive Complexity: 7\n- Max Nesting Depth: 4\n- Code Governance: 100% compliant'
      }
    ],
    checklist: [
      {
        id: 'chk-lru-1',
        rule: 'O(1) Access Check (Map+DLL)',
        description: 'Verify implementation uses both a Map lookup and a custom Node/pointers linked list instead of scan arrays.',
        checkType: 'pattern',
        targetPattern: 'this.map.get'
      },
      {
        id: 'chk-lru-2',
        rule: 'Safety Catch on Callback',
        description: 'Ensures that if the user-provided evict callback crashes, the put() method absorbs the error instead of breaking execution.',
        checkType: 'pattern',
        targetPattern: 'try'
      },
      {
        id: 'chk-lru-3',
        rule: 'No var declaration',
        description: 'Verifies block-scoped const/let are used, complying with modern ES6 guidelines.',
        checkType: 'ast'
      },
      {
        id: 'chk-lru-4',
        rule: 'Unit Test Assertions Passed',
        description: 'Verifies all unit assertions run and pass successfully.',
        checkType: 'test'
      }
    ],
    qa: [
      {
        id: 'lru-q1',
        category: 'First-Principles Design',
        question: 'Why did you combine a Doubly Linked List with a Map? Why not just use a single array or a JS Map?',
        answer: 'If we use a standard Array, we can maintain eviction order by pushing items to the end and slicing from the beginning. However, updating an existing key requires finding its index, which is O(n), violating the spec. If we use a JS Map, its iterators preserve insertion order, but updating a key requires deleting and re-inserting it. While that works in modern engines, relying on standard library iteration order is fragile. A Doubly Linked List allows us to detach any node from its current position and append it to the head in O(1) time simply by adjusting 4 pointers, while the Map maps keys directly to DLL nodes in O(1) lookup.'
      },
      {
        id: 'lru-q2',
        category: 'Governance & Error Boundaries',
        question: 'Why did you wrap the eviction callback trigger in a try-catch block? Is it not the caller\'s responsibility to write safe code?',
        answer: 'In AI-Native engineering, structural quality and governance are paramount. A callback is an external boundary. If an external client registers a callback that throws an exception, letting that exception propagate will crash our core `put` operation. This violates the principle of high availability and isolation. A robust system should insulate its core operations from failures in optional event handlers.'
      },
      {
        id: 'lru-q3',
        category: 'Data Structures',
        question: 'How does your LRUCache handle concurrency, and what adjustments would be needed for a thread-safe implementation in languages like Java?',
        answer: 'Since Javascript is single-threaded, concurrency issues like race conditions do not arise in the event loop. However, in a multi-threaded language like Java or C#, multiple threads could call `put` concurrently, causing memory corruption in the DLL pointers (e.g., creating loops or losing references). To make it thread-safe, we would use mutual exclusion locking (e.g., `synchronized` blocks in Java or `ReentrantReadWriteLock`). Alternatively, we could use concurrent data structures, like Java\'s `ConcurrentHashMap` combined with thread-safe pointer swapping or segment locking, to minimize lock contention.'
      }
    ]
  },
  {
    id: 'safe-url-parser',
    name: 'Safe URL Sanitizer & Parser',
    shortDesc: 'A parser designed to decode URLs, enforce strict protocol and hostname whitelisting, and block XSS / injection attacks.',
    spec: `# Specification: Safe URL Sanitizer & Parser

Develop a secure utility function or class \`SafeURLParser\` that parses URL components and filters malicious injections.

## Requirements:
1. **Validation & Whitelist**: Allow instantiation with a whitelist of acceptable domains (e.g. \`['secure-app.com', 'google.com']\`).
2. **XSS / Protocol Sanitization**:
   - Only allow safe protocols: \`http:\` and \`https:\`.
   - Reject dangerous schemes (e.g., \`javascript:\`, \`data:\`, \`vbscript:\`) by throwing an error.
3. **Query Parameter Cleaning**:
   - Strip out malicious HTML tags or script injection strings (like \`<script>\` or \`onload=...\`) from query parameters.
4. **Parsed Components Output**:
   - Provide getter properties: \`protocol\`, \`hostname\`, \`pathname\`, \`queryParams\` (as a safe key-value object).
5. **Robust Parsing**: Do not crash on malformed inputs; raise structured custom errors.`,
    files: {
      'src/index.js': `/**
 * Safe URL Sanitizer & Parser
 * Epicenter of security audits and strict validation
 */
class SafeURLParser {
  constructor(urlString, allowedDomains = []) {
    this.rawUrl = urlString;
    this.allowedDomains = allowedDomains.map(d => d.toLowerCase());
    
    this.parsedProtocol = '';
    this.parsedHostname = '';
    this.parsedPathname = '';
    this.parsedParams = {};

    this._parseAndValidate();
  }

  _parseAndValidate() {
    let urlObj;
    try {
      urlObj = new URL(this.rawUrl);
    } catch (e) {
      throw new Error('Malformed URL input');
    }

    // 1. Enforce Safe Protocols
    const proto = urlObj.protocol.toLowerCase();
    if (proto !== 'http:' && proto !== 'https:') {
      throw new Error(\`Forbidden protocol: \${proto}. Only http: and https: are allowed.\`);
    }
    this.parsedProtocol = proto;

    // 2. Domain Whitelisting Check
    const host = urlObj.hostname.toLowerCase();
    if (this.allowedDomains.length > 0) {
      const isAllowed = this.allowedDomains.some(domain => {
        // Allow exact matches or subdomains (e.g. sub.secure-app.com matching secure-app.com)
        return host === domain || host.endsWith('.' + domain);
      });
      if (!isAllowed) {
        throw new Error(\`Access Denied: Hostname \${host} is not whitelisted.\`);
      }
    }
    this.parsedHostname = host;
    this.parsedPathname = urlObj.pathname;

    // 3. Sanitizing Query Parameters
    const params = {};
    urlObj.searchParams.forEach((value, key) => {
      const cleanKey = this._sanitizeString(key);
      const cleanValue = this._sanitizeString(value);
      params[cleanKey] = cleanValue;
    });
    this.parsedParams = params;
  }

  /**
   * Remove dangerous XSS elements
   */
  _sanitizeString(str) {
    if (!str) return '';
    let clean = str;

    // Remove tags like <script>...</script>
    clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove individual tags
    clean = clean.replace(/<[^>]+>/g, '');

    // Prevent javascript: links inside query attributes
    if (clean.toLowerCase().includes('javascript:')) {
      clean = '[sanitized]';
    }

    // Strip inline execution attributes (e.g. onload, onerror)
    clean = clean.replace(/\bon[a-z]+\s*=\s*['"][^'"]*['"]/gi, '');
    clean = clean.replace(/\bon[a-z]+\s*=\s*[^\s>]+/gi, '');

    return clean.trim();
  }

  get protocol() { return this.parsedProtocol; }
  get hostname() { return this.parsedHostname; }
  get pathname() { return this.parsedPathname; }
  get queryParams() { return this.parsedParams; }
}

module.exports = { SafeURLParser };`,
      'tests/index.test.js': `const { SafeURLParser } = require('./src/index.js');

describe('Safe URL Parser Security Audits', (assert) => {
  // Test 1: Whitelist Enforcement
  try {
    new SafeURLParser('https://malicious-site.com', ['secure-app.com']);
    assert.fail('Should have blocked unwhitelisted host');
  } catch (e) {
    assert.ok(e.message.includes('Access Denied'), 'Blocked malicious host successfully');
  }

  // Test 2: Protocol Security
  try {
    new SafeURLParser('javascript:alert("XSS")', ['secure-app.com']);
    assert.fail('Should block javascript: scheme');
  } catch (e) {
    assert.ok(e.message.includes('Malformed URL') || e.message.includes('Forbidden protocol'), 'Blocked dangerous script protocol');
  }

  // Test 3: XSS Query Parameter Stripping
  const parser = new SafeURLParser('https://secure-app.com/search?q=<script>alert("hacked")</script>&ref=home&attr=onload="x()"');
  assert.equal(parser.queryParams.q, '', 'Stripped script tags completely');
  assert.equal(parser.queryParams.ref, 'home', 'Kept safe parameters intact');
  assert.ok(!parser.queryParams.attr || !parser.queryParams.attr.includes('onload'), 'Stripped inline onload events');
});`
    },
    logs: [
      {
        stage: 'architect',
        timestamp: '11:15:30 AM',
        message: 'Analyzing secure sanitization requirements...',
        details: 'Identified attack vectors: Protocol spoofing, host hijacking (e.g. secure-app.com.phishing.com), and reflective XSS through query values.'
      },
      {
        stage: 'developer',
        timestamp: '11:15:31 AM',
        message: 'Writing parser engine in `src/index.js`...',
        details: 'Utilizing built-in browser-native `URL` object as a first-principles parser base (highly reliable compared to custom regex parsers). Appending regex scrubbing for HTML tags and event listeners.'
      },
      {
        stage: 'developer',
        timestamp: '11:15:32 AM',
        message: 'Adding subdomain whitelisting checks...',
        details: 'Ensuring correct domain checking logic: prevents `mysecure-app.com` from bypassing `secure-app.com` while correctly allowing `sub.secure-app.com`.'
      },
      {
        stage: 'tester',
        timestamp: '11:15:33 AM',
        message: 'Composing security assertions in `tests/index.test.js`...',
        details: 'Created test cases covering DNS/Domain whitelists, javascript schemes, and raw script tag query vectors.'
      },
      {
        stage: 'executor',
        timestamp: '11:15:34 AM',
        message: 'Executing sandbox test suite...',
        details: 'Running suite. 3 of 3 unit tests passed without exceptions.'
      },
      {
        stage: 'validator',
        timestamp: '11:15:35 AM',
        message: 'Evaluating complexity and risk indicators...',
        details: 'Analyzed: Cyclomatic Complexity = 8, Nesting depth = 3. Checks validated: protocol restriction works.'
      }
    ],
    checklist: [
      {
        id: 'chk-url-1',
        rule: 'Whitelist Subdomain Safety',
        description: 'Verify domain matching logic checks boundaries properly (doesn\'t allow custom prefixes like phishingsecure-app.com).',
        checkType: 'pattern',
        targetPattern: "endsWith('.' +"
      },
      {
        id: 'chk-url-2',
        rule: 'Protocol Restriction',
        description: 'Confirm that only http: and https: protocols are permitted.',
        checkType: 'pattern',
        targetPattern: "'http:'"
      },
      {
        id: 'chk-url-3',
        rule: 'HTML sanitization regex present',
        description: 'Verifies the AST code includes pattern matching filters to strip out script nodes.',
        checkType: 'pattern',
        targetPattern: 'replace'
      },
      {
        id: 'chk-url-4',
        rule: 'Test coverage passes',
        description: 'Verifies test harness runs all validation assertions.',
        checkType: 'test'
      }
    ],
    qa: [
      {
        id: 'url-q1',
        category: 'Security Engineering',
        question: 'Why did you use the native `URL` class instead of parsing the string with a regular expression?',
        answer: 'Parsing URLs with custom regular expressions is a classic source of security vulnerabilities (such as ReDoS attacks, or bypasses involving backslashes, userinfo fields, and port formatting). Native browser engines use highly optimized, thoroughly tested parser standards (WHATWG URL standard) that handle complex edge cases consistently. Designing an AI agent to build a custom regex parser when a native, secure standard exists is bad engineering. I utilized `new URL()` as a safe base and built sanitization overlays on top.'
      },
      {
        id: 'url-q2',
        category: 'First-Principles Coding',
        question: 'Explain the vulnerability in checking allowed domains using `host.includes(domain)` instead of your logic.',
        answer: 'If we check access via `host.includes("secure-app.com")`, an attacker can bypass this restriction by registering `secure-app.com.attacker.com` or `fake-secure-app.com`. Both hostnames contain the substring "secure-app.com", so `includes` evaluates to true. My implementation checks if the hostname is exactly equal to the whitelisted domain, or ends with `.` + the domain, ensuring that only actual subdomains of the target domain are authorized.'
      },
      {
        id: 'url-q3',
        category: 'Governance & Auditing',
        question: 'Does your sanitizer cover DOM-based XSS if the query parameters are directly injected into an innerHTML sink? How could this be improved?',
        answer: 'My sanitizer strips `<script>` tags, inline event attributes (`onload`), and `javascript:` schemes. However, regular-expression-based sanitization is notoriously difficult to make 100% bulletproof because attackers continuously find new obfuscation formats (e.g. Unicode encoding, nested tags). If the client injects these parameter strings directly into an `innerHTML` sink, there is still risk. To improve this, the core architecture should enforce context-aware encoding (like utilizing textContent, or using APIs like `DOMPurify` / the Trusted Types API in the browser) rather than relying solely on server/utility-side regex scrubbing.'
      }
    ]
  },
  {
    id: 'rate-limiter',
    name: 'Token Bucket Rate Limiter',
    shortDesc: 'A rate limiting utility modeled after the Token Bucket algorithm to control request limits with time-based replenishment.',
    spec: `# Specification: Token Bucket Rate Limiter

Create a utility class \`TokenBucket\` that throttles api actions based on predefined capacity constraints.

## Requirements:
1. **Bucket Configuration**: Allow setting \`capacity\` (maximum tokens) and \`refillRate\` (number of tokens replenished per second).
2. **Dynamic Replenishment**: Tokens replenish gradually over time. Do NOT run a persistent \`setInterval\` background loop to add tokens (this wastes CPU cycles and leaks resources). Calculate token replenishment lazily during incoming requests.
3. **Throttling Action**:
   - Implement method \`consume(tokens = 1)\`. Returns \`true\` if the bucket has enough tokens, deducts them, and allows the request. Returns \`false\` otherwise.
4. **Precision**: Handle fractional tokens accurately; use time delta timestamps in milliseconds.`,
    files: {
      'src/index.js': `/**
 * Token Bucket Rate Limiter
 * Resource-friendly lazy replenishment implementation
 */
class TokenBucket {
  constructor(capacity, refillRate) {
    if (capacity <= 0 || refillRate <= 0) {
      throw new Error('Capacity and refillRate must be positive numbers');
    }
    this.capacity = capacity;
    this.refillRate = refillRate; // Tokens per second
    
    this.tokens = capacity;
    this.lastRefillTime = Date.now();
  }

  /**
   * Consume tokens from the bucket
   * Refills lazily before checking capacity
   */
  consume(tokensToConsume = 1) {
    if (tokensToConsume <= 0) {
      throw new Error('Tokens to consume must be a positive number');
    }

    this._refill();

    if (this.tokens >= tokensToConsume) {
      this.tokens -= tokensToConsume;
      return true;
    }

    return false;
  }

  /**
   * Lazy update token count based on timestamp delta
   */
  _refill() {
    const now = Date.now();
    const deltaMs = now - this.lastRefillTime;
    
    if (deltaMs > 0) {
      // Calculate token replenishment: (rate * ms) / 1000
      const tokensToAdd = (this.refillRate * deltaMs) / 1000;
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefillTime = now;
    }
  }

  /**
   * Get current token count
   */
  getAvailableTokens() {
    this._refill();
    return this.tokens;
  }
}

module.exports = { TokenBucket };`,
      'tests/index.test.js': `const { TokenBucket } = require('./src/index.js');

describe('Token Bucket Rate Limiter Throttling', (assert) => {
  // Test 1: Basic consumption
  const bucket = new TokenBucket(5, 1); // capacity 5, 1 token/sec
  assert.ok(bucket.consume(3), 'Allowed consumption of 3 tokens');
  assert.equal(Math.round(bucket.getAvailableTokens()), 2, '2 tokens remaining');

  // Test 2: Rejecting over-limit requests
  assert.ok(!bucket.consume(4), 'Blocked consumption of 4 tokens (only 2 left)');

  // Test 3: Lazy replenishment
  // Mock time advancement by overriding date variables internally in the test assertion
  const originalNow = Date.now;
  let simulatedTime = Date.now();
  Date.now = () => simulatedTime;

  const dynamicBucket = new TokenBucket(10, 2); // 2 tokens/sec
  assert.ok(dynamicBucket.consume(10), 'Consumed entire bucket');
  
  // Advance time by 2.5 seconds (should replenish 5 tokens)
  simulatedTime += 2500;
  
  assert.equal(dynamicBucket.getAvailableTokens(), 5, 'Bucket replenished 5 tokens after 2.5s');
  assert.ok(dynamicBucket.consume(3), 'Allows consumption of replenished tokens');
  
  // Restore mock
  Date.now = originalNow;
});`
    },
    logs: [
      {
        stage: 'architect',
        timestamp: '02:40:01 PM',
        message: 'Reviewing rate limiting requirements...',
        details: 'Critical constraint: No background setInterval threads. Setting active loops for thousands of rate limiters leaks memory and increases event loop blockages.'
      },
      {
        stage: 'developer',
        timestamp: '02:40:02 PM',
        message: 'Writing TokenBucket algorithm with lazy refills...',
        details: 'Implementing _refill() calculation: tokensToAdd = (refillRate * timeDelta) / 1000. Storing timestamps.'
      },
      {
        stage: 'tester',
        timestamp: '02:40:03 PM',
        message: 'Writing time-simulated tests...',
        details: 'Mocking global Date.now in tests/index.test.js to advance virtual clock by 2500ms and verify token levels.'
      },
      {
        stage: 'executor',
        timestamp: '02:40:04 PM',
        message: 'Executing sandbox test suite...',
        details: 'Virtual clock tick test completed. 3 assertions verified. Runtime: 1.1ms.'
      },
      {
        stage: 'validator',
        timestamp: '02:40:05 PM',
        message: 'Checking for active thread usage...',
        details: 'AST search complete: Zero matches for `setInterval` or `setTimeout` in codebase. Performance is optimal.'
      }
    ],
    checklist: [
      {
        id: 'chk-limit-1',
        rule: 'No setInterval background loops',
        description: 'Ensures the codebase refills tokens lazily when accessed, avoiding active CPU polling.',
        checkType: 'pattern',
        targetPattern: 'Date.now()'
      },
      {
        id: 'chk-limit-2',
        rule: 'Fractional Token Math',
        description: 'Verify token math handles decimal values (doesn\'t floor values prematurely).',
        checkType: 'pattern',
        targetPattern: 'tokensToAdd'
      },
      {
        id: 'chk-limit-3',
        rule: 'Virtual clock simulation test',
        description: 'Assert that unit tests mock the clock boundary condition correctly.',
        checkType: 'pattern',
        targetPattern: 'simulatedTime'
      },
      {
        id: 'chk-limit-4',
        rule: 'Test suite passed',
        description: 'Check that all rate limiter tests pass successfully.',
        checkType: 'test'
      }
    ],
    qa: [
      {
        id: 'limit-q1',
        category: 'Resource Optimization',
        question: 'Why did you choose lazy replenishment over running a standard `setInterval` loop in the constructor?',
        answer: 'In professional software systems, we might instantiate thousands of rate limiters (e.g. one for each user session or IP address). If each rate limiter creates a active timer via `setInterval`, we would have thousands of active timer callbacks in the JavaScript event loop. This degrades CPU efficiency, blocks garbage collection, and creates memory leaks. Lazy replenishment calculates the token count mathematically only when a request is made, converting an O(n) background processing overhead into a simple O(1) mathematical subtraction during active operations.'
      },
      {
        id: 'limit-q2',
        category: 'Algorithmic Precision',
        question: 'What happens if a request arrives at exactly the same millisecond as the last request? How does your code handle fractional token replenishments?',
        answer: 'If a request arrives at the same millisecond, `deltaMs` is `0`, so `tokensToAdd` is `0`. The tokens are not replenished, and the bucket behaves correctly based on its current balance. For fractional tokens, my code does not round or floor values until they are consumed, using double-precision floats. This ensures that if the refill rate is `1.5` tokens/sec, and `500ms` passes, we get exactly `0.75` tokens.'
      },
      {
        id: 'limit-q3',
        category: 'Scale Architecture',
        question: 'How would you scale this Token Bucket Rate Limiter across a distributed cluster of servers?',
        answer: 'A local in-memory token bucket cannot handle rate limiting across a distributed cluster of API servers, because subsequent requests from the same user could hit different server nodes. To scale this, we must externalize the rate limiting state. A common production architecture uses Redis. We can write a Redis Lua script that implements the exact same lazy token bucket math. By executing it inside Redis, we get atomic read-and-write operations (preventing race conditions) and a centralized state store that all API servers can access in sub-millisecond times.'
      }
    ]
  }
];
