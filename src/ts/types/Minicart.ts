import { Product } from "./Product";

export type MinicartItem = Product & {
  quantity: number;
};
