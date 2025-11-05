/**
 * Logique de la page compte utilisateur
 */

let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    initializeNavigation();
});

// Load user profile
async function loadUserProfile() {
    try {
        const data = await API.getCurrentUser();
        currentUser = data.data || data;

        renderUserProfile();
        showSection('profile');
    } catch (error) {
        console.error('Erreur:', error);
        Toast.error('Veuillez vous connecter pour accéder à votre compte');
        setTimeout(() => window.location.href = '/admin-login.html', 2000);
    }
}

// Render user profile
function renderUserProfile() {
    if (!currentUser) return;

    // Profile header
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) {
        avatarEl.textContent = currentUser.first_name?.charAt(0) || currentUser.username?.charAt(0) || '👤';
    }

    const nameEl = document.getElementById('userName');
    if (nameEl) {
        nameEl.textContent = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username;
    }

    const emailEl = document.getElementById('userEmail');
    if (emailEl) {
        emailEl.textContent = currentUser.email;
    }

    const roleEl = document.getElementById('userRole');
    if (roleEl) {
        roleEl.textContent = currentUser.role || 'user';
    }

    // Fill profile form
    fillProfileForm();
}

// Fill profile form
function fillProfileForm() {
    if (!currentUser) return;

    const form = document.getElementById('profileForm');
    if (!form) return;

    const fields = {
        firstName: currentUser.first_name,
        lastName: currentUser.last_name,
        email: currentUser.email,
        username: currentUser.username,
        phone: currentUser.phone
    };

    Object.entries(fields).forEach(([fieldName, value]) => {
        const input = form.querySelector(`[name="${fieldName}"]`);
        if (input && value) {
            input.value = value;
        }
    });
}

// Initialize navigation
function initializeNavigation() {
    document.querySelectorAll('.account-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.dataset.section;
            if (section) {
                showSection(section);
                updateActiveNav(e.target);
            }
        });
    });
}

// Show section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const section = document.getElementById(`${sectionName}Section`);
    if (section) {
        section.classList.add('active');
    }

    // Load section data
    switch(sectionName) {
        case 'addresses':
            loadAddresses();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'security':
            // Already loaded
            break;
    }
}

// Update active nav
function updateActiveNav(activeLink) {
    document.querySelectorAll('.account-nav a').forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// Update profile
async function updateProfile() {
    const form = document.getElementById('profileForm');
    if (!form) return;

    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });

    try {
        await API.updateUser(currentUser.id, data);
        Toast.success('Profil mis à jour avec succès');
        loadUserProfile();
    } catch (error) {
        console.error('Erreur:', error);
        Toast.error('Erreur lors de la mise à jour du profil');
    }
}

// Load addresses
async function loadAddresses() {
    if (!currentUser || !currentUser.addresses) return;

    const container = document.getElementById('addressesList');
    if (!container) return;

    const addresses = Array.isArray(currentUser.addresses) ? currentUser.addresses : [];

    if (addresses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Aucune adresse enregistrée</p>
                <button class="btn btn-primary" onclick="addAddress()">Ajouter une adresse</button>
            </div>
        `;
        return;
    }

    container.innerHTML = addresses.map((address, index) => `
        <div class="address-card ${address.is_default ? 'default' : ''}">
            ${address.is_default ? '<span class="address-badge">Par défaut</span>' : ''}
            <div class="address-name">${escapeHtml(address.label || 'Adresse ' + (index + 1))}</div>
            <div class="address-details">
                ${escapeHtml(address.street)}<br>
                ${escapeHtml(address.city)}, ${escapeHtml(address.postal_code)}<br>
                ${escapeHtml(address.country)}
            </div>
            <div class="address-actions">
                <button class="btn btn-small btn-outline" onclick="editAddress(${index})">Modifier</button>
                ${!address.is_default ? `<button class="btn btn-small btn-danger" onclick="deleteAddress(${index})">Supprimer</button>` : ''}
            </div>
        </div>
    `).join('');
}

// Load orders
async function loadOrders() {
    try {
        const data = await API.getOrders();
        const orders = (data.data || data).slice(0, 5); // Last 5 orders

        const container = document.getElementById('recentOrdersList');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Aucune commande</p>
                    <a href="/products.html" class="btn btn-primary">Découvrir nos produits</a>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <div class="order-number">#${order.order_number}</div>
                        <div class="order-date">${formatDate(order.created_at)}</div>
                    </div>
                    <div class="order-status ${order.status}">${getStatusLabel(order.status)}</div>
                </div>
                <div class="order-total">${formatPrice(order.total)}</div>
                <button class="btn btn-small btn-outline" onclick="viewOrder('${order.id}')">
                    Voir les détails
                </button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur:', error);
        Toast.error('Impossible de charger les commandes');
    }
}

// Get status label
function getStatusLabel(status) {
    const labels = {
        'pending': 'En attente',
        'processing': 'En cours',
        'shipped': 'Expédiée',
        'delivered': 'Livrée',
        'cancelled': 'Annulée'
    };
    return labels[status] || status;
}

// View order
function viewOrder(orderId) {
    window.location.href = `/orders.html?id=${orderId}`;
}

// Update password
async function updatePassword() {
    const form = document.getElementById('passwordForm');
    if (!form) return;

    const currentPassword = form.querySelector('[name="currentPassword"]').value;
    const newPassword = form.querySelector('[name="newPassword"]').value;
    const confirmPassword = form.querySelector('[name="confirmPassword"]').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        Toast.warning('Veuillez remplir tous les champs');
        return;
    }

    if (newPassword !== confirmPassword) {
        Toast.error('Les mots de passe ne correspondent pas');
        return;
    }

    if (newPassword.length < 6) {
        Toast.error('Le mot de passe doit contenir au moins 6 caractères');
        return;
    }

    try {
        await API.updatePassword(currentPassword, newPassword);
        Toast.success('Mot de passe mis à jour avec succès');
        form.reset();
    } catch (error) {
        console.error('Erreur:', error);
        Toast.error('Erreur lors de la mise à jour du mot de passe');
    }
}

// Add address
function addAddress() {
    Toast.info('Fonctionnalité d\'ajout d\'adresse à venir');
}

// Edit address
function editAddress(index) {
    Toast.info('Fonctionnalité d\'édition d\'adresse à venir');
}

// Delete address
function deleteAddress(index) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) {
        Toast.info('Fonctionnalité de suppression d\'adresse à venir');
    }
}

// Logout
function logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        localStorage.removeItem('authToken');
        clearCart();
        Toast.success('Déconnexion réussie');
        setTimeout(() => window.location.href = '/admin-login.html', 1000);
    }
}
