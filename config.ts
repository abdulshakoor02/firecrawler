type Config = {
  openai: {
    apiKey: string;
    baseUrl: string;
  };
  qdrant: {
    url: string;
    apiKey: string;
  };
  firecrawl: {
    apiKey: string;
  };
  crawl4ai: {
    serverUrl: string;
    proxy: string;
  };
  llm: {
    url: string;
    token: string;
  };
};

export const config: Config = {
  openai: {
    apiKey: process.env.MOONSHOT_API_KEY!,
    baseUrl: process.env.MOONSHOT_BASE_URL!,
  },
  qdrant: {
    url: process.env.QDRANT_URL!,
    apiKey: process.env.QDRANT_API_KEY!,
  },
  firecrawl: {
    apiKey: process.env.FIRECRAWL_API_KEY!,
  },
  crawl4ai: {
    serverUrl: process.env.CRAWL4AI_SERVER_URL!,
    proxy: process.env.PROXY_URL!
  },
  llm: {
    url: process.env.LLM_URL!,
    token: process.env.LLM_TOKEN!,
  },
};
