import { Service, Container } from 'typedi';
import { PuppeteerCrawler, log, RequestQueue } from 'crawlee';
import TurndownService from 'turndown';
import {
  EmbeddingService,
  QdrantService,
  OpenaiService,
  ChunkingService,
  OrchestraterService
} from './'

import type {
  ChunkingService as ChunkType,
  QdrantService as QdrantType,
  OpenaiService as OpenAiType,
  EmbeddingService as EmbeddingType,
  OrchestraterService as OrchestraterType
} from "./";
import type { Product, ProductWithEmbedding } from '../models';

@Service()
export class CrawleeService {
  private chunk: ChunkType
  private qdrant: QdrantType
  private ai: OpenAiType
  private embedding: EmbeddingType
  private turndownService: TurndownService
  private orchestrater: OrchestraterType

  constructor() {
    this.turndownService = new TurndownService();
    log.setLevel(log.LEVELS.OFF);
    this.chunk = Container.get(ChunkingService)
    this.qdrant = Container.get(QdrantService)
    this.ai = Container.get(OpenaiService)
    this.embedding = Container.get(EmbeddingService)
    this.orchestrater = Container.get(OrchestraterService)
  }

  public async convertUrlToMarkdown(url: string): Promise<string> {
    let markdownContent = '';

    const crawler = new PuppeteerCrawler({
      launchContext: {
        launchOptions: {
          args: ['--no-sandbox'],
        },
      },
      requestHandler: async ({ page, request }) => {
        let htmlContent = '';
        try {
          // Attempt to find a more specific content area
          htmlContent = await page.$eval('main, .main-content, #content', (element) => element.innerHTML);
        } catch (error) {
          // Fallback to body if specific content area not found
          htmlContent = await page.$eval('body', (element) => element.innerHTML);
        }
        const html = htmlContent;
        if (html) {
          markdownContent = await this.turndownService.turndown(html);
        }
      },
    });

    await crawler.run([url]);
    return markdownContent;
  }

  public async deepCrawlAndConvertToMarkdown(
    startUrl: string,
    maxRequestsPerCrawl: number = 10,
    maxDepth: number = 1,
  ): Promise<string[]> {
    const requestQueue = await RequestQueue.open();
    const markdownContents: string[] = [];

    const crawler = new PuppeteerCrawler({
      requestQueue,
      maxRequestsPerCrawl: maxRequestsPerCrawl,
      launchContext: {
        launchOptions: {
          args: ['--no-sandbox'],
        },
      },
      requestHandler: async ({ page, request }) => {
        const currentDepth = request.userData?.depth || 0;

        let htmlContent = '';
        try {
          htmlContent = await page.$eval('main, .main-content, #content', (element) => element.innerHTML);
        } catch (error) {
          htmlContent = await page.$eval('body', (element) => element.innerHTML);
        }

        if (htmlContent) {
          const markdown = this.turndownService.turndown(htmlContent);
          markdownContents.push(markdown);
          console.log(`Extracted ${markdown.length} characters from ${request.url} (depth: ${currentDepth})`);
        }

        // Enqueue links for deeper crawling if we haven't reached max depth
        if (currentDepth < maxDepth) {
          const links = await page.$$eval('a[href]', (anchors) =>
            anchors.map(anchor => anchor.href).filter(href => href)
          );

          for (const link of links) {
            try {
              await requestQueue.addRequest({
                url: link,
                userData: { depth: currentDepth + 1 }
              });
            } catch (error) {
              // Skip invalid URLs
              console.log(`Skipping invalid URL: ${link}`);
            }
          }
        }
      },
    });

    await requestQueue.addRequest({ url: startUrl, userData: { depth: 0 } });
    await crawler.run();
    return markdownContents;
  }

