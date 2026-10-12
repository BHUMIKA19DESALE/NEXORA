import { api } from './api.js';
import { renderProductCard } from './components/ProductCard.js';

document.addEventListener('DOMContentLoaded', async () => {
    await fetchCategories();
    await fetchProducts();
});

async function fetchCategories() {
    const container = document.getElementById('categories-container');
    const errorEl = document.getElementById('categories-error');
    
    container.innerHTML = 'Loading categories...';
    
    try {
        const categories = await api.get('/categories');
        container.innerHTML = '';
        if (categories.length === 0) {
            container.innerHTML = '<p>No categories found.</p>';
            return;
        }
        categories.forEach(cat => {
            const el = document.createElement('div');
            el.className = 'category-circle';
            el.style.cursor = 'pointer';
            el.onclick = () => window.location.href = `/pages/shop.html?category_id=${cat.id}`;
            const fallbackImg = 'https://placehold.co/150x150/f3f4f6/31343c?text=' + encodeURIComponent(cat.name.substring(0, 3));
            const imgUrl = cat.image_url || fallbackImg;
            el.innerHTML = `
                <div class="category-circle-wrapper" style="width: 120px; height: 120px; border-radius: 50%; overflow: hidden; margin: 0 auto 1rem auto; background: var(--color-surface-elevated); box-shadow: var(--shadow-md);">
                    <img src="${imgUrl}" alt="${cat.name}" loading="lazy" onerror="this.onerror=null; this.src='${fallbackImg}'" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <h3 style="margin: 0; font-size: 0.875rem; text-align: center; font-weight: 500;">${cat.name}</h3>
            `;
            container.appendChild(el);
        });
    } catch (err) {
        container.innerHTML = '';
        errorEl.style.display = 'block';
        errorEl.innerText = `Failed to load categories. Required backend endpoint missing: GET /api/categories`;
    }
}

async function fetchProducts() {
    const container = document.getElementById('products-container');
    const errorEl = document.getElementById('products-error');
    
    container.innerHTML = 'Loading products...';
    
    try {
        const products = await api.get('/products');
        container.innerHTML = '';
        if (products.length === 0) {
            container.innerHTML = '<p>No products found.</p>';
            return;
        }
        products.slice(0, 8).forEach(p => {
            const card = renderProductCard(p);
            container.appendChild(card);
        });
    } catch (err) {
        container.innerHTML = '';
        errorEl.style.display = 'block';
        errorEl.innerText = `Failed to load products. Required backend endpoint missing: GET /api/products`;
    }
}
