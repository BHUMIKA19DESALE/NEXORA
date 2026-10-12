import { paymentsService } from './api.js';
import { toast } from './toast.js';

// ── QR Pattern helper (decorative, purely visual) ──────────────────────────
function buildQRGrid() {
    // 9x9 visual pattern — purely decorative, not a real QR code
    const pattern = [
        1,1,1,1,1,1,1,0,0,
        1,0,0,0,0,0,1,0,1,
        1,0,1,1,1,0,1,0,0,
        1,0,1,1,1,0,1,0,1,
        1,0,1,1,1,0,1,0,0,
        1,0,0,0,0,0,1,0,1,
        1,1,1,1,1,1,1,0,1,
        0,0,1,0,1,0,0,0,1,
        1,1,0,1,0,1,1,1,0,
    ];
    return pattern.map(v => `<div class="pg-qr-cell${v ? '' : ' empty'}"></div>`).join('');
}

class PaymentGateway {
    constructor() {
        this.overlay      = null;
        this.processing   = null;
        this.failureScreen= null;
        this.currentPaymentId = null;
        this.currentOrderId   = null;
        this.currentMethod    = 'CARD';
        this.onSuccess    = null;
        this.onCancel     = null;
        this.cartItems    = [];
        this.subtotal     = 0;
        this.shipping     = 0;
        this.grandTotal   = 0;
        this._initialized = false;
    }

