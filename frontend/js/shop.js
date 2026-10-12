import { productsService, categoriesService } from './api.js';
import { renderProductCard, renderProductSkeleton } from './components/ProductCard.js';

const grid = document.getElementById('shop-grid');
const resultsCount = document.getElementById('results-count');
const filterForm = document.getElementById('filter-form');
const categoryFilters = document.getElementById('category-filters');
const sortSelect = document.getElementById('sort-select');
const clearBtn = document.getElementById('clear-filters');


let currentParams = new URLSearchParams(window.location.search);

async function init() {
    // Populate form from URL
    const search = currentParams.get('search') || '';
    if (search) document.getElementById('nav-search-input').value = search;
    
    const minPrice = currentParams.get('min_price');
    if (minPrice) filterForm.elements['min_price'].value = minPrice;
    
    const maxPrice = currentParams.get('max_price');
    if (maxPrice) filterForm.elements['max_price'].value = maxPrice;
    
    const sort = currentParams.get('sort') || 'newest';
    sortSelect.value = sort;

    await loadCategories();
    await loadProducts();
}

async function loadCategories() {
    try {
        const categories = await categoriesService.getAll();
        
        let catCountsData = [];
        try {
            catCountsData = await categoriesService.getCounts();
        } catch (e) {
            console.error("Failed to load category counts", e);
        }
        
        const catCounts = {};
        let totalProductCount = 0;
        catCountsData.forEach(c => {
            catCounts[c.category_id] = c.count;
            totalProductCount += c.count;
        });

        categoryFilters.innerHTML = '';
        const currentCat = currentParams.get('category_id');

        // All Products option
        const allLabel = document.createElement('label');
        const isAllSelected = !currentCat;
        allLabel.className = 'filter-label-modern' + (isAllSelected ? ' selected' : '');
        allLabel.innerHTML = `
            <div class="checkbox-group">
                <input type="radio" class="modern-radio" name="category_id" value="" ${isAllSelected ? 'checked' : ''}>
                <span>All Products</span>
            </div>
            <span class="category-count">${totalProductCount}</span>
        `;
        allLabel.querySelector('input').addEventListener('change', () => {
            filterForm.dispatchEvent(new Event('submit', { cancelable: true }));
        });
        categoryFilters.appendChild(allLabel);
        
        categories.forEach(cat => {
            const count = catCounts[cat.id] || 0;
            const label = document.createElement('label');
            const isSelected = currentCat === cat.id;
            label.className = 'filter-label-modern' + (isSelected ? ' selected' : '');
            label.innerHTML = `
                <div class="checkbox-group">
                    <input type="radio" class="modern-radio" name="category_id" value="${cat.id}" ${isSelected ? 'checked' : ''}>
                    <span>${cat.name}</span>
                </div>
                <span class="category-count">${count}</span>
            `;
            label.querySelector('input').addEventListener('change', () => {
                filterForm.dispatchEvent(new Event('submit', { cancelable: true }));
            });
            categoryFilters.appendChild(label);
        });
    } catch (err) {
        categoryFilters.innerHTML = '<span style="color:var(--color-danger)">Failed to load categories</span>';
    }
}

async function loadProducts() {
    // Show Skeletons
    grid.innerHTML = '';
    for(let i=0; i<8; i++) grid.appendChild(renderProductSkeleton());
    
    try {
        // Collect params for API
        const apiParams = {};
        for (const [key, value] of currentParams.entries()) {
            if (value) apiParams[key] = value;
        }
        
        let products = await productsService.getAll(apiParams);
        
        // Frontend sorting fallback (if backend didn't implement it)
        const sort = currentParams.get('sort');
        if (sort === 'price_asc') products.sort((a,b) => (a.price-a.discount) - (b.price-b.discount));
        if (sort === 'price_desc') products.sort((a,b) => (b.price-b.discount) - (a.price-a.discount));

        grid.innerHTML = '';
        
        if (products.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1;" class="empty-state">
                    <h3>No products found</h3>
                    <p>Try adjusting your filters or search terms.</p>
                    <button class="btn btn-secondary" onclick="document.getElementById('clear-filters').click()" style="margin-top:1rem;">Clear Filters</button>
                </div>
            `;
            resultsCount.innerText = '0 results';
            return;
        }

        products.forEach(p => {
            grid.appendChild(renderProductCard(p));
        });
        
        resultsCount.innerText = `Showing ${products.length} result${products.length !== 1 ? 's' : ''}`;
        
    } catch (err) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1;" class="empty-state">
                <h3 style="color:var(--color-danger)">Unable to load products</h3>
                <p>There was a problem connecting to the server.</p>
                <button class="btn btn-primary" onclick="window.location.reload()" style="margin-top:1rem;">Try Again</button>
            </div>
        `;
        resultsCount.innerText = '';
    }
}

function updateURLAndReload() {
    const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
    window.history.pushState({}, '', newUrl);
    loadProducts();
}

filterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(filterForm);
    
    // Update params
    currentParams.set('category_id', formData.get('category_id') || '');
    currentParams.set('min_price', formData.get('min_price') || '');
    currentParams.set('max_price', formData.get('max_price') || '');
    
    updateURLAndReload();
});

// Search is handled natively by the HTML form now

sortSelect.addEventListener('change', () => {
    currentParams.set('sort', sortSelect.value);
    updateURLAndReload();
});

clearBtn.addEventListener('click', () => {
    filterForm.reset();
    currentParams = new URLSearchParams();
    updateURLAndReload();
});

document.addEventListener('DOMContentLoaded', init);
