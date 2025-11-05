/**
 * Configuration globale de l'application
 */

const CONFIG = {
    // API Configuration
    API_URL: 'http://localhost:3000/api',
    API_TIMEOUT: 10000, // 10 secondes

    // Pagination
    PRODUCTS_PER_PAGE: 12,

    // Cart
    CART_STORAGE_KEY: 'cart',

    // Images
    DEFAULT_PRODUCT_IMAGE: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjUwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y3ZmFmYyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM3MTgwOTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QYXMgZCdpbWFnZTwvdGV4dD48L3N2Zz4=',

    // Toast
    TOAST_DURATION: 3000, // 3 secondes

    // Search
    SEARCH_DEBOUNCE_DELAY: 300, // 300ms
};

// Fonction pour récupérer l'URL de l'API
function getApiUrl() {
    return CONFIG.API_URL;
}

// Fonction pour récupérer l'URL complète d'un endpoint
function getEndpoint(path) {
    return `${CONFIG.API_URL}${path}`;
}
