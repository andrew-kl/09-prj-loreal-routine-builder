/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Cloudflare Worker URL */
const workerUrl = "https://gca-loreal-worker.andrewkalazin.workers.dev/";

/* Messages array for storing system prompt and conversation history */
let conversation = [
  {
    role: "system",
    content:
      "You are a L’Oréal Smart Routine & Product Advisor. Your job is to generate personalized beauty (skincare, haircare, makeup, fragrance, etc.) routines based on user-selected L’Oréal products. You should also answer follow-up questions for those routines/products. When generating beauty routines, only use L’Oréal products selected by the user. You may suggest additional products at the end if you think they complement the routine. Politely refuse and redirect if the user asks about unrelated topics (including non-L’Oréal brands and products) or non-beauty subjects. Do not recommend non–L’Oréal brands; suggest L’Oréal alternatives instead. Keep responses short, practical, and routine-focused. Do not invent product details or guarantee results.",
  },
];

/* Store all products loaded from the JSON file in a variable to avoid fetching multiple times */
let allProductsJson;

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
loadProducts().then((data) => {
  allProductsJson = data;
});

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = allProductsJson.filter(
    (product) => product.category === selectedCategory,
  );

  displayProducts(filteredProducts);
});

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product, idx) => `
      <div class="product-card">
        <!-- Checkbox in the top left corner -->
        <input type="checkbox" class="product-checkbox" id="product-check-${idx}" aria-label="Select product" onchange="toggleCardSelection(this)">
        <!-- Info (i) button in the top right corner -->
        <button class="info-btn" data-product-id="${product.id}" aria-label="More about product">&#9432;</button>
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h3 id="${product.id}">${product.name}</h3>
          <p>${product.brand}</p>
        </div>
      </div>
    `,
    )
    .join("");

  // Adding info-button event listeners after the product cards are rendered
  document.querySelectorAll(".info-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const productId = btn.getAttribute("data-product-id");
      const product = allProductsJson.find(
        (p) => String(p.id) === String(productId),
      );
      if (product) {
        showProductModal(product);
      }
    });
  });

  // Check checboxes and apply highlight and border for displayed product cards correlating to products in the selectedProducts array.
  displaySelectedProducts();
}

// Function for showing product details in a modal when the info button is clicked
function showProductModal(product) {
  const modal = document.getElementById("productModal");
  const modalContent = document.getElementById("modalProductContent");
  modalContent.innerHTML = `
    <img src="${product.image}" alt="${product.name}">
    <h3>${product.name}</h3>
    <p><strong>Brand:</strong> ${product.brand}</p>
    <p><strong>Category:</strong> ${product.category}</p>
    <p>${product.description}</p>
  `;
  modal.style.display = "block";
}

// Closing the modal when the close button is clicked or when clicking outside the modal content
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("productModal");
  const closeBtn = document.getElementById("closeModalBtn");
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
});

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

/* Submit selected products to OpenAI API to generate a beauty routine */
document
  .getElementById("generateRoutine")
  .addEventListener("click", async () => {
    if (selectedProducts.length === 0) {
      alert("Please select at least one product to generate a routine.");
      return;
    }

    chatWindow.innerHTML =
      "Generating your beauty routine based on selected products...";
    document.getElementById("generateRoutine").disabled = true;
    document.getElementById("sendBtn").disabled = true;

    // Reset conversation array when generating a new routine
    conversation = [
      {
        role: "system",
        content:
          "You are a L’Oréal Smart Routine & Product Advisor. Your job is to generate personalized beauty (skincare, haircare, makeup, fragrance, etc.) routines based on user-selected L’Oréal products. You should also answer follow-up questions for those routines/products. When generating beauty routines, only use L’Oréal products selected by the user. You may suggest additional products at the end if you think they complement the routine. Politely refuse and redirect if the user asks about unrelated topics (including non-L’Oréal brands and products) or non-beauty subjects. Do not recommend non–L’Oréal brands; suggest L’Oréal alternatives instead. Keep responses short, practical, and routine-focused. Do not invent product details or guarantee results.",
      },
    ];

    // Get entries from allProductsJson using ids from selectedProducts
    chatProductInput = selectedProducts.map((p) => {
      const productDetails = allProductsJson.find(
        (prod) => String(prod.id) === String(p.id),
      );
      return productDetails
        ? {
            name: productDetails.name,
            category: productDetails.category,
            description: productDetails.description,
          }
        : null;
    });
    console.log("Chat product input:", chatProductInput);

    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.0",
        messages: [
          ...conversation,
          {
            role: "user",
            content:
              "Generate me a beauty routine based on the following products: " +
              JSON.stringify(chatProductInput),
          },
        ],
      }),
    });

    // Throw an error if the response is not 200
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    // Parse Cloudflare Worker JSON response
    const result = await response.json();
    const assistantMsg = result.choices[0].message.content;

    // Store assistant response in conversation array
    conversation.push({ role: "assistant", content: assistantMsg });

    // Display user prompt & assistant response in chat window
    chatWindow.innerHTML = assistantMsg
      .replace(/\n/g, "<br>")
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

    document.getElementById("generateRoutine").disabled = false;
    document.getElementById("sendBtn").disabled = false;
  });

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  document.getElementById("generateRoutine").disabled = true;
  document.getElementById("sendBtn").disabled = true;

  // Store user input in conversation array
  const userMessage = document.getElementById("userInput").value.trim();
  if (userMessage) conversation.push({ role: "user", content: userMessage });

  chatWindow.innerHTML += `<br><br><b>You:</b> ${userMessage}`;
  document.getElementById("userInput").value =
    "Waiting for assistant response...";
  document.getElementById("userInput").disabled = true;

  const response = await fetch(workerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.0",
      messages: conversation,
    }),
  });

  // Throw an error if the response is not 200
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  // Parse Cloudflare Worker JSON response
  const result = await response.json();
  const assistantMsg = result.choices[0].message.content;

  // Store assistant response in conversation array
  conversation.push({ role: "assistant", content: assistantMsg });

  // Display user prompt & assistant response in chat window
  chatWindow.innerHTML += `<br><br><b>Assistant:</b> ${assistantMsg}`
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

  document.getElementById("generateRoutine").disabled = false;
  document.getElementById("sendBtn").disabled = false;
  document.getElementById("userInput").value = "";
  document.getElementById("userInput").disabled = false;
});
