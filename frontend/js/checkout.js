import { cartService, addressesService, ordersService } from './api.js';
import { toast } from './toast.js';
import { paymentSimulator } from './payment-simulator.js';

const checkoutForm  = document.getElementById('checkout-form');
const cartSubtotal  = document.getElementById('cart-subtotal');
const cartTotal     = document.getElementById('cart-total');
const cartShipping  = document.getElementById('cart-shipping');
const checkoutBtn   = document.getElementById('checkout-btn');

let finalAmount  = 0;
let subtotalAmt  = 0;
let shippingAmt  = 0;
let cachedItems  = [];

async function loadSummary() {
    try {
        const items = await cartService.getCart();
        if (items.length === 0) {
            window.location.href = '/pages/cart.html';
            return;
        }

        cachedItems = items;
        let total = 0;
        items.forEach(item => {
            const price = item.product.price - (item.product.discount || 0);
            total += price * item.quantity;
        });

        subtotalAmt  = total;
        shippingAmt  = total < 100 ? 10 : 0;
        finalAmount  = subtotalAmt + shippingAmt;

        cartSubtotal.innerText = `₹${subtotalAmt.toFixed(2)}`;
        cartShipping.innerText = shippingAmt > 0 ? `₹${shippingAmt.toFixed(2)}` : 'Free';
        cartTotal.innerText    = `₹${finalAmount.toFixed(2)}`;

    } catch (err) {
        toast.show('Failed to load summary', 'error');
    }
}

checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    checkoutBtn.disabled  = true;
    checkoutBtn.innerText = 'Creating Order…';

    try {
        const formData = new FormData(checkoutForm);
        const data     = Object.fromEntries(formData.entries());

        // 1. Save shipping address
        const address = await addressesService.create({
            full_name:      data.full_name,
            address_line_1: data.address_line_1,
            city:           data.city,
            state:          data.state,
            postal_code:    data.postal_code,
            country:        data.country,
            phone:          data.phone
        });

        // 2. Create order (reserves inventory, keeps cart until payment succeeds)
        const order = await ordersService.create({
            address_id:     address.id,
            payment_method: 'CARD'   // overwritten by actual method chosen in gateway
        });

        checkoutBtn.innerText = 'Opening Payment Gateway…';

        // 3. Open the payment gateway
        paymentSimulator.startPayment(
            order.id,
            finalAmount,
            cachedItems,
            subtotalAmt,
            shippingAmt,
            // onSuccess — backend already cleared cart + finalized inventory
            (result) => {
                window.location.href =
                    `/pages/payment-success.html?order_id=${order.id}&payment_ref=${result.reference}`;
            },
            // onCancel / onFail — cart preserved, button re-enabled
            () => {
                checkoutBtn.disabled  = false;
                checkoutBtn.innerText = 'Retry Payment';
            }
        );

    } catch (err) {
        toast.show(err.message || 'Checkout failed', 'error');
        checkoutBtn.disabled  = false;
        checkoutBtn.innerText = 'Proceed to Payment';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (!window.auth || !window.auth.isAuthenticated()) {
        window.location.href = '/pages/login.html';
    } else {
        loadSummary();
    }
});
