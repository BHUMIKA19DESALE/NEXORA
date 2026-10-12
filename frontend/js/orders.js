import { ordersService } from './api.js';
import { toast } from './toast.js';

const ordersGrid = document.getElementById('orders-grid');
const emptyState = document.getElementById('orders-empty');

async function loadOrders() {
    try {
        const orders = await ordersService.getAll();
        
        if (orders.length === 0) {
            ordersGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        ordersGrid.style.display = 'flex';
        emptyState.style.display = 'none';
        
        ordersGrid.innerHTML = '';
        
        orders.forEach(order => {
            const orderEl = document.createElement('div');
            orderEl.className = 'card';
            orderEl.style.padding = 'var(--spacing-lg)';
            orderEl.style.width = '100%';
            
            const date = new Date(order.created_at || Date.now()).toLocaleDateString();
            
            orderEl.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--color-border); padding-bottom: var(--spacing-md); margin-bottom: var(--spacing-md);">
                    <div>
                        <h3 style="margin-bottom: var(--spacing-xs);">Order #${order.id.split('-')[0]}</h3>
                        <p style="margin: 0; color: var(--color-text-secondary); font-size: 0.875rem;">Placed on ${date}</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; font-size: 1.125rem;">₹${order.grand_total.toFixed(2)}</div>
                        <span style="display: inline-block; padding: 2px 8px; border-radius: var(--radius-full); background: var(--color-primary-light); color: var(--color-primary); font-size: 0.75rem; font-weight: 500; margin-top: 4px;">${order.status}</span>
                    </div>
                </div>
                <div>
                    <!-- Order Items would go here if backend returned them. -->
                    <p style="color: var(--color-text-muted); font-size: 0.875rem;">Items in this order are being processed.</p>
                </div>
            `;
            
            ordersGrid.appendChild(orderEl);
        });
        
    } catch (err) {
        console.error(err);
        toast.show('Failed to load orders', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!window.auth.isAuthenticated()) {
        window.location.href = '/pages/login.html';
    } else {
        loadOrders();
    }
});
