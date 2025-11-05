/**
 * Logique de la page historique des commandes
 */

let allOrders = [];
let filteredOrders = [];
let currentPage = 1;
const ordersPerPage = 10;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    initializeFilters();

    // Check if specific order ID in URL
    const orderId = getUrlParameter('id');
    if (orderId) {
        loadOrderDetails(orderId);
    }
});

// Load orders
async function loadOrders() {
    try {
        const data = await API.getOrders();
        allOrders = data.data || data;
        filteredOrders = [...allOrders];

        renderOrders();
    } catch (error) {
        console.error('Erreur:', error);
        Toast.error('Impossible de charger les commandes');

        const container = document.getElementById('ordersContainer');
        if (container) {
            container.innerHTML = `
                <div class="empty-orders">
                    <div class="empty-icon">📦</div>
                    <h2>Erreur de chargement</h2>
                    <p>Impossible de charger vos commandes. Veuillez réessayer.</p>
                </div>
            `;
        }
    }
}

// Initialize filters
function initializeFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');

    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }

    if (dateFilter) {
        dateFilter.addEventListener('change', applyFilters);
    }
}

// Apply filters
function applyFilters() {
    const statusFilter = document.getElementById('statusFilter')?.value;
    const dateFilter = document.getElementById('dateFilter')?.value;

    filteredOrders = allOrders.filter(order => {
        // Status filter
        if (statusFilter && statusFilter !== 'all' && order.status !== statusFilter) {
            return false;
        }

        // Date filter
        if (dateFilter && dateFilter !== 'all') {
            const orderDate = new Date(order.created_at);
            const now = new Date();
            const daysDiff = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));

            switch(dateFilter) {
                case '7':
                    if (daysDiff > 7) return false;
                    break;
                case '30':
                    if (daysDiff > 30) return false;
                    break;
                case '90':
                    if (daysDiff > 90) return false;
                    break;
            }
        }

        return true;
    });

    currentPage = 1;
    renderOrders();
}

