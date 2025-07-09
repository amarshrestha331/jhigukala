// Declare globally so accessible everywhere
let productRows;
let productNames;

// Quantity increase/decrease functions (used in buttons inside dynamically created rows)
function increaseQty(btn) {
  const input = btn.previousElementSibling;
  input.value = parseInt(input.value) + 1;
}

function decreaseQty(btn) {
  const input = btn.nextElementSibling;
  const current = parseInt(input.value);
  if (current > 0) {
    input.value = current - 1;
  }
}

// Get selected products excluding a particular select dropdown (to prevent duplicates)
function getSelectedProducts(excludeSelect = null) {
  const selects = productRows.querySelectorAll('select');
  const selected = [];
  selects.forEach(select => {
    if (select !== excludeSelect && select.value) {
      selected.push(select.value);
    }
  });
  return selected;
}

// Update dropdown options to disable already selected products to prevent duplicates
function updateProductOptions() {
  const selectedProducts = getSelectedProducts();
  productRows.querySelectorAll('.product-row').forEach(row => {
    const select = row.querySelector('select');
    const currentValue = select.value;

    Array.from(select.options).forEach(option => {
      if (option.value === "") {
        option.disabled = false; // default option always enabled
        return;
      }
      option.disabled = selectedProducts.includes(option.value) && option.value !== currentValue;
    });
  });
}

// Create a new product row with optional selected product and quantity
function createProductRow(selected = "", quantity = "") {
  const row = document.createElement('div');
  row.className = 'product-row';

  // Product select dropdown
  const select = document.createElement('select');
  select.required = true;
  select.innerHTML = `<option value="" disabled ${selected ? '' : 'selected'}>Select product</option>`;
  productNames.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    if (name === selected) option.selected = true;
    select.appendChild(option);
  });

  // Quantity controls container
  const qtyContainer = document.createElement('div');
  qtyContainer.className = 'quantity-container';

  // Decrease quantity button
  const decBtn = document.createElement('button');
  decBtn.type = 'button';
  decBtn.className = 'qty-decrease';
  decBtn.textContent = '−';

  // Quantity input
  const qty = document.createElement('input');
  qty.type = 'number';
  qty.min = 1;
  qty.value = quantity;
  qty.inputMode = 'numeric';
  qty.pattern = '[0-9]*';
  qty.className = 'qty-input';

  // Increase quantity button
  const incBtn = document.createElement('button');
  incBtn.type = 'button';
  incBtn.className = 'qty-increase';
  incBtn.textContent = '+';

  // Decrease button click handler
  decBtn.addEventListener('click', () => {
    let val = parseInt(qty.value) || 1;
    if (val > 1) {
      qty.value = val - 1;
    } else {
      const totalRows = productRows.querySelectorAll('.product-row').length;
      if (totalRows === 1) {
        qty.value = "";
      }
    }
  });

  // Increase button click handler
  incBtn.addEventListener('click', () => {
    let val = parseInt(qty.value) || 0;
    qty.value = val + 1;
  });

  // Validate manual input on quantity field
  qty.addEventListener('input', () => {
    let val = parseInt(qty.value);
    if (isNaN(val) || val < 1) qty.value = 1;
  });

  qtyContainer.appendChild(decBtn);
  qtyContainer.appendChild(qty);
  qtyContainer.appendChild(incBtn);

  // Remove product row button
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-btn';
  removeBtn.textContent = '×';

  removeBtn.addEventListener('click', () => {
    const totalRows = productRows.querySelectorAll('.product-row').length;
    if (totalRows === 1) {
      select.value = "";
      qty.value = "";
      updateProductOptions();
    } else {
      row.remove();
      updateProductOptions();
    }
  });

  // Add new product row button
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'add-btn';
  addBtn.textContent = '+';

  addBtn.addEventListener('click', () => {
    createProductRow();
    updateProductOptions();
  });

  // When product changes, update quantity and options
  select.addEventListener('change', () => {
    if (select.value && (!qty.value || qty.value < 1)) qty.value = 1;
    updateProductOptions();
  });

  // Append all elements to the row
  row.appendChild(select);
  row.appendChild(qtyContainer);
  row.appendChild(removeBtn);
  row.appendChild(addBtn);

  // Append row to the container
  productRows.appendChild(row);

  // Update options to reflect current selection
  updateProductOptions();
}

// Wait until DOM is loaded to initialize everything
document.addEventListener("DOMContentLoaded", function () {
  productRows = document.getElementById('productRows');
  productNames = Array.from(document.querySelectorAll('.product-details h3')).map(h3 => h3.textContent.trim());

  // Initialize with one empty product row
  createProductRow();

  // Hook up Proceed buttons in product cards to add selected product to form
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    const proceedBtn = card.querySelector('.proceed-btn');
    const productName = card.querySelector('.product-details h3').textContent.trim();
    const qtyInput = card.querySelector('.qty-input');

    proceedBtn.addEventListener('click', () => {
      const quantity = parseInt(qtyInput.value);

      if (!quantity || quantity < 1) {
        alert(`Please select a valid quantity for "${productName}"`);
        return;
      }

      // Prevent duplicate products
      const existingSelects = productRows.querySelectorAll('select');
      const alreadyExists = Array.from(existingSelects).some(select => select.value === productName);

      if (alreadyExists) {
        alert(`"${productName}" is already added in the form.`);
        return;
      }

      // Add new product row with selected product and quantity
      createProductRow(productName, quantity);
    });
  });

  // Clear error messages on clicking Clear button (if you have one)
  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      const errorFields = document.querySelectorAll('.error');
      errorFields.forEach(el => el.textContent = '');
    });
  }
});

// Initialize EmailJS with your public key
emailjs.init('QMyP1cKybFP7V5Cci'); // Replace with your actual public key

// Form submission handler
document.addEventListener("DOMContentLoaded", function () {
  const orderForm = document.getElementById("orderForm");

  orderForm.addEventListener("submit", function (e) {
    e.preventDefault(); // prevent default form submission

    // Collect form field values
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const address = document.getElementById("address").value.trim();
    const payment = document.getElementById("payment").value.trim();
    const notes = document.getElementById("notes").value.trim();

    // Build product list summary from rows
    const rows = productRows.querySelectorAll(".product-row");
    let productSummary = "";

    rows.forEach(row => {
      const productName = row.querySelector("select")?.value;
      const quantity = row.querySelector(".qty-input")?.value;

      if (productName && quantity) {
        productSummary += `• ${productName} (Quantity: ${quantity})\n`;
      }
    });

    // Basic validation
    if (!name || !phone || !email || !address || !payment || !productSummary) {
      alert("Please fill in all required fields and add at least one product.");
      return;
    }

    // EmailJS template params
    const templateParams = {
      to_name: "Jhigu_Kala",
      from_name: name,
      from_email: email,
      phone: phone,
      address: address,
      payment: payment,
      notes: notes || "No additional notes.",
      products: productSummary,
    };

    // Send email using EmailJS
    emailjs.send("service_t9z0wmp", "template_0nj899b", templateParams)
      .then(() => {
        alert("Order submitted successfully!");

        // Reset form & product rows
        orderForm.reset();
        productRows.innerHTML = "";
        createProductRow(); // Add one empty row again
      })
      .catch((error) => {
        alert("Failed to submit order: " + (error?.text || error?.message || "Unknown error"));
      });
  });
});

// Mobile menu toggle (optional)
document.addEventListener('DOMContentLoaded', function () {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navMenu = document.querySelector('.nav-menu');

  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', function () {
      navMenu.classList.toggle('active');
    });
  }
});
