/**
 * Lightweight personalization data — intentionally NOT a question bank.
 * Per the product spec: no thousands of pre-written company/role questions.
 * This is just enough structured context (skills a role expects, what a
 * company's interviews tend to emphasize) to steer Groq's dynamic question
 * generation and the resume skill-gap comparison. Everything else about
 * "how the interview goes" is generated live by the model.
 */

export const ROLE_SKILLS = {
  "Software Engineer":        ["Data Structures", "Algorithms", "System Design", "OOP", "Git", "Testing"],
  "Frontend Developer":       ["JavaScript", "React", "CSS", "HTML", "Web Performance", "Accessibility", "REST APIs"],
  "Backend Developer":        ["Node.js", "Databases", "REST APIs", "System Design", "Caching", "Authentication"],
  "Full Stack Developer":     ["JavaScript", "React", "Node.js", "Databases", "REST APIs", "System Design"],
  "AI Engineer":              ["Python", "Machine Learning", "Deep Learning", "PyTorch/TensorFlow", "LLMs", "Data Pipelines"],
  "Machine Learning Engineer":["Python", "Statistics", "Model Training", "MLOps", "Feature Engineering", "SQL"],
  "Data Scientist":           ["Python", "Statistics", "SQL", "Data Visualization", "Machine Learning", "A/B Testing"],
  "Cloud Engineer":           ["AWS/GCP/Azure", "Networking", "IaC (Terraform)", "Kubernetes", "Security", "Cost Optimization"],
  "DevOps Engineer":          ["CI/CD", "Docker", "Kubernetes", "Monitoring", "Linux", "Scripting"],
  "Cybersecurity Analyst":    ["Network Security", "Threat Detection", "Cryptography", "Incident Response", "Compliance"],
  "UI/UX Designer":           ["Figma", "User Research", "Wireframing", "Design Systems", "Accessibility"],
  "Mobile App Developer":     ["React Native/Flutter", "Mobile UI", "APIs", "App Performance", "Platform Guidelines"],
  "Product Manager":          ["Product Strategy", "Roadmapping", "Stakeholder Management", "Metrics", "User Research"],
  "QA Engineer":              ["Test Automation", "Manual Testing", "Bug Tracking", "CI/CD", "API Testing"],
  "Data Engineer":            ["SQL", "ETL Pipelines", "Data Warehousing", "Python/Scala", "Distributed Systems"],
};

export const COMPANY_FOCUS = {
  "Amazon":    { style: "Behavioral + Leadership Principles heavy", focus: ["Ownership", "System Design", "Data Structures", "Bar-raising problem solving"] },
  "Google":    { style: "Algorithmic depth + ambiguity handling",   focus: ["Algorithms", "System Design", "Googleyness/Culture", "Scalability"] },
  "Meta":      { style: "Fast-paced technical + product sense",     focus: ["Data Structures", "System Design", "Product Thinking", "Execution speed"] },
  "Microsoft": { style: "Balanced technical + collaboration",       focus: ["Problem Solving", "System Design", "Growth Mindset", "Collaboration"] },
  "Netflix":   { style: "Deep technical + culture fit",             focus: ["System Design", "Ownership", "Judgment", "Freedom & Responsibility"] },
  "Apple":     { style: "Detail-oriented + craftsmanship",          focus: ["Attention to Detail", "System Design", "Product Craftsmanship"] },
  "Flipkart":  { style: "DSA heavy + system design for scale",      focus: ["Data Structures", "System Design", "Scalability"] },
  "TCS":       { style: "Fundamentals + communication",             focus: ["CS Fundamentals", "Communication", "Aptitude"] },
  "Infosys":   { style: "Fundamentals + communication",             focus: ["CS Fundamentals", "Communication", "Problem Solving"] },
  "Wipro":     { style: "Fundamentals + communication",             focus: ["CS Fundamentals", "Communication", "Problem Solving"] },
  "Adobe":     { style: "Strong DSA + product thinking",            focus: ["Data Structures", "Algorithms", "Product Sense"] },
  "Uber":      { style: "System design + real-time systems",        focus: ["System Design", "Distributed Systems", "Data Structures"] },
};

/** Fixed set of DSA topic labels — matches TOPIC_META in CodingPractice.jsx.
 *  Used so AI-generated report output can point back to a real topic in the
 *  existing 450-question set instead of inventing topic names that don't map
 *  to anything the user can actually go practice. */
export const DSA_TOPICS = [
  "Array", "String", "LinkedList", "Binary Trees", "Binary Search Trees",
  "Dynamic Programming", "Graph", "Stacks & Queues", "Heap", "Matrix",
  "Searching & Sorting", "BackTracking", "Bit Manipulation", "Greedy", "Trie",
];

export const getRoleSkills = (role) => ROLE_SKILLS[role] || [];
export const getCompanyFocus = (company) => COMPANY_FOCUS[company] || null;
