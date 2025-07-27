import { Service } from 'typedi';
import { config } from '../../config';

@Service()
export class Crawl4aiService {
  private serverUrl: string;

  constructor() {
    this.serverUrl = config.crawl4ai.serverUrl;
  }

  public async deepCrawlAndExtract(url: string) {
    const payload: any = {
      urls: [url],
      browser_config: {
        type: "BrowserConfig",
        params: {
          proxy: config.crawl4ai.proxy
        }
      },
      crawler_config: {
        type: "CrawlerRunConfig",
        params: {
          magic: true,
          scan_full_page: true,
          js_code: [
            "for (let i = 0; i < 5; i++) { setTimeout(() => { window.scrollTo(0, document.body.scrollHeight); }, i * 2000); }",
            "document.querySelectorAll(\"a:is(:contains('Next'), :contains('next'), :contains('load more'), :contains('Load More'))\").forEach(el => el.click())",
            "document.querySelectorAll(\"button:is(:contains('Next'), :contains('next'), :contains('load more'), :contains('Load More'))\").forEach(el => el.click())"
          ],
          deep_crawl_strategy: {
            type: "BFSDeepCrawlStrategy",
            params: {
              max_depth: 2,
              include_external: false,
              max_pages: 10
            }
          },
        }
      }
    };

    try {
      const response = await fetch(`${this.serverUrl}/crawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Crawl4AI API request failed with status ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error during Crawl4AI request:', error);
      return null;
    }
  }

}
