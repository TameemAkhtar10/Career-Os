/**
 * Curated taxonomy of technical skills and their canonical display names and aliases.
 * Normalizes punctuation (. - _ / and spaces) so React.js = react js = reactjs,
 * Node.js = node js = nodejs, MongoDB = mongo db = mongodb, etc.
 * Always returns canonical display names like "React.js", "Node.js", "MongoDB".
 */

export const SKILL_TAXONOMY = {
  // Languages
  "JavaScript": ["js", "ecmascript", "es6", "es6+", "javascript"],
  "TypeScript": ["ts", "typescript"],
  "Python": ["py", "python3", "python"],
  "Java": ["core java", "java 8", "java 11", "java 17", "java"],
  "C++": ["cpp", "cplusplus", "c++"],
  "C": [],
  "C#": ["csharp", "c-sharp", ".net", "dotnet", "c#"],
  "Go": ["golang", "go"],
  "Rust": ["rust"],
  "Ruby": ["ruby on rails", "rails", "ruby"],
  "PHP": ["php"],
  "Swift": ["swift"],
  "Kotlin": ["kotlin"],
  "SQL": ["structured query language", "sql"],

  // Frontend
  "React.js": ["react", "reactjs", "react.js", "react js", "mern", "pern"],
  "Next.js": ["next", "nextjs", "next.js", "next js"],
  "Vue.js": ["vue", "vuejs", "vue.js", "vue js"],
  "Angular": ["angularjs", "angular 2+", "angular", "mean"],
  "HTML": ["html5", "html"],
  "CSS": ["css3", "css"],
  "Tailwind CSS": ["tailwind", "tailwindcss", "tailwind css"],
  "Bootstrap": ["bootstrap 5", "bootstrap"],
  "Redux": ["redux toolkit", "rtk", "redux"],
  "Sass": ["scss", "sass"],
  "Webpack": ["webpack"],
  "Vite": ["vite"],

  // Backend & Frameworks
  "Node.js": ["node", "nodejs", "node.js", "node js", "mern", "mean", "pern"],
  "Express.js": ["express", "expressjs", "express.js", "express js", "mern", "mean", "pern"],
  "Nest.js": ["nestjs", "nest.js", "nest js"],
  "Django": ["django"],
  "Flask": ["flask"],
  "FastAPI": ["fastapi", "fast api"],
  "Spring Boot": ["spring", "springboot", "spring boot"],
  "ASP.NET": ["asp.net core", "aspnet", "asp.net"],
  "GraphQL": ["apollo graphql", "graphql"],
  "REST APIs": ["rest", "restful", "restful api", "rest apis", "rest api", "web api"],

  // Databases & Storage
  "MongoDB": ["mongo", "mongoose", "mongo db", "mongodb", "mern", "mean"],
  "PostgreSQL": ["postgres", "pgsql", "postgresql", "pern"],
  "MySQL": ["my-sql", "my sql", "mysql"],
  "Redis": ["redis"],
  "SQLite": ["sqlite"],
  "Elasticsearch": ["elastic", "elasticsearch"],
  "Firebase": ["firestore", "firebase auth", "firebase"],
  "Prisma": ["prisma orm", "prisma"],

  // Cloud & DevOps
  "Docker": ["containerization", "containers", "docker"],
  "Kubernetes": ["k8s", "kubernetes"],
  "AWS": ["amazon web services", "ec2", "s3", "lambda", "aws"],
  "Azure": ["microsoft azure", "azure"],
  "GCP": ["google cloud", "google cloud platform", "gcp"],
  "Git": ["github", "gitlab", "bitbucket", "version control", "git"],
  "CI/CD": ["continuous integration", "github actions", "jenkins", "cicd", "ci cd", "ci/cd"],
  "Linux": ["unix", "ubuntu", "bash", "shell scripting", "linux"],

  // Core CS & Architecture
  "Data Structures": ["dsa", "data structures and algorithms", "data structures"],
  "Algorithms": ["algo", "algorithms"],
  "OOP": ["object-oriented programming", "oops", "object oriented programming", "oop"],
  "System Design": ["system design"],
  "Microservices": ["microservice architecture", "microservices"],
  "MVC": ["model view controller", "mvc"],

  // Testing
  "Jest": ["jest"],
  "Cypress": ["cypress"],
  "Mocha": ["mocha"],
  "JUnit": ["junit"],
  "Postman": ["api testing", "postman"],

  // AI & Data
  "Machine Learning": ["ml", "machine learning"],
  "Deep Learning": ["dl", "deep learning"],
  "Pandas": ["pandas"],
  "NumPy": ["numpy"],
  "Scikit-Learn": ["sklearn", "scikit-learn", "scikit learn"],
  "TensorFlow": ["tensorflow"],
  "PyTorch": ["pytorch"],
};

/**
 * Normalizes a skill string by treating ".", "-", "_", "/" and spaces as equal.
 * e.g., "React.js" -> "react js", "CI/CD" -> "ci cd"
 */
