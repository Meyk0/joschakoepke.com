// ─── Types ────────────────────────────────────────────────────────────────────

export interface Bio {
  name: string;
  role: string;
  company: string;
  location: string;
  summary: string;
  tags: string[];
}

export interface ManifestoEntry {
  index: number;
  title: string;
  body: string;
}

export interface Project {
  name: string;
  type: "work" | "side";
  status: "active" | "shipped" | "archived";
  description: string;
  tech: string[];
  url?: string;
}

export interface ExperienceEntry {
  hash: string;
  date: string;
  message: string;
  body: string;
  branch: string;
}

export interface Article {
  title: string;
  url: string;
  publication: string;
  year: number;
}

export interface Contact {
  email: string;
  twitter: string;
  linkedin: string;
  github: string;
  mcp_url: string;
}

export interface OpenToWork {
  open: boolean;
  context: string;
  ideal_role: string;
}

export interface McpToolMeta {
  name: string;
  description: string;
  parameters: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

export const bio: Bio = {
  name: "Joscha Koepke",
  role: "Head of Product",
  company: "Connectly AI",
  location: "San Francisco, CA",
  summary:
    "Building AI agents for WhatsApp commerce at Connectly. Previously product at several startups. Passionate about the intersection of AI, product, and user experience.",
  tags: ["product", "ai", "agents", "whatsapp", "commerce", "mcp"],
};

export const manifesto: ManifestoEntry[] = [
  {
    index: 0,
    title: "Ship it",
    body: "Perfection is the enemy of progress. Get it out, learn from real users, iterate. The best product decisions come from data, not debates.",
  },
  {
    index: 1,
    title: "Talk to users",
    body: "Every assumption is wrong until validated. The best PMs spend more time listening than talking. User interviews > stakeholder opinions.",
  },
  {
    index: 2,
    title: "Build with AI, not around it",
    body: "AI isn't a feature — it's an infrastructure shift. Treat LLMs as a new computing primitive, not a chatbot wrapper.",
  },
  {
    index: 3,
    title: "Simple > clever",
    body: "Complexity is a liability. If you can't explain the product in one sentence, it's too complicated. Reduce scope ruthlessly.",
  },
  {
    index: 4,
    title: "Own the outcome",
    body: "Product managers don't ship features — they ship outcomes. Measure impact, not output. OKRs over task lists.",
  },
  {
    index: 5,
    title: "Design is how it works",
    body: "Not just how it looks. Great UX is invisible. The best interface is no interface — until the user needs one.",
  },
  {
    index: 6,
    title: "Data-informed, not data-driven",
    body: "Numbers tell you what happened. Intuition tells you why. Use both. Don't let dashboards replace critical thinking.",
  },
  {
    index: 7,
    title: "Move fast, stay aligned",
    body: "Speed without direction is just chaos. Async communication, clear ownership, and shared context beat daily standups.",
  },
  {
    index: 8,
    title: "Prototype in code",
    body: "Figma mockups lie. Real prototypes reveal real problems. The fastest way to validate an idea is to build a rough version.",
  },
  {
    index: 9,
    title: "Bet on compounding",
    body: "Small improvements compound. Platform bets pay off over years. Build infrastructure that makes the next 10 features easier.",
  },
  {
    index: 10,
    title: "Stay curious",
    body: "The best product people are polymaths. Read widely, build side projects, break things. Boredom is the real enemy.",
  },
];

export const projects: Project[] = [
  {
    name: "Connectly AI Agents",
    type: "work",
    status: "active",
    description:
      "AI-powered sales agents for WhatsApp commerce. Automated conversations that drive revenue for D2C brands across LATAM and emerging markets.",
    tech: ["LLMs", "WhatsApp API", "TypeScript", "Python"],
  },
  {
    name: "joschakoepke.com",
    type: "side",
    status: "active",
    description:
      "This website. A terminal-first personal site that doubles as an MCP server. You're looking at it right now.",
    tech: ["Next.js", "TypeScript", "MCP", "Tailwind"],
    url: "https://joschakoepke.com",
  },
  {
    name: "MCP Personal Server",
    type: "side",
    status: "active",
    description:
      "An MCP server that lets Claude (and other AI agents) query my background, projects, and manifesto programmatically.",
    tech: ["MCP", "SSE", "Next.js API Routes"],
    url: "https://mcp.joschakoepke.com/api/mcp",
  },
];

export const experience: ExperienceEntry[] = [
  {
    hash: "a1b2c3d",
    date: "2023–present",
    message: "Head of Product @ Connectly AI",
    body: "Leading product for AI-powered WhatsApp commerce platform. Building conversational agents that drive revenue for D2C brands.",
    branch: "main",
  },
  {
    hash: "e4f5g6h",
    date: "2021–2023",
    message: "Senior Product Manager @ Previous Co",
    body: "Shipped core product features, grew user engagement. Led cross-functional team of 8.",
    branch: "main",
  },
  {
    hash: "i7j8k9l",
    date: "2019–2021",
    message: "Product Manager @ Early Stage Startup",
    body: "First PM hire. Built product from 0→1, established product processes and culture.",
    branch: "main",
  },
  {
    hash: "m0n1o2p",
    date: "2017–2019",
    message: "Associate PM / Business Analyst",
    body: "Started in product. Learned the craft through shipping, failing, and iterating.",
    branch: "origin/career",
  },
];

export const articles: Article[] = [
  {
    title: "Why Every PM Should Learn to Code (a little)",
    url: "#",
    publication: "Personal Blog",
    year: 2024,
  },
  {
    title: "Building AI Agents That Actually Work",
    url: "#",
    publication: "Personal Blog",
    year: 2024,
  },
];

export const contact: Contact = {
  email: "hello@joschakoepke.com",
  twitter: "https://twitter.com/joschakoepke",
  linkedin: "https://linkedin.com/in/joschakoepke",
  github: "https://github.com/Meyk0",
  mcp_url: "https://mcp.joschakoepke.com/api/mcp",
};

export const openToWork: OpenToWork = {
  open: true,
  context:
    "Always open to interesting conversations about AI, product, and the future of work.",
  ideal_role:
    "Head of Product / VP Product at an AI-native company building tools that matter.",
};

export const mcpTools: McpToolMeta[] = [
  {
    name: "get_bio",
    description: "Returns name, role, company, location, summary, and tags",
    parameters: "(none)",
  },
  {
    name: "get_manifesto",
    description: "Returns manifesto entries (all or by index 0-10)",
    parameters: "index?: number",
  },
  {
    name: "get_projects",
    description: "Returns active and shipped projects with tech stacks",
    parameters: "(none)",
  },
  {
    name: "get_experience",
    description: "Returns career history as git-log style entries",
    parameters: "(none)",
  },
  {
    name: "get_writing",
    description: "Returns authored articles with links",
    parameters: "(none)",
  },
  {
    name: "get_contact",
    description: "Returns email, socials, and MCP endpoint",
    parameters: "(none)",
  },
  {
    name: "is_open_to_work",
    description: "Returns availability, context, and ideal role",
    parameters: "(none)",
  },
];
