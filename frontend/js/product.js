import { productsService, cartService, wishlistService } from './api.js';
import { toast } from './toast.js';

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');
const productSlug = urlParams.get('slug');

const loading = document.getElementById('product-loading');
const content = document.getElementById('product-content');
const error = document.getElementById('product-error');

let currentProduct = null;

async function init() {
    try {
        if (productSlug) {
            currentProduct = await productsService.getBySlug(productSlug);
        } else if (productId) {
            currentProduct = await productsService.getById(productId);
        } else {
            throw new Error("No product specified");
        }
        
        renderProduct();
    } catch (err) {
        loading.style.display = 'none';
        error.style.display = 'block';
    }
}

function renderProduct() {
    loading.style.display = 'none';
    content.style.display = 'block';
    
    document.title = `${currentProduct.name} - NEXORA`;
    document.getElementById('bc-name').innerText = currentProduct.name;
    document.getElementById('p-brand').innerText = currentProduct.brand || 'NEXORA';
    document.getElementById('p-name').innerText = currentProduct.name;
    
    const price = currentProduct.price;
    const discount = currentProduct.discount || 0;
    const currentPrice = price - discount;
    
    document.getElementById('p-price').innerText = `₹${currentPrice.toFixed(2)}`;
    
    if (discount > 0) {
        document.getElementById('p-original-price').innerText = `₹${price.toFixed(2)}`;
        document.getElementById('p-discount').innerText = `-${Math.round((discount/price)*100)}%`;
        document.getElementById('p-discount').style.display = 'inline-block';
    }
    
    document.getElementById('p-desc').innerText = currentProduct.description || 'No description available.';
    
    // Image
    const imgEl = document.getElementById('main-image');
    const fallbackUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTVlN2ViIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiPjwvcmVjdD48Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSI+PC9jaXJjbGU+PHBvbHlsaW5lIHBvaW50cz0iMjEgMTUgMTYgMTAgNSAyMSI+PC9wb2x5bGluZT48L3N2Zz4=';
    imgEl.src = (currentProduct.images && currentProduct.images.length > 0) ? currentProduct.images[0].image_url : fallbackUrl;
    imgEl.onerror = () => { imgEl.onerror = null; imgEl.src = fallbackUrl; };
    
    // Inventory & Quantity logic
    const stockEl = document.getElementById('p-stock');
    let maxStock = 10;
    
    if (currentProduct.inventory) {
        maxStock = currentProduct.inventory.available_stock;
        if (maxStock === 0) {
            stockEl.innerText = "Out of Stock";
            stockEl.style.color = "var(--color-danger)";
            document.getElementById('btn-add-cart').disabled = true;
            document.getElementById('qty-plus').disabled = true;
        } else if (maxStock <= 10) {
            stockEl.innerText = `Only ${maxStock} left`;
            stockEl.style.color = "var(--color-warning)";
        } else {
            stockEl.innerText = "In Stock";
            stockEl.style.color = "var(--color-success)";
        }
    } else {
        stockEl.innerText = "Stock info unavailable";
    }

    const qtyInput = document.getElementById('qty-input');
    qtyInput.max = maxStock;
    
    document.getElementById('qty-minus').addEventListener('click', () => {
        let val = parseInt(qtyInput.value);
        if (val > 1) qtyInput.value = val - 1;
    });
    document.getElementById('qty-plus').addEventListener('click', () => {
        let val = parseInt(qtyInput.value);
        if (val < maxStock) {
            qtyInput.value = val + 1;
        } else {
            toast.show(`Only ${maxStock} units available`, 'warning');
        }
    });
    
    // Add to cart
    const addCartBtn = document.getElementById('btn-add-cart');
    addCartBtn.addEventListener('click', async () => {
        const qty = parseInt(qtyInput.value);
        const oldHtml = addCartBtn.innerHTML;
        addCartBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Adding...";
        addCartBtn.disabled = true;
        
        try {
            await cartService.addItem(currentProduct.id, qty);
            toast.show('Added to cart', 'success');
            window.dispatchEvent(new Event('cart-updated'));
        } catch (err) {
            if (err.message.includes('401')) {
                window.location.href = '/pages/login.html';
            } else {
                toast.show(err.message, 'error');
            }
        } finally {
            addCartBtn.innerHTML = oldHtml;
            addCartBtn.disabled = false;
        }
    });
    
    // Wishlist
    const wishlistBtn = document.getElementById('btn-wishlist');
    wishlistBtn.addEventListener('click', async () => {
        try {
            const added = await wishlistService.toggleItem(currentProduct.id);
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
}

document.addEventListener('DOMContentLoaded', init);
