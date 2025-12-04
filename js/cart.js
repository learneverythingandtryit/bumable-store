// BUMABLE COMPLETE SHOPPING CART SYSTEM
// Professional e-commerce cart with all modern features

// Cart state and configuration
const CART_CONFIG = {
    maxItems: 50,
    maxQuantityPerItem: 10,
    currency: '₹',
    taxRate: 0.18, // 18% GST
    freeShippingThreshold: 1000,
    shippingCost: 99
};

class ShoppingCart {
    constructor() {
        this.items = [];
        this.subtotal = 0;
        this.tax = 0;
        this.shipping = 0;
        this.total = 0;
        
        this.loadCart();
        this.bindEvents();
        this.updateDisplay();
    }

    // Load cart from localStorage
    loadCart() {
        try {
            const savedCart = localStorage.getItem('bumableCart');
            if (savedCart) {
                this.items = JSON.parse(savedCart);
                this.calculateTotals();
            }
        } catch (error) {
            console.warn('Error loading cart:', error);
            this.items = [];
        }
    }

    // Save cart to localStorage
    saveCart() {
        try {
            localStorage.setItem('bumableCart', JSON.stringify(this.items));
        } catch (error) {
            console.warn('Error saving cart:', error);
        }
    }

    // Add item to cart
    addItem(productId, size, quantity = 1) {
        // Validate inputs
        if (!productId || !size || quantity < 1) {
            this.showNotification('Invalid product details', 'error');
            return false;
        }

        // Get product details
        const product = window.productManager?.getProduct(productId);
        if (!product) {
            this.showNotification('Product not found', 'error');
            return false;
        }

        // Check stock
        if (!product.inStock || product.stockCount < quantity) {
            this.showNotification('Insufficient stock', 'error');
            return false;
        }

        // Check cart limits
        const currentItemCount = this.getTotalItems();
        if (currentItemCount + quantity > CART_CONFIG.maxItems) {
            this.showNotification(`Maximum ${CART_CONFIG.maxItems} items allowed in cart`, 'warning');
            return false;
        }

        // Check if item already exists
        const existingItemIndex = this.items.findIndex(
            item => item.productId === productId && item.size === size
        );

        if (existingItemIndex !== -1) {
            // Update existing item
            const existingItem = this.items[existingItemIndex];
            const newQuantity = existingItem.quantity + quantity;
            
            if (newQuantity > CART_CONFIG.maxQuantityPerItem) {
                this.showNotification(`Maximum ${CART_CONFIG.maxQuantityPerItem} items per product`, 'warning');
                return false;
            }
            
            existingItem.quantity = newQuantity;
        } else {
            // Add new item
            const newItem = {
                productId: productId,
                name: product.name,
                size: size,
                quantity: quantity,
                price: product.salePrice || product.regularPrice,
                originalPrice: product.regularPrice,
                image: product.image,
                category: product.category,
                addedAt: new Date().toISOString()
            };
            this.items.push(newItem);
        }

        this.calculateTotals();
        this.saveCart();
        this.updateDisplay();
        this.showNotification(`${product.name} added to cart`, 'success');
        return true;
    }

    // Remove item from cart
    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            const removedItem = this.items[index];
            this.items.splice(index, 1);
            
