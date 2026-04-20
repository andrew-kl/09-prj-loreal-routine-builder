/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Store selected products in an array for sending to OpenAI API later */
let selProdsArr = [];

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
        <input type="checkbox" class="product-checkbox" id="product-check-${idx}" aria-label="Select product" onchange="cardCheckboxUpdate(this)">
        <!-- Info (i) button in the top right corner -->
        <button class="info-btn" aria-label="More about product">&#9432;</button>
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.brand}</p>
        </div>
      </div>
    `,
    )
    .join("");

  /* Retain checked products after filtering */
  const checkboxes = productsContainer.querySelectorAll(".product-checkbox");
  checkboxes.forEach((checkbox, idx) => {
    const product = products[idx];
    if (
      selProdsArr.some(
        (p) => p.querySelector(".product-info h3").textContent === product.name,
      )
    ) {
      checkbox.checked = true;
      checkbox.closest(".product-card").classList.add("selected");
    }
  });
}

/* Add and remove selected products when checkbox is toggled */
function cardCheckboxUpdate(e) {
  const selProdsDOM = document.getElementById("selectedProductsList");

  const card = e.closest(".product-card");
  if (e.checked) {
    card.classList.add("selected");
    selProdsArr.push(card);

    // Create a wide version of the card for the selected products list
    const selectedCard = document.createElement("div");
    selectedCard.classList.add("selected-product-card");

    selectedCard.style.width = "100%";
    selectedCard.style.border = "2px solid";
    selectedCard.style.padding = "5px";
    selectedCard.innerHTML = `
      <button class="remove-btn" aria-label="Remove product">&times;</button>
      <span>${card.querySelector(".product-info h3").textContent + " | " + card.querySelector(".product-info p").textContent}</span>
    `;

    // Add event listener to the remove button to uncheck the original card and remove this card
    selectedCard.querySelector(".remove-btn").addEventListener("click", () => {
      e.checked = false;
      card.classList.remove("selected");
      selProdsDOM.removeChild(selectedCard);
    });

    selProdsDOM.appendChild(selectedCard);
  } else {
    card.classList.remove("selected");
    selProdsArr = selProdsArr.filter((p) => p !== card);

    // Remove the corresponding card from the selected products list
    const selectedCards = selProdsDOM.querySelectorAll(
      ".selected-product-card",
    );
    selectedCards.forEach((selectedCard) => {
      if (
        selectedCard.textContent.includes(
          card.querySelector(".product-info h3").textContent,
        )
      ) {
        selProdsDOM.removeChild(selectedCard);
      }
    });
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
