import { Product } from "./types/Product";

const serverUrl = "http://localhost:5000";
const get_product_url = `${serverUrl}/products`;

async function getProducts() {
  let data: Product | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(get_product_url, { method: "GET" });

    if (!response.ok) {
      throw new Error("Something went wrong.");
    }

    const result = (await response.json()) as Product;

    data = result;
  } catch (err) {
    error = err;
  }

  return { data, error };
}

async function main() {}

document.addEventListener("DOMContentLoaded", main);
