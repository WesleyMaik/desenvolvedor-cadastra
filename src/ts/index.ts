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

    const uniqueProducts = result.reduce((acc, cur) => {
      return acc.some((obj) => obj.id === cur.id) ? acc : [...acc, cur];
    }, []) as Product[];

    data = uniqueProducts;
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
  const prices = (getArrayDistinct(products, "price") as number[]) || [];
  return prices.sort((a, b) => {
    return a - b;
  });
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

/**
 *
 * @param colors Array of colors
 * @param target A selector of DOM's element
 */
function createColorFilter(colors: string[], target: string) {
  const container = document.querySelector(target);

  colors.forEach((color) => {
    const element = `
    <div id="color-${color}" class="color">
      <label id="color_label-${color}" class="color_label">
        <input type="checkbox" name="color[]" id="color-${color}" value="${color}" />
        <span id="color_name-${color}" class="color_name">${color}</span>
      </label>
    </div>
    `.trim();

    container.innerHTML += element;
  });
}

/**
 *
 * @param sizes Array of sizes
 * @param target A selector of DOM's element
 */
function createSizeFilter(sizes: string[], target: string) {
  const container = document.querySelector(target);

  sizes.forEach((size) => {
    const element = `
      <button type="button" title="${size}" id="size-${size}" class="size" data-active="false" data-value="${size}">${size}</button>
    `.trim();

    container.innerHTML += element;
  });
}

/**
 *
 * @param prices Array of prices
 * @param target A selector of DOM's element
 * @returns
 */
function createPriceRangeFilter(prices: number[], target: string) {
  const container = document.querySelector(target);

  if (prices.length < 2) {
    return;
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const priceRange = [0, minPrice, maxPrice / 2, maxPrice, Infinity];

  priceRange.forEach((price, index) => {
    if (index == priceRange.length - 1) {
      return;
    }

    const nextValue = priceRange[index + 1];

    let priceText = `<span id="price_range-${index}" class="price_range">
      de ${formatCurrency(price)} até ${formatCurrency(nextValue)}
    </span>`;

    if (index == priceRange.length - 2) {
      priceText = `A partir de ${formatCurrency(maxPrice)}`;
    }

    const element = `
      <div id="price-${index}" class="price">
        <label id="price_label-${index}" class="price_label">
          <input 
            type="radio" 
            name="price-range" 
            id="price-range-${index}" 
            value="${price}"
            data-min-value="${price}"
            data-max-value="${nextValue}"
          />
          ${priceText}
        </label>
      </div>
    `.trim();

    container.innerHTML += element;
  });
}

/**
 *
 * @param value A number value
 * @returns A number formatted for Brazilian currency
 */
function formatCurrency(value: number) {
  return value?.toLocaleString("pt-br", { style: "currency", currency: "BRL" });
}

/**
 *
 * @param products Products list
 */
function createProductShelfs(products: Product[]) {
  const container = document.querySelector("#products");
  container.innerHTML += "";

  products.forEach((product) => {
    const { id, installment, image, name, price } = product;

    const element = `
      <a href="#" id="product-${id}" class="product">
        <div id="image-container-${id}" class="image-container">
          <img
            class="product_image"
            src=".${image}"
            alt="${name || "Blusa"}"
            width="190"
            height="290"
          />
        </div>
        <p id="product-name-${id}" class="product-name">${name}</p>
        <p id="product-price-${id}" class="product-price">
          ${formatCurrency(price)}
        </p>
        <p id="product-installment-${id}" class="product-installment">
          Até ${installment[0]}x de ${formatCurrency(price / installment[0])}
        </p>
        <button 
          type="button" 
          id="add-to-cart-${id}" 
          class="add-to-cart"
          data-item-id="${id}"
        >
          Comprar
        </button>
      </a>
    `.trim();

    container.innerHTML += element;
  });
}

async function main() {
  const { data: products } = await getProducts();
  const colors = getColorsByProducts(products);
  const sizes = getSizesByProducts(products);
  const prices = getPricesByProducts(products);

  createColorFilter(colors, "#color-options");
  createSizeFilter(sizes, "#size-options");
  createPriceRangeFilter(prices, "#price-options");

  createProductShelfs(products);
}

document.addEventListener("DOMContentLoaded", main);
