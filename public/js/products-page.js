/**
 * Logique de la page produits
 */

// State
let allProducts = [];
let filteredProducts = [];
let categories = [];
let currentPage = 1;
const productsPerPage = CONFIG.PRODUCTS_PER_PAGE;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();
});

// Load categories for filters
async function loadCategories() {
    try {
        const data = await API.getCategories();
        categories = data.data || data;

        const container = document.getElementById('categoryFilters');
        if (!container) return;

        container.innerHTML = categories
            .filter(cat => cat.is_active !== false)
            .map(cat => `
                <div class="filter-option">
                    <input type="checkbox" id="cat-${cat.id}" value="${cat.id}" onchange="applyFilters()">
                    <label for="cat-${cat.id}">${escapeHtml(cat.name)}</label>
                </div>
            `).join('');
    } catch (error) {
        console.error('Erreur chargement catégories:', error);
        Toast.error('Impossible de charger les catégories');
    }
}

// Load products
async function loadProducts() {
    try {
        const data = await API.getProducts();
        allProducts = (data.data || data).filter(p => p.is_active !== false);
        filteredProducts = [...allProducts];

        updateResultsInfo();
        renderProducts();
    } catch (error) {
        console.error('Erreur chargement produits:', error);
        Toast.error('Impossible de charger les produits');
        document.getElementById('productsContainer').innerHTML = `
            <div class="empty-state">
                <h3>Erreur de chargement</h3>
                <p>Impossible de charger les produits. Veuillez réessayer.</p>
            </div>
        `;
    }
}

// Apply filters
function applyFilters() {
    const selectedCategories = Array.from(
        document.querySelectorAll('#categoryFilters input:checked')
    ).map(input => input.value);

    const minPrice = parseFloat(document.getElementById('minPrice')?.value) || 0;
    const maxPrice = parseFloat(document.getElementById('maxPrice')?.value) || Infinity;
    const inStock = document.getElementById('inStock')?.checked;
    const outOfStock = document.getElementById('outOfStock')?.checked;

    filteredProducts = allProducts.filter(product => {
        // Category filter
        if (selectedCategories.length > 0 && !selectedCategories.includes(product.category_id)) {
            return false;
        }

        // Price filter
        const price = parseFloat(product.price);
        if (price < minPrice || price > maxPrice) {
            return false;
        }

        // Stock filter
        const hasStock = product.quantity > 0;
        if (inStock && !outOfStock && !hasStock) return false;
        if (!inStock && outOfStock && hasStock) return false;
        if (!inStock && !outOfStock) return false;

        return true;
    });

    currentPage = 1;
    updateResultsInfo();
    renderProducts();
}

// Reset filters
function resetFilters() {
    document.querySelectorAll('#categoryFilters input').forEach(input => input.checked = false);
    if (document.getElementById('minPrice')) document.getElementById('minPrice').value = 0;
    if (document.getElementById('maxPrice')) document.getElementById('maxPrice').value = 1000;
    if (document.getElementById('inStock')) document.getElementById('inStock').checked = true;
    if (document.getElementById('outOfStock')) document.getElementById('outOfStock').checked = false;
    if (document.getElementById('searchInput')) document.getElementById('searchInput').value = '';
    if (document.getElementById('sortSelect')) document.getElementById('sortSelect').value = 'default';

    filteredProducts = [...allProducts];
    currentPage = 1;
    updateResultsInfo();
    renderProducts();
}

// Handle search with debounce
const handleSearch = debounce(function() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase();

    if (!searchTerm || searchTerm === '') {
        applyFilters();
        return;
    }

    filteredProducts = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        (product.description && product.description.toLowerCase().includes(searchTerm)) ||
        (product.short_description && product.short_description.toLowerCase().includes(searchTerm))
    );

    currentPage = 1;
    updateResultsInfo();
    renderProducts();
}, CONFIG.SEARCH_DEBOUNCE_DELAY);

// Handle sort
function handleSort() {
    const sortValue = document.getElementById('sortSelect')?.value;

    switch(sortValue) {
        case 'price-asc':
            filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
            break;
        case 'name-asc':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'newest':
            filteredProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
    }

    renderProducts();
}

// Update results info
function updateResultsInfo() {
    const info = document.getElementById('resultsInfo');
    if (info) {
        info.textContent = `${filteredProducts.length} produit${filteredProducts.length > 1 ? 's' : ''}`;
    }
}

// Render products
function renderProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    if (filteredProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Aucun produit trouvé</h3>
                <p>Essayez de modifier vos critères de recherche ou vos filtres.</p>
            </div>
        `;
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    // Pagination
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    // Render products
    container.innerHTML = `
        <div class="products-grid">
            ${paginatedProducts.map(product => {
                const category = categories.find(c => c.id === product.category_id);
                const discount = hasDiscount(product);
                const discountPercent = calculateDiscountPercent(product.compare_price, product.price);

                const imageUrl = getProductImageUrl(product);

                return `
                    <div class="product-card" onclick="viewProduct('${product.id}')">
                        <img src="${imageUrl}" alt="${escapeHtml(product.name)}" class="product-image" onerror="handleImageError(this)">
                        <div class="product-info">
                            <div class="product-category">${category ? escapeHtml(category.name) : 'Sans catégorie'}</div>
                            <h3 class="product-name">${escapeHtml(product.name)}</h3>
                            <div class="product-price">
                                <span class="current-price">${formatPrice(product.price)}</span>
                                ${discount ? `
                                    <span class="old-price">${formatPrice(product.compare_price)}</span>
                                    <span class="discount-badge">-${discountPercent}%</span>
                                ` : ''}
                            </div>
                            <div class="product-actions">
                                <button class="btn-cart" onclick="event.stopPropagation(); addToCart('${product.id}', '${escapeHtml(product.name)}', ${product.price})">
                                    Ajouter au panier
                                </button>
                                <button class="btn-details" onclick="event.stopPropagation(); viewProduct('${product.id}')">
                                    Détails
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    renderPagination();
}

// Render pagination
function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
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
        if (
            i === 1 ||
            i === totalPages ||
            (i >= currentPage - 2 && i <= currentPage + 2)
        ) {
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
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    renderProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// View product
function viewProduct(id) {
    window.location.href = `/product.html?id=${id}`;
}
