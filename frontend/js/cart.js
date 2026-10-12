import { cartService } from './api.js';
import { toast } from './toast.js';

const cartItemsContainer = document.getElementById('cart-items');
const cartEmpty = document.getElementById('cart-empty');
const cartContainer = document.getElementById('cart-container');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartTotal = document.getElementById('cart-total');

async function loadCart() {
    try {
        const items = await cartService.getCart();
        
        if (items.length === 0) {
            cartContainer.style.display = 'none';
            cartEmpty.style.display = 'block';
            return;
        }

        cartContainer.style.display = 'flex';
        cartEmpty.style.display = 'none';
        
        cartItemsContainer.innerHTML = '';
        let total = 0;

        items.forEach(item => {
            const product = item.product;
            const price = product.price - (product.discount || 0);
            total += price * item.quantity;
            
            const itemEl = document.createElement('div');
            itemEl.className = 'card';
            itemEl.style.display = 'flex';
            itemEl.style.padding = 'var(--spacing-md)';
            itemEl.style.marginBottom = 'var(--spacing-md)';
            itemEl.style.alignItems = 'center';
            itemEl.style.gap = 'var(--spacing-md)';
            
            const fallbackUrl = 'data:image/svg+xml;base64,...'; // Add a real fallback
            const imageUrl = product.images && product.images.length ? product.images[0].image_url : '/images/placeholder.png';
            
            itemEl.innerHTML = `
                <img src="${imageUrl}" style="width: 80px; height: 80px; object-fit: contain; background: var(--color-background); border-radius: var(--radius-md);" onerror="this.onerror=null; this.src='${fallbackUrl}'">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 var(--spacing-xs) 0;">${product.name}</h4>
                    <p style="margin: 0; color: var(--color-text-secondary); font-size: 0.875rem;">₹${price.toFixed(2)}</p>
                </div>
                <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                    <button class="icon-btn btn-minus" data-id="${item.id}" style="width: 32px; height: 32px;"><i class='bx bx-minus'></i></button>
                    <span>${item.quantity}</span>
                    <button class="icon-btn btn-plus" data-id="${item.id}" style="width: 32px; height: 32px;"><i class='bx bx-plus'></i></button>
                </div>
                <div style="font-weight: 600; width: 100px; text-align: right;">₹${(price * item.quantity).toFixed(2)}</div>
                <button class="icon-btn btn-remove" data-id="${item.id}" style="color: var(--color-danger);"><i class='bx bx-trash'></i></button>
            `;
            
            cartItemsContainer.appendChild(itemEl);
            
            itemEl.querySelector('.btn-remove').addEventListener('click', async () => {
                await cartService.removeItem(item.id);
                toast.show('Item removed from cart');
                loadCart();
                window.dispatchEvent(new Event('cart-updated'));
            });
            // TODO: implement quantity increment/decrement endpoints in backend
        });

        cartSubtotal.innerText = `₹${total.toFixed(2)}`;
        cartTotal.innerText = `₹${total.toFixed(2)}`;
        
    } catch (err) {
        console.error(err);
        toast.show('Failed to load cart', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!window.auth.isAuthenticated()) {
        window.location.href = '/pages/login.html';
    } else {
        loadCart();
    }
});
