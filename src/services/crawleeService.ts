import { Service, Container } from 'typedi';
import { PuppeteerCrawler, log, RequestQueue } from 'crawlee';
import TurndownService from 'turndown';
import {
  EmbeddingService,
  QdrantService,
  OpenaiService,
  ChunkingService,
} from './'

import type {
  ChunkingService as ChunkType,
  QdrantService as QdrantType,
  OpenaiService as OpenAiType,
  EmbeddingService as EmbeddingType
} from "./";
import type { Product, ProductWithEmbedding } from '../models';

@Service()
export class CrawleeService {
  private chunk: ChunkType
  private qdrant: QdrantType
  private ai: OpenAiType
  private embedding: EmbeddingType
  private turndownService: TurndownService

  constructor() {
    this.turndownService = new TurndownService();
    log.setLevel(log.LEVELS.OFF);
    this.chunk = Container.get(ChunkingService)
    this.qdrant = Container.get(QdrantService)
    this.ai = Container.get(OpenaiService)
    this.embedding = Container.get(EmbeddingService)
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

      console.log(`[deepCrawlWithPagination] Pre-generated ${urls.length} URLs for parallel processing`);

      // Create a unique RequestQueue for this crawler instance to avoid conflicts
      const queueId = `${source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const requestQueue = await RequestQueue.open(queueId);

      const crawler = new PuppeteerCrawler({
        minConcurrency: 5, // Reduced concurrency to prevent resource conflicts
        requestQueue,
        maxRequestsPerCrawl: maxPages, // Process all pages in parallel
        launchContext: {
          launchOptions: {
            args: ['--no-sandbox'],
          },
        },
        handleFailedRequestFunction: async ({ request, error }) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`[deepCrawlWithPagination] Request failed for ${request.url}:`, errorMessage);
          // Don't retry on ENOENT errors
          if (errorMessage.includes('ENOENT')) {
            return;
          }
        },
        requestHandler: async ({ page, request }) => {
          console.log(`[deepCrawlWithPagination] Processing page: ${request.url}`);

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

          // Wait for page to fully load with faster timeout
          await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch((err) => {
            console.log(`[deepCrawlWithPagination] Page load error: ${err}`);
          });
          console.log(`[deepCrawlWithPagination] Page loaded: ${request.url}`);

          // Extract content
          let htmlContent = '';
          let contentSelectorUsed = '';

          try {
            htmlContent = await page.$eval('main, .main-content, #content, article', (element) => element.innerHTML);
            contentSelectorUsed = 'main/.main-content/#content/article';
            console.log(`[deepCrawlWithPagination] Found content using selector: ${contentSelectorUsed}`);
          } catch (error) {
            console.log(`[deepCrawlWithPagination] Content selectors not found, falling back to body`);
            htmlContent = await page.$eval('body', (element) => element.innerHTML);
            contentSelectorUsed = 'body';
          }

          if (htmlContent) {
            const markdown = this.turndownService.turndown(htmlContent);
            const wordCount = markdown.split(/\s+/).length;
            console.log(`[deepCrawlWithPagination] Extracted ${markdown.length} 
                         chars (~${wordCount} words) from ${request.url}`);

            const chunked = this.chunk.chunkStringByCharCount(markdown as string, 10000);

            for (const val of chunked) {
              const parsedData = await this.ai.parse(`
  Convert the following content into a JSON array of product objects 
  ${val}
  `);
              const res = JSON.parse(parsedData?.choices?.[0]?.message?.content as any);
              console.log(`total products ${res.products.length}`);
              const result = await this.embedding.producEmbeddings(
                res.products as unknown as Product[],
                20,
                source,
              ) as ProductWithEmbedding;
              await this.qdrant.upsertPoints('products', result);
            }
          } else {
            console.log(`[deepCrawlWithPagination] No content extracted from ${request.url}`);
          }
        },
      });

      console.log(`[deepCrawlWithPagination] Starting crawler with ${urls.length} URLs`);
      await crawler.run(urls);

      console.log(`[deepCrawlWithPagination] Crawling completed. Total pages processed: ${markdownContents.length}`);

    } catch (error) {
      console.error(`[deepCrawlWithPagination] Error during crawling:`, error);
      throw error;
    }

  }
}
