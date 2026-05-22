/**
 * Real DSA Problems Database
 * Based on Striver A2Z, Blind 75, NeetCode 150, and top interview prep sheets
 * Each problem is complete with examples, solutions, and explanations
 */

export const DSA_PROBLEMS = [
  // ===== ARRAYS =====
  {
    id: "array-001",
    topic: "Arrays",
    title: "Two Sum",
    difficulty: "Easy",
    companies: ["Amazon", "Google", "Meta", "Microsoft"],
    description: `Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.

You may assume that each input has exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    constraints: `
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.`,
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "nums[0] + nums[1] == 9, so we return [0, 1].",
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
        explanation: "nums[1] + nums[2] == 6, so we return [1, 2].",
      },
    ],
    starterCode: `function twoSum(nums, target) {
  // Your code here
  return [];
}`,
    bruteForceSolution: `// Brute Force: Check all pairs
function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}
// Time: O(n²), Space: O(1)`,
    optimizedSolution: `// Optimal: Use HashMap
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}
// Time: O(n), Space: O(n)`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    topicTags: ["Array", "Hash Table"],
    keyLearnings: [
      "Hash tables for complement searching",
      "Single pass solution",
      "Index tracking",
    ],
  },

  {
    id: "array-002",
    topic: "Arrays",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    companies: ["Amazon", "Google", "Meta"],
    description: `You are given an array prices where prices[i] is the price of a given stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.`,
    constraints: `
- 1 <= prices.length <= 10^5
- 0 <= prices[i] <= 10^4`,
    examples: [
      {
        input: "prices = [7,1,5,3,6,4]",
        output: "5",
        explanation:
          "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.",
      },
      {
        input: "prices = [7,6,4,3,1]",
        output: "0",
        explanation:
          "In this case, no transactions are done and the max profit = 0.",
      },
    ],
    starterCode: `function maxProfit(prices) {
  // Your code here
  return 0;
}`,
    bruteForceSolution: `// Brute Force: Check all pairs
function maxProfit(prices) {
  let max = 0;
  for (let i = 0; i < prices.length; i++) {
    for (let j = i + 1; j < prices.length; j++) {
      max = Math.max(max, prices[j] - prices[i]);
    }
  }
  return max;
}
// Time: O(n²), Space: O(1)`,
    optimizedSolution: `// Optimal: Single pass tracking min
function maxProfit(prices) {
  let minPrice = prices[0];
  let maxProfit = 0;
  for (let i = 1; i < prices.length; i++) {
    maxProfit = Math.max(maxProfit, prices[i] - minPrice);
    minPrice = Math.min(minPrice, prices[i]);
  }
  return maxProfit;
}
// Time: O(n), Space: O(1)`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    topicTags: ["Array", "Dynamic Programming"],
    keyLearnings: [
      "Single pass algorithms",
      "Track minimum efficiently",
      "State tracking",
    ],
  },

  {
    id: "array-003",
    topic: "Arrays",
    title: "Merge Intervals",
    difficulty: "Medium",
    companies: ["Amazon", "Google", "Microsoft", "Apple"],
    description: `Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals.`,
    constraints: `
- 1 <= intervals.length <= 10^4
- intervals[i].length == 2
- 0 <= starti <= endi <= 10^4`,
    examples: [
      {
        input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        output: "[[1,6],[8,10],[15,18]]",
        explanation: "Since intervals [1,3] and [2,6] overlap, merge them into [1,6].",
      },
      {
        input: "intervals = [[1,4],[4,5]]",
        output: "[[1,5]]",
        explanation:
          "Intervals [1,4] and [4,5] are considered overlapping.",
      },
    ],
    starterCode: `function merge(intervals) {
  // Your code here
  return [];
}`,
    optimizedSolution: `// Sort by start, then merge overlapping
function merge(intervals) {
  if (intervals.length <= 1) return intervals;
  
  // Sort by start time
  intervals.sort((a, b) => a[0] - b[0]);
  
  const result = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = result[result.length - 1];
    const current = intervals[i];
    
    if (current[0] <= last[1]) {
      // Overlapping - merge
      last[1] = Math.max(last[1], current[1]);
    } else {
      // Non-overlapping - add new interval
      result.push(current);
    }
  }
  return result;
}
// Time: O(n log n), Space: O(n)`,
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(n)",
    topicTags: ["Array", "Sorting"],
    keyLearnings: [
      "Sorting enables merging",
      "Overlap detection",
      "Greedy merging strategy",
    ],
  },

  // ===== LINKED LISTS =====
  {
    id: "linkedlist-001",
    topic: "Linked Lists",
    title: "Reverse Linked List",
    difficulty: "Easy",
    companies: ["Amazon", "Facebook", "Google", "Microsoft"],
    description: `Given the head of a singly linked list, reverse the list, and return the reversed list.`,
    constraints: `
- The number of nodes in the list is the range [0, 5000].
- -5000 <= Node.val <= 5000`,
    examples: [
      {
        input: "head = [1,2,3,4,5]",
        output: "[5,4,3,2,1]",
      },
      {
        input: "head = [1,2]",
        output: "[2,1]",
      },
      {
        input: "head = []",
        output: "[]",
      },
    ],
    starterCode: `function reverseList(head) {
  // Your code here
  return null;
}`,
    optimizedSolution: `// Iterative approach
function reverseList(head) {
  let prev = null;
  let current = head;
  
  while (current !== null) {
    const next = current.next; // Store next node
    current.next = prev; // Reverse the link
    prev = current; // Move prev forward
    current = next; // Move current forward
  }
  
  return prev; // New head
}
// Time: O(n), Space: O(1)`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1) iterative, O(n) recursive",
    topicTags: ["Linked List"],
    keyLearnings: [
      "Pointer manipulation",
      "Reversing links",
      "Iterative vs recursive",
    ],
  },

  // ===== TREES =====
  {
    id: "tree-001",
    topic: "Trees",
    title: "Invert Binary Tree",
    difficulty: "Easy",
    companies: ["Amazon", "Google", "Microsoft"],
    description: `Given the root of a binary tree, invert the tree, and return its root.`,
    constraints: `
- The number of nodes in the tree is in the range [0, 100].
- -100 <= Node.val <= 100`,
    examples: [
      {
        input: "root = [4,2,7,1,3,6,9]",
        output: "[4,7,2,9,6,3,1]",
      },
      {
        input: "root = [2,1,3]",
        output: "[2,3,1]",
      },
    ],
    starterCode: `function invertTree(root) {
  // Your code here
  return null;
}`,
    optimizedSolution: `// Recursive approach
function invertTree(root) {
  if (root === null) return null;
  
  // Swap children
  const temp = root.left;
  root.left = root.right;
  root.right = temp;
  
  // Recursively invert subtrees
  invertTree(root.left);
  invertTree(root.right);
  
  return root;
}
// Time: O(n), Space: O(h) where h is height`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(h) where h is height",
    topicTags: ["Binary Tree"],
    keyLearnings: ["Tree traversal", "Recursive tree manipulation"],
  },

  // ===== DYNAMIC PROGRAMMING =====
  {
    id: "dp-001",
    topic: "Dynamic Programming",
    title: "Climbing Stairs",
    difficulty: "Easy",
    companies: ["Amazon", "Google", "Meta"],
    description: `You are climbing a staircase. It takes n steps to reach the top.

Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?`,
    constraints: `
- 1 <= n <= 45`,
    examples: [
      {
        input: "n = 2",
        output: "2",
        explanation:
          "1. 1 step + 1 step\\n2. 2 steps",
      },
      {
        input: "n = 3",
        output: "3",
        explanation:
          "1. 1 step + 1 step + 1 step\\n2. 1 step + 2 steps\\n3. 2 steps + 1 step",
      },
    ],
    starterCode: `function climbStairs(n) {
  // Your code here
  return 0;
}`,
    optimizedSolution: `// DP: Similar to Fibonacci
function climbStairs(n) {
  if (n <= 2) return n;
  
  let prev2 = 1, prev1 = 2;
  for (let i = 3; i <= n; i++) {
    const current = prev1 + prev2;
    prev2 = prev1;
    prev1 = current;
  }
  return prev1;
}
// Time: O(n), Space: O(1)`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    topicTags: ["Dynamic Programming"],
    keyLearnings: ["DP recurrence relations", "Space optimization"],
  },

  {
    id: "dp-002",
    topic: "Dynamic Programming",
    title: "Coin Change",
    difficulty: "Medium",
    companies: ["Amazon", "Google", "Microsoft", "Apple"],
    description: `You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.

You may assume that you have an infinite number of each kind of coin.`,
    constraints: `
- 1 <= coins.length <= 12
- 1 <= coins[i] <= 2^31 - 1
- 0 <= amount <= 10^4`,
    examples: [
      {
        input: "coins = [1,2,5], amount = 5",
        output: "1",
        explanation: "5 = 5, only one coin needed.",
      },
      {
        input: "coins = [2], amount = 3",
        output: "-1",
        explanation: "No combination of coins make amount 3.",
      },
      {
        input: "coins = [10], amount = 10",
        output: "1",
      },
    ],
    starterCode: `function coinChange(coins, amount) {
  // Your code here
  return -1;
}`,
    optimizedSolution: `// BFS/DP approach
function coinChange(coins, amount) {
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  
  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }
  
  return dp[amount] === Infinity ? -1 : dp[amount];
}
// Time: O(amount * coins.length), Space: O(amount)`,
    timeComplexity: "O(amount * coins.length)",
    spaceComplexity: "O(amount)",
    topicTags: ["Dynamic Programming"],
    keyLearnings: ["DP state definition", "Optimal substructure"],
  },

  // ===== BACKTRACKING =====
  {
    id: "backtrack-001",
    topic: "Backtracking",
    title: "N-Queens",
    difficulty: "Hard",
    companies: ["Amazon", "Google", "Microsoft"],
    description: `The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other.

Given an integer n, return all distinct solutions to the n-queens puzzle. You may return the answer in any order.`,
    constraints: `
- 1 <= n <= 9`,
    examples: [
      {
        input: "n = 4",
        output:
          '[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]',
        explanation: "There exist two distinct solutions to the 4-queens puzzle.",
      },
    ],
    starterCode: `function solveNQueens(n) {
  // Your code here
  return [];
}`,
    optimizedSolution: `function solveNQueens(n) {
  const result = [];
  const board = Array(n).fill(null).map(() => Array(n).fill('.'));
  
  function isSafe(row, col) {
    // Check column
    for (let i = 0; i < row; i++) {
      if (board[i][col] === 'Q') return false;
    }
    // Check diagonal (top-left)
    for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
      if (board[i][j] === 'Q') return false;
    }
    // Check diagonal (top-right)
    for (let i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) {
      if (board[i][j] === 'Q') return false;
    }
    return true;
  }
  
  function backtrack(row) {
    if (row === n) {
      result.push(board.map(r => r.join('')));
      return;
    }
    
    for (let col = 0; col < n; col++) {
      if (isSafe(row, col)) {
        board[row][col] = 'Q';
        backtrack(row + 1);
        board[row][col] = '.';
      }
    }
  }
  
  backtrack(0);
  return result;
}
// Time: O(n!), Space: O(n²)`,
    timeComplexity: "O(n!)",
    spaceComplexity: "O(n²)",
    topicTags: ["Backtracking"],
    keyLearnings: ["Constraint satisfaction", "State space exploration"],
  },

  // ===== GRAPHS =====
  {
    id: "graph-001",
    topic: "Graphs",
    title: "Number of Islands",
    difficulty: "Medium",
    companies: ["Amazon", "Google", "Microsoft", "Meta"],
    description: `Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.`,
    constraints: `
- m == grid.length
- n == grid[i].length
- 1 <= m, n <= 300
- grid[i][j] is '0' or '1'`,
    examples: [
      {
        input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]',
        output: "1",
      },
      {
        input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]',
        output: "3",
      },
    ],
    starterCode: `function numIslands(grid) {
  // Your code here
  return 0;
}`,
    optimizedSolution: `function numIslands(grid) {
  if (!grid || grid.length === 0) return 0;
  
  let count = 0;
  const rows = grid.length, cols = grid[0].length;
  
  function dfs(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] === '0') {
      return;
    }
    grid[r][c] = '0'; // Mark as visited
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        count++;
        dfs(r, c);
      }
    }
  }
  
  return count;
}
// Time: O(m*n), Space: O(m*n)`,
    timeComplexity: "O(m*n)",
    spaceComplexity: "O(m*n)",
    topicTags: ["Graph", "DFS/BFS"],
    keyLearnings: ["DFS graph traversal", "Connected components"],
  },
  {
    id: "strings-001",
    topic: "Strings",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    companies: ["Amazon", "Google", "Adobe"],
    description: `Given a string s, find the length of the longest substring without repeating characters.`,
    constraints: `
- 0 <= s.length <= 5 * 10^4
- s consists of English letters, digits, symbols and spaces.`,
    examples: [
      { input: "s = \"abcabcbb\"", output: "3" },
      { input: "s = \"bbbbb\"", output: "1" },
    ],
    starterCode: `function lengthOfLongestSubstring(s) {
  // Your code here
  return 0;
}`,
    optimizedSolution: `function lengthOfLongestSubstring(s) {
  const map = new Map();
  let left = 0;
  let maxLength = 0;
  for (let right = 0; right < s.length; right++) {
    if (map.has(s[right])) {
      left = Math.max(left, map.get(s[right]) + 1);
    }
    map.set(s[right], right);
    maxLength = Math.max(maxLength, right - left + 1);
  }
  return maxLength;
}
// Time: O(n), Space: O(min(n,m))`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(min(n,m))",
    topicTags: ["String", "Sliding Window"],
    keyLearnings: ["Sliding window", "Hash maps", "String traversal"],
  },
  {
    id: "strings-002",
    topic: "Strings",
    title: "Valid Palindrome II",
    difficulty: "Easy",
    companies: ["Microsoft", "Apple", "Amazon"],
    description: `Given a string s, return true if the s can be palindrome after deleting at most one character.`,
    constraints: `
- 1 <= s.length <= 10^5
- s consists of lowercase English letters.`,
    examples: [
      { input: "s = \"aba\"", output: "true" },
      { input: "s = \"abca\"", output: "true" },
    ],
    starterCode: `function validPalindrome(s) {
  // Your code here
  return false;
}`,
    optimizedSolution: `function validPalindrome(s) {
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    if (s[left] !== s[right]) {
      return isPalindromeRange(s, left + 1, right) || isPalindromeRange(s, left, right - 1);
    }
    left++;
    right--;
  }
  return true;
}

function isPalindromeRange(s, left, right) {
  while (left < right) {
    if (s[left] !== s[right]) return false;
    left++;
    right--;
  }
  return true;
}
// Time: O(n), Space: O(1)`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    topicTags: ["Two Pointers", "String"],
    keyLearnings: ["Two pointers", "Palindrome check", "Edge case handling"],
  },
  {
    id: "hashing-001",
    topic: "Hashing",
    title: "Group Anagrams",
    difficulty: "Medium",
    companies: ["Google", "Amazon", "Facebook"],
    description: `Given an array of strings strs, group the anagrams together. You may return the answer in any order.`,
    constraints: `
- 1 <= strs.length <= 10^4
- 0 <= strs[i].length <= 100
- strs[i] consists of lowercase English letters.`,
    examples: [
      { input: "strs = [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]", output: "[[\"bat\"],[\"nat\",\"tan\"],[\"ate\",\"eat\",\"tea\"]]" },
    ],
    starterCode: `function groupAnagrams(strs) {
  // Your code here
  return [];
}`,
    optimizedSolution: `function groupAnagrams(strs) {
  const map = new Map();
  for (const s of strs) {
    const key = s.split("").sort().join("");
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(s);
  }
  return Array.from(map.values());
}
// Time: O(n k log k), Space: O(n k)`,
    timeComplexity: "O(n k log k)",
    spaceComplexity: "O(n k)",
    topicTags: ["Hash Table", "Sorting"],
    keyLearnings: ["Hashing", "String sorting", "Grouping"],
  },
  {
    id: "slidingwindow-001",
    topic: "Sliding Window",
    title: "Minimum Size Subarray Sum",
    difficulty: "Medium",
    companies: ["Amazon", "LinkedIn", "Google"],
    description: `Given an array of positive integers nums and a positive integer target, return the minimal length of a subarray with sum >= target. If there is no such subarray, return 0.`,
    constraints: `
- 1 <= nums.length <= 10^5
- 1 <= nums[i] <= 10^4
- 1 <= target <= 10^9`,
    examples: [
      { input: "target = 7, nums = [2,3,1,2,4,3]", output: "2" },
      { input: "target = 4, nums = [1,4,4]", output: "1" },
    ],
    starterCode: `function minSubArrayLen(target, nums) {
  // Your code here
  return 0;
}`,
    optimizedSolution: `function minSubArrayLen(target, nums) {
  let left = 0;
  let sum = 0;
  let minLen = Infinity;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    while (sum >= target) {
      minLen = Math.min(minLen, right - left + 1);
      sum -= nums[left];
      left++;
    }
  }
  return minLen === Infinity ? 0 : minLen;
}
// Time: O(n), Space: O(1)`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    topicTags: ["Sliding Window"],
    keyLearnings: ["Two pointers", "Sliding window", "Subarray sums"],
  },
  {
    id: "binarysearch-001",
    topic: "Binary Search",
    title: "Search in Rotated Sorted Array",
    difficulty: "Medium",
    companies: ["Google", "Uber", "Microsoft"],
    description: `There is an integer array nums sorted in ascending order (with distinct values), rotated at an unknown pivot. Given the array nums and an integer target, return the index of target if it is in nums, otherwise return -1.`,
    constraints: `
- 1 <= nums.length <= 5000
- -10^4 <= nums[i], target <= 10^4
- All values of nums are unique.`,
    examples: [
      { input: "nums = [4,5,6,7,0,1,2], target = 0", output: "4" },
      { input: "nums = [4,5,6,7,0,1,2], target = 3", output: "-1" },
    ],
    starterCode: `function search(nums, target) {
  // Your code here
  return -1;
}`,
    optimizedSolution: `function search(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[left] <= nums[mid]) {
      if (nums[left] <= target && target < nums[mid]) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    } else {
      if (nums[mid] < target && target <= nums[right]) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
  }
  return -1;
}
// Time: O(log n), Space: O(1)`,
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)",
    topicTags: ["Binary Search", "Array"],
    keyLearnings: ["Rotated sorted arrays", "Binary search", "Edge cases"],
  },
  {
    id: "linkedlist-002",
    topic: "Linked Lists",
    title: "Reverse Linked List",
    difficulty: "Easy",
    companies: ["Microsoft", "Amazon", "Apple"],
    description: `Reverse a singly linked list and return the reversed list.`,
    constraints: `
- The number of nodes in the list is the range [0, 5000]
- -5000 <= Node.val <= 5000`,
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" },
    ],
    starterCode: `function reverseList(head) {
  // Your code here
  return head;
}`,
    optimizedSolution: `function reverseList(head) {
  let prev = null;
  let current = head;
  while (current) {
    const nextTemp = current.next;
    current.next = prev;
    prev = current;
    current = nextTemp;
  }
  return prev;
}
// Time: O(n), Space: O(1)`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    topicTags: ["Linked List"],
    keyLearnings: ["Pointer manipulation", "Iterative list reversal"],
  },
  {
    id: "stack-001",
    topic: "Stack",
    title: "Valid Parentheses",
    difficulty: "Easy",
    companies: ["Google", "Facebook", "Amazon"],
    description: `Given a string s containing just the characters '()[]{}', determine if the input string is valid.`,
    constraints: `
- 1 <= s.length <= 10^4
- s consists of parentheses only '()[]{}'.`,
    examples: [
      { input: "s = \"()\"", output: "true" },
      { input: "s = \"([)]\"", output: "false" },
    ],
    starterCode: `function isValid(s) {
  // Your code here
  return false;
}`,
    optimizedSolution: `function isValid(s) {
  const stack = [];
  const map = { ')': '(', ']': '[', '}': '{' };
  for (const char of s) {
    if (['(','[','{'].includes(char)) {
      stack.push(char);
    } else {
      if (stack.pop() !== map[char]) return false;
    }
  }
  return stack.length === 0;
}
// Time: O(n), Space: O(n)`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    topicTags: ["Stack"],
    keyLearnings: ["Stack usage", "String parsing", "Bracket matching"],
  },
  {
    id: "heap-001",
    topic: "Heaps",
    title: "Top K Frequent Elements",
    difficulty: "Medium",
    companies: ["Twitter", "Google", "Amazon"],
    description: `Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.`,
    constraints: `
- 1 <= nums.length <= 10^5
- k is in the range [1, the number of unique elements in the array]`,
    examples: [
      { input: "nums = [1,1,1,2,2,3], k = 2", output: "[1,2]" },
    ],
    starterCode: `function topKFrequent(nums, k) {
  // Your code here
  return [];
}`,
    optimizedSolution: `function topKFrequent(nums, k) {
  const count = new Map();
  nums.forEach((n) => count.set(n, (count.get(n) || 0) + 1));
  const bucket = Array(nums.length + 1).fill().map(() => []);
  for (const [num, freq] of count.entries()) {
    bucket[freq].push(num);
  }
  const result = [];
  for (let i = bucket.length - 1; i >= 0 && result.length < k; i--) {
    result.push(...bucket[i]);
  }
  return result.slice(0, k);
}
// Time: O(n), Space: O(n)`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    topicTags: ["Heap", "Hash Table"],
    keyLearnings: ["Bucket sort", "Frequency counting", "Heaps"],
  },
  {
    id: "greedy-001",
    topic: "Greedy Algorithms",
    title: "Jump Game",
    difficulty: "Medium",
    companies: ["Apple", "Amazon", "Facebook"],
    description: `Given an array of non-negative integers nums, return true if you can reach the last index starting from the first index.`,
    constraints: `
- 1 <= nums.length <= 10^4
- 0 <= nums[i] <= 10^5`,
    examples: [
      { input: "nums = [2,3,1,1,4]", output: "true" },
      { input: "nums = [3,2,1,0,4]", output: "false" },
    ],
    starterCode: `function canJump(nums) {
  // Your code here
  return false;
}`,
    optimizedSolution: `function canJump(nums) {
  let furthest = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > furthest) return false;
    furthest = Math.max(furthest, i + nums[i]);
  }
  return true;
}
// Time: O(n), Space: O(1)`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    topicTags: ["Greedy"],
    keyLearnings: ["Greedy algorithms", "Reachability"],
  },
  {
    id: "bit-001",
    topic: "Bit Manipulation",
    title: "Single Number",
    difficulty: "Easy",
    companies: ["Microsoft", "Amazon", "Uber"],
    description: `Given a non-empty array of integers nums where every element appears twice except for one, find that single one.`,
    constraints: `
- 1 <= nums.length <= 3 * 10^4
- -3 * 10^4 <= nums[i] <= 3 * 10^4
- Each element appears twice except for one element.`,
    examples: [
      { input: "nums = [2,2,1]", output: "1" },
      { input: "nums = [4,1,2,1,2]", output: "4" },
    ],
    starterCode: `function singleNumber(nums) {
  // Your code here
  return 0;
}`,
    optimizedSolution: `function singleNumber(nums) {
  let result = 0;
  for (const num of nums) {
    result ^= num;
  }
  return result;
}
// Time: O(n), Space: O(1)`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    topicTags: ["Bit Manipulation"],
    keyLearnings: ["XOR", "Bitwise operations"],
  },
  {
    id: "trie-001",
    topic: "Tries",
    title: "Implement Trie (Prefix Tree)",
    difficulty: "Medium",
    companies: ["Google", "Amazon", "Microsoft"],
    description: `Implement a trie with insert, search, and startsWith methods.`,
    constraints: `
- 1 <= word.length, prefix.length <= 2000
- word and prefix consist of lowercase English letters.`,
    examples: [
      { input: "operations = [\"Trie\",\"insert\",\"search\",\"search\",\"startsWith\",\"insert\",\"search\"], arguments = [[], [\"apple\"], [\"apple\"], [\"app\"], [\"app\"], [\"app\"], [\"app\"]]", output: "[null,null,true,false,true,null,true]" },
    ],
    starterCode: `class Trie {
  constructor() {
    // Your code here
  }

  insert(word) {
    // Your code here
  }

  search(word) {
    // Your code here
  }

  startsWith(prefix) {
    // Your code here
  }
}
`,
    optimizedSolution: `class Trie {
  constructor() {
    this.root = {};
  }

  insert(word) {
    let node = this.root;
    for (const char of word) {
      if (!node[char]) node[char] = {};
      node = node[char];
    }
    node.isWord = true;
  }

  search(word) {
    let node = this.root;
    for (const char of word) {
      if (!node[char]) return false;
      node = node[char];
    }
    return !!node.isWord;
  }

  startsWith(prefix) {
    let node = this.root;
    for (const char of prefix) {
      if (!node[char]) return false;
      node = node[char];
    }
    return true;
  }
}
// Time: O(n), Space: O(n)`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    topicTags: ["Tries"],
    keyLearnings: ["Prefix tree", "String search", "Trie operations"],
  },
];

export const PROBLEM_TOPICS = [
  "Arrays",
  "Strings",
  "Hashing",
  "Recursion",
  "Backtracking",
  "Linked Lists",
  "Stack",
  "Queue",
  "Sliding Window",
  "Binary Search",
  "Trees",
  "Binary Trees",
  "BST",
  "Heaps",
  "Greedy Algorithms",
  "Graphs",
  "Dynamic Programming",
  "Tries",
  "Segment Trees",
  "Bit Manipulation",
];

export const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export function getProblemById(id) {
  return DSA_PROBLEMS.find((p) => p.id === id);
}

export function getProblemsByTopic(topic) {
  return DSA_PROBLEMS.filter((p) => p.topic === topic);
}

export function getProblemsByDifficulty(difficulty) {
  return DSA_PROBLEMS.filter((p) => p.difficulty === difficulty);
}

export function searchProblems(query) {
  const lowerQuery = query.toLowerCase();
  return DSA_PROBLEMS.filter(
    (p) =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.topicTags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}
