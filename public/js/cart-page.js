/**
 * Logique de la page panier
 */

let cart = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
});

// Load cart
function loadCart() {
    cart = getCart();
    renderCart();
}

// Render cart
function renderCart() {
    const container = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartContent = document.getElementById('cartContent');

    if (!container) return;

    if (cart.length === 0) {
        if (emptyCart) emptyCart.style.display = 'block';
        if (cartContent) cartContent.style.display = 'none';
        return;
    }

    if (emptyCart) emptyCart.style.display = 'none';
    if (cartContent) cartContent.style.display = 'grid';

    container.innerHTML = cart.map((item, index) => {
        const itemTotal = item.price * item.quantity;
        const itemKey = item.variant_id || item.product_id;

        return `
            <div class="cart-item" data-key="${itemKey}">
                <img src="${CONFIG.DEFAULT_PRODUCT_IMAGE}"
                     alt="${escapeHtml(item.name)}"
                     class="item-image"
                     onerror="handleImageError(this)">

                <div class="item-details">
                    <h3 class="item-name">${escapeHtml(item.name)}</h3>
                    ${item.variant_id ? '<p class="item-variant">Variante sélectionnée</p>' : ''}
                    <p class="item-price">${formatPrice(item.price)} × ${item.quantity}</p>
                </div>

                <div class="item-actions">
                    <div class="item-quantity">
                        <button class="quantity-btn" onclick="updateQuantity('${itemKey}', ${item.quantity - 1})">-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity('${itemKey}', ${item.quantity + 1})">+</button>
                    </div>
                    <div>
                        <strong>${formatPrice(itemTotal)}</strong>
                    </div>
                    <button class="item-remove" onclick="removeItem('${itemKey}')">
                        🗑️ Supprimer
                    </button>
                </div>
            </div>
        `;
    }).join('');

    updateSummary();
}

// Update quantity
function updateQuantity(itemKey, newQuantity) {
    if (newQuantity < 1) {
        removeItem(itemKey);
        return;
    }

    updateCartItemQuantity(itemKey, newQuantity);
    loadCart();
    Toast.success('Quantité mise à jour');
}

// Remove item
function removeItem(itemKey) {
    const item = cart.find(i => (i.variant_id || i.product_id) === itemKey);
    if (item) {
        removeFromCart(itemKey);
        loadCart();
    }
}

// Update summary
function updateSummary() {
    const subtotal = calculateCartTotal();
    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.20; // TVA 20%
    const discount = 0; // TODO: Implement coupon logic
    const total = subtotal + shipping + tax - discount;

    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('shipping').textContent = shipping === 0 ? 'Gratuit' : formatPrice(shipping);
    document.getElementById('tax').textContent = formatPrice(tax);
    document.getElementById('discount').textContent = discount > 0 ? `-${formatPrice(discount)}` : formatPrice(0);
    document.getElementById('total').textContent = formatPrice(total);
}

// Apply coupon
async function applyCoupon() {
    const input = document.getElementById('couponInput');
    const code = input?.value.trim();

    if (!code) {
        Toast.warning('Veuillez entrer un code promo');
        return;
    }

    try {
        const data = await API.validateCoupon(code);
        Toast.success(`Code promo "${code}" appliqué !`);
        // TODO: Apply discount logic
        updateSummary();
    } catch (error) {
        Toast.error('Code promo invalide');
    }
}

// Proceed to checkout
function proceedToCheckout() {
    if (cart.length === 0) {
        Toast.warning('Votre panier est vide');
        return;
    }

    window.location.href = '/checkout.html';
}

// Clear cart
function emptyCart() {
    if (confirm('Êtes-vous sûr de vouloir vider le panier ?')) {
        clearCart();
        loadCart();
    }
}
