import { MinicartItem } from "./types/Minicart";
import { Product } from "./types/Product";

const serverUrl =
  process.env.NODE_ENV == "development"
    ? "http://localhost:5000"
    : "https://my-json-server.typicode.com/wesleymaik/desenvolvedor-cadastra";

const get_product_url = `${serverUrl}/products`;

async function getProducts() {
  let data: Product[] = [];
  let error: string | null = null;

  try {
    const response = await fetch(get_product_url, { method: "GET" });

    if (!response.ok) {
      throw new Error("Something went wrong.");
    }

    const result = ((await response.json()) || []) as Product[];

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
  const sizes = [
    ...new Set(
      products?.reduce((prev, cur) => {
        return [...prev, ...cur.size];
      }, [])
    ),
  ];

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
  color?: string[];
  size?: string[];
  price_range?: [number?, number?];
};

/**
 *
 * @param products  Products list
 * @param filterBy Property to filter
 * @returns Filtered products
 */
function filterProductsBy(products: Product[], filterBy: FilterBy) {
  let filtered = Array.from(products);

  if (filterBy.color && filterBy.color.length) {
    filtered = filtered.filter((product) => {
      const colorStatement = filterBy.color?.includes(product.color);
      return colorStatement;
    });
  }

  if (filterBy.size && filterBy.size.length) {
    filtered = filtered.filter((product) => {
      const sizeStatement = filterBy?.size.some((size) =>
        (product.size || [])?.includes(size)
      );
      return sizeStatement;
    });
  }

  if (filterBy.price_range && filterBy.price_range.length) {
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
        <input type="checkbox" name="color[]" id="color-${color}" data-id="color" value="${color}" />
        <span id="color_name-${color}" class="color_name">${color}</span>
      </label>
    </div>
    `.trim();

    container.innerHTML += element;
  });

  const clearFilterElement = `
    <button 
      type="button" 
      title="Limpar filtro" 
      class="clear-button clear-color" 
      data-id="clear-color"
    >Limpar filtro</button>
  `;

  container.innerHTML += clearFilterElement;
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
      <button 
        type="button" 
        title="${size}" 
        id="size-${size}" 
        class="size" 
        data-id="size"
        data-active="false" 
        data-value="${size}"
      >${size}</button>
    `.trim();

    container.innerHTML += element;
  });

  const clearFilterElement = `
    <button 
      type="button" 
      title="Limpar filtro" 
      class="clear-button clear-size" 
      data-id="clear-size"
    >Limpar filtro</button>
  `;

  container.innerHTML += clearFilterElement;
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
  const midPrice = prices[Math.floor(prices.length / 2)];
  const maxPrice = Math.max(...prices);

  const priceRange = [0, minPrice, midPrice, maxPrice, Infinity];

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
            class="price-range"
            data-id="prince-range"
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

  const clearFilterElement = `
    <button 
      type="button" 
      title="Limpar filtro" 
      class="clear-button clear-price-range" 
      data-id="clear-price-range"
    >Limpar filtro</button>
  `;

  container.innerHTML += clearFilterElement;
}

/**
 *
 * @param value A number value
 * @returns A number formatted for Brazilian currency
 */
function formatCurrency(value: number) {
  return value?.toLocaleString("pt-br", { style: "currency", currency: "BRL" });
}

function showErrorMessage() {
  const container = document.querySelector("#products-container");

  const element = `<p id="error" class="error">Não foi possível exibir os produtos.</p>`;

  container.innerHTML = element;
}

/**
 *
 * @param quantity number
 */
function updateQuantityCart(quantity: number) {
  const minicartQuantity =
    document.querySelector<HTMLDivElement>("#minicart-quantity");
  minicartQuantity.innerText = String(quantity);
}

