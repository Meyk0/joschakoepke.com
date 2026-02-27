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
    title: "Launching vs Landing",
    body: "Like rockets, launching a product is just the start \u2013 landing is the hard part. Successful landing requires constant adjustments, monitoring, and dedication to stick the landing. Focus on what happens after the champagne and launch party.",
  },
  {
    index: 1,
    title: "Action Reveals Truth",
    body: "I\u2019ve spent countless hours in rooms theorizing about user behavior, only to be completely wrong when we actually shipped. Stop overthinking and start shipping \u2013 your assumptions are probably wrong anyway.",
  },
  {
    index: 2,
    title: "Lead with Empathy, Not Authority",
    body: "You\u2019re a tour guide, not an autocrat. Know your terrain deeply, but be ready to change course when your group spots something you missed. Nobody wants to follow a know-it-all with a megaphone.",
  },
  {
    index: 3,
    title: "High-IQ Problems Need In Person Collaboration",
    body: "Google Meet is great for status updates, but trying to solve complex problems need face-to-face energy and a whiteboard.",
  },
  {
    index: 4,
    title: "Stay Curious, Always",
    body: "The moment you think you\u2019ve got it all figured out is the moment you start becoming irrelevant. Keep asking \u201Cwhy\u201D like a stubborn toddler \u2013 it\u2019s surprisingly effective.",
  },
  {
    index: 5,
    title: "Think Big, Start Small",
    body: "Dream up the flying car, but start by making the bicycle better. Your grand vision means nothing without the small wins that prove you\u2019re heading in the right direction.",
  },
  {
    index: 6,
    title: "Frameworks Are Overrated",
    body: "RICE scoring won\u2019t tell you what product to build. Jobs-to-be-Done won\u2019t magically reveal user needs. Frameworks are training wheels \u2013 helpful for learning but limiting if you never take them off.",
  },
  {
    index: 7,
    title: "Radical Candor Builds Great Products",
    body: "Sugarcoating feedback is like serving a burnt dinner and calling it \u201Cwell-done.\u201D It helps no one. Be kind, be specific, be direct \u2013 your team can handle it.",
  },
  {
    index: 8,
    title: "Speed Through Focus",
    body: "Doing ten things poorly doesn\u2019t make you fast \u2013 it makes you ineffective. Pick the few things that matter and do them extraordinarily well. Everything else can wait.",
  },
  {
    index: 9,
    title: "Strong Opinions, Weakly Held",
    body: "Have the courage to make bold bets but the humility to admit when you\u2019re wrong. Your ego isn\u2019t more important than building the right thing.",
  },
  {
    index: 10,
    title: "Build Yourself Out of the Equation",
    body: "Your greatest achievement is building a team that no longer needs you. Empower others, foster leadership, and create systems that ensure your impact lasts beyond your tenure.",
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
