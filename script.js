/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Keep track of selected products to update checkboxes and send data to OpenAI */
let selectedProducts = [];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product, idx) => `
      <div class="product-card">
        <!-- Checkbox in the top left corner -->
        <input type="checkbox" class="product-checkbox" id="product-check-${idx}" aria-label="Select product" onchange="toggleCardSelection(this)">
        <!-- Info (i) button in the top right corner -->
        <button class="info-btn" aria-label="More about product">&#9432;</button>
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h3 id="${product.id}">${product.name}</h3>
          <p>${product.brand}</p>
        </div>
      </div>
    `,
    )
    .join("");

  // Check checboxes and apply highlight and border for displayed product cards correlating to products in the selectedProducts array.
  displaySelectedProducts();
}

/* Check the displayed product cards against the selected products array. Apply styling and checkbox state to matches. */
function displaySelectedProducts() {
  const productCards = document.querySelectorAll(".product-card");

  productCards.forEach((card) => {
    const productId = card.querySelector(".product-info h3").id;
    const checkbox = card.querySelector(".product-checkbox");

    if (selectedProducts.some((p) => p.id === productId)) {
      card.classList.add("selected");
      checkbox.checked = true;
    } else {
      card.classList.remove("selected");
      checkbox.checked = false;
    }
  });
}

/* Add and remove selected products when checkbox is toggled */
function toggleCardSelection(e) {
  const card = e.closest(".product-card");

  if (e.checked) {
    // Apply styling to checked card (highlight, border)
    card.classList.add("selected");

    // Add checked card's product's id to the selectedProducts array
    selectedProducts.push({
      id: card.querySelector(".product-info h3").id, // Get the rest from productsJson
    });

    // Add the selected product to the "selected products" list on the webpage
    const selectedCard = document.createElement("div");
    selectedCard.classList.add("selected-product-card");
    selectedCard.id = `${card.querySelector(".product-info h3").id}`;
    selectedCard.style.width = "100%";
    selectedCard.style.border = "2px solid";
    selectedCard.style.padding = "5px";
    selectedCard.innerHTML = `
      <button class="remove-btn" aria-label="Remove product">&times;</button>
      <span>${card.querySelector(".product-info h3").textContent + " | " + card.querySelector(".product-info p").textContent}</span>
    `;
    document.getElementById("selectedProductsList").appendChild(selectedCard);

    // Remove the product from both the selectedProducts array and the "selected products" list on the webpage when the remove button is clicked
    selectedCard.querySelector(".remove-btn").addEventListener("click", () => {
      // Remove from selectedProducts array
      selectedProducts = selectedProducts.filter(
        (p) => p.id !== card.querySelector(".product-info h3").id,
      );

      // Remove the card from the selected products list
      selectedCard.remove();

      // Update product list styling and checkbox state
      displaySelectedProducts();
    });
  } else {
    card.classList.remove("selected");
    selectedProducts = selectedProducts.filter(
      (p) => p.id !== card.querySelector(".product-info h3").id,
    );

    // Remove the corresponding card from the selected products list
    const selectedCard = document.querySelector(
      `.selected-product-card[id="${card.querySelector(".product-info h3").id}"]`,
    );
    if (selectedCard) {
      selectedCard.remove();
    }
  }
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  /* TODO: Add loading animation */
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory,
  );

  displayProducts(filteredProducts);
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});