function createProductSummary(items: MinicartItem[]) {
  const container = document.querySelector("#minicart-items");
  container.innerHTML = "";

  items.forEach((item) => {
    const { id, image, name, price } = item;

    const element = `
      <div id="item" class="item">
        <img
          src=".${image}"
          alt="${name}"
          id="item-image-${id}"
          class="item-image"
        />
        <div id="item-info-${id}" class="item-info">
          <p class="item-name">${name}</p>
          <p class="item-price">${formatCurrency(price)}</p>
          <button 
            type="button" 
            id="remove-item-${id}" 
            class="remove-item"
            data-id="remove-item"
            data-item-id="${id}"
          >
            Remover
          </button>
        </div>
      </div>
    `;

    container.innerHTML += element;
  });
}

function updateSubtotal(items: MinicartItem[]) {
  const subtotal = items.reduce((acc, cur) => {
    return acc + cur.price * cur.quantity;
  }, 0);

  const minicartSubtotal = document.querySelector<HTMLSpanElement>(
    "#minicart-subtotal-value"
  );

  minicartSubtotal.innerText = formatCurrency(subtotal);
}

/**
 * Product constructor
 */
class ProductPage {
  constructor(
    private products: Product[] = [],
    private filters: FilterBy = {},
    private sorted: Product[] = [],
    private itemsToShow: number = 6
  ) {}

  setProducts(data: Product[]) {
    this.products = data;

    if (!this.sorted.length) {
      this.setSorted(data);
    }

    this.createProductShelfs(this.products);
  }

  getProducts() {
    return this.products;
  }

  setSorted(data: Product[]) {
    this.sorted = data;
    this.setProducts(data);
  }

  setFilters(data: FilterBy) {
    this.filters = { ...this.filters, ...data };
    const filtered = filterProductsBy(this.sorted, this.filters);
    this.setProducts(filtered);
  }

  getFilters() {
    return this.filters;
  }

  setItemsToShow(value: number) {
    this.itemsToShow = value;
    const products = this.products;
    this.createProductShelfs(products);
  }

  showMoreItems() {
    const itemsToShow = this.itemsToShow;

    if (itemsToShow >= this.products.length) {
      return;
    }

    this.setItemsToShow(itemsToShow + 6);
  }

  /**
   *
   * @param products Products list
   */
  createProductShelfs(products: Product[]) {
    const container = document.querySelector("#products");
    container.innerHTML = "";

    if (!products.length) {
      const container = document.querySelector("#products-container");

      const emptyElement = `<p id="shelf-empty">Não há produtos no momento.</p>`;

      container.innerHTML += emptyElement;
      return;
    }

    document.querySelector("#shelf-empty")?.remove();

    const itemsToShow = this.itemsToShow;

    const showMoreButton =
      document.querySelector<HTMLButtonElement>("#show-more");

    if (itemsToShow >= products.length) {
      showMoreButton.style.display = "none";
    } else {
      showMoreButton.style.display = "block";
    }

    products.slice(0, itemsToShow).forEach((product) => {
      const { id, installment, image, name, price } = product;

      const element = `
        <div id="product-${id}" class="product">
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
            data-id="add-to-cart"
            data-item-id="${id}"
          >
            Comprar
          </button>
        </div>
      `.trim();

      container.innerHTML += element;
    });
  }
}

/**
 * Minicart constructor
 */
class Minicart {
  constructor(private items: MinicartItem[] = []) {}

  private setItems(items: MinicartItem[]) {
    this.items = items;

    this.updateMinicart();
  }

  private updateItem(index: number, property: Partial<MinicartItem>) {
    const item = this.items[index];

    if (!item) {
      return;
    }

    this.items[index] = { ...item, ...property };
  }

  getItems() {
    return this.items;
  }

  addToCart(item: MinicartItem) {
    const id = item.id;
    const items = this.getItems();

    const index = this.items.findIndex((item) => item.id == id);

    if (index != -1) {
      const item = items[index];
      items[index] = {
        ...item,
        quantity: item.quantity + 1,
      };

      this.updateItem(index, { quantity: item.quantity + 1 });
      return;
    }

    this.setItems([...items, item]);
  }

  removeFromCart(id: string) {
    const items = this.getItems();
    const itemIndex = items.findIndex((item) => item.id == id);

    if (itemIndex == -1) {
      return;
    }

    this.setItems(items.filter((_, index) => index != itemIndex));
  }

