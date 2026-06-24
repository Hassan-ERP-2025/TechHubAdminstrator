// Product Data - Load from localStorage (admin-managed) or use default
let products = [];

// Load products from localStorage or use default products
// الدالة الجديدة المربوطة بالسيرفر السحابي
function loadProductsFromStorage() {
    // 1. أولاً بنجيب المنتجات الكاش لو موجودة عشان الموقع يفتح بسرعة
    const savedProducts = localStorage.getItem('techhub_products');
    if (savedProducts) {
        products = JSON.parse(savedProducts);
        if (typeof displayProducts === 'function') displayProducts(products);
    }

    // 2. فوراً بنروح نجيب المنتجات السحابية من سيرفر Render عشان لو الأدمن ضاف حاجة جديدة تظهر
    fetch('https://techhubtest.onrender.com/api/products')
        .then(response => response.json())
        .then(cloudProducts => {
            if (cloudProducts && cloudProducts.length > 0) {
                products = cloudProducts;
                localStorage.setItem('techhub_products', JSON.stringify(cloudProducts));
                // لو دالة العرض عندك اسمها displayProducts بتناديها هنا عشان تحدث الشاشة
                if (typeof displayProducts === 'function') displayProducts(products);
            }
        })
        .catch(error => {
            console.log("برجاء التأكد من تشغيل سيرفر Render أو استخدام الداتا المحلية:", error);
            // لو السيرفر نايم أو فيه مشكلة بيشغل المنتجات الافتراضية كخطة بديلة
            if (!savedProducts) {
                products = [
                    { id: 1, name: "MacBook Pro 14-inch", category: "laptops", price: 61999.69, image: "💻" },
                    { id: 2, name: "Dell XPS 13", category: "laptops", price: 40299.69, image: "💻" }
                ];
                if (typeof displayProducts === 'function') displayProducts(products);
            }
        });
}
        // Save default products to localStorage
        localStorage.setItem('techhub_products', JSON.stringify(products));
    }
    filteredProducts = [...products];
}

// Global Variables
let cart = [];
let currentCategory = 'all';
let currentView = 'grid';
let filteredProducts = [...products];

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const cartBtn = document.getElementById('cartBtn');
const cartSidebar = document.getElementById('cartSidebar');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.querySelector('.cart-count');
const filterBtn = document.getElementById('filterBtn');
const filterSidebar = document.getElementById('filterSidebar');
const closeFilter = document.getElementById('closeFilter');
const searchInput = document.getElementById('searchInput');
const navToggle = document.getElementById('nav-toggle');
const mobileMenu = document.getElementById('mobileMenu');
const modal = document.getElementById('quickViewModal');
const closeModal = document.getElementById('closeModal');
const modalBody = document.getElementById('modalBody');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const checkoutBtn = document.getElementById('checkoutBtn');
const checkoutModal = document.getElementById('checkoutModal');
const closeCheckoutModal = document.getElementById('closeCheckoutModal');
const checkoutForm = document.getElementById('checkoutForm');
const cancelCheckout = document.getElementById('cancelCheckout');
const submitOrder = document.getElementById('submitOrder');
const checkoutItems = document.getElementById('checkoutItems');
const checkoutTotal = document.getElementById('checkoutTotal');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadProductsFromStorage();
    setupEventListeners();
    updateCartDisplay();
    loadProducts();
});

// Function to refresh products from admin updates
function refreshProductsFromAdmin() {
    loadProductsFromStorage();
    loadProducts();
}

// Function to check for admin updates periodically
function checkForAdminUpdates() {
    // Check if products have been updated in localStorage
    const currentProducts = localStorage.getItem('techhub_products');
    if (currentProducts) {
        const newProducts = JSON.parse(currentProducts);
        // Compare with current products array
        if (JSON.stringify(newProducts) !== JSON.stringify(products)) {
            refreshProductsFromAdmin();
        }
    }
}

// Set up periodic checking for admin updates
setInterval(checkForAdminUpdates, 2000); // Check every 2 seconds

