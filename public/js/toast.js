/**
 * Système de Toast/Notifications
 * Remplace les alert() par des notifications élégantes
 */

class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.init();
    }

    init() {
        // Créer le conteneur de toasts s'il n'existe pas
        if (!document.querySelector('.toast-container')) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.toast-container');
        }
    }

    /**
     * Affiche un toast
     * @param {string} message - Message à afficher
     * @param {string} type - Type de toast (success, error, warning, info)
     * @param {string} title - Titre du toast (optionnel)
     * @param {number} duration - Durée d'affichage en ms (par défaut 3000)
     */
    show(message, type = 'info', title = '', duration = CONFIG.TOAST_DURATION) {
        const toast = this.createToast(message, type, title);
        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Animation d'entrée
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Auto-suppression
        const autoRemoveTimer = setTimeout(() => {
            this.remove(toast);
        }, duration);

        // Sauvegarder le timer pour pouvoir l'annuler
        toast.dataset.timer = autoRemoveTimer;

        return toast;
    }

    createToast(message, type, title) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        // Icônes selon le type
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        // Titres par défaut selon le type
        const defaultTitles = {
            success: 'Succès',
            error: 'Erreur',
            warning: 'Attention',
            info: 'Information'
        };

        const finalTitle = title || defaultTitles[type];
        const icon = icons[type] || icons.info;

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${finalTitle}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Fermer">×</button>
            <div class="toast-progress"></div>
        `;

        // Bouton de fermeture
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(toast.dataset.timer);
            this.remove(toast);
        });

        return toast;
    }

    remove(toast) {
        toast.classList.remove('show');
        toast.classList.add('hide');

        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
            this.toasts = this.toasts.filter(t => t !== toast);
        }, 300);
    }

    // Méthodes de raccourci
    success(message, title = '') {
        return this.show(message, 'success', title);
    }

    error(message, title = '') {
        return this.show(message, 'error', title);
    }

    warning(message, title = '') {
        return this.show(message, 'warning', title);
    }

    info(message, title = '') {
        return this.show(message, 'info', title);
    }

    // Nettoyer tous les toasts
    clear() {
        this.toasts.forEach(toast => {
            clearTimeout(toast.dataset.timer);
            this.remove(toast);
        });
    }
}

// Instance globale
const Toast = new ToastManager();

// Fonction helper pour compatibilité avec alert()
function showToast(message, type = 'info') {
    Toast.show(message, type);
}
