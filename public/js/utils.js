/**
 * Fonctions utilitaires communes
 */

// === GESTION DU PANIER ===

/**
 * Récupère le panier depuis le localStorage
 */
function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CONFIG.CART_STORAGE_KEY) || '[]');
    } catch (error) {
        console.error('Erreur lecture panier:', error);
        return [];
    }
}

/**
 * Sauvegarde le panier dans le localStorage
 */
function saveCart(cart) {
    try {
        localStorage.setItem(CONFIG.CART_STORAGE_KEY, JSON.stringify(cart));
        updateCartBadge();
    } catch (error) {
        console.error('Erreur sauvegarde panier:', error);
        Toast.error('Impossible de sauvegarder le panier');
    }
}

/**
 * Ajoute un produit au panier
 */
function addToCart(productId, name, price, variantId = null, quantity = 1) {
    const cart = getCart();
    const itemKey = variantId || productId;
    const existingItem = cart.find(item =>
        (item.variant_id || item.product_id) === itemKey
    );

    if (existingItem) {
        existingItem.quantity += quantity;
        Toast.success(`Quantité mise à jour: ${name}`, 'Panier');
    } else {
        cart.push({
            product_id: productId,
            variant_id: variantId,
            name,
            price: parseFloat(price),
            quantity,
        });
        Toast.success(`${name} ajouté au panier`, 'Panier');
    }

    saveCart(cart);
}

/**
 * Met à jour la quantité d'un article
 */
function updateCartItemQuantity(itemKey, quantity) {
    const cart = getCart();
    const item = cart.find(i => (i.variant_id || i.product_id) === itemKey);

    if (item) {
        if (quantity <= 0) {
            removeFromCart(itemKey);
        } else {
            item.quantity = quantity;
            saveCart(cart);
        }
    }
}

/**
 * Retire un produit du panier
 */
function removeFromCart(itemKey) {
    let cart = getCart();
    cart = cart.filter(item => (item.variant_id || item.product_id) !== itemKey);
    saveCart(cart);
    Toast.info('Article retiré du panier', 'Panier');
}

/**
 * Vide le panier
 */
function clearCart() {
    localStorage.removeItem(CONFIG.CART_STORAGE_KEY);
    updateCartBadge();
    Toast.info('Panier vidé', 'Panier');
}

/**
 * Calcule le total du panier
 */
function calculateCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

/**
 * Compte le nombre d'articles dans le panier
 */
function getCartItemCount() {
    const cart = getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
}

/**
 * Met à jour le badge du panier dans le header
 */
function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        const count = getCartItemCount();
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// === FORMATAGE ===

/**
 * Formate un prix en euros
 */
function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
    }).format(price);
}

/**
 * Formate une date
 */
function formatDate(dateString, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };

    return new Intl.DateTimeFormat('fr-FR', { ...defaultOptions, ...options }).format(
        new Date(dateString)
    );
}

/**
 * Tronque un texte
 */
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// === VALIDATION ===

/**
 * Valide une adresse email
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Valide un numéro de téléphone français
 */
function isValidPhone(phone) {
    const regex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    return regex.test(phone);
}

/**
 * Valide un code postal français
 */
function isValidPostalCode(code) {
    const regex = /^(?:0[1-9]|[1-8]\d|9[0-8])\d{3}$/;
    return regex.test(code);
}

// === IMAGES ===

/**
 * Récupère l'URL de l'image d'un produit
 */
function getProductImageUrl(product, size = 'medium') {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        const firstImage = product.images[0];

        // Si l'image est un objet avec les différentes tailles
        if (typeof firstImage === 'object' && firstImage[size]) {
            return firstImage[size];
        }

        // Si c'est une URL simple
        if (typeof firstImage === 'string') {
            return firstImage;
        }
    }

    return CONFIG.DEFAULT_PRODUCT_IMAGE;
}

/**
 * Gère les erreurs de chargement d'image
 */
function handleImageError(imgElement) {
    imgElement.src = CONFIG.DEFAULT_PRODUCT_IMAGE;
    imgElement.onerror = null; // Évite les boucles infinies
}

// === DEBOUNCE ===

/**
 * Crée une fonction debounced
 */
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// === URL PARAMETERS ===

/**
 * Récupère un paramètre de l'URL
 */
function getUrlParameter(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

/**
 * Met à jour un paramètre dans l'URL sans recharger la page
 */
function updateUrlParameter(name, value) {
    const url = new URL(window.location);
    url.searchParams.set(name, value);
    window.history.pushState({}, '', url);
}

/**
 * Supprime un paramètre de l'URL
 */
function removeUrlParameter(name) {
    const url = new URL(window.location);
    url.searchParams.delete(name);
    window.history.pushState({}, '', url);
}

// === CALCULS DE RÉDUCTION ===

/**
 * Calcule le pourcentage de réduction
 */
function calculateDiscountPercent(originalPrice, currentPrice) {
    if (!originalPrice || !currentPrice || originalPrice <= currentPrice) {
        return 0;
    }
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

/**
 * Vérifie si un produit a une réduction
 */
function hasDiscount(product) {
    return product.compare_price &&
           parseFloat(product.compare_price) > parseFloat(product.price);
}

// === SANITIZATION ===

/**
 * Échappe les caractères HTML pour éviter les injections XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// === INITIALISATION ===

/**
 * Initialise les fonctionnalités communes au chargement de la page
 */
document.addEventListener('DOMContentLoaded', () => {
    // Mise à jour du badge du panier
    updateCartBadge();

    // Gestion des images en erreur
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', () => handleImageError(img));
    });
});
