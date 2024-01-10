import { Product } from "./types/Product";

const serverUrl = "http://localhost:5000";
const get_product_url = `${serverUrl}/products`;

async function getProducts() {
  let data: Product[] | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(get_product_url, { method: "GET" });

    if (!response.ok) {
      throw new Error("Something went wrong.");
    }

    const result = (await response.json()) as Product[];

    data = result;
  } catch (err) {
    error = err;
  }

  return { data, error };
}

/**
 *
 * @param products Products list
 * @param key Propriety of Product
 * @returns A distict list of a product's propriety
 */
function getArrayDistinct(products: Product[], key: keyof Product) {
  return [...new Set(products?.map((product) => product[key]))];
}

/**
 *
 * @param products Products list
 * @returns A list of colors
 */
function getColorsByProducts(products: Product[]) {
  const colors = getArrayDistinct(products, "color") || [];

  return colors.sort() as string[];
}

/**
 *
 * @param products Products list
 * @returns A list of sizes
 */
function getSizesByProducts(products: Product[]) {
  const sizes =
    [
      ...new Set(
        products?.reduce((prev, cur) => {
          return [...prev, ...cur.size];
        }, [])
      ),
    ] || [];

  const orderSizes = ["P", "M", "G", "GG", "U"];
  return sizes.sort((a, b) => {
    return orderSizes.indexOf(a) - orderSizes.indexOf(b);
  }) as string[];
}

/**
 *
 * @param products Products list
 * @returns A list of prices
 */
function getPricesByProducts(products: Product[]) {
  const prices = getArrayDistinct(products, "price") || [];
  return prices.sort() as number[];
}

/**
 *
 * @param products Products list
 * @returns A list of dates
 */
function getDateByProducts(products: Product[]) {
  const dates = getArrayDistinct(products, "date") || [];
  return dates.sort() as string[];
}

async function main() {
  const { data: products } = await getProducts();
  const colors = getColorsByProducts(products);
  const sizes = getSizesByProducts(products);
  const prices = getPricesByProducts(products);
  const dates = getDateByProducts(products);

  console.log({ colors, sizes, prices, dates });
}

document.addEventListener("DOMContentLoaded", main);