// Render orders
function renderOrders() {
    const container = document.getElementById('ordersContainer');
    if (!container) return;

    if (filteredOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-orders">
                <div class="empty-icon">📦</div>
                <h2>Aucune commande</h2>
                <p>Vous n'avez pas encore passé de commande.</p>
                <a href="/products.html" class="btn btn-primary">Découvrir nos produits</a>
            </div>
        `;
        return;
    }

    // Pagination
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    container.innerHTML = `
        <div class="orders-list">
            ${paginatedOrders.map(order => renderOrderCard(order)).join('')}
        </div>
    `;

    renderPagination();
}

// Render order card
function renderOrderCard(order) {
    const statusLabel = getStatusLabel(order.status);
    const paymentStatusLabel = getPaymentStatusLabel(order.payment_status);

    return `
        <div class="order-card">
            <div class="order-header">
                <div class="order-info-item">
                    <div class="order-info-label">Numéro de commande</div>
                    <div class="order-info-value order-number">#${order.order_number}</div>
                </div>
                <div class="order-info-item">
                    <div class="order-info-label">Date</div>
                    <div class="order-info-value">${formatDate(order.created_at)}</div>
                </div>
                <div class="order-info-item">
                    <div class="order-info-label">Statut</div>
                    <div class="order-status ${order.status}">${statusLabel}</div>
                </div>
                <div class="order-info-item">
                    <div class="order-info-label">Paiement</div>
                    <div class="order-info-value">${paymentStatusLabel}</div>
                </div>
            </div>

            <div class="order-body">
                <div class="order-items">
                    ${order.OrderItems?.slice(0, 3).map(item => renderOrderItem(item)).join('') || ''}
                    ${order.OrderItems?.length > 3 ? `<div style="text-align: center; padding: 1rem; color: var(--text-light);">... et ${order.OrderItems.length - 3} autre(s) article(s)</div>` : ''}
                </div>

                <div class="order-summary">
                    <div class="summary-details">
                        <div class="summary-row">
                            <span>Sous-total</span>
                            <span>${formatPrice(order.subtotal)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Livraison</span>
                            <span>${formatPrice(order.shipping_cost || 0)}</span>
                        </div>
                        <div class="summary-row">
                            <span>TVA</span>
                            <span>${formatPrice(order.tax || 0)}</span>
                        </div>
                        ${order.discount > 0 ? `
                            <div class="summary-row">
                                <span>Réduction</span>
                                <span style="color: var(--success)">-${formatPrice(order.discount)}</span>
                            </div>
                        ` : ''}
                        <div class="summary-row total">
                            <span>Total</span>
                            <span>${formatPrice(order.total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="order-footer">
                ${order.tracking_number ? `
                    <div class="tracking-info">
                        <span>Numéro de suivi:</span>
                        <span class="tracking-number">${order.tracking_number}</span>
                    </div>
                ` : '<div></div>'}

                <div class="order-actions">
                    <button class="btn btn-small btn-outline" onclick="viewOrderDetails('${order.id}')">
                        Voir les détails
                    </button>
                    ${order.status === 'delivered' ? `
                        <button class="btn btn-small btn-primary" onclick="reorder('${order.id}')">
                            Commander à nouveau
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// Render order item
function renderOrderItem(item) {
    return `
        <div class="order-item">
            <img src="${CONFIG.DEFAULT_PRODUCT_IMAGE}"
                 alt="${escapeHtml(item.Product?.name || 'Produit')}"
                 class="order-item-image"
                 onerror="handleImageError(this)">
            <div class="order-item-details">
                <div class="order-item-name">${escapeHtml(item.Product?.name || 'Produit')}</div>
                ${item.ProductVariant ? `<div class="order-item-variant">Variante: ${item.ProductVariant.size} - ${item.ProductVariant.color}</div>` : ''}
                <div class="order-item-quantity">Quantité: ${item.quantity}</div>
            </div>
            <div class="order-item-price">
                <div class="item-price">${formatPrice(item.price * item.quantity)}</div>
                <div class="item-unit-price">${formatPrice(item.price)} / unité</div>
            </div>
        </div>
    `;
}

// Get status label
function getStatusLabel(status) {
    const labels = {
        'pending': 'En attente',
        'processing': 'En cours de traitement',
        'shipped': 'Expédiée',
        'delivered': 'Livrée',
        'cancelled': 'Annulée',
        'refunded': 'Remboursée'
    };
    return labels[status] || status;
}

// Get payment status label
function getPaymentStatusLabel(status) {
    const labels = {
        'pending': 'En attente',
        'paid': 'Payé',
        'failed': 'Échec',
        'refunded': 'Remboursé'
    };
    return labels[status] || status;
}

// Render pagination
function renderPagination() {
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    const pagination = document.getElementById('pagination');

    if (!pagination || totalPages <= 1) {
        if (pagination) pagination.innerHTML = '';
        return;
    }

    let html = `
        <button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            ← Précédent
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `
                <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += '<span>...</span>';
        }
    }

    html += `
        <button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            Suivant →
        </button>
    `;

    pagination.innerHTML = html;
}

// Change page
function changePage(page) {
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    renderOrders();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// View order details
function viewOrderDetails(orderId) {
    window.location.href = `/orders.html?id=${orderId}`;
}

// Load order details
async function loadOrderDetails(orderId) {
    try {
        const data = await API.getOrderById(orderId);
        const order = data.data || data;

        showOrderModal(order);
    } catch (error) {
        console.error('Erreur:', error);
        Toast.error('Impossible de charger les détails de la commande');
    }
}

// Show order modal
function showOrderModal(order) {
    // TODO: Implement modal display
    Toast.info('Détails de la commande à implémenter');
}

// Reorder
function reorder(orderId) {
    Toast.info('Fonctionnalité de recommande à venir');
}
