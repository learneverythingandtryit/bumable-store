// BUMABLE Main JavaScript - Production Version

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize basic functions
    initNavigation();
    initContactForm();
    initNotifications(); // Initialize notification system
    
    // Initialize product system with delay to ensure products.js is loaded
    setTimeout(function() {
        initProductSystem();
    }, 500);
    
    // Initialize admin sync listening
    initAdminSync();
});

// Listen for admin changes and sync with main site
function initAdminSync() {
    // Listen for localStorage changes from admin panel
    window.addEventListener('storage', function(e) {
        if (e.key === 'bumable_products') {
            console.log('Products updated by admin, refreshing display...');
            
            // Reload product manager with new data
            if (window.ProductManager) {
                window.productManager = new ProductManager();
                updateProductDisplay();
                
                // Update cart if items have changed
                if (typeof updateCartDisplay === 'function') {
                    updateCartDisplay();
                }
                
                console.log('Product display synced with admin changes');
            }
        }
    });
    
    // Also listen for manual storage events (same window)
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        const oldValue = localStorage.getItem(key);
        originalSetItem.call(this, key, value);
        
        if (key === 'bumable_products' && oldValue !== value) {
            // Dispatch custom event for same-window updates
            setTimeout(function() {
                if (window.productManager) {
                    window.productManager = new ProductManager();
                    updateProductDisplay();
                }
            }, 100);
        }
    };
}

// Navigation functionality
function initNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
}

// Product system initialization
function initProductSystem() {
    // Check if we're not in admin
    if (window.location.pathname.includes('admin')) {
        return;
    }
    
    // Check if ProductManager exists (should be loaded from products.js)
    if (window.ProductManager) {
        window.productManager = new ProductManager();
        updateProductDisplay();
    } else {
        // Try again after a short delay
        setTimeout(initProductSystem, 1000);
    }
}

// Update product display on website
function updateProductDisplay() {
    if (!window.productManager) {
        console.log('No productManager found');
        return;
    }
    
    const products = window.productManager.getAllProducts();
    console.log('Products loaded:', products.length);
    
    // Update home page if we're on it
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '' || window.location.pathname.endsWith('/')) {
        console.log('Updating homepage products');
        updateHomePageProducts(products);
    }
    
    // Update shop page if we're on it
    if (window.location.pathname.includes('shop') && (window.location.pathname.endsWith('/') || window.location.pathname.includes('shop/'))) {
        updateShopPageProducts(products);
    }
}

// Update home page product showcase
function updateHomePageProducts(products) {
    console.log('updateHomePageProducts called with', products.length, 'products');
    
    // Update product carousel if it exists
    const carousel = document.querySelector('.product-carousel');
    if (carousel) {
        console.log('Found product carousel');
        // Clear existing products
        carousel.innerHTML = '';
        
        // Show first 6 products or all if less than 6
        const displayProducts = products.slice(0, 6);
        
        if (displayProducts.length === 0) {
            carousel.innerHTML = '<div class="no-products" style="text-align: center; padding: 2rem; color: #666;">No products available</div>';
        } else {
            displayProducts.forEach(product => {
                const productCard = createHomeProductCard(product);
                carousel.appendChild(productCard);
            });
        }
    } else {
        console.log('No product carousel found');
    }
    
    // Update shop section if it exists
    const shopGrid = document.querySelector('.products-grid');
    if (shopGrid) {
        console.log('Found products-grid, loading', products.length, 'products');
        shopGrid.innerHTML = '';
        
        if (products.length === 0) {
            shopGrid.innerHTML = '<div class="no-products" style="text-align: center; padding: 2rem; color: #666;">No products available</div>';
        } else {
            products.forEach(product => {
                const productCard = createShopProductCard(product);
                shopGrid.appendChild(productCard);
            });
        }
    } else {
        console.log('No products-grid found');
    }
}

// Update shop page products
function updateShopPageProducts(products) {
    // Shop page product update logic would go here
}

