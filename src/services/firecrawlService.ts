import { Service } from 'typedi';
import FirecrawlApp from '@mendable/firecrawl-js';
import { config } from '../../config';
import { type Schema, z } from 'zod';
import { required } from 'zod/mini';

@Service()
export class FirecrawlService {
  private client: FirecrawlApp;

  constructor() {
    this.client = new FirecrawlApp({ apiKey: config.firecrawl.apiKey });
  }

  public async extractProduct(url: string, prompt: string) {
    const domaintoCrawl = []
    domaintoCrawl.push(url);
    try {
      const data = await this.client.extract(
        domaintoCrawl,
        {
          prompt,
          agent: {
            model: 'FIRE-1'
          },
          schema: {
            "type": "object",
            "properties": {
              "products": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string"
                    },
                    "price": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "name",
                    "price",
                    "description"
                  ]
                }
              }
            },
            "required": [
              "products"
            ]
          }
        });
      return data;
    } catch (error) {
      console.error(`Error extracting data from '${url}':`, error);
      return null;
    }
  }
}
