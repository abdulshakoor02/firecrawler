import { Service } from 'typedi';

@Service()
export class ChunkingService {
  /**
   * Chunks a string into smaller pieces based on a specified character count.
   * @param text The input string to chunk.
   * @param chunkSize The maximum number of characters for each chunk.
   * @returns An array of string chunks.
   */
  public chunkStringByCharCount(text: string, chunkSize: number): string[] {
    if (!text || chunkSize <= 0) {
      return [];
    }

    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }

    return chunks;
  }
}