    // ── Build the DOM once ─────────────────────────────────────────────────
    _build() {
        if (this._initialized) return;
        this._initialized = true;

        const html = `
<div class="pg-overlay" id="pg-overlay">
  <div class="pg-window" id="pg-window">

    <!-- Processing overlay -->
    <div class="pg-processing" id="pg-processing">
      <div class="pg-spinner"></div>
      <div class="pg-processing-title">Processing Payment</div>
      <div class="pg-processing-sub">Please do not refresh or close this window</div>
      <div class="pg-processing-steps">
        <div class="pg-step done" id="pg-step-1"><i class='bx bx-check'></i> Order Verified</div>
        <div class="pg-step active-step" id="pg-step-2"><i class='bx bx-loader-alt' style="animation:pgSpin 0.8s linear infinite;"></i> Connecting to Bank</div>
        <div class="pg-step" id="pg-step-3"><i class='bx bx-time'></i> Awaiting Confirmation</div>
      </div>
    </div>

    <!-- Failure screen -->
    <div class="pg-failure" id="pg-failure">
      <div class="pg-failure-icon"><i class='bx bx-x'></i></div>
      <div class="pg-failure-title">Payment Failed</div>
      <div class="pg-failure-msg" id="pg-failure-msg">Your payment could not be processed. No money was deducted. You can retry or go back.</div>
      <div class="pg-failure-ref" id="pg-failure-ref"></div>
      <div class="pg-failure-btns">
        <button class="pg-retry-btn" id="pg-retry-btn"><i class='bx bx-refresh'></i> Retry Payment</button>
        <button class="pg-back-btn" id="pg-back-btn"><i class='bx bx-arrow-back'></i> Back to Checkout</button>
      </div>
    </div>

    <!-- Header bar -->
    <div class="pg-header">
      <div class="pg-header-brand">
        <span class="pg-lock-icon"><i class='bx bx-lock-alt'></i></span>
        NEXORA Pay
        <span class="pg-demo-badge">Demo</span>
      </div>
      <div class="pg-demo-notice"><i class='bx bx-info-circle'></i> No real money charged</div>
      <button class="pg-close-btn" id="pg-close-btn" title="Cancel payment">&times;</button>
    </div>

    <!-- Body -->
    <div class="pg-body">

      <!-- LEFT: Methods -->
      <div class="pg-left">

        <!-- Sidebar tabs -->
        <div class="pg-tabs" id="pg-tabs">
          <div class="pg-tab active" data-pane="pg-pane-upi" data-method="UPI">
            <i class='bx bx-qr-scan'></i>UPI
          </div>
          <div class="pg-tab" data-pane="pg-pane-card" data-method="CARD">
            <i class='bx bx-credit-card'></i>Card
          </div>
          <div class="pg-tab" data-pane="pg-pane-netbanking" data-method="NET_BANKING">
            <i class='bx bx-building-house'></i>Net&nbsp;Banking
          </div>
          <div class="pg-tab" data-pane="pg-pane-wallet" data-method="WALLET">
            <i class='bx bx-wallet'></i>Wallet
          </div>
        </div>

        <!-- Pane area -->
        <div class="pg-pane-area">

          <!-- UPI Pane -->
          <div class="pg-pane active" id="pg-pane-upi">
            <div class="pg-pane-title">Pay via UPI</div>

            <div class="pg-upi-apps">
              <div class="pg-upi-app selected" data-upi-app="gpay">
                <i class='bx bx-mobile'></i>GPay
              </div>
              <div class="pg-upi-app" data-upi-app="phonepe">
                <i class='bx bx-mobile-alt'></i>PhonePe
              </div>
              <div class="pg-upi-app" data-upi-app="paytm">
                <i class='bx bx-wallet-alt'></i>Paytm
              </div>
            </div>

            <div class="pg-upi-qr">
              <div class="pg-qr-box">
                <div class="pg-qr-inner">${buildQRGrid()}</div>
              </div>
              <div class="pg-upi-qr-label">Scan this QR with any UPI app<br><span style="color:var(--color-text-muted);font-size:0.65rem;">(Demo — no real payment)</span></div>
            </div>

            <div class="pg-divider">or enter UPI ID</div>

            <div class="pg-field">
              <label>UPI ID</label>
              <input type="text" class="pg-input" id="pg-upi-id" placeholder="yourname@upi" autocomplete="off">
            </div>

            <button class="pg-pay-btn" id="pg-upi-pay-btn">
              <i class='bx bx-lock-alt'></i>
              Pay <span class="pg-pay-amount-label">₹0.00</span>
            </button>

            <div class="pg-demo-controls">
              <div class="pg-demo-controls-title"><i class='bx bx-code-alt'></i> Test Controls — Not real banking</div>
              <div class="pg-demo-btns">
                <button class="pg-demo-btn pg-demo-btn-success" data-action="SUCCESS" data-method="UPI"><i class='bx bx-check'></i> Success</button>
                <button class="pg-demo-btn pg-demo-btn-fail" data-action="FAILED" data-method="UPI"><i class='bx bx-x'></i> Fail</button>
                <button class="pg-demo-btn pg-demo-btn-cancel" data-action="CANCELLED" data-method="UPI"><i class='bx bx-minus'></i> Cancel</button>
              </div>
            </div>
          </div>

          <!-- Card Pane -->
          <div class="pg-pane" id="pg-pane-card">
            <div class="pg-pane-title">Credit / Debit Card</div>

            <div class="pg-card-preview">
              <div class="pg-card-chip"></div>
              <div class="pg-card-number-display" id="pg-card-display">•••• •••• •••• ••••</div>
              <div class="pg-card-bottom">
                <div>
                  <div style="font-size:0.6rem;margin-bottom:2px;">CARD HOLDER</div>
                  <div id="pg-card-name-display">YOUR NAME</div>
                </div>
                <div>
                  <div style="font-size:0.6rem;margin-bottom:2px;">EXPIRES</div>
                  <div id="pg-card-expiry-display">MM/YY</div>
                </div>
                <div class="pg-card-network" id="pg-card-network">DEMO</div>
              </div>
            </div>

            <div class="pg-field">
              <label>Card Number</label>
              <input type="text" class="pg-input" id="pg-card-number" placeholder="4111 1111 1111 1111" maxlength="19" autocomplete="off">
            </div>
            <div class="pg-input-row">
              <div class="pg-field">
                <label>Expiry (MM/YY)</label>
                <input type="text" class="pg-input" id="pg-card-expiry" placeholder="12/28" maxlength="5" autocomplete="off">
              </div>
              <div class="pg-field">
                <label>CVV</label>
                <input type="password" class="pg-input" id="pg-card-cvv" placeholder="•••" maxlength="4" autocomplete="off">
              </div>
            </div>
            <div class="pg-field">
              <label>Cardholder Name</label>
              <input type="text" class="pg-input" id="pg-card-name" placeholder="JOHN DOE" autocomplete="off">
            </div>

            <button class="pg-pay-btn" id="pg-card-pay-btn">
              <i class='bx bx-lock-alt'></i>
              Pay Securely <span class="pg-pay-amount-label">₹0.00</span>
            </button>

            <div class="pg-demo-controls">
              <div class="pg-demo-controls-title"><i class='bx bx-code-alt'></i> Test Controls — Not real banking</div>
              <div class="pg-demo-btns">
                <button class="pg-demo-btn pg-demo-btn-success" data-action="SUCCESS" data-method="CARD"><i class='bx bx-check'></i> Success</button>
                <button class="pg-demo-btn pg-demo-btn-fail" data-action="FAILED" data-method="CARD"><i class='bx bx-x'></i> Fail</button>
                <button class="pg-demo-btn pg-demo-btn-cancel" data-action="CANCELLED" data-method="CARD"><i class='bx bx-minus'></i> Cancel</button>
              </div>
            </div>
          </div>

          <!-- Net Banking Pane -->
          <div class="pg-pane" id="pg-pane-netbanking">
            <div class="pg-pane-title">Net Banking</div>

            <div class="pg-bank-grid">
              <div class="pg-bank-card selected" data-bank="SBI">
                <i class='bx bx-building'></i>SBI
              </div>
              <div class="pg-bank-card" data-bank="HDFC">
                <i class='bx bx-building'></i>HDFC
              </div>
              <div class="pg-bank-card" data-bank="ICICI">
                <i class='bx bx-building'></i>ICICI
              </div>
              <div class="pg-bank-card" data-bank="AXIS">
                <i class='bx bx-building'></i>Axis
              </div>
              <div class="pg-bank-card" data-bank="KOTAK">
                <i class='bx bx-building'></i>Kotak
              </div>
              <div class="pg-bank-card" data-bank="YES">
                <i class='bx bx-building'></i>Yes Bank
              </div>
            </div>

            <div class="pg-field">
              <label>Or select from all banks</label>
              <select class="pg-bank-select" id="pg-bank-select">
                <option value="">-- Select Bank --</option>
                <option value="SBI">State Bank of India</option>
                <option value="HDFC">HDFC Bank</option>
                <option value="ICICI">ICICI Bank</option>
                <option value="AXIS">Axis Bank</option>
                <option value="KOTAK">Kotak Mahindra Bank</option>
                <option value="YES">Yes Bank</option>
                <option value="PNB">Punjab National Bank</option>
                <option value="BOB">Bank of Baroda</option>
                <option value="CANARA">Canara Bank</option>
                <option value="INDUSIND">IndusInd Bank</option>
                <option value="FEDERAL">Federal Bank</option>
                <option value="IDFC">IDFC First Bank</option>
              </select>
            </div>

            <button class="pg-pay-btn" id="pg-nb-pay-btn">
              <i class='bx bx-lock-alt'></i>
              Proceed to Bank <span class="pg-pay-amount-label">₹0.00</span>
            </button>

            <div class="pg-demo-controls">
              <div class="pg-demo-controls-title"><i class='bx bx-code-alt'></i> Test Controls — Not real banking</div>
              <div class="pg-demo-btns">
                <button class="pg-demo-btn pg-demo-btn-success" data-action="SUCCESS" data-method="NET_BANKING"><i class='bx bx-check'></i> Success</button>
                <button class="pg-demo-btn pg-demo-btn-fail" data-action="FAILED" data-method="NET_BANKING"><i class='bx bx-x'></i> Fail</button>
                <button class="pg-demo-btn pg-demo-btn-cancel" data-action="CANCELLED" data-method="NET_BANKING"><i class='bx bx-minus'></i> Cancel</button>
              </div>
            </div>
          </div>

          <!-- Wallet Pane -->
          <div class="pg-pane" id="pg-pane-wallet">
            <div class="pg-pane-title">Wallets</div>

            <div class="pg-wallet-grid">
              <div class="pg-wallet-card selected" data-wallet="PAYTM">
                <div class="pg-wallet-icon" style="background:#00B9F1;"><i class='bx bx-wallet'></i></div>
                Paytm
              </div>
              <div class="pg-wallet-card" data-wallet="PHONEPE">
                <div class="pg-wallet-icon" style="background:#5f259f;"><i class='bx bx-wallet-alt'></i></div>
                PhonePe
              </div>
              <div class="pg-wallet-card" data-wallet="AMAZON">
                <div class="pg-wallet-icon" style="background:#FF9900;"><i class='bx bx-cart'></i></div>
                Amazon Pay
              </div>
              <div class="pg-wallet-card" data-wallet="FREECHARGE">
                <div class="pg-wallet-icon" style="background:#e31e24;"><i class='bx bx-money'></i></div>
                FreeCharge
              </div>
              <div class="pg-wallet-card" data-wallet="MOBIKWIK">
                <div class="pg-wallet-icon" style="background:#2b2d6e;"><i class='bx bx-credit-card-alt'></i></div>
                MobiKwik
              </div>
              <div class="pg-wallet-card" data-wallet="AIRTEL">
                <div class="pg-wallet-icon" style="background:#e40000;"><i class='bx bx-signal-5'></i></div>
                Airtel Money
              </div>
            </div>

            <button class="pg-pay-btn" id="pg-wallet-pay-btn">
              <i class='bx bx-lock-alt'></i>
              Pay from Wallet <span class="pg-pay-amount-label">₹0.00</span>
            </button>

            <div class="pg-demo-controls">
              <div class="pg-demo-controls-title"><i class='bx bx-code-alt'></i> Test Controls — Not real banking</div>
              <div class="pg-demo-btns">
                <button class="pg-demo-btn pg-demo-btn-success" data-action="SUCCESS" data-method="WALLET"><i class='bx bx-check'></i> Success</button>
                <button class="pg-demo-btn pg-demo-btn-fail" data-action="FAILED" data-method="WALLET"><i class='bx bx-x'></i> Fail</button>
                <button class="pg-demo-btn pg-demo-btn-cancel" data-action="CANCELLED" data-method="WALLET"><i class='bx bx-minus'></i> Cancel</button>
              </div>
            </div>
          </div>

        </div><!-- end pane-area -->
      </div><!-- end pg-left -->

      <!-- RIGHT: Order Summary -->
      <div class="pg-right">
        <div class="pg-summary-header">
          <div class="pg-summary-title">Order Summary</div>
          <div class="pg-summary-merchant">NEXORA</div>
          <div class="pg-summary-amount-big" id="pg-summary-total-big">₹0.00</div>
        </div>
        <div class="pg-summary-items" id="pg-summary-items">
          <!-- populated dynamically -->
        </div>
        <div class="pg-summary-totals">
          <div class="pg-summary-row">
            <span>Subtotal</span>
            <span id="pg-sum-subtotal">₹0.00</span>
          </div>
          <div class="pg-summary-row">
            <span>Shipping</span>
            <span id="pg-sum-shipping">₹0.00</span>
          </div>
          <div class="pg-summary-row total">
            <span>Total</span>
            <span id="pg-sum-total">₹0.00</span>
          </div>
        </div>
        <div class="pg-secure-note">
          <i class='bx bx-shield-quarter'></i>
          256-bit SSL encrypted · Demo mode
        </div>
      </div>

    </div><!-- end pg-body -->
  </div><!-- end pg-window -->
</div><!-- end pg-overlay -->
        `;

        document.body.insertAdjacentHTML('beforeend', html);
        this.overlay       = document.getElementById('pg-overlay');
        this.processing    = document.getElementById('pg-processing');
        this.failureScreen = document.getElementById('pg-failure');

        this._bindStaticEvents();
    }

