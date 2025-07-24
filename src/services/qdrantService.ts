import { Service } from 'typedi';
import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../../config';

@Service()
export class QdrantService {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      url: config.qdrant.url,
      apiKey: config.qdrant.apiKey,
    });
  }

  public async createCollection(collectionName: string, vectorSize: number) {
    try {
      await this.client.createCollection(collectionName, {
        vectors: {
          size: vectorSize, // Specify the vector size for your model
          distance: 'Cosine',
        },
      });
      console.log(`Collection '${collectionName}' created successfully.`);
    } catch (error) {
      console.error(`Error creating collection '${collectionName}':`, error);
    }
  }

  public async upsertPoints(collectionName: string, points: any) {
    try {
      await this.client.upsert(collectionName, {
        wait: true,
        points: points,
      });
      console.log(`Upserted ${points.length} points to '${collectionName}'.`);
    } catch (error) {
      console.error(`Error upserting points to '${collectionName}':`, error);
    }
  }

  public async deleteCollection(collectionName: string) {
    try {
      await this.client.deleteCollection(collectionName);
      console.log(`deleted collection with collection name ${collectionName}`);
    } catch (error) {
      console.error(`Error upserting points to '${collectionName}':`, error);
    }
  }

  public async searchPoints(collectionName: string, vector: number[], limit: number = 5) {
    try {
      const searchResult = await this.client.search(collectionName, {
        vector: vector,
        limit: limit,
      });
      return searchResult;
    } catch (error) {
      console.error(`Error searching points in '${collectionName}':`, error);
      return null;
    }
  }

  public async queryPoints(collectionName: string, vector: number[], limit: number = 5) {
    try {
      const searchResult = await this.client.query(collectionName, {
        query: vector,
        limit: limit,
        params: { exact: true },
        with_payload: true,
        score_threshold: 0.65
      });
      return searchResult;
    } catch (error) {
      console.error(`Error searching points in '${collectionName}':`, error);
      return null;
    }
  }
}
