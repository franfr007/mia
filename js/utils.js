// UTILIDADES COMUNES
class Utils {
    // === NAVEGACIÓN ===
    static navigateTo(page, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        window.location.href = queryString ? `${page}?${queryString}` : page;
    }

    static getUrlParams() {
        return Object.fromEntries(new URLSearchParams(window.location.search));
    }

    static goBack() {
        window.history.back();
    }

    // === FORMATO DE FECHAS ===
    static formatDate(timestamp, format = 'full') {
        const date = new Date(timestamp * 1000);
        const options = {
            'short': { day: '2-digit', month: '2-digit', year: 'numeric' },
            'medium': { day: '2-digit', month: 'short', year: 'numeric' },
            'full': { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            }
        };
        return date.toLocaleDateString('es-AR', options[format] || options.full);
    }

    static formatRelativeTime(timestamp) {
        const now = Date.now();
        const date = timestamp * 1000;
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 7) {
            return this.formatDate(timestamp, 'medium');
        } else if (days > 0) {
            return `Hace ${days} día${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
        } else if (minutes > 0) {
            return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        } else {
            return 'Hace un momento';
        }
    }

    // Alias para formatRelativeTime
    static formatTimeAgo(timestamp) {
        return this.formatRelativeTime(timestamp);
    }

    // Formatear solo la hora (HH:MM)
    static formatTime(timestamp) {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // Formatear fecha y hora completa
    static formatDateTime(timestamp) {
        const date = new Date(timestamp);
        const dateStr = date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const timeStr = this.formatTime(timestamp);
        return `${dateStr} ${timeStr}`;
    }

    // === ALERTAS Y MENSAJES ===
    static showAlert(message, type = 'info', duration = 5000) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            max-width: 500px;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(alertDiv);

        if (duration > 0) {
            setTimeout(() => {
                alertDiv.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => alertDiv.remove(), 300);
            }, duration);
        }

        return alertDiv;
    }

    static showLoading(message = 'Cargando...') {
        // IMPORTANTE: Eliminar cualquier loading existente antes de crear uno nuevo
        this.hideLoading();
        
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'globalLoading';
        loadingDiv.className = 'loading';
        loadingDiv.innerHTML = `
            <div class="spinner"></div>
            <p>${message}</p>
        `;
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.95);
            z-index: 9998;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        `;
        document.body.appendChild(loadingDiv);
        return loadingDiv;
    }

    static hideLoading() {
        // Eliminar TODOS los elementos de loading, no solo el primero
        const loadingElements = document.querySelectorAll('#globalLoading, .loading');
        loadingElements.forEach(el => {
            el.remove();
        });
    }

    static confirm(message, onConfirm, onCancel = null) {
        if (window.confirm(message)) {
            onConfirm();
        } else if (onCancel) {
            onCancel();
        }
    }

    // === VALIDACIÓN ===
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validateUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    static isEmpty(value) {
        return !value || value.trim().length === 0;
    }

    // === PROCESAMIENTO DE ARCHIVOS ===
    static async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    static async readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }

    static getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
    }

    static isValidFileType(filename, allowedTypes) {
        const ext = this.getFileExtension(filename);
        return allowedTypes.includes(ext);
    }

    // === FORMATO DE TEXTO ===
    static truncate(text, maxLength, suffix = '...') {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - suffix.length) + suffix;
    }

    static capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }

    static slugify(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');
    }

    // === HTML Y DOM ===
    static createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key.startsWith('on')) {
                element.addEventListener(key.substring(2).toLowerCase(), value);
            } else {
                element.setAttribute(key, value);
            }
        });

        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });

        return element;
    }

    static clearElement(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    // === COLORES Y BADGES ===
    static getStatusBadge(status) {
        const badges = {
            'submitted': { class: 'badge-warning', text: 'Pendiente' },
            'graded': { class: 'badge-success', text: 'Corregida' },
            'draft': { class: 'badge-secondary', text: 'Borrador' },
            'finished': { class: 'badge-primary', text: 'Completado' },
            'inprogress': { class: 'badge-warning', text: 'En progreso' },
            'notstarted': { class: 'badge-danger', text: 'No iniciado' }
        };
        return badges[status] || { class: 'badge-secondary', text: status };
    }

    static getGradeColor(grade, maxGrade = 10) {
        const percentage = (grade / maxGrade) * 100;
        if (percentage >= 70) return 'var(--success)';
        if (percentage >= 50) return 'var(--warning)';
        return 'var(--danger)';
    }

    // === ESTADÍSTICAS ===
    static calculateAverage(numbers) {
        if (numbers.length === 0) return 0;
        const sum = numbers.reduce((a, b) => a + b, 0);
        return sum / numbers.length;
    }

    static calculatePercentage(value, total) {
        if (total === 0) return 0;
        return (value / total) * 100;
    }

    // === EXPORTACIÓN ===
    static exportToCSV(data, filename = 'export.csv') {
        const csv = this.arrayToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, filename);
    }

    static arrayToCSV(data) {
        if (data.length === 0) return '';
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => 
            Object.values(row).map(val => 
                typeof val === 'string' ? `"${val}"` : val
            ).join(',')
        );
        return [headers, ...rows].join('\n');
    }

    static downloadBlob(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // === ALMACENAMIENTO LOCAL ===
    static saveToStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error guardando en localStorage:', e);
            return false;
        }
    }

    static loadFromStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Error cargando de localStorage:', e);
            return defaultValue;
        }
    }

    static removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Error eliminando de localStorage:', e);
            return false;
        }
    }

    // === DEBOUNCE Y THROTTLE ===
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // === COPIAR AL PORTAPAPELES ===
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showAlert('Copiado al portapapeles', 'success', 2000);
            return true;
        } catch (e) {
            console.error('Error copiando al portapapeles:', e);
            return false;
        }
    }

    // === FORMATO DE NÚMEROS ===
    static formatNumber(num, decimals = 2) {
        return Number(num).toFixed(decimals);
    }

    static formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    // === ORDENAMIENTO ===
    static sortByProperty(array, property, ascending = true) {
        return array.sort((a, b) => {
            const aVal = a[property];
            const bVal = b[property];
            if (aVal < bVal) return ascending ? -1 : 1;
            if (aVal > bVal) return ascending ? 1 : -1;
            return 0;
        });
    }

    // === FILTRADO ===
    static filterBySearch(array, searchTerm, properties) {
        const term = searchTerm.toLowerCase();
        return array.filter(item => {
            return properties.some(prop => {
                const value = item[prop];
                return value && value.toString().toLowerCase().includes(term);
            });
        });
    }
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
