/**
 * Logique de la page checkout
 */

let cart = [];
let currentStep = 1;
let shippingMethod = null;
let paymentMethod = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    cart = getCart();

    if (cart.length === 0) {
        Toast.warning('Votre panier est vide');
        setTimeout(() => window.location.href = '/cart.html', 2000);
        return;
    }

    renderOrderSummary();
    initializeForms();
});

// Render order summary
function renderOrderSummary() {
    const itemsContainer = document.getElementById('summaryItems');
    if (!itemsContainer) return;

    itemsContainer.innerHTML = cart.map(item => `
        <div class="summary-item">
            <img src="${CONFIG.DEFAULT_PRODUCT_IMAGE}"
                 alt="${escapeHtml(item.name)}"
                 class="summary-item-image"
                 onerror="handleImageError(this)">
            <div class="summary-item-info">
                <div class="summary-item-name">${escapeHtml(item.name)}</div>
                <div class="summary-item-quantity">Quantité: ${item.quantity}</div>
            </div>
            <div class="summary-item-price">
                ${formatPrice(item.price * item.quantity)}
            </div>
        </div>
    `).join('');

    updateTotals();
}

// Update totals
function updateTotals() {
    const subtotal = calculateCartTotal();
    const shipping = shippingMethod?.price || 0;
    const tax = subtotal * 0.20; // TVA 20%
    const total = subtotal + shipping + tax;

    if (document.getElementById('orderSubtotal')) {
        document.getElementById('orderSubtotal').textContent = formatPrice(subtotal);
    }
    if (document.getElementById('orderShipping')) {
        document.getElementById('orderShipping').textContent = shipping === 0 ? 'Gratuit' : formatPrice(shipping);
    }
    if (document.getElementById('orderTax')) {
        document.getElementById('orderTax').textContent = formatPrice(tax);
    }
    if (document.getElementById('orderTotal')) {
        document.getElementById('orderTotal').textContent = formatPrice(total);
    }
}

// Initialize forms
function initializeForms() {
    // Shipping method selection
    document.querySelectorAll('input[name="shipping"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const option = e.target.closest('.shipping-option');
            if (option) {
                shippingMethod = {
                    id: e.target.value,
                    name: option.querySelector('.shipping-name').textContent,
                    price: parseFloat(option.dataset.price || 0)
                };
                updateTotals();
            }
        });
    });

    // Payment method selection
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const option = e.target.closest('.payment-option');
            if (option) {
                paymentMethod = {
                    id: e.target.value,
                    name: option.querySelector('.payment-name').textContent
                };
            }
        });
    });
}

// Go to step
function goToStep(step) {
    // Validate current step before moving
    if (step > currentStep) {
        if (!validateStep(currentStep)) {
            return;
        }
    }

    // Update step UI
    document.querySelectorAll('.step').forEach((el, index) => {
        el.classList.remove('active', 'completed');
        if (index + 1 < step) {
            el.classList.add('completed');
        } else if (index + 1 === step) {
            el.classList.add('active');
        }
    });

    // Show/hide sections
    document.querySelectorAll('.checkout-section').forEach(section => {
        section.style.display = 'none';
    });

    const sectionMap = {
        1: 'shippingSection',
        2: 'paymentSection',
        3: 'reviewSection'
    };

    const sectionId = sectionMap[step];
    if (sectionId && document.getElementById(sectionId)) {
        document.getElementById(sectionId).style.display = 'block';
    }

    currentStep = step;

    // Update review if on step 3
    if (step === 3) {
        updateReview();
    }
}

// Validate step
function validateStep(step) {
    switch(step) {
        case 1: // Shipping
            return validateShippingForm();
        case 2: // Payment
            if (!shippingMethod) {
                Toast.warning('Veuillez sélectionner un mode de livraison');
                return false;
            }
            if (!paymentMethod) {
                Toast.warning('Veuillez sélectionner un mode de paiement');
                return false;
            }
            return true;
        default:
            return true;
    }
}

// Validate shipping form
function validateShippingForm() {
    const form = document.getElementById('shippingForm');
    if (!form) return false;

    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.closest('.form-group').classList.add('error');
            isValid = false;
        } else {
            field.closest('.form-group').classList.remove('error');
        }
    });

    if (!isValid) {
        Toast.error('Veuillez remplir tous les champs obligatoires');
    }

    return isValid;
}

// Update review
function updateReview() {
    // Update shipping address
    const shippingData = getFormData('shippingForm');
    const shippingReview = document.getElementById('shippingReview');
    if (shippingReview && shippingData) {
        shippingReview.innerHTML = `
            <strong>${shippingData.firstName} ${shippingData.lastName}</strong><br>
            ${shippingData.address}<br>
            ${shippingData.city}, ${shippingData.postalCode}<br>
            ${shippingData.country}<br>
            Tel: ${shippingData.phone}
        `;
    }

    // Update shipping method
    const shippingMethodReview = document.getElementById('shippingMethodReview');
    if (shippingMethodReview && shippingMethod) {
        shippingMethodReview.textContent = shippingMethod.name;
    }

    // Update payment method
    const paymentMethodReview = document.getElementById('paymentMethodReview');
    if (paymentMethodReview && paymentMethod) {
        paymentMethodReview.textContent = paymentMethod.name;
    }
}

// Get form data
function getFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return null;

    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });
    return data;
}

// Place order
async function placeOrder() {
    if (!validateStep(currentStep)) {
        return;
    }

    const shippingData = getFormData('shippingForm');

    const orderData = {
        items: cart.map(item => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            price: item.price
        })),
        shipping_address: {
            street: shippingData.address,
            city: shippingData.city,
            postal_code: shippingData.postalCode,
            country: shippingData.country,
            phone: shippingData.phone
        },
        billing_address: shippingData.sameAsBilling ? shippingData : getFormData('billingForm'),
        payment_method: paymentMethod?.id,
        shipping_method: shippingMethod?.id
    };

    try {
        const result = await API.createOrder(orderData);

        // Clear cart
        clearCart();

        // Show confirmation
        showOrderConfirmation(result.data || result);

        Toast.success('Commande passée avec succès !');
    } catch (error) {
        console.error('Erreur:', error);
        Toast.error('Erreur lors de la création de la commande');
    }
}

// Show order confirmation
function showOrderConfirmation(order) {
    document.querySelectorAll('.checkout-section, .checkout-steps').forEach(el => {
        el.style.display = 'none';
    });

    const confirmationHTML = `
        <div class="order-confirmation">
            <div class="confirmation-icon">✓</div>
            <h2 class="confirmation-title">Commande confirmée !</h2>
            <p class="order-number">Numéro de commande: ${order.order_number || order.id}</p>
            <p>Merci pour votre commande. Un email de confirmation vous a été envoyé.</p>
            <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center;">
                <a href="/orders.html" class="btn btn-primary">Voir mes commandes</a>
                <a href="/products.html" class="btn btn-outline">Continuer mes achats</a>
            </div>
        </div>
    `;

    const contentArea = document.querySelector('.checkout-content');
    if (contentArea) {
        contentArea.innerHTML = confirmationHTML;
    }
}