// Event Listeners
function setupEventListeners() {
    // Cart functionality
    cartBtn.addEventListener('click', toggleCart);
    closeCart.addEventListener('click', toggleCart);
    
    // Filter functionality
    filterBtn.addEventListener('click', toggleFilter);
    closeFilter.addEventListener('click', toggleFilter);
    
    // Search functionality
    searchInput.addEventListener('input', handleSearch);
    
    // Mobile menu
    navToggle.addEventListener('click', toggleMobileMenu);
    
    // Modal
    closeModal.addEventListener('click', closeQuickView);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeQuickView();
    });
    
    // Checkout functionality
    checkoutBtn.addEventListener('click', openCheckout);
    closeCheckoutModal.addEventListener('click', closeCheckout);
    cancelCheckout.addEventListener('click', closeCheckout);
    checkoutModal.addEventListener('click', (e) => {
        if (e.target === checkoutModal) closeCheckout();
    });
    checkoutForm.addEventListener('submit', handleCheckout);
    
    // Category filters
    document.querySelectorAll('.category-card, .category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.closest('[data-category]').dataset.category;
            filterByCategory(category);
        });
    });
    
    // View toggles
    document.querySelectorAll('.view-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.closest('[data-view]').dataset.view;
            changeView(view);
        });
    });
    
    // Sort functionality
    document.querySelector('.sort-select').addEventListener('change', handleSort);
    
    // Load more
    loadMoreBtn.addEventListener('click', loadMoreProducts);
    
    // Price range
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');
    if (priceRange && priceValue) {
        priceRange.addEventListener('input', (e) => {
            priceValue.textContent = `EGP ${e.target.value}`;
        });
    }
    
    // Apply filters
    document.querySelector('.apply-filters').addEventListener('click', applyFilters);
}

// Product Loading
function loadProducts() {
    productsGrid.innerHTML = '';
    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card loading';
    
    // Handle image display - check if it's a base64 image or URL
    let imageDisplay;
    if (product.image && product.image.startsWith('data:image')) {
        // Base64 image
        imageDisplay = `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">`;
    } else if (product.image && product.image !== '💻' && product.image !== '📱' && product.image !== '🎧' && product.image !== '⌚' && product.image !== '🖱️' && product.image !== '🔋' && product.image !== '🔌' && !product.image.startsWith('http')) {
        // URL or other image format (but not emoji)
        imageDisplay = `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">`;
    } else {
        // Emoji fallback
        imageDisplay = `<div style="font-size: 4rem; text-align: center; height: 200px; display: flex; align-items: center; justify-content: center;">${product.image}</div>`;
    }
    
    card.innerHTML = `
        <div class="product-image">
            ${imageDisplay}
            ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
        </div>
        <div class="product-info">
            <div class="product-category">${product.category}</div>
            <h3 class="product-title">${product.name}</h3>
            <div class="product-rating">
                <div class="stars">
                    ${generateStars(product.rating)}
                </div>
                <span class="rating-text">(${product.reviews})</span>
            </div>
            <div class="product-price">
                <span class="current-price">EGP ${product.price.toFixed(2)}</span>
                ${product.originalPrice > product.price ? 
                    `<span class="original-price">EGP ${product.originalPrice.toFixed(2)}</span>` : ''}
            </div>
            <div class="product-actions">
                <button class="add-to-cart" onclick="addToCart(${product.id})">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
                <button class="quick-view" onclick="openQuickView(${product.id})">
                    <i class="fas fa-eye"></i> Quick View
                </button>
            </div>
        </div>
    `;
    
    // Add loading animation
    setTimeout(() => card.classList.add('loaded'), 100);
    
    return card;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// Cart Functionality
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    showToast('Product added to cart!', 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
    showToast('Product removed from cart!', 'info');
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        updateCartDisplay();
    }
}

