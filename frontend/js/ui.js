import { auth } from './auth.js';
import { toggleTheme } from './theme.js';
import { toast } from './toast.js';


export function injectFooter() {
    if (!document.querySelector('footer.footer')) {
        document.body.insertAdjacentHTML('beforeend', `
    <footer class="footer">
        <div class="footer-container">
            <div class="footer-grid">
                <div class="footer-col brand-col">
                    <h3 class="footer-logo">NEXORA</h3>
                    <p>Discover products from independent and trusted vendors on one modern marketplace.</p>
                    <div class="social-links">
                        <a href="#"><i class='bx bxl-instagram'></i></a>
                        <a href="#"><i class='bx bxl-linkedin'></i></a>
                        <a href="#"><i class='bx bxl-twitter'></i></a>
                        <a href="#"><i class='bx bxl-youtube'></i></a>
                    </div>
                </div>
                <div class="footer-col">
                    <h4>SHOP</h4>
                    <a href="/pages/shop.html">All Products</a>
                    <a href="/pages/shop.html">Categories</a>
                    <a href="/pages/shop.html?deals=true">Deals</a>
                    <a href="/pages/vendor-register.html">Vendors</a>
                </div>
                <div class="footer-col">
                    <h4>CUSTOMER</h4>
                    <a href="/pages/login.html">My Account</a>
                    <a href="/pages/orders.html">Orders</a>
                    <a href="/pages/cart.html">Cart</a>
                </div>
                <div class="footer-col">
                    <h4>SELLERS</h4>
                    <a href="/pages/vendor-register.html">Sell on NEXORA</a>
                    <a href="/pages/vendor-register.html">Vendor Registration</a>
                    <a href="/pages/vendor-dashboard.html">Vendor Dashboard</a>
                </div>
                <div class="footer-col">
                    <h4>SUPPORT</h4>
                    <a href="#">Contact Us</a>
                    <a href="#">FAQs</a>
                    <a href="/pages/admin-login.html">Admin Login</a>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 NEXORA Marketplace. All rights reserved.</p>
                <div class="trust-badges">
                    <i class='bx bxs-credit-card'></i>
                    <i class='bx bxs-lock-alt'></i>
                    <span>Secure Checkout</span>
                </div>
            </div>
        </div>
    </footer>
`);
    } else {
        const supportCol = Array.from(document.querySelectorAll('.footer-col')).find(col => col.innerHTML.includes('SUPPORT'));
        if (supportCol && !supportCol.innerHTML.includes('Admin Login')) {
            supportCol.insertAdjacentHTML('beforeend', '<a href="/pages/admin-login.html">Admin Login</a>');
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    injectFooter();
    // Setup Theme Toggle (if element exists)
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const newTheme = toggleTheme();
            toast.show(`Switched to ${newTheme} mode`);
        });
    }

    // Auth state check
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
        if (auth.isAuthenticated()) {
            try {
                const user = await auth.fetchCurrentUser();
                if (user) {
                    // Update account link depending on role
                    const accountBtn = document.getElementById('account-btn');
                    if (accountBtn) {
                        if (user.role === 'VENDOR') accountBtn.href = '/pages/vendor-dashboard.html';
                        else if (user.role === 'ADMIN') accountBtn.href = '/pages/admin.html';
                        else accountBtn.href = '/pages/account.html';
                    }
                    
                    // Show logout button
                    let logoutBtn = document.getElementById('logout-btn');
                    if (!logoutBtn) {
                        logoutBtn = document.createElement('a');
                        logoutBtn.href = '#';
                        logoutBtn.className = 'nav-logout-btn';
                        logoutBtn.id = 'logout-btn';
                        logoutBtn.innerHTML = "<i class='bx bx-log-out'></i> <span class='logout-text'>Logout</span>";
                        navActions.appendChild(logoutBtn);
                    } else {
                        // Ensure it has the correct class if it was hardcoded differently
                        logoutBtn.className = 'nav-logout-btn';
                        logoutBtn.innerHTML = "<i class='bx bx-log-out'></i> <span class='logout-text'>Logout</span>";
                        logoutBtn.style.display = 'inline-flex';
                    }

                    logoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        auth.logout();
                    });
                }
            } catch (err) {
                // Invalid token
                const accountBtn = document.getElementById('account-btn');
                if (accountBtn) accountBtn.href = '/pages/login.html';
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) logoutBtn.style.display = 'none';
            }
        } else {
            const accountBtn = document.getElementById('account-btn');
            if (accountBtn) accountBtn.href = '/pages/login.html';
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }
});

// Expose toast to global for easy access
window.toast = toast;
window.auth = auth;

// Global Cart Badge Update
import { cartService } from './api.js';

async function updateCartBadge() {
    const badge = document.getElementById('nav-cart-count');
    if (!badge) return;
    
    if (auth.isAuthenticated()) {
        try {
            const items = await cartService.getCart();
            const count = items.reduce((sum, item) => sum + item.quantity, 0);
            if (count > 0) {
                badge.innerText = count > 99 ? '99+' : count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        } catch (e) {
            badge.style.display = 'none';
        }
    }
}

window.addEventListener('cart-updated', updateCartBadge);
document.addEventListener('DOMContentLoaded', () => {
    if(auth.isAuthenticated()) updateCartBadge();
});
