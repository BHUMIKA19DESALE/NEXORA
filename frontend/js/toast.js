export const toast = {
    show(message, type = 'info', duration = 3000) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toastEl = document.createElement('div');
        toastEl.className = `toast toast-${type}`;
        
        const iconMap = {
            'success': 'bx-check-circle',
            'error': 'bx-error-circle',
            'warning': 'bx-error',
            'info': 'bx-info-circle'
        };
        
        toastEl.innerHTML = `
            <i class='bx ${iconMap[type]}'></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toastEl);
        
        // Trigger animation
        setTimeout(() => toastEl.classList.add('show'), 10);
        
        setTimeout(() => {
            toastEl.classList.remove('show');
            setTimeout(() => toastEl.remove(), 300);
        }, duration);
    }
};