function updateCartDisplay() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartCount.textContent = totalItems;
    cartTotal.textContent = `EGP ${totalPrice.toFixed(2)}`;
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p>Add some products to get started!</p>
            </div>
        `;
    } else {
        cartItems.innerHTML = cart.map(item => {
            // Handle image display in cart
            let cartImageDisplay;
            if (item.image && item.image.startsWith('data:image')) {
                cartImageDisplay = `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">`;
            } else if (item.image && item.image !== '💻' && item.image !== '📱' && item.image !== '🎧' && item.image !== '⌚' && item.image !== '🖱️' && item.image !== '🔋' && item.image !== '🔌' && !item.image.startsWith('http')) {
                cartImageDisplay = `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">`;
            } else {
                cartImageDisplay = `<div style="font-size: 1.5rem; text-align: center; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">${item.image}</div>`;
            }
            
            return `
                <div class="cart-item">
                    <div class="cart-item-image">
                        ${cartImageDisplay}
                    </div>
                    <div class="cart-item-details">
                                            <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">EGP ${item.price.toFixed(2)}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Checkout Functionality
function openCheckout() {
    if (cart.length === 0) {
        showToast('Your cart is empty!', 'error');
        return;
    }
    
    // Load checkout items
    loadCheckoutItems();
    
    // Show checkout modal
    checkoutModal.classList.add('active');
    cartSidebar.classList.remove('active');
}

function closeCheckout() {
    checkoutModal.classList.remove('active');
}

function loadCheckoutItems() {
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    checkoutItems.innerHTML = cart.map(item => `
        <div class="order-item">
                                    <div class="order-item-name">${item.name} (x${item.quantity})</div>
                        <div class="order-item-price">EGP ${(item.price * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');
    
    checkoutTotal.textContent = `EGP ${totalPrice.toFixed(2)}`;
}

function handleCheckout(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(checkoutForm);
    const customerData = {
        name: formData.get('customerName'),
        phone: formData.get('customerPhone'),
        email: formData.get('customerEmail'),
        address: formData.get('addressLine1'),
        notes: formData.get('notes')
    };
    
    // Validate required fields
    if (!customerData.name || !customerData.phone || !customerData.email || !customerData.address) {
        showToast('Please fill in all required fields!', 'error');
        return;
    }
    
    // Validate email format
    if (!isValidEmail(customerData.email)) {
        showToast('Please enter a valid email address!', 'error');
        return;
    }
    
    // Show loading state
    submitOrder.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitOrder.disabled = true;
    
    // Prepare order data
    const orderData = {
        customer: customerData,
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        orderDate: new Date().toLocaleString(),
        orderId: generateOrderId()
    };
    
    // Send email automatically using FormSubmit
    sendOrderEmail(orderData);
}

function sendOrderEmail(orderData) {
    // Save order to localStorage for admin page
    saveOrderToAdmin(orderData);
    
    // Handle success
    setTimeout(() => {
        handleOrderSuccess(orderData);
    }, 1000);
}

function saveOrderToAdmin(orderData) {
    // Get existing orders from localStorage
    const existingOrders = localStorage.getItem('techhub_orders');
    let orders = existingOrders ? JSON.parse(existingOrders) : [];
    
    // Add status to order data
    orderData.status = 'pending';
    
    // Add new order to beginning of array
    orders.unshift(orderData);
    
    // Save back to localStorage
    localStorage.setItem('techhub_orders', JSON.stringify(orders));
    
    // Try to notify admin page if it's open
    try {
        if (window.opener && window.opener.addNewOrder) {
            window.opener.addNewOrder(orderData);
        }
    } catch (e) {
        // Admin page not open, that's okay
    }
}

function sendEmailToCustomer(orderData) {
    // Create a hidden form to send confirmation to customer
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://formsubmit.co/el/confirm/' + btoa(orderData.customer.email);
    form.style.display = 'none';

    // Add form fields for customer confirmation
    const fields = {
        '_subject': `Order Confirmation #${orderData.orderId} - TechHub`,
        'Order ID': orderData.orderId,
        'Customer Name': orderData.customer.name,
        'Order Date': orderData.orderDate,
        'Total Amount': `EGP ${orderData.total.toFixed(2)}`,
        'Order Items': orderData.items.map(item =>
            `${item.name} (${item.category}) - Qty: ${item.quantity} - Price: EGP ${item.price.toFixed(2)} - Total: EGP ${(item.price * item.quantity).toFixed(2)}`
        ).join('\n'),
        'Delivery Address': orderData.customer.address,
        'Contact Phone': orderData.customer.phone,
        'Additional Notes': orderData.customer.notes || 'None',
        'Thank You Message': `Thank you for your order! We have received your order #${orderData.orderId} and will process it shortly. You will receive updates on your order status.`
    };

    // Create form inputs
    Object.keys(fields).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = fields[key];
        form.appendChild(input);
    });

    // Add form to page and submit
    document.body.appendChild(form);
    form.submit();
}

// Handle success after emails are sent
function handleOrderSuccess(orderData) {
    // Reset form
    checkoutForm.reset();
    
    // Clear cart
    cart = [];
    updateCartDisplay();
    
    // Close checkout modal
    closeCheckout();
    
    // Show success message
    showToast(`Order submitted successfully! Order #${orderData.orderId}`, 'success');
    
    // Reset submit button
    submitOrder.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Order';
    submitOrder.disabled = false;
    
    // Log order details (for development)
    console.log('Order submitted:', orderData);
    
    // Show additional success message
    setTimeout(() => {
        showToast('Order saved to admin dashboard', 'info');
    }, 2000);
}