export function normalizeSkillKey(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .toLowerCase()
    .replace(/[.\-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Collapses punctuation and whitespace completely for joined matching.
 * e.g., "React.js" -> "reactjs", "Node.js" -> "nodejs", "MongoDB" -> "mongodb"
 */
export function toCollapsedKey(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .toLowerCase()
    .replace(/[^a-z0-9+#]/g, "")
    .trim();
}

// Build inverted alias lookup map
const ALIAS_LOOKUP = new Map();

for (const [canonicalDisplay, aliases] of Object.entries(SKILL_TAXONOMY)) {
  const allVariants = [canonicalDisplay, ...aliases];
  for (const variant of allVariants) {
    const rawLower = variant.toLowerCase().trim();
    const normalized = normalizeSkillKey(variant);
    const collapsed = toCollapsedKey(variant);

    if (rawLower) ALIAS_LOOKUP.set(rawLower, canonicalDisplay);
    if (normalized) ALIAS_LOOKUP.set(normalized, canonicalDisplay);
    if (collapsed) ALIAS_LOOKUP.set(collapsed, canonicalDisplay);
  }
}

/**
 * Normalizes a raw skill string to its canonical display name if recognized in taxonomy.
 * Returns canonical display names like "React.js", "Node.js", "MongoDB".
 * @param {string} skill
 * @returns {string}
 */
export function normalizeSkill(skill) {
  if (!skill || typeof skill !== "string") return "";
  const trimmed = skill.trim();
  if (!trimmed) return "";

  // 1. Direct lowercase match
  const rawLower = trimmed.toLowerCase();
  if (ALIAS_LOOKUP.has(rawLower)) return ALIAS_LOOKUP.get(rawLower);

  // 2. Normalized match (treat . - _ / and space as equal)
  const normKey = normalizeSkillKey(trimmed);
  if (ALIAS_LOOKUP.has(normKey)) return ALIAS_LOOKUP.get(normKey);

  // 3. Collapsed key match
  const collapsed = toCollapsedKey(trimmed);
  if (ALIAS_LOOKUP.has(collapsed)) return ALIAS_LOOKUP.get(collapsed);

  // Return clean original trimmed string if not in taxonomy
  return trimmed;
}

/**
 * Extracts skills from arbitrary text using normalized text matching against taxonomy.
 * @param {string} text
 * @returns {string[]} Canonical display names found (e.g. "React.js", "Node.js", "MongoDB")
 */
export function extractSkillsFromText(text) {
  if (!text || typeof text !== "string") return [];

  // Prepare original lowercase with spaces and normalized form where punctuation is space
  const lowerText = ` ${text.toLowerCase().replace(/[\r\n\t]/g, " ")} `;
  const normText = ` ${text.toLowerCase().replace(/[.\-_/]+/g, " ").replace(/[\r\n\t\s]+/g, " ")} `;

  const found = new Set();

  for (const [canonicalDisplay, aliases] of Object.entries(SKILL_TAXONOMY)) {
    const variants = [canonicalDisplay, ...aliases];
    let matched = false;

    for (const v of variants) {
      if (matched) break;

      // 1. Check in lowerText (handles raw words, c++, c#, .net, react.js, etc.)
      const escapedRaw = v.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regexRaw = new RegExp(`(?:^|[^a-zA-Z0-9+#.])${escapedRaw}(?:$|[^a-zA-Z0-9+#.])`, "i");
      if (regexRaw.test(lowerText)) {
        found.add(canonicalDisplay);
        matched = true;
        break;
      }

      // 2. Check in normText (handles "react js", "node js", "mongo db", "ci cd", etc.)
      const normV = normalizeSkillKey(v);
      if (normV) {
        const escapedNorm = normV.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regexNorm = new RegExp(`(?:^|[^a-zA-Z0-9+#])${escapedNorm}(?:$|[^a-zA-Z0-9+#])`, "i");
        if (regexNorm.test(normText)) {
          found.add(canonicalDisplay);
          matched = true;
          break;
        }
      }

      // 3. Check collapsed word boundary if applicable (e.g. "reactjs", "nodejs", "mongodb")
      const collapsedV = toCollapsedKey(v);
      if (collapsedV && collapsedV.length >= 3 && !["c", "go", "js", "ts", "py", "sql", "git"].includes(collapsedV)) {
        const escapedCollapsed = collapsedV.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regexCollapsed = new RegExp(`(?:^|[^a-zA-Z0-9+#])${escapedCollapsed}(?:$|[^a-zA-Z0-9+#])`, "i");
        if (regexCollapsed.test(lowerText)) {
          found.add(canonicalDisplay);
          matched = true;
          break;
        }
      }
    }
  }

  return Array.from(found);
}

/**
 * Compares two skill lists and returns { present: string[], missing: string[] }
 * with canonical display names.
 * @param {string[]} candidateSkills
 * @param {string[]} targetSkills
 */
export function compareSkills(candidateSkills = [], targetSkills = []) {
  const normCandidate = new Set(
    candidateSkills.map((s) => normalizeSkill(s)).filter(Boolean)
  );

  const present = [];
  const missing = [];

  for (const target of targetSkills) {
    const normTarget = normalizeSkill(target);
    if (!normTarget) continue;

    if (normCandidate.has(normTarget)) {
      if (!present.includes(normTarget)) present.push(normTarget);
    } else {
      if (!missing.includes(normTarget)) missing.push(normTarget);
    }
  }

  return { present, missing };
}
