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

export interface ResumeData {
  summary: string;
  selectedImpact: string[];
  experience: ResumeExperience[];
  competencies: Record<string, string>;
  education: string[];
  languages: string[];
  sideProjects: string[];
  interests: string;
}

export interface ResumeExperience {
  company: string;
  role: string;
  dates: string;
  context?: string;
  bullets: string[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

export const bio: Bio = {
  name: "Joscha Koepke",
  role: "Head of Product",
  company: "Connectly AI",
  location: "San Francisco, CA",
  summary:
    "AI product leader. Led Connectly\u2019s agent platform from inception to $10M+ ARR, powering 40M+ monthly messages for enterprise retailers globally. Previously Global Product Lead at Google for online-to-offline ads, scaling from beta to 9-digit ARR across 20+ countries.",
  tags: ["product", "ai", "agents", "llm-eval", "personalization", "mcp"],
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
      "AI-powered sales agents for WhatsApp commerce. Agent memory, personalization, retrieval, LLM evaluation. $10M+ ARR, 40M+ monthly messages.",
    tech: ["LLMs", "WhatsApp API", "TypeScript", "Python"],
  },
  {
    name: "EvalArena",
    type: "side",
    status: "active",
    description:
      "Hands-on training platform for writing AI evals. LLM-as-judge, trace analysis, rubric design.",
    tech: ["React", "TypeScript"],
    url: "https://www.evalarena.xyz",
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
    name: "MCP Task Creator",
    type: "side",
    status: "shipped",
    description:
      "MCP-based task creation tool for AI agent workflows.",
    tech: ["MCP", "TypeScript"],
  },
  {
    name: "AI Resume Analyzer",
    type: "side",
    status: "shipped",
    description:
      "AI-powered resume analysis and feedback tool.",
    tech: ["React", "TypeScript", "LLMs"],
    url: "https://www.theresume.guru/",
  },
  {
    name: "Git Claude Commit",
    type: "side",
    status: "shipped",
    description:
      "AI-assisted git commit message generator.",
    tech: ["TypeScript", "Git"],
  },
];

export const experience: ExperienceEntry[] = [
  {
    hash: "a1b2c3d",
    date: "2021\u2013present",
    message: "Head of Product @ Connectly AI",
    body: "Series B (Alibaba, Unusual Ventures). Scaled agent platform from inception to $10M+ ARR, 40M+ monthly messages. Led Product & Design team of 5.",
    branch: "main",
  },
  {
    hash: "e4f5g6h",
    date: "2018\u20132021",
    message: "Global Product Lead, Online to Offline @ Google",
    body: "Led product & GTM for online-to-offline ads across Search, Display, YouTube, Maps. Scaled from beta to 9-digit ARR across 20+ countries.",
    branch: "main",
  },
  {
    hash: "i7j8k9l",
    date: "2014\u20132018",
    message: "Senior Account Manager @ Google",
    body: "Managed $50M+ portfolio of automotive & mobility advertisers, averaging 50% YoY growth.",
    branch: "origin/career",
  },
];

export const featuredArticles: Article[] = [
  {
    title: "AITech Interview with Joscha Koepke, Head of Product at Connectly.ai",
    url: "https://ai-techpark.com/aitech-interview-with-joscha-koepke/",
    publication: "AI TechPark",
    year: 2024,
  },
  {
    title: "Here\u2019s Why Everyone is Raving About RAG",
    url: "https://ai-techpark.com/why-everyone-is-raving-about-rag/",
    publication: "AI TechPark",
    year: 2024,
  },
  {
    title: "How AI Is Disrupting Our Industry, And What We Can Do About It",
    url: "https://medium.com/authority-magazine/joscha-koepke-of-connectly-how-ai-is-disrupting-our-industry-and-what-we-can-do-about-it-03514fbb5443",
    publication: "Authority Magazine",
    year: 2024,
  },
  {
    title: "AI Walks Into a Bar: The Quest for Artificial Humor",
    url: "https://www.pymnts.com/artificial-intelligence-2/2024/ai-walks-into-a-bar-the-quest-for-artificial-humor/",
    publication: "PYMNTS",
    year: 2024,
  },
  {
    title: "Joscha Koepke, Head of Product at Connectly \u2013 Interview Series",
    url: "https://www.unite.ai/joscha-koepke-head-of-product-at-connectly-interview-series/",
    publication: "Unite.AI",
    year: 2024,
  },
];

export const authoredArticles: Article[] = [
  {
    title: "Launching vs. Landing: Why Product Landings Matter More Than Launches",
    url: "https://www.linkedin.com/pulse/launching-vs-landing-why-product-landings-matter-more-joscha-koepke-dolhe/",
    publication: "LinkedIn",
    year: 2024,
  },
  {
    title: "What\u2019s the rage about RAG?",
    url: "https://www.linkedin.com/pulse/whats-rage-rag-joscha-koepke-karvc/",
    publication: "LinkedIn",
    year: 2024,
  },
  {
    title: "The Dawn of Agentic Chatbots",
    url: "https://www.linkedin.com/pulse/dawn-agentic-chatbots-joscha-koepke-t4sbc/",
    publication: "LinkedIn",
    year: 2023,
  },
  {
    title: "Decision-Making at Connectly: The Power of First Principles Thinking",
    url: "https://www.linkedin.com/pulse/decision-making-connectly-power-first-principles-thinking-koepke/",
    publication: "LinkedIn",
    year: 2023,
  },
];

export const contact: Contact = {
  email: "joschakoepke@gmail.com",
  twitter: "",
  linkedin: "https://linkedin.com/in/joschakoepke",
  github: "https://github.com/Meyk0",
  mcp_url: "https://joschakoepke.com/api/mcp",
};

export const openToWork: OpenToWork = {
  open: true,
  context:
    "Always open to interesting conversations about AI, product, and the future of work.",
  ideal_role:
    "Head of Product / VP Product at an AI-native company building tools that matter.",
};

// ─── Hidden CV (MCP-only, not exposed in terminal UI) ─────────────────────────

export const resume: ResumeData = {
  summary:
    "AI product leader with deep hands-on experience across the full stack of enterprise conversational agents: memory and personalization, retrieval and knowledge grounding, and LLM evaluation systems. Led and grew Connectly\u2019s agent platform from inception to $10M+ ARR, powering 40M+ monthly messages for enterprise retailers globally. Customer obsession built through years of working directly with customers, partnering with forward-deployed engineering teams to turn deployment learnings into product direction.",
  selectedImpact: [
    "Scaled platform to $10M+ ARR with 106% net dollar retention in 2025. Existing customers expanded faster than any churn.",
    "2x direct in-thread purchases per session since Oct 2025, driven by evaluation-informed improvements to checkout, discount logic, and personalization.",
    "40M+ monthly messages across outbound marketing campaigns and inbound AI agent interactions at 99% uptime.",
  ],
  experience: [
    {
      company: "Connectly AI",
      role: "Head of Product",
      dates: "04/2021 \u2013 Present",
      context: "Series B \u00B7 Investors: Alibaba, Unusual Ventures",
      bullets: [
        "Designed and shipped agent memory and personalization: per-session context summaries stored in Postgres, injected into key LLM calls (router, response generator, agent loops) for cross-session continuity. Architected around enterprise privacy requirements (consent, data minimization, retention, auditability), reducing time-to-checkout for returning customers on sales agents by ~3 min.",
        "Built and owned the AI evaluation platform: simulations, LLM-as-judge scoring, and telemetry to diagnose funnel drop-offs. Translated insights into checkout, discount, and personalization improvements, doubling direct in-thread purchases per session since Oct 2025.",
        "Led the AI Agent Builder Platform: reusable modules, standardized SDKs, and integration templates that cut agent setup and integration time from weeks to hours for forward-deployed and customer engineering teams.",
        "Defined composable SOP framework through direct work with enterprise retail customers: knowledge grounding, product search and recommendations, order status, and checkout. Translated deployment learnings into reusable modules now used in production globally.",
        "Designed real-time intent classification layer: routing between transactional and exploratory shopper intent upstream of the recommendation engine, then selecting between consultative dialog and direct recommendations based on context.",
        "Owned event-trigger-action orchestration architecture handling 40M+ monthly messages across outbound marketing campaigns and inbound AI agent interactions, maintaining 99% uptime across production deployments.",
        "Defined enterprise pricing and integrations: usage-based and managed tiers, plus strategic integrations with Salesforce, Braze, Shopify, and VTEX, contributing to 25% ACV growth and 40% YoY revenue increase.",
        "Hired and led global Product and Design team of 5. Established cross-functional alignment across Engineering, Sales, and Customer Engineering.",
      ],
    },
    {
      company: "Google",
      role: "Global Product Lead, Online to Offline",
      dates: "09/2018 \u2013 04/2021",
      bullets: [
        "Led product and go-to-market strategy for online-to-offline ads and geo products across Search, Display, YouTube, and Google Maps. Scaled from beta to 9-digit ARR across 20+ countries.",
        "Core product was Store Visits attribution: probabilistic modeling of ad exposure to physical store visit conversion, working closely with advertisers to validate and scale results.",
      ],
    },
    {
      company: "Google",
      role: "Senior Account Manager",
      dates: "04/2014 \u2013 09/2018",
      bullets: [
        "Managed $50M+ portfolio of automotive and mobility advertisers, achieving average 50% YoY growth through performance optimization and expansion.",
      ],
    },
  ],
  competencies: {
    "AI agent systems":
      "orchestration, tool & API integrations, retrieval & knowledge grounding, personalization, LLM-as-judge evaluation, simulations, telemetry",
    "Platform product":
      "APIs, SDKs, integration templates, developer experience, observability & debugging workflows, enterprise controls, pricing & packaging",
    "Data & experimentation":
      "customer development, A/B experimentation, SQL, Python",
    "Security & compliance":
      "ISO 27001 certification leadership, enterprise privacy (consent, data minimization, retention, auditability), access governance",
  },
  education: [
    "M.Sc. Management & Marketing, HEC Lausanne",
    "Global MBA Exchange, National Taiwan University",
    "B.Sc. Business Administration, University of M\u00FCnster",
    "Full Stack Development, Le Wagon (2018)",
  ],
  languages: [
    "German & English (native)",
    "French (fluent)",
    "Spanish (conversational)",
  ],
  sideProjects: [
    "EvalArena: hands-on training platform for writing AI evals (LLM-as-judge, trace analysis, rubric design)",
    "MCP Task Creator",
    "AI Resume Analyzer",
    "Git Claude Commit",
  ],
  interests:
    "Dogs, mostly Golden Retrievers and preferably puppies. Overpriced espresso machines. Paragliding over and surfing in San Francisco\u2019s cold and sharky waters.",
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
  {
    name: "get_resume",
    description: "Returns full CV with detailed experience, impact metrics, competencies, and education",
    parameters: "(none)",
  },
  {
    name: "ask_joscha",
    description: "Ask any free-form question about Joscha and get a grounded, conversational answer",
    parameters: "question: string",
  },
];