  public async deepCrawlWithPaginationAndInteraction(
    startUrl: string,
    maxPages: number = 10,
    source: string,
    pageParam: string
  ): Promise<void> {
    const markdownContents: string[] = [];
    let crawlCount = 0; // Counter to track number of crawls

    console.log(`[deepCrawlWithPagination] Starting parallel crawl from: ${startUrl}`);
    console.log(`[deepCrawlWithPagination] Max pages to process: ${maxPages}`);

    try {
      // Pre-generate URLs for parallel processing
      const baseUrl = new URL(startUrl);
      const urls: string[] = [];

      // Generate URLs with page parameters
      for (let i = 1; i <= maxPages; i++) {
        const pageUrl = new URL(baseUrl);
        pageUrl.searchParams.set(pageParam, i.toString());
        urls.push(pageUrl.toString());
      }

      console.log(`[deepCrawlWithPagination] Pre-generated URLs:`, urls);

      console.log(`[deepCrawlWithPagination] Pre-generated ${urls.length} URLs for parallel processing`);

      // Deduplicate URLs to prevent crawling the same page multiple times
      const uniqueUrls = [...new Set(urls)];
      console.log(`[deepCrawlWithPagination] After deduplication: ${uniqueUrls.length} URLs`);

      // Create a unique RequestQueue for this crawler instance to avoid conflicts
      // const queueId = `${source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      // const requestQueue = await RequestQueue.open(queueId);
      // console.log(requestQueue)

      const crawler = new PuppeteerCrawler({
        minConcurrency: 5, // Reduced concurrency to prevent resource conflicts
        maxRequestRetries: 2, // Limit retries
        requestHandlerTimeoutSecs: 1000, // Increase timeout
        // requestQueue,
        // maxRequestsPerCrawl: maxPages, // Process all pages in parallel
        launchContext: {
          launchOptions: {
            args: ['--no-sandbox'],
          },
        },
        handleFailedRequestFunction: async ({ request, error }) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`[deepCrawlWithPagination] Request failed for ${request.url}:`, errorMessage);
          // Don't retry on ENOENT, timeout, or navigation errors
          if (errorMessage.includes('ENOENT') ||
            errorMessage.includes('timeout') ||
            errorMessage.includes('Navigation timeout') ||
            errorMessage.includes('net::ERR_CONNECTION_TIMED_OUT')) {
            console.log(`[deepCrawlWithPagination] Skipping retry for ${request.url} due to timeout/error`);
            return;
          }
        },
        requestHandler: async ({ page, request }) => {
          crawlCount++; // Increment crawl counter
          console.log(`[deepCrawlWithPagination] Processing page ${crawlCount}: ${request.url}`);
          console.log(`[deepCrawlWithPagination] Original URL: ${request.loadedUrl || 'N/A'}`);

          // Block unnecessary resources for faster loading
          await page.setRequestInterception(true);
          page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
              req.abort();
            } else {
              req.continue();
            }
          });

          // Set a shorter navigation timeout
          // page.setDefaultNavigationTimeout(30000); // 30 seconds

          // Wait for specific elements to load
          try {
            await page.waitForSelector('main, .main-content, #content, article, body', { timeout: 30000 });
          } catch (error) {
            console.log(`[deepCrawlWithPagination] Timeout waiting for content selectors on ${request.url}`);
          }

          // Extract content
          let htmlContent = '';
          let contentSelectorUsed = '';

          try {
            htmlContent = await page.$eval('main, .main-content, #content, article', (element) => element.innerHTML);
            contentSelectorUsed = 'main/.main-content/#content/article';
            console.log(`[deepCrawlWithPagination] Found content using selector: ${contentSelectorUsed}`);
          } catch (error) {
            console.log(`[deepCrawlWithPagination] Content selectors not found, falling back to body`);
            try {
              htmlContent = await page.$eval('body', (element) => element.innerHTML);
              contentSelectorUsed = 'body';
            } catch (bodyError) {
              console.log(`[deepCrawlWithPagination] Failed to extract content from body`);
            }
          }

          if (htmlContent) {
            const markdown = this.turndownService.turndown(htmlContent);
            const wordCount = markdown.split(/\s+/).length;
            console.log(`[deepCrawlWithPagination] Extracted ${markdown.length} 
                         chars (~${wordCount} words) from ${request.url}`);
            console.log(markdown.length)
            await this.orchestrater.processCrawleeMarkdown(markdown, source);
            console.log(`[deepCrawlWithPagination] finished upserting the data: ${request.url}`);
          } else {
            console.log(`[deepCrawlWithPagination] No content extracted from ${request.url}`);
          }
        },
      });

      console.log(`[deepCrawlWithPagination] Starting crawler with ${uniqueUrls.length} URLs`);
      await crawler.run(uniqueUrls);

      console.log(`[deepCrawlWithPagination] Crawling completed. Total pages processed: ${urls.length}`);
      console.log(`[deepCrawlWithPagination] Actual crawl operations performed: ${crawlCount}`);

    } catch (error) {
      console.error(`[deepCrawlWithPagination] Error during crawling:`, error);
      throw error;
    }

  }
}
