export interface Point {
  vectors: number[];
  id: string;
}

export interface GenericPoints extends Point {
  payload: any;
}

