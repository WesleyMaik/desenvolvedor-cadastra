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

type ProductParams = keyof Product;

/**
 *
 * @param products Products list
 * @param key Property of Product
 * @returns A distict list of a product's property
 */
function getArrayDistinct(products: Product[], key: ProductParams) {
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

type SortBy = "date" | "price" | "color" | "name";
type OrderBy = "asc" | "desc";

/**
 *
 * @param products Products list
 * @param sortBy Property to sort
 * @param orderBy Ascending or Descending
 * @returns Sorted products
 */
function sortProductsBy(products: Product[], sortBy: SortBy, orderBy: OrderBy) {
  const sorted = Array.from(products).sort((a, b) => {
    const key = sortBy;

    if (a[key] < b[key]) {
      return orderBy == "asc" ? -1 : 1;
    }

    if (a[key] > b[key]) {
      return orderBy == "asc" ? 1 : -1;
    }

    return 0;
  });

  return sorted;
}

type FilterBy = {
  color?: string;
  size?: string;
  price_range?: [number, number];
};

/**
 *
 * @param products  Products list
 * @param filterBy Property to filter
 * @returns Filtered products
 */
function filterProductsBy(products: Product[], filterBy: FilterBy) {
  let filtered = Array.from(products);

  if (filterBy.color) {
    filtered = filtered.filter((product) => {
      const colorStatement = filterBy.color == product.color;
      return colorStatement;
    });
  }

  if (filterBy.size) {
    filtered = filtered.filter((product) => {
      const sizeStatement = product.size.includes(filterBy?.size);
      return sizeStatement;
    });
  }

  if (filterBy.price_range) {
    filtered = filtered.filter((product) => {
      const priceStatement =
        product.price >= filterBy?.price_range[0] &&
        product.price <= filterBy?.price_range[1];

      return priceStatement;
    });
  }

  return filtered;
}

async function main() {
  const { data: products } = await getProducts();
  const colors = getColorsByProducts(products);
  const sizes = getSizesByProducts(products);
  const prices = getPricesByProducts(products);
  const dates = getDateByProducts(products);

  console.log({ products, colors, sizes, prices, dates });

  console.log(sortProductsBy(products, "date", "asc"));
  console.log(sortProductsBy(products, "date", "desc"));

  console.log(filterProductsBy(products, { color: "Amarelo" }));
  console.log(filterProductsBy(products, { size: "M" }));
  console.log(filterProductsBy(products, { price_range: [28, 120] }));
}

document.addEventListener("DOMContentLoaded", main);
