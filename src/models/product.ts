export interface Product {
  name: string;
  price: number;
  description: string;
}

export interface ProductWithSource extends Product {
  source: string
}

export interface ProductWithEmbedding {
  vectors: number[];
  id: string;
  payload: ProductWithSource
}
