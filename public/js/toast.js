// Toast Notification System
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', title = '') {
    this.init();

    const icons = {
      success: '<i class="fas fa-check-circle"></i>',
      error: '<i class="fas fa-times-circle"></i>',
      warning: '<i class="fas fa-exclamation-triangle"></i>',
      info: '<i class="fas fa-info-circle"></i>'
    };

    const titles = {
      success: title || 'Muvaffaqiyatli',
      error: title || 'Xatolik',
      warning: title || 'Ogohlantirish',
      info: title || 'Ma\'lumot'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type]}</div>
      <div class="toast-content">
        <div class="toast-title">${titles[type]}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="Toast.remove(this.parentElement)">×</button>
    `;

    this.container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => this.remove(toast), 5000);
  },

  remove(toast) {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 350);
  },

  success(message, title) { this.show(message, 'success', title); },
  error(message, title) { this.show(message, 'error', title); },
  warning(message, title) { this.show(message, 'warning', title); },
  info(message, title) { this.show(message, 'info', title); }
};

// Fetch wrapper with toast notifications
async function fetchWithToast(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      Toast.error(data.message || 'Xatolik yuz berdi');
      throw new Error(data.message);
    }

    return data;
  } catch (error) {
    if (error.message !== 'Failed to fetch') {
      Toast.error(error.message || 'Tarmoq xatosi');
    }
    throw error;
  }
}