    // ── Wire static UI events once ─────────────────────────────────────────
    _bindStaticEvents() {
        // Close / Cancel
        document.getElementById('pg-close-btn').addEventListener('click', () => this._cancelPayment());

        // Tabs
        document.getElementById('pg-tabs').addEventListener('click', e => {
            const tab = e.target.closest('.pg-tab');
            if (!tab) return;
            document.querySelectorAll('.pg-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.pg-pane').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.pane).classList.add('active');
            this.currentMethod = tab.dataset.method;
        });

        // UPI app selection
        document.querySelectorAll('.pg-upi-app').forEach(app => {
            app.addEventListener('click', () => {
                document.querySelectorAll('.pg-upi-app').forEach(a => a.classList.remove('selected'));
                app.classList.add('selected');
            });
        });

        // Bank card grid selection
        document.querySelectorAll('.pg-bank-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.pg-bank-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                document.getElementById('pg-bank-select').value = card.dataset.bank;
            });
        });
        document.getElementById('pg-bank-select').addEventListener('change', e => {
            document.querySelectorAll('.pg-bank-card').forEach(c => {
                c.classList.toggle('selected', c.dataset.bank === e.target.value);
            });
        });

        // Wallet grid selection
        document.querySelectorAll('.pg-wallet-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.pg-wallet-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            });
        });

        // Card number live preview
        const numInput = document.getElementById('pg-card-number');
        numInput.addEventListener('input', () => {
            let v = numInput.value.replace(/\D/g, '').substring(0, 16);
            numInput.value = v.replace(/(.{4})/g, '$1 ').trim();
            const display = v.padEnd(16, '•');
            document.getElementById('pg-card-display').textContent =
                display.replace(/(.{4})/g, '$1 ').trim();
            // Detect card network
            const net = v[0] === '4' ? 'VISA' : v[0] === '5' ? 'MC' : v.substring(0,2) === '37' ? 'AMEX' : 'DEMO';
            document.getElementById('pg-card-network').textContent = net;
        });
        // Card expiry preview
        document.getElementById('pg-card-expiry').addEventListener('input', e => {
            let v = e.target.value.replace(/\D/g,'').substring(0,4);
            if (v.length > 2) v = v.substring(0,2) + '/' + v.substring(2);
            e.target.value = v;
            document.getElementById('pg-card-expiry-display').textContent = v || 'MM/YY';
        });
        // Card name preview
        document.getElementById('pg-card-name').addEventListener('input', e => {
            document.getElementById('pg-card-name-display').textContent =
                e.target.value.toUpperCase() || 'YOUR NAME';
        });

        // Pay buttons (trigger active-pane's method)
        document.getElementById('pg-upi-pay-btn').addEventListener('click',
            () => this._handleOutcome('SUCCESS', 'UPI'));
        document.getElementById('pg-card-pay-btn').addEventListener('click',
            () => this._handleOutcome('SUCCESS', 'CARD'));
        document.getElementById('pg-nb-pay-btn').addEventListener('click',
            () => this._handleOutcome('SUCCESS', 'NET_BANKING'));
        document.getElementById('pg-wallet-pay-btn').addEventListener('click',
            () => this._handleOutcome('SUCCESS', 'WALLET'));

        // Demo control buttons (all panes share via delegation)
        document.getElementById('pg-window').addEventListener('click', e => {
            const btn = e.target.closest('.pg-demo-btn');
            if (!btn) return;
            this._handleOutcome(btn.dataset.action, btn.dataset.method);
        });

        // Failure screen
        document.getElementById('pg-retry-btn').addEventListener('click', () => {
            this.failureScreen.classList.remove('active');
        });
        document.getElementById('pg-back-btn').addEventListener('click', () => {
            this._cancelPayment();
        });
    }

    // ── Populate order summary panel ───────────────────────────────────────
    _populateSummary() {
        const itemsEl    = document.getElementById('pg-summary-items');
        const subtotalEl = document.getElementById('pg-sum-subtotal');
        const shippingEl = document.getElementById('pg-sum-shipping');
        const totalEl    = document.getElementById('pg-sum-total');
        const bigEl      = document.getElementById('pg-summary-total-big');

        // Items list
        if (this.cartItems.length > 0) {
            itemsEl.innerHTML = this.cartItems.map(item => {
                const price = (item.product.price - (item.product.discount || 0));
                const lineTotal = price * item.quantity;
                return `
                    <div class="pg-summary-item">
                        <div>
                            <div class="pg-item-name">${item.product.name}</div>
                            <div class="pg-item-qty">Qty: ${item.quantity}</div>
                        </div>
                        <div class="pg-item-price">₹${lineTotal.toFixed(2)}</div>
                    </div>`;
            }).join('');
        } else {
            itemsEl.innerHTML = '<div class="pg-summary-item"><div class="pg-item-name" style="color:var(--color-text-muted);">Items loading...</div></div>';
        }

        subtotalEl.textContent = `₹${this.subtotal.toFixed(2)}`;
        shippingEl.textContent = this.shipping > 0 ? `₹${this.shipping.toFixed(2)}` : 'Free';
        totalEl.textContent    = `₹${this.grandTotal.toFixed(2)}`;
        bigEl.textContent      = `₹${this.grandTotal.toFixed(2)}`;

        // Stamp amount on every pay button
        document.querySelectorAll('.pg-pay-amount-label').forEach(el => {
            el.textContent = `₹${this.grandTotal.toFixed(2)}`;
        });
    }

    // ── Public entry point ─────────────────────────────────────────────────
    async startPayment(orderId, amount, cartItems, subtotal, shipping, onSuccess, onCancel) {
        this._build();

        this.currentOrderId = orderId;
        this.currentPaymentId = null;
        this.onSuccess  = onSuccess;
        this.onCancel   = onCancel;
        this.cartItems  = cartItems  || [];
        this.subtotal   = subtotal   || amount;
        this.shipping   = shipping   || 0;
        this.grandTotal = amount;

        // Reset UI state
        this.processing.classList.remove('active');
        this.failureScreen.classList.remove('active');
        this._clearInputs();

        this._populateSummary();
        this.overlay.classList.add('active');

        // Create backend payment record
        try {
            const payment = await paymentsService.create({
                order_id: orderId,
                method: 'CARD',
                amount: amount
            });
            this.currentPaymentId = payment.id;
        } catch (err) {
            toast.show('Failed to initialize payment. Please try again.', 'error');
            this.overlay.classList.remove('active');
            if (this.onCancel) this.onCancel();
        }
    }

    // ── Handle outcome (SUCCESS / FAILED / CANCELLED) ─────────────────────
    async _handleOutcome(status, method) {
        if (!this.currentPaymentId) {
            toast.show('Payment not initialized yet. Please wait.', 'warning');
            return;
        }

        this._clearInputs();
        this._showProcessing();

        try {
            const result = await paymentsService.process({
                payment_id: this.currentPaymentId,
                status: status,
                method: method
            });

            this.processing.classList.remove('active');

            if (status === 'SUCCESS') {
                // Small success flash before redirect
                setTimeout(() => {
                    this.overlay.classList.remove('active');
                    if (this.onSuccess) this.onSuccess(result);
                }, 600);
            } else if (status === 'CANCELLED') {
                this.overlay.classList.remove('active');
                toast.show('Payment cancelled. Your cart is intact.', 'info');
                if (this.onCancel) this.onCancel();
            } else {
                // FAILED — show failure screen
                this._showFailure(result);
            }
        } catch (err) {
            this.processing.classList.remove('active');
            toast.show('Payment processing error. Please retry.', 'error');
            this._showFailure(null);
        }
    }

    _showProcessing() {
        this.failureScreen.classList.remove('active');
        this.processing.classList.add('active');
    }

    _showFailure(result) {
        this.processing.classList.remove('active');
        const refEl = document.getElementById('pg-failure-ref');
        refEl.textContent = result ? `Ref: ${result.reference || 'N/A'}` : '';
        this.failureScreen.classList.add('active');
        // Reset payment ID so a new payment record can be created on retry
        this.currentPaymentId = null;
    }

    _cancelPayment() {
        if (this.overlay) this.overlay.classList.remove('active');
        toast.show('Payment cancelled. Your cart is intact.', 'info');
        if (this.onCancel) this.onCancel();
    }

    _clearInputs() {
        // Clear sensitive card/UPI fields — never persisted
        const ids = ['pg-card-number', 'pg-card-expiry', 'pg-card-cvv', 'pg-card-name', 'pg-upi-id'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        // Reset card preview
        const cd = document.getElementById('pg-card-display');
        const cn = document.getElementById('pg-card-name-display');
        const ce = document.getElementById('pg-card-expiry-display');
        if (cd) cd.textContent = '•••• •••• •••• ••••';
        if (cn) cn.textContent = 'YOUR NAME';
        if (ce) ce.textContent = 'MM/YY';
    }
}

export const paymentSimulator = new PaymentGateway();
