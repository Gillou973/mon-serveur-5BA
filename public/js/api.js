/**
 * Gestionnaire d'API centralisé
 * Toutes les requêtes API passent par ce module
 */

const API = {
    /**
     * Récupérer le token d'authentification
     */
    getAuthToken() {
        return localStorage.getItem('authToken');
    },

    /**
     * Définir le token d'authentification
     */
    setAuthToken(token) {
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    },

    /**
     * Fonction fetch générique avec gestion d'erreurs et JWT
     */
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : getEndpoint(endpoint);

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        // Ajouter le token JWT si disponible
        const token = this.getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const defaultOptions = {
            ...options,
            headers,
        };

        try {
            const response = await fetch(url, defaultOptions);
            const data = await response.json();

            if (!response.ok) {
                // Si erreur 401, supprimer le token et rediriger
                if (response.status === 401) {
                    this.setAuthToken(null);
                }
                throw new Error(data.message || `Erreur HTTP: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Erreur API:', error);
            throw error;
        }
    },

    /**
     * Requête GET
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    /**
     * Requête POST
     */
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Requête PUT
     */
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    /**
     * Requête DELETE
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },

    // === CATEGORIES ===
    async getCategories() {
        return this.get('/categories');
    },

    async getCategoryById(id) {
        return this.get(`/categories/${id}`);
    },

    // === PRODUCTS ===
    async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/products?${queryString}` : '/products';
        return this.get(endpoint);
    },

    async getProductById(id) {
        return this.get(`/products/${id}`);
    },

    async getProductBySlug(slug) {
        return this.get(`/products/slug/${slug}`);
    },

    async checkProductAvailability(id) {
        return this.get(`/products/${id}/availability`);
    },

    // === VARIANTS ===
    async getProductVariants(productId) {
        return this.get(`/products/${productId}/variants`);
    },

    async getVariantById(variantId) {
        return this.get(`/variants/${variantId}`);
    },

    async checkVariantAvailability(variantId) {
        return this.get(`/variants/${variantId}/availability`);
    },

    // === CART ===
    async getCart() {
        return this.get('/cart/my-cart');
    },

    async addToCart(productId, variantId = null, quantity = 1) {
        return this.post('/cart/my-cart/items', {
            product_id: productId,
            variant_id: variantId,
            quantity,
        });
    },

    async updateCartItem(itemId, quantity) {
        return this.put(`/cart/my-cart/items/${itemId}`, { quantity });
    },

    async removeFromCart(itemId) {
        return this.delete(`/cart/my-cart/items/${itemId}`);
    },

    async clearCart() {
        return this.delete('/cart/my-cart');
    },

    // === ORDERS ===
    async getOrders() {
        return this.get('/orders');
    },

    async getOrderById(id) {
        return this.get(`/orders/${id}`);
    },

    async createOrder(orderData) {
        return this.post('/orders', orderData);
    },

    // === AUTH ===
    async login(email, password) {
        return this.post('/auth/login', { email, password });
    },

    async register(userData) {
        return this.post('/auth/register', userData);
    },

    async logout() {
        return this.post('/auth/logout');
    },

    async getCurrentUser() {
        return this.get('/auth/me');
    },

    async updatePassword(currentPassword, newPassword) {
        return this.put('/auth/update-password', {
            currentPassword,
            newPassword,
        });
    },

    async updateUser(userId, userData) {
        return this.put(`/users/${userId}`, userData);
    },

    // === COUPONS ===
    async validateCoupon(code) {
        return this.get(`/coupons/${code}`);
    },

    // === BUNDLES ===
    async getActiveBundles() {
        return this.get('/bundles');
    },
};
