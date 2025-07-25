# FireCrawler Documentation

## Overview

FireCrawler is a web scraping and data processing application that extracts product information from e-commerce websites, processes the data, generates embeddings, and stores the results in a vector database (Qdrant). The application uses various tools and services for crawling, parsing, and processing data.

## Architecture

The application follows a modular service-based architecture with the following key components:

1. **Orchestrator Service** - Coordinates the entire workflow
2. **Crawling Services** - Multiple services for web crawling (Crawlee, Crawl4ai, Firecrawl)
3. **Parsing Services** - Extracts structured data from crawled content
4. **Embedding Service** - Generates vector embeddings for products
5. **Qdrant Service** - Manages storage and retrieval from the Qdrant vector database

## Services

### Orchestrator Service (`orchestraterService.ts`)

The main service that orchestrates the entire workflow:
- Uses Crawl4ai to perform deep crawling of websites
- Chunks the crawled content for processing
- Parses product data from the content using LLM
- Generates embeddings for products
- Stores the results in Qdrant

### Crawling Services

1. **Crawlee Service (`crawleeService.ts`)** - Uses the Crawlee framework for web crawling
2. **Crawl4ai Service (`crawl4aiService.ts`)** - Integrates with Crawl4ai for advanced crawling capabilities
3. **Firecrawl Service (`firecrawlService.ts`)** - Uses Firecrawl for website crawling and data extraction

#### Crawlee Framework

Crawlee is a powerful web scraping and browser automation library for Node.js that provides several key features:

- **Multiple Crawler Types**: 
  - `CheerioCrawler`: For fast scraping of static HTML content
  - `PlaywrightCrawler`: For full browser automation with Playwright
  - `PuppeteerCrawler`: For full browser automation with Puppeteer
  
- **Smart Request Management**: Built-in features for handling retries, rate limiting, and session management

- **Anti-blocking Features**: Browser fingerprinting, proxy rotation, and user-agent rotation to avoid detection

- **Data Storage**: Automatic management of datasets, key-value stores, and request queues with both local and cloud storage options
  - **Datasets**: For storing structured data extracted from web pages
  - **Key-Value Stores**: For storing configuration, cookies, and other key-value data
  - **Request Queues**: For managing URLs to be crawled
  
- **Scalability**: Horizontal scaling capabilities for handling large-scale crawling tasks

Crawlee's storage system automatically manages data persistence during crawling operations. By default, data is stored locally in the filesystem, but it can also integrate with cloud storage when deployed on the Apify platform. The storage system provides:
- Automatic data serialization and deserialization
- Efficient data retrieval and querying
- Support for various data formats (JSON, CSV, etc.)
- Cleanup utilities for managing storage between runs

### Data Processing Services

1. **Chunking Service (`chunkingService.ts`)** - Splits large text content into manageable chunks
2. **OpenAI Service (`openaiService.ts`)** - Interfaces with OpenAI (or compatible) models for content parsing
3. **Embedding Service (`embeddingService.ts`)** - Generates vector embeddings for product data using transformer models

### Storage Service

1. **Qdrant Service (`qdrantService.ts`)** - Manages interactions with the Qdrant vector database

## Data Models

### Product (`product.ts`)

```typescript
interface Product {
  name: string;
  price: number;
  description: string;
}

interface ProductWithSource extends Product {
  source: string;
}

interface ProductWithEmbedding {
  vectors: number[];
  id: string;
  payload: ProductWithSource;
}
```

## Configuration

The application uses a configuration file (`config.ts`) that reads environment variables for API keys and service URLs:

- OpenAI API key and base URL
- Qdrant URL and API key
- Firecrawl API key
- Crawl4ai server URL and proxy settings
- LLM URL and token

## Dependencies

Key dependencies include:
- `crawlee` - Web scraping framework that provides multiple crawler types (Cheerio, Playwright, Puppeteer) with built-in features for request management, anti-blocking, and data storage
- `@mendable/firecrawl-js` - Firecrawl SDK for website crawling and data extraction
- `@qdrant/js-client-rest` - Qdrant client for vector database operations
- `@xenova/transformers` - For generating embeddings using transformer models
- `openai` - OpenAI client for interacting with LLMs
- `typedi` - Dependency injection container for TypeScript
- `reflect-metadata` - Required for TypeDI's reflection capabilities

## Usage

To run the application:

1. Install dependencies:
   ```bash
   bun install
   ```

2. Set up environment variables for all required services

3. Run the application:
   ```bash
   bun run src/app.ts
   ```

In `app.ts`, you can uncomment different services to test various crawling approaches:
- `orchestrate.crawl4aiJob()` - Uses the orchestrator with Crawl4ai
- `crawlee.crawl()` - Uses Crawlee directly

### Using Crawlee

To use the Crawlee service in your application:

1. Make sure you have configured the required environment variables for any proxies or special settings
2. Import and use the CrawleeService in your code:
   ```typescript
   import { Container } from 'typedi';
   import { CrawleeService } from './services';
   
   const crawlee = Container.get(CrawleeService);
   await crawlee.crawl('https://example.com');
   ```

The Crawlee service in this project is set up to:
- Use PlaywrightCrawler for full browser automation capabilities
- Handle JavaScript-rendered content properly
- Automatically store crawled data in local storage
- Manage request queues and retries
- Scale appropriately for the crawling task

## Workflow

The typical workflow is:
1. Crawl a website using one of the crawling services (with Crawlee being one option that offers powerful features for handling complex sites)
2. Extract raw content (HTML/markdown)
3. Chunk the content for processing
4. Parse product data from chunks using an LLM
5. Generate embeddings for each product
6. Store products with embeddings in Qdrant

This enables semantic search capabilities over the crawled product data.

When using Crawlee specifically, the workflow benefits from:
- Automatic handling of JavaScript-rendered content
- Built-in anti-blocking measures to avoid detection
- Smart request management with retries and rate limiting
- Automatic data storage during the crawling process
- Scalability features for handling large websites