  updateMinicart() {
    const items = this.getItems();
    const quantity = items.length;
    updateQuantityCart(quantity);
    createProductSummary(items);
    updateSubtotal(items);
  }
}

async function main() {
  // Fetch products
  const { data: products, error } = await getProducts();

  // Show error message
  if (error) {
    showErrorMessage();
    return;
  }

  // Get product's properties
  const colors = getColorsByProducts(products);
  const sizes = getSizesByProducts(products);
  const prices = getPricesByProducts(products);

  // Create filters
  createColorFilter(colors, "#color-options");
  createSizeFilter(sizes, "#size-options");
  createPriceRangeFilter(prices, "#price-options");

  createColorFilter(colors, "#color-options-mobile");
  createSizeFilter(sizes, "#size-options-mobile");
  createPriceRangeFilter(prices, "#price-options-mobile");

  const productPage = new ProductPage();
  const cart = new Minicart();

  // Initializing Shelfs
  productPage.setProducts(products);

  // OrderBy event
  const select = document.querySelectorAll<HTMLDivElement>(".select");
  const options =
    document.querySelectorAll<HTMLButtonElement>(".options button");

  select.forEach((select) => {
    select.addEventListener("click", function () {
      this.classList.toggle("opened");
    });
  });

  options.forEach(function (option) {
    const value = option.dataset.value;
    const label = option.dataset.label;
    option.addEventListener("click", function () {
      select.forEach((select) => {
        select.dataset.value = value;
        select.querySelector<HTMLSpanElement>(".selected .text").innerText =
          label;

        select.dispatchEvent(new Event("change"));
      });
    });
  });

  select.forEach((select) => {
    select.addEventListener("change", function () {
      const value = this.dataset.value;
      let sortBy: SortBy = undefined;
      let orderBy: OrderBy = undefined;

      switch (value) {
        case "newest":
          sortBy = "date";
          orderBy = "desc";
          break;
        case "price-asc":
          sortBy = "price";
          orderBy = "asc";
          break;
        case "price-desc":
          sortBy = "price";
          orderBy = "desc";
          break;
      }

      if (!value || !sortBy || !orderBy) {
        return;
      }

      const products = productPage.getProducts();
      const sortedProducts = sortProductsBy(products, sortBy, orderBy);

      productPage.setSorted(sortedProducts);

      addToCartEvent();
    });
  });

  const clearColorButton = document.querySelector<HTMLButtonElement>(
    "button[data-id='clear-color']"
  );

  const clearSizeButton = document.querySelector<HTMLButtonElement>(
    "button[data-id='clear-size']"
  );

  const clearPricesButton = document.querySelector<HTMLButtonElement>(
    "button[data-id='clear-price-range']"
  );

  // FilterBy color
  const colorInputs = document.querySelectorAll<HTMLInputElement>(
    "input[data-id='color']"
  );

  // FilterBy color event
  colorInputs.forEach((input) => {
    input.addEventListener("change", function () {
      const choosedColors = [...colorInputs]
        .filter((element) => element.checked)
        .map((element) => element.value);

      clearColorButton.style.display = choosedColors.length ? "block" : "none";

      productPage.setFilters({ color: choosedColors });

      addToCartEvent();
    });
  });

  // FilterBy size
  const sizeButtons = document.querySelectorAll<HTMLButtonElement>(
    "button[data-id='size']"
  );

  // FilterBy size event
  sizeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const isActive = button.dataset.active == "true";
      button.dataset.active = isActive ? "false" : "true";

      button.dispatchEvent(new Event("change"));
    });

    button.addEventListener("change", function () {
      const choosedSizes = [...sizeButtons]
        .filter((element) => element.dataset.active == "true")
        .map((element) => element.dataset.value);

      clearSizeButton.style.display = choosedSizes.length ? "block" : "none";

      productPage.setFilters({ size: choosedSizes });

      addToCartEvent();
    });
  });

  // FilterBy price
  const priceRadios = document.querySelectorAll<HTMLInputElement>(
    "input[data-id='prince-range']"
  );

  // FilterBy color event
  priceRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      const minValue = Number(radio.dataset.minValue) || 0;
      const maxValue = Number(radio.dataset.maxValue) || Infinity;

      clearPricesButton.style.display = radio.checked ? "block" : "none";

      productPage.setFilters({
        price_range: radio.checked ? [minValue, maxValue] : [],
      });

      addToCartEvent();
    });
  });

  // Clear filters events

  clearColorButton.addEventListener("click", function () {
    colorInputs.forEach((color) => {
      color.checked = false;
      color.dispatchEvent(new Event("change"));
    });
  });

  clearSizeButton.addEventListener("click", function () {
    sizeButtons.forEach((button) => {
      button.dataset.active = "false";
      button.dispatchEvent(new Event("change"));
    });
  });

  clearPricesButton.addEventListener("click", function () {
    priceRadios.forEach((radio) => {
      radio.checked = false;
      radio.dispatchEvent(new Event("change"));
    });
  });

  // Minicart behaviours
  const minicart = document.querySelector("#minicart");
  const minicartButton =
    document.querySelector<HTMLDivElement>("#minicart-icon");
  const closeMinicartButton = document.querySelector<HTMLButtonElement>(
    "button#close-minicart"
  );

  minicartButton.addEventListener("click", function () {
    minicart.setAttribute("data-open", "true");
  });

  closeMinicartButton.addEventListener("click", function () {
    minicart.removeAttribute("data-open");
  });

  // Add to Minicart event
  function addToCartEvent() {
    const addToCartButtons = document.querySelectorAll<HTMLButtonElement>(
      "button[data-id='add-to-cart']"
    );

    function addToCart(event: MouseEvent) {
      event.preventDefault();

      const itemId = this.dataset.itemId;
      const items = productPage.getProducts();
      const item = items.find((item) => item.id == itemId);

      if (!item) {
        return;
      }

      cart.addToCart({ ...item, quantity: 1 });
      minicart.dispatchEvent(new Event("addToCart"));
      minicartButton.dispatchEvent(new Event("click"));
    }

    addToCartButtons.forEach((addToCartButton) => {
      addToCartButton.removeEventListener("click", addToCart);
      addToCartButton.addEventListener("click", addToCart);
    });
  }

  addToCartEvent();

  function removeFromCart() {
    const removeFromCartButtons = document.querySelectorAll<HTMLButtonElement>(
      "button[data-id='remove-item']"
    );

    // Remove from cart event
    removeFromCartButtons.forEach((button) => {
      function removeItem() {
        const itemId = button.dataset.itemId;
        cart.removeFromCart(itemId);

        button.removeEventListener("click", removeItem);

        removeFromCart();
      }

      button.addEventListener("click", removeItem);
    });
  }

  minicart.addEventListener("addToCart", removeFromCart);

  // Mobile Actions
  const mobileFilter = document.querySelector<HTMLDivElement>("#filter-mobile");

  const mobileFilterButton = document.querySelector<HTMLButtonElement>(
    "button#filter-mobile-button"
  );

  const mobileApplyFilterButton =
    document.querySelector<HTMLButtonElement>("#apply-filter");

  const mobileClearFilterButton =
    document.querySelector<HTMLButtonElement>("#clear-filter");

  mobileFilterButton.addEventListener("click", function () {
    mobileFilter.setAttribute("data-open", "true");
  });

  mobileApplyFilterButton.addEventListener("click", function () {
    mobileFilter.removeAttribute("data-open");
  });

  mobileClearFilterButton.addEventListener("click", function () {
    [clearColorButton, clearSizeButton, clearPricesButton].forEach((button) => {
      button.dispatchEvent(new Event("click"));
    });

    mobileFilter.removeAttribute("data-open");
  });

  // Show more
  const showMoreButton =
    document.querySelector<HTMLButtonElement>("#show-more");

  if (products.length > 0) {
    showMoreButton.style.display = "block";
  }

  showMoreButton.addEventListener("click", function () {
    productPage.showMoreItems();
    addToCartEvent();
  });
}

document.addEventListener("DOMContentLoaded", main);
