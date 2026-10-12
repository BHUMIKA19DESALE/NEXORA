import { cartService, wishlistService } from '../api.js';
import { toast } from '../toast.js';

export function renderProductCard(product) {
    const el = document.createElement('div');
    el.className = 'card product-card';
    
    // Format price and discount
    const price = product.price;
    const discount = product.discount || 0;
    const currentPrice = price - discount;
    const hasDiscount = discount > 0;
    
    // Image fallback
    const fallbackUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTVlN2ViIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiPjwvcmVjdD48Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSI+PC9jaXJjbGU+PHBvbHlsaW5lIHBvaW50cz0iMjEgMTUgMTYgMTAgNSAyMSI+PC9wb2x5bGluZT48L3N2Zz4=';
    const imageUrl = (product.images && product.images.length > 0 && product.images[0].image_url) ? product.images[0].image_url : fallbackUrl;
    
    // Inventory logic
    let stockStatusHtml = '';
    let outOfStock = false;
    if (product.inventory) {
        const stock = product.inventory.available_stock;
        if (stock === 0) {
            stockStatusHtml = `<span class="stock-status out-of-stock" style="color: var(--color-danger); font-size: 0.75rem; font-weight: 500;">Out of Stock</span>`;
            outOfStock = true;
        } else if (stock <= 10) {
            stockStatusHtml = `<span class="stock-status low-stock" style="color: var(--color-warning); font-size: 0.75rem; font-weight: 500;">Only ${stock} left</span>`;
        } else {
            stockStatusHtml = `<span class="stock-status in-stock" style="color: var(--color-success); font-size: 0.75rem; font-weight: 500;">In Stock</span>`;
        }
    }
    
    el.innerHTML = `
        <div class="image-wrapper">
            ${hasDiscount ? `<span class="discount-badge">-${Math.round((discount/price)*100)}%</span>` : ''}
            <a href="/pages/product.html?slug=${product.slug || product.id}">
                <img src="${imageUrl}" alt="${product.name}" onerror="this.onerror=null; this.src='${fallbackUrl}'" loading="lazy" style="width: 100%; height: 250px; object-fit: cover; border-radius: var(--radius-md) var(--radius-md) 0 0;">
            </a>
            <button class="icon-btn wishlist-btn" data-id="${product.id}" aria-label="Add to wishlist">
                <i class='bx bx-heart'></i>
            </button>
        </div>
        <div class="details">
            <div class="brand">${product.brand || 'NEXORA'}</div>
            <a href="/pages/product.html?slug=${product.slug || product.id}" class="title" style="text-decoration: none;">${product.name}</a>
            
            <div class="rating-row">
                <span class="review-count" style="color: var(--color-text-muted); font-size: 0.875rem;">No reviews yet</span>
            </div>

            <div class="price-row">
                <div class="price-col">
                    <span class="price">₹${currentPrice.toFixed(2)}</span>
                    ${hasDiscount ? `<span class="original-price">₹${price.toFixed(2)}</span>` : ''}
                </div>
                ${stockStatusHtml}
                <button class="icon-btn add-cart-btn" data-id="${product.id}" aria-label="Add to cart" ${outOfStock ? 'disabled' : ''}>
                    <i class='bx bx-cart-add'></i>
                </button>
            </div>
        </div>
    `;

    // Bind events
    const wishlistBtn = el.querySelector('.wishlist-btn');
    wishlistBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const added = await wishlistService.toggleItem(product.id);
            if (added) {
                wishlistBtn.innerHTML = "<i class='bx bxs-heart' style='color: var(--color-danger);'></i>";
                toast.show('Added to wishlist', 'success');
            } else {
                wishlistBtn.innerHTML = "<i class='bx bx-heart'></i>";
                toast.show('Removed from wishlist');
            }
        } catch (err) {
            if (err.message.includes('401')) {
                window.location.href = '/pages/login.html';
            } else {
                toast.show('Failed to update wishlist', 'error');
            }
        }
    });

    const cartBtn = el.querySelector('.add-cart-btn');
    cartBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const oldHtml = cartBtn.innerHTML;
        cartBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i>";
        try {
            await cartService.addItem(product.id, 1);
            toast.show('Added to cart', 'success');
            window.dispatchEvent(new Event('cart-updated'));
        } catch (err) {
            if (err.message.includes('401')) {
                window.location.href = '/pages/login.html';
            } else {
                toast.show(err.message, 'error');
            }
        } finally {
            cartBtn.innerHTML = oldHtml;
        }
    });

    return el;
}

export function renderProductSkeleton() {
    const el = document.createElement('div');
    el.className = 'card product-card skeleton-card';
    el.innerHTML = `
        <div class="image-wrapper skeleton"></div>
        <div class="details">
            <div class="brand skeleton skeleton-text" style="width: 40%"></div>
            <div class="title skeleton skeleton-text" style="width: 80%; margin-top: 8px;"></div>
            <div class="title skeleton skeleton-text" style="width: 60%"></div>
            
            <div class="price-row" style="margin-top: 16px;">
                <div class="price skeleton skeleton-text" style="width: 50%; height: 24px;"></div>
                <div class="icon-btn skeleton"></div>
            </div>
        </div>
    `;
    return el;
}
