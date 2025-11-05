/**
 * Logique de la page détail produit
 */

let currentProduct = null;
let selectedVariant = null;
let quantity = 1;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const productId = getUrlParameter('id');
    if (productId) {
        loadProduct(productId);
    } else {
        Toast.error('ID produit manquant');
        setTimeout(() => window.location.href = '/products.html', 2000);
    }
});

// Load product details
async function loadProduct(productId) {
    try {
        const data = await API.getProductById(productId);
        currentProduct = data.data || data;

        if (!currentProduct) {
            throw new Error('Produit non trouvé');
        }

        renderProduct();

        if (currentProduct.has_variants) {
            loadVariants(productId);
        }

        loadRelatedProducts(currentProduct.category_id);
    } catch (error) {
        console.error('Erreur:', error);
        Toast.error('Impossible de charger le produit');
        setTimeout(() => window.location.href = '/products.html', 2000);
    }
}

// Render product details
function renderProduct() {
    document.title = `${currentProduct.name} - E-Shop`;

    // Product images
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.getElementById('thumbnails');

    const imageUrl = getProductImageUrl(currentProduct);
    if (mainImage) mainImage.src = imageUrl;

    // Product info
    document.getElementById('productName').textContent = currentProduct.name;
    document.getElementById('productCategory').textContent = currentProduct.Category?.name || 'Sans catégorie';

    // Price
    const currentPrice = document.getElementById('currentPrice');
    const oldPrice = document.getElementById('oldPrice');
    const discountBadge = document.getElementById('discountBadge');

    currentPrice.textContent = formatPrice(currentProduct.price);

    if (hasDiscount(currentProduct)) {
        oldPrice.textContent = formatPrice(currentProduct.compare_price);
        oldPrice.style.display = 'inline';
        const discount = calculateDiscountPercent(currentProduct.compare_price, currentProduct.price);
        discountBadge.textContent = `-${discount}%`;
        discountBadge.style.display = 'inline-block';
    }

    // Stock
    const stockInfo = document.getElementById('stockInfo');
    if (currentProduct.quantity > 0) {
        stockInfo.innerHTML = `<span style="color: var(--success)">✓ En stock (${currentProduct.quantity} disponibles)</span>`;
    } else {
        stockInfo.innerHTML = `<span style="color: var(--danger)">✕ Rupture de stock</span>`;
    }

    // Description
    document.getElementById('productDescription').innerHTML = currentProduct.description || '';
}

// Load variants
async function loadVariants(productId) {
    try {
        const data = await API.getProductVariants(productId);
        const variants = data.data || data;

        if (variants && variants.length > 0) {
            renderVariants(variants);
        }
    } catch (error) {
        console.error('Erreur chargement variantes:', error);
    }
}

// Render variants
function renderVariants(variants) {
    const container = document.getElementById('variantsSection');
    if (!container) return;

    // Group by attribute
    const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
    const colors = [...new Set(variants.map(v => ({ name: v.color, hex: v.color_hex })).filter(c => c.name))];

    let html = '';

    // Sizes
    if (sizes.length > 0) {
        html += `
            <div class="variant-group">
                <label>Taille</label>
                <div class="variant-options" id="sizeOptions">
                    ${sizes.map(size => `
                        <button class="variant-option" data-size="${size}" onclick="selectSize('${size}')">
                            ${size}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Colors
    if (colors.length > 0) {
        html += `
            <div class="variant-group">
                <label>Couleur</label>
                <div class="variant-options" id="colorOptions">
                    ${colors.map(color => `
                        <button class="variant-option color-option"
                                style="background: ${color.hex || '#ccc'}"
                                data-color="${color.name}"
                                onclick="selectColor('${color.name}')"
                                title="${color.name}">
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

// Select size
function selectSize(size) {
    document.querySelectorAll('[data-size]').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-size="${size}"]`).classList.add('active');
    updateSelectedVariant();
}

// Select color
function selectColor(color) {
    document.querySelectorAll('[data-color]').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-color="${color}"]`).classList.add('active');
    updateSelectedVariant();
}

// Update selected variant
function updateSelectedVariant() {
    const size = document.querySelector('[data-size].active')?.dataset.size;
    const color = document.querySelector('[data-color].active')?.dataset.color;

    // Find matching variant
    // This would need the variants array stored globally
    // For now, just update the UI
}

// Change quantity
function changeQuantity(delta) {
    quantity = Math.max(1, quantity + delta);
    document.getElementById('quantityValue').textContent = quantity;
}

// Add to cart
function addProductToCart() {
    if (currentProduct.quantity === 0) {
        Toast.warning('Ce produit est en rupture de stock');
        return;
    }

    addToCart(
        currentProduct.id,
        currentProduct.name,
        currentProduct.price,
        selectedVariant?.id,
        quantity
    );
}

// Load related products
async function loadRelatedProducts(categoryId) {
    if (!categoryId) return;

    try {
        const data = await API.getProducts({ category: categoryId });
        const products = (data.data || data)
            .filter(p => p.id !== currentProduct.id)
            .slice(0, 4);

        const container = document.getElementById('relatedProducts');
        if (!container || products.length === 0) return;

        container.innerHTML = products.map(product => `
            <div class="product-card card" onclick="window.location.href='/product.html?id=${product.id}'">
                <img src="${getProductImageUrl(product)}"
                     alt="${escapeHtml(product.name)}"
                     class="product-image"
                     onerror="handleImageError(this)">
                <div class="product-info">
                    <h3 class="product-name">${escapeHtml(product.name)}</h3>
                    <div class="product-price">
                        <span class="current-price">${formatPrice(product.price)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur produits liés:', error);
    }
}

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// Change main image
function changeMainImage(imageSrc) {
    document.getElementById('mainImage').src = imageSrc;
    document.querySelectorAll('.thumbnail').forEach(thumb => thumb.classList.remove('active'));
    event.target.classList.add('active');
}
