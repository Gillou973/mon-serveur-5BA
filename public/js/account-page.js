/**
 * Logique de la page compte utilisateur avec authentification
 */

let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    checkAuth();
    initializeAuthTabs();
    initializeAuthForms();
    initializeNavigation();
});

// Check authentication status
async function checkAuth() {
    const token = API.getAuthToken();

    if (!token) {
        showAuthSection();
        return;
    }

    try {
        await loadUserProfile();
        showAccountSection();
    } catch (error) {
        console.error('Erreur auth:', error);
        API.setAuthToken(null);
        showAuthSection();
    }
}

// Show auth section
function showAuthSection() {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('accountSection').style.display = 'none';
}

// Show account section
function showAccountSection() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('accountSection').style.display = 'block';
}

// Initialize auth tabs
function initializeAuthTabs() {
    const tabs = document.querySelectorAll('.auth-tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchAuthTab(tabName);
        });
    });
}

// Switch auth tab
function switchAuthTab(tabName) {
    // Update tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        }
    });

    // Update panels
    document.querySelectorAll('.auth-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    const panel = document.getElementById(`${tabName}Panel`);
    if (panel) {
        panel.classList.add('active');
    }
}

// Initialize auth forms
function initializeAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    if (profileForm) {
        profileForm.addEventListener('submit', handleUpdateProfile);
    }

    if (passwordForm) {
        passwordForm.addEventListener('submit', handleUpdatePassword);
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
        const response = await API.login(email, password);

        if (response.success && response.data && response.data.token) {
            API.setAuthToken(response.data.token);

            // Utiliser directement les données de l'utilisateur retournées par le login
            currentUser = response.data.user;

            Toast.success('Connexion réussie !');
            renderUserProfile();
            showAccountSection();
            showSection('profile');
            form.reset();
        } else {
            Toast.error(response.message || 'Erreur lors de la connexion');
        }
    } catch (error) {
        console.error('Erreur login:', error);
        Toast.error(error.message || 'Erreur lors de la connexion');
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    // Validation
    if (password !== confirmPassword) {
        Toast.error('Les mots de passe ne correspondent pas');
        return;
    }

    const userData = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: password,
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
    };

    try {
        const response = await API.register(userData);

        if (response.success && response.data && response.data.token) {
            API.setAuthToken(response.data.token);

            // Utiliser directement les données de l'utilisateur retournées par le register
            currentUser = response.data.user;

            Toast.success('Inscription réussie ! Bienvenue !');
            renderUserProfile();
            showAccountSection();
            showSection('profile');
            form.reset();
        } else {
            Toast.error(response.message || 'Erreur lors de l\'inscription');
        }
    } catch (error) {
        console.error('Erreur register:', error);
        Toast.error(error.message || 'Erreur lors de l\'inscription');
    }
}

// Load user profile
async function loadUserProfile() {
    try {
        const response = await API.getCurrentUser();
        // La réponse est { success: true, data: { user: {...} } }
        currentUser = response.data?.user || response.user || response.data || response;

        renderUserProfile();
        showSection('profile');
    } catch (error) {
        console.error('Erreur chargement profil:', error);
        throw error;
    }
}

// Render user profile
function renderUserProfile() {
    if (!currentUser) return;

    // Profile header
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) {
        const initial = currentUser.first_name?.charAt(0) ||
                       currentUser.username?.charAt(0) ||
                       currentUser.email?.charAt(0) || '?';
        avatarEl.textContent = initial.toUpperCase();
    }

    const nameEl = document.getElementById('userName');
    if (nameEl) {
        const fullName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim();
        nameEl.textContent = fullName || currentUser.username || 'Utilisateur';
    }

    const emailEl = document.getElementById('userEmail');
    if (emailEl) {
        emailEl.textContent = currentUser.email || '';
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
    const navLinks = document.querySelectorAll('.account-nav a:not(.logout)');
    const logoutLink = document.querySelector('.account-nav a.logout');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            if (section) {
                showSection(section);
                updateActiveNav(link);
            }
        });
    });

    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
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
            loadRecentOrders();
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

// Handle update profile
async function handleUpdateProfile(e) {
    e.preventDefault();

    if (!currentUser) return;

    const form = e.target;
    const formData = new FormData(form);

    const data = {
        first_name: formData.get('firstName'),
        last_name: formData.get('lastName'),
        phone: formData.get('phone')
    };

    try {
        await API.updateUser(currentUser.id, data);
        Toast.success('Profil mis à jour avec succès');
        await loadUserProfile();
    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        Toast.error('Erreur lors de la mise à jour du profil');
    }
}

// Handle update password
async function handleUpdatePassword(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    // Validation
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
        console.error('Erreur mise à jour mot de passe:', error);
        Toast.error(error.message || 'Erreur lors de la mise à jour du mot de passe');
    }
}

// Load addresses
function loadAddresses() {
    const container = document.getElementById('addressesList');
    if (!container) return;

    const addresses = currentUser?.addresses || [];

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
                ${escapeHtml(address.street || '')}<br>
                ${escapeHtml(address.city || '')}, ${escapeHtml(address.postal_code || '')}<br>
                ${escapeHtml(address.country || '')}
            </div>
            <div class="address-actions">
                <button class="btn btn-small btn-outline" onclick="editAddress(${index})">Modifier</button>
                ${!address.is_default ? `<button class="btn btn-small btn-danger" onclick="deleteAddress(${index})">Supprimer</button>` : ''}
            </div>
        </div>
    `).join('');
}

// Load recent orders
async function loadRecentOrders() {
    try {
        const response = await API.getOrders();
        const orders = (response.data || response).slice(0, 5); // Last 5 orders

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
                        <div class="order-number">#${escapeHtml(order.order_number || order.id)}</div>
                        <div class="order-date">${formatDate(order.created_at)}</div>
                    </div>
                    <div class="order-status ${order.status}">${getStatusLabel(order.status)}</div>
                </div>
                <div class="order-total">${formatPrice(order.total_amount || order.total)}</div>
                <a href="/orders.html?id=${order.id}" class="btn btn-small btn-outline">
                    Voir les détails
                </a>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur chargement commandes:', error);
        const container = document.getElementById('recentOrdersList');
        if (container) {
            container.innerHTML = '<p style="color: var(--text-secondary);">Impossible de charger les commandes</p>';
        }
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

// Add address (placeholder)
function addAddress() {
    Toast.info('Fonctionnalité d\'ajout d\'adresse à venir');
}

// Edit address (placeholder)
function editAddress(index) {
    Toast.info('Fonctionnalité d\'édition d\'adresse à venir');
}

// Delete address (placeholder)
function deleteAddress(index) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) {
        Toast.info('Fonctionnalité de suppression d\'adresse à venir');
    }
}

// Handle logout
async function handleLogout() {
    if (!confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        return;
    }

    try {
        await API.logout();
    } catch (error) {
        console.error('Erreur logout:', error);
    } finally {
        API.setAuthToken(null);
        currentUser = null;
        Toast.success('Déconnexion réussie');
        showAuthSection();
    }
}

// Update cart count
function updateCartCount() {
    updateCartBadge();
}