// Create product card for home page
function createHomeProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const salePrice = product.salePrice || product.regularPrice;
    const discountPercent = product.onSale ? Math.round((1 - salePrice / product.regularPrice) * 100) : 0;
    
    // Fix image path for homepage (remove ../ if present)
    const imagePath = product.image.replace('../', '');
    
    card.innerHTML = `
        <div class="product-image">
            <img src="${imagePath}" alt="${product.name}" onerror="this.src='images/placeholder-product.svg'">
            ${product.onSale ? `<span class="sale-badge">${discountPercent}% OFF</span>` : ''}
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price">
                <span class="current-price">₹${salePrice}</span>
                ${product.onSale ? `<span class="original-price">₹${product.regularPrice}</span>` : ''}
            </div>
            <div class="product-actions">
                <select class="size-select" id="size-${product.id}">
                    ${product.availableSizes.map(size => `<option value="${size}">${size}</option>`).join('')}
                </select>
                <button class="add-to-cart-btn" onclick="addToCartFromHome('${product.id}')">
                    Add to Cart
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Add to cart from home page
function addToCartFromHome(productId) {
    const sizeSelect = document.getElementById(`size-${productId}`);
    const size = sizeSelect ? sizeSelect.value : 'M';
    
    if (typeof addToCart === 'function') {
        addToCart(productId, size, 1);
    }
}

// Create product card for shop section on homepage
function createShopProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const salePrice = product.onSale ? product.salePrice : product.regularPrice;
    const discountPercent = product.onSale ? Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100) : 0;
    
    // Fix image path for homepage (remove ../ if present)
    const imagePath = product.image.replace('../', '');
    
    card.innerHTML = `
        <div class="product-image" style="background-image: url('${imagePath}')">
            ${product.onSale ? `<div class="product-badge">${discountPercent}% OFF</div>` : ''}
        </div>
        <div class="product-content">
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price">
                <span class="sale-price">₹${salePrice}</span>
                ${product.onSale ? `<span class="original-price">₹${product.regularPrice}</span>` : ''}
            </div>
            <div class="product-controls">
                <select class="size-selector" id="shop-size-${product.id}">
                    <option value="">Choose Size</option>
                    ${product.availableSizes.map(size => `<option value="${size}">${size}</option>`).join('')}
                </select>
                <div class="quantity-control">
                    <button class="qty-btn" onclick="changeQuantity('shop-qty-${product.id}', -1)">-</button>
                    <div class="qty-display" id="shop-qty-${product.id}">1</div>
                    <button class="qty-btn" onclick="changeQuantity('shop-qty-${product.id}', 1)">+</button>
                </div>
                <button class="add-to-cart-btn" onclick="addToCartFromShop('${product.id}')" ${!product.inStock ? 'disabled' : ''}>
                    ${product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Add to cart from shop section
function addToCartFromShop(productId) {
    const sizeSelect = document.getElementById(`shop-size-${productId}`);
    const qtyDisplay = document.getElementById(`shop-qty-${productId}`);
    
    const size = sizeSelect ? sizeSelect.value : '';
    const quantity = qtyDisplay ? parseInt(qtyDisplay.textContent) : 1;
    
    if (!size) {
        alert('Please select a size');
        return;
    }
    
    if (typeof addToCart === 'function') {
        addToCart(productId, size, quantity);
    }
}

// Change quantity in shop section
function changeQuantity(elementId, change) {
    const element = document.getElementById(elementId);
    if (element) {
        const currentQty = parseInt(element.textContent) || 1;
        const newQty = Math.max(1, Math.min(10, currentQty + change));
        element.textContent = newQty;
    }
}

// Notification system for other functions
function toggleNotifications() {
    const notificationsDropdown = document.getElementById('notifications-dropdown');
    if (notificationsDropdown) {
        if (notificationsDropdown.style.display === 'none' || !notificationsDropdown.style.display) {
            loadNotifications();
            notificationsDropdown.style.display = 'block';
        } else {
            notificationsDropdown.style.display = 'none';
        }
    }
}

function closeNotifications() {
    const notificationsDropdown = document.getElementById('notifications-dropdown');
    if (notificationsDropdown) {
        notificationsDropdown.style.display = 'none';
    }
}

// Load notifications (contact replies)
function loadNotifications() {
    console.log('Loading notifications...');
    const notificationsList = document.getElementById('notifications-list');
    const notificationCount = document.getElementById('notification-count');
    
    // Get unread contact queries with replies
    const contactQueries = JSON.parse(localStorage.getItem('bumableContactQueries') || '[]');
    const unreadReplies = contactQueries.filter(query => query.adminReply && query.status === 'replied' && !query.read);
    
    console.log('Found unread replies:', unreadReplies.length);
    
    if (unreadReplies.length === 0) {
        notificationsList.innerHTML = `
            <div class="no-notifications">
                <i class="fas fa-bell-slash"></i>
                <p>No new notifications</p>
            </div>
        `;
        notificationCount.style.display = 'none';
        return;
    }
    
    // Sort by reply timestamp (newest first)
    unreadReplies.sort((a, b) => new Date(b.replyTimestamp) - new Date(a.replyTimestamp));
    
    // Display notification count
    notificationCount.textContent = unreadReplies.length;
    notificationCount.style.display = 'inline';
    
    // Create notification items
    notificationsList.innerHTML = unreadReplies.map(query => `
        <div class="notification-item" onclick="viewQueryResponse('${query.id}')">
            <div class="notification-icon">
                <i class="fas fa-reply"></i>
            </div>
            <div class="notification-content">
                <h4>Response to Your Query</h4>
                <p>We have responded to your inquiry. Click to view our response.</p>
                <span class="notification-time">${formatDate(query.replyTimestamp)}</span>
            </div>
        </div>
    `).join('');
}

// View query response in a professional format
function viewQueryResponse(queryId) {
    const contactQueries = JSON.parse(localStorage.getItem('bumableContactQueries') || '[]');
    const query = contactQueries.find(q => q.id === queryId);
    
    if (!query) return;
    
    // Create response view modal
    const responseModal = document.createElement('div');
    responseModal.id = 'response-modal';
    responseModal.className = 'modal';
    responseModal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <span class="close" onclick="closeResponseModal()">&times;</span>
            <h2>📧 Response to Your Query</h2>
            
            <div class="query-response-container">
                <div class="user-query">
                    <h3>Your Message</h3>
                    <div class="query-info">
                        <p><strong>Sent:</strong> ${formatDate(query.timestamp)}</p>
                    </div>
                    <div class="query-message">
                        <p>${query.message}</p>
                    </div>
                </div>
                
                <div class="response-divider"></div>
                
                <div class="support-response">
                    <h3>💬 Response from Bumable Support</h3>
                    <div class="response-info">
                        <p><strong>Replied:</strong> ${formatDate(query.replyTimestamp)}</p>
                    </div>
                    <div class="response-message">
                        <p>${query.adminReply}</p>
                    </div>
                </div>
            </div>
            
            <div class="response-actions">
                <button class="btn btn-primary" onclick="closeResponseModal()">Got it, Thanks!</button>
                <button class="btn btn-secondary" onclick="markAsRead('${query.id}')">Mark as Read</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(responseModal);
    responseModal.style.display = 'block';
    
    // Close notifications dropdown
    closeNotifications();
}

// Close response modal
function closeResponseModal() {
    const responseModal = document.getElementById('response-modal');
    if (responseModal) {
        responseModal.remove();
    }
}

// Mark notification as read
function markAsRead(queryId) {
    const contactQueries = JSON.parse(localStorage.getItem('bumableContactQueries') || '[]');
    const queryIndex = contactQueries.findIndex(q => q.id === queryId);
    
    if (queryIndex !== -1) {
        contactQueries[queryIndex].read = true;
        localStorage.setItem('bumableContactQueries', JSON.stringify(contactQueries));
        
        // Update notification count
        initNotifications();
        loadNotifications();
        
        closeResponseModal();
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Initialize notifications on page load
function initNotifications() {
    // Load notification count on page load
    const contactQueries = JSON.parse(localStorage.getItem('bumableContactQueries') || '[]');
    const unreadReplies = contactQueries.filter(query => query.adminReply && query.status === 'replied' && !query.read);
    const notificationCount = document.getElementById('notification-count');
    
    if (unreadReplies.length > 0) {
        notificationCount.textContent = unreadReplies.length;
        notificationCount.style.display = 'inline';
    } else {
        notificationCount.style.display = 'none';
    }
}

// Smooth scrolling for anchor links
document.addEventListener('click', function(e) {
    if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Close mobile menu when clicking outside
document.addEventListener('click', function(e) {
    const navMenu = document.getElementById('nav-menu');
    const navToggle = document.getElementById('nav-toggle');
    
    if (navMenu && navMenu.classList.contains('active')) {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    }
});

// Handle contact form if it exists
function initContactForm() {
    console.log('Initializing contact form...');
    const contactForm = document.getElementById('contact-form');
    const contactModal = document.getElementById('contact-modal');
    const closeBtn = contactModal ? contactModal.querySelector('.close') : null;
    
    console.log('Contact form found:', !!contactForm);
    console.log('Contact modal found:', !!contactModal);
    
    // Open contact modal when clicking contact links
    document.querySelectorAll('a[href="#contact"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Contact link clicked, opening modal...');
            if (contactModal) {
                contactModal.style.display = 'block';
                console.log('Modal display set to block');
            }
        });
    });
    
    // Close modal functionality
    if (closeBtn && contactModal) {
        closeBtn.addEventListener('click', function() {
            contactModal.style.display = 'none';
        });
        
        window.addEventListener('click', function(e) {
            if (e.target === contactModal) {
                contactModal.style.display = 'none';
            }
        });
    }
    
    if (contactForm) {
        console.log('Setting up contact form submit handler...');
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Contact form submitted!');
            
            const firstName = contactForm.querySelector('[name="firstName"]').value;
            const lastName = contactForm.querySelector('[name="lastName"]').value;
            const email = contactForm.querySelector('[name="email"]').value;
            const message = contactForm.querySelector('[name="message"]').value;
            const messageDiv = document.getElementById('form-message');
            
            console.log('Form data:', { firstName, lastName, email, message });
            
            if (firstName && lastName && email && message) {
                // Create contact data object
                const contactData = {
                    name: `${firstName} ${lastName}`,
                    email: email,
                    subject: 'Contact Form Submission',
                    message: message,
                    timestamp: new Date().toISOString()
                };
                
                console.log('Created contact data:', contactData);
                
                // Show loading message
                messageDiv.style.display = 'block';
                messageDiv.style.backgroundColor = '#fff3cd';
                messageDiv.style.color = '#856404';
                messageDiv.style.border = '1px solid #ffeeba';
                messageDiv.innerHTML = '⏳ Sending your message...';
                
                // Try to save to GitHub database first, fallback to localStorage
                async function saveContact() {
                    try {
                        // Try GitHub database if available
                        if (window.githubDB) {
                            await window.githubDB.saveContact(contactData);
                            console.log('✅ Contact saved to GitHub Issues');
                            
                            // Show success message
                            messageDiv.style.backgroundColor = '#d4edda';
                            messageDiv.style.color = '#155724';
                            messageDiv.style.border = '1px solid #c3e6cb';
                            messageDiv.innerHTML = '✓ Thank you for your message! We will get back to you soon via GitHub Issues.';
                        } else {
                            throw new Error('GitHub database not available');
                        }
                    } catch (error) {
                        console.warn('GitHub database failed, using localStorage fallback:', error);
                        
                        // Fallback to localStorage
                        const contactQuery = {
                            id: 'CQ' + Date.now(),
                            firstName: firstName,
                            lastName: lastName,
                            email: email,
                            message: message,
                            timestamp: new Date().toISOString(),
                            status: 'new',
                            adminReply: null,
                            replyTimestamp: null
                        };
                        
                        const contactQueries = JSON.parse(localStorage.getItem('bumableContactQueries') || '[]');
                        contactQueries.push(contactQuery);
                        localStorage.setItem('bumableContactQueries', JSON.stringify(contactQueries));
                        
                        console.log('💾 Saved to localStorage. Total queries:', contactQueries.length);
                        
                        // Show success message
                        messageDiv.style.backgroundColor = '#d4edda';
                        messageDiv.style.color = '#155724';
                        messageDiv.style.border = '1px solid #c3e6cb';
                        messageDiv.innerHTML = '✓ Thank you for your message! We will get back to you soon.';
                    }
                    
                    // Reset form
                    contactForm.reset();
                    
                    // Close modal after 2 seconds
                    setTimeout(() => {
                        if (contactModal) {
                            contactModal.style.display = 'none';
                        }
                        messageDiv.style.display = 'none';
                    }, 3000);
                }
                
                saveContact();
                
            } else {
                messageDiv.style.display = 'block';
                messageDiv.style.backgroundColor = '#f8d7da';
                messageDiv.style.color = '#721c24';
                messageDiv.style.border = '1px solid #f5c6cb';
                
                // Check which fields are missing
                let missingFields = [];
                if (!firstName) missingFields.push('First Name');
                if (!lastName) missingFields.push('Last Name');
                if (!email) missingFields.push('Email');
                if (!message) missingFields.push('Message');
                
                messageDiv.innerHTML = `✗ Please fill in all required fields: ${missingFields.join(', ')}`;
            }
        });
    }
}