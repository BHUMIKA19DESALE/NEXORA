import { wishlistService } from './api.js';
import { renderProductCard, renderProductSkeleton } from './components/ProductCard.js';
import { toast } from './toast.js';

const grid = document.getElementById('wishlist-grid');
const emptyState = document.getElementById('wishlist-empty');

async function loadWishlist() {
    try {
        grid.innerHTML = '';
        for(let i=0; i<4; i++) grid.appendChild(renderProductSkeleton());
        
        const items = await wishlistService.getWishlist();
        grid.innerHTML = '';
        
        if (items.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        items.forEach(item => {
            grid.appendChild(renderProductCard(item.product));
        });
        
    } catch (err) {
        console.error(err);
        grid.innerHTML = '<div style="color:var(--color-danger)">Failed to load wishlist</div>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!window.auth.isAuthenticated()) {
        window.location.href = '/pages/login.html';
    } else {
        loadWishlist();
    }
});