            this.calculateTotals();
            this.saveCart();
            this.updateDisplay();
            this.showNotification(`${removedItem.name} removed from cart`, 'info');
        }
    }

    // Update item quantity
    updateItemQuantity(index, newQuantity) {
        if (index < 0 || index >= this.items.length) return;
        
        if (newQuantity <= 0) {
            this.removeItem(index);
            return;
        }

        if (newQuantity > CART_CONFIG.maxQuantityPerItem) {
            this.showNotification(`Maximum ${CART_CONFIG.maxQuantityPerItem} items per product`, 'warning');
            return;
        }

        this.items[index].quantity = newQuantity;
        this.calculateTotals();
        this.saveCart();
        this.updateDisplay();
    }

    // Clear entire cart
    clearCart() {
        if (confirm('Are you sure you want to clear your cart?')) {
            this.items = [];
            this.calculateTotals();
            this.saveCart();
            this.updateDisplay();
            this.showNotification('Cart cleared', 'info');
        }
    }

    // Calculate all totals
    calculateTotals() {
        // Subtotal
        this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Shipping
        this.shipping = this.subtotal >= CART_CONFIG.freeShippingThreshold ? 0 : CART_CONFIG.shippingCost;

        // Tax
        this.tax = Math.round(this.subtotal * CART_CONFIG.taxRate);

        // Total
        this.total = this.subtotal + this.tax + this.shipping;
    }

    // Get total number of items
    getTotalItems() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    // Update cart display
    updateDisplay() {
        this.updateCartBadge();
        this.updateCartSidebar();
    }

    // Update cart badge
    updateCartBadge() {
        const badges = document.querySelectorAll('.cart-count, .cart-badge');
        const totalItems = this.getTotalItems();
        
        badges.forEach(badge => {
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'flex' : 'none';
        });
    }

    // Update cart sidebar
    updateCartSidebar() {
        const cartItemsContainer = document.getElementById('cart-items');
        const emptyCartDiv = document.querySelector('.empty-cart');
        const cartContentDiv = document.querySelector('.cart-content');
        
        if (!cartItemsContainer) return;

        if (this.items.length === 0) {
            if (emptyCartDiv) emptyCartDiv.style.display = 'block';
            if (cartContentDiv) cartContentDiv.style.display = 'none';
            return;
        }

        // Show cart content, hide empty state
        if (emptyCartDiv) emptyCartDiv.style.display = 'none';
        if (cartContentDiv) cartContentDiv.style.display = 'block';

        // Generate cart items HTML
        let cartHTML = '';
        this.items.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            
            cartHTML += `
                <div class="cart-item" data-index="${index}">
                    <div class="item-image">
                        <img src="${item.image}" alt="${item.name}" onerror="this.src='images/placeholder-product.svg'">
                    </div>
                    <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <div class="item-details-row">
                            <span class="item-size">Size: ${item.size}</span>
                            <span class="item-price">${CART_CONFIG.currency}${item.price}</span>
                        </div>
                    </div>
                    <div class="item-actions">
                        <div class="quantity-controls">
                            <button class="qty-btn" onclick="cart.updateItemQuantity(${index}, ${item.quantity - 1})" 
                                ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="qty-btn" onclick="cart.updateItemQuantity(${index}, ${item.quantity + 1})" 
                                ${item.quantity >= CART_CONFIG.maxQuantityPerItem ? 'disabled' : ''}>+</button>
                        </div>
                        <button class="remove-item" onclick="cart.removeItem(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        cartItemsContainer.innerHTML = cartHTML;

        // Update totals in cart footer
        this.updateCartFooter();
    }

    // Update cart footer with totals
    updateCartFooter() {
        const cartFooter = document.querySelector('.cart-footer');
        if (!cartFooter) return;

        const footerHTML = `
            <div class="cart-summary">
                <div class="cart-summary-item">
                    <span>Subtotal (${this.getTotalItems()} items)</span>
                    <span class="value">${CART_CONFIG.currency}${this.subtotal}</span>
                </div>
                
                <div class="cart-summary-item">
                    <span>Shipping</span>
                    <span class="value">${this.shipping === 0 ? 'FREE' : CART_CONFIG.currency + this.shipping}</span>
                </div>
                
                <div class="cart-summary-item">
                    <span>Tax (${Math.round(CART_CONFIG.taxRate * 100)}%)</span>
                    <span class="value">${CART_CONFIG.currency}${this.tax}</span>
                </div>
                
                <div class="cart-summary-item total">
                    <span>Total:</span>
                    <span class="value" id="cart-total">${CART_CONFIG.currency}${this.total}</span>
                </div>
            </div>
            
            ${this.subtotal < CART_CONFIG.freeShippingThreshold ? `
            <div class="free-shipping-message">
                Add ${CART_CONFIG.currency}${CART_CONFIG.freeShippingThreshold - this.subtotal} more for FREE shipping!
            </div>` : `
            <div class="free-shipping-message">
                You qualify for FREE shipping!
            </div>`}
            
            <div class="cart-actions">
                <button class="btn-checkout" onclick="cart.proceedToCheckout()">
                    Proceed to Checkout (${CART_CONFIG.currency}${this.total})
                </button>
            </div>
        `;

        cartFooter.innerHTML = footerHTML;
    }

    // Proceed to checkout
    proceedToCheckout() {
        console.log('Checkout initiated...'); // Debug log
        
        if (this.items.length === 0) {
            this.showNotification('Your cart is empty', 'warning');
            return;
        }

        console.log('Cart items:', this.items); // Debug log

        // Save cart state for checkout
        localStorage.setItem('checkoutCart', JSON.stringify({
            items: this.items,
            subtotal: this.subtotal,
            tax: this.tax,
            shipping: this.shipping,
            total: this.total
        }));

        console.log('Checkout data saved to localStorage'); // Debug log

        // Determine correct path based on current location
        const currentPath = window.location.pathname;
        let checkoutPath;
        
        if (currentPath.includes('/shop/') || currentPath.includes('/admin/') || 
            currentPath.includes('/policy/') || currentPath.includes('/shipping/') || 
            currentPath.includes('/success/') || currentPath.includes('/faq/') ||
            currentPath.includes('/login/') || currentPath.includes('/checkout/')) {
            // In a subdirectory
            checkoutPath = '../checkout/';
        } else {
            // In root directory  
            checkoutPath = 'checkout/';
        }

        console.log('Redirecting to:', checkoutPath); // Debug log

        // Redirect to checkout
        window.location.href = checkoutPath;
    }

    // Toggle cart sidebar
    toggle() {
        const cartSidebar = document.getElementById('cart-sidebar');
        const cartOverlay = document.getElementById('cart-overlay');

        if (cartSidebar && cartOverlay) {
            if (cartSidebar.classList.contains('active')) {
                cartSidebar.classList.remove('active');
                cartOverlay.classList.remove('active');
            } else {
                cartSidebar.classList.add('active');
                cartOverlay.classList.add('active');
                this.updateDisplay(); // Refresh display when opening
            }
        }
    }

    // Bind events
    bindEvents() {
        // Close cart when clicking outside
        document.addEventListener('click', (e) => {
            const cartOverlay = document.getElementById('cart-overlay');
            if (cartOverlay && cartOverlay.classList.contains('active') && e.target === cartOverlay) {
                this.toggle();
            }
        });

        // Close cart with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const cartSidebar = document.getElementById('cart-sidebar');
                if (cartSidebar && cartSidebar.classList.contains('active')) {
                    this.toggle();
                }
            }
        });
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.cart-notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        
        const bgColors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#007bff',
            warning: '#ffc107'
        };

        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${bgColors[type] || bgColors.info};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            z-index: 10000;
            transform: translateX(100%);
            transition: all 0.3s ease;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            max-width: 350px;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>${message}</span>
                <button style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 0; margin-left: auto;" 
                    onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Slide in animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }
        }, 4000);
    }
}

// Initialize cart when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.cart = new ShoppingCart();
});

// Legacy function support for existing code
function addToCart(productId, size, quantity) {
    return window.cart ? window.cart.addItem(productId, size, quantity) : false;
}

function toggleCart() {
    if (window.cart) window.cart.toggle();
}

function clearCart() {
    if (window.cart) window.cart.clearCart();
}

function proceedToCheckout() {
    if (window.cart) window.cart.proceedToCheckout();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ShoppingCart, CART_CONFIG };
}