function generateOrderId() {
    return 'ORD-' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Toggle Functions
function toggleCart() {
    cartSidebar.classList.toggle('active');
}

function toggleFilter() {
    filterSidebar.classList.toggle('active');
}

function toggleMobileMenu() {
    mobileMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
}

// Search Functionality
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
    );
    loadProducts();
}

// Filter Functionality
function filterByCategory(category) {
    currentCategory = category;
    
    // Update active states
    document.querySelectorAll('.category-card, .category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll(`[data-category="${category}"]`).forEach(btn => {
        btn.classList.add('active');
    });
    
    if (category === 'all') {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => product.category === category);
    }
    
    loadProducts();
}

function applyFilters() {
    const selectedCategories = Array.from(document.querySelectorAll('.filter-option input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    
    const maxPrice = parseInt(document.getElementById('priceRange').value);
    
    filteredProducts = products.filter(product => {
        const categoryMatch = selectedCategories.includes(product.category);
        const priceMatch = product.price <= maxPrice;
        return categoryMatch && priceMatch;
    });
    
    loadProducts();
    toggleFilter();
    showToast('Filters applied!', 'success');
}

// Sort Functionality
function handleSort(e) {
    const sortBy = e.target.value;
    
    switch (sortBy) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            filteredProducts.sort((a, b) => b.rating - a.rating);
            break;
        default:
            // Featured - keep original order
            break;
    }
    
    loadProducts();
}

// View Toggle
function changeView(view) {
    currentView = view;
    
    document.querySelectorAll('.view-toggle').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    if (view === 'list') {
        productsGrid.style.gridTemplateColumns = '1fr';
    } else {
        productsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
    }
}

// Quick View Modal
function openQuickView(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Handle image display in quick view
    let quickViewImageDisplay;
    if (product.image && product.image.startsWith('data:image')) {
        quickViewImageDisplay = `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px;">`;
    } else if (product.image && product.image !== '💻' && product.image !== '📱' && product.image !== '🎧' && product.image !== '⌚' && product.image !== '🖱️' && product.image !== '🔋' && product.image !== '🔌' && !product.image.startsWith('http')) {
        quickViewImageDisplay = `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px;">`;
    } else {
        quickViewImageDisplay = `<div style="height: 300px; font-size: 5rem; display: flex; align-items: center; justify-content: center;">${product.image}</div>`;
    }
    
    modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start;">
            <div class="product-image">
                ${quickViewImageDisplay}
            </div>
            <div>
                <div class="product-category">${product.category}</div>
                <h2 style="margin: 1rem 0; color: #1e293b;">${product.name}</h2>
                <div class="product-rating" style="margin-bottom: 1rem;">
                    <div class="stars">
                        ${generateStars(product.rating)}
                    </div>
                    <span class="rating-text">(${product.reviews} reviews)</span>
                </div>
                <div class="product-price" style="margin-bottom: 1.5rem;">
                                    <span class="current-price">EGP ${product.price.toFixed(2)}</span>
                ${product.originalPrice > product.price ? 
                    `<span class="original-price">EGP ${product.originalPrice.toFixed(2)}</span>` : ''}
                </div>
                <p style="color: #64748b; line-height: 1.6; margin-bottom: 2rem;">
                    ${product.description}
                </p>
                <button class="add-to-cart" onclick="addToCart(${product.id}); closeQuickView();" style="width: 100%; padding: 1rem;">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

function closeQuickView() {
    modal.classList.remove('active');
}

// Load More Products (simulated)
function loadMoreProducts() {
    loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    loadMoreBtn.disabled = true;
    
    // Simulate loading more products
    setTimeout(() => {
        // In a real app, you would fetch more products from an API
        showToast('More products loaded!', 'success');
        loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Load More Products';
        loadMoreBtn.disabled = false;
    }, 1500);
}

// Toast Notifications
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Close sidebars when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.cart-sidebar') && !e.target.closest('.cart-btn')) {
        cartSidebar.classList.remove('active');
    }
    
    if (!e.target.closest('.filter-sidebar') && !e.target.closest('.filter-btn')) {
        filterSidebar.classList.remove('active');
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        cartSidebar.classList.remove('active');
        filterSidebar.classList.remove('active');
        modal.classList.remove('active');
        checkoutModal.classList.remove('active');
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('loaded');
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

// Observe product cards for animation
document.addEventListener('DOMContentLoaded', () => {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => observer.observe(card));
}); 
