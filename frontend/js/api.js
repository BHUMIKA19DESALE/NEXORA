const IS_LOCAL_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
const API_URL = (window.location.protocol === 'file:') 
    ? 'http://localhost:5000/api' 
    : '/api';

export const api = {
    async request(endpoint, options = {}) {
        const url = `${API_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const token = localStorage.getItem('nexora_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        if (options.body && typeof options.body === 'object') {
            if (!(options.body instanceof URLSearchParams)) {
                config.body = JSON.stringify(options.body);
            } else {
                delete headers['Content-Type'];
            }
        }

        try {
            const response = await fetch(url, config);
            let data = null;
            let rawText = null;
            if (response.status !== 204) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    rawText = await response.text();
                }
            }
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Handle unauthorized
                    localStorage.removeItem('nexora_token');
                    window.dispatchEvent(new Event('auth-expired'));
                }
                
                let errorMessage = 'API request failed';
                if (data && data.detail) {
                    if (Array.isArray(data.detail)) {
                        errorMessage = data.detail.map(e => e.msg).join(', ');
                    } else if (typeof data.detail === 'string') {
                        errorMessage = data.detail;
                    }
                } else if (rawText) {
                    errorMessage = `Server Error (${response.status}): ` + rawText.substring(0, 100);
                } else if (response.status >= 500) {
                    errorMessage = `Server Error (${response.status})`;
                }
                throw new Error(errorMessage);
            }
            
            return data;
        } catch (error) {
            console.error(`API Error on ${endpoint}:`, error);
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                throw new Error('Unable to connect to the server. Please check your network connection or try again later.');
            }
            throw error;
        }
    },

    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    },

    post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body });
    },

    put(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body });
    },

    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
};

export const productsService = {
    getAll: (params = {}) => {
        const query = new URLSearchParams();
        if (params.category_id) query.append('category_id', params.category_id);
        if (params.brand) query.append('brand', params.brand);
        if (params.search) query.append('search', params.search);
        if (params.deals) query.append('deals', params.deals);
        // Add more params as backend supports
        return api.get(`/products?${query.toString()}`);
    },
    getById: (id) => api.get(`/products/${id}`),
    getBySlug: (slug) => api.get(`/products/slug/${slug}`)
};

export const categoriesService = {
    getAll: () => api.get('/categories'),
    getCounts: () => api.get('/categories/counts/inventory'),
    getById: (id) => api.get(`/categories/${id}`),
    getBySlug: (slug) => api.get(`/categories/slug/${slug}`)
};

export const cartService = {
    getCart: () => api.get('/cart'),
    addItem: (productId, quantity = 1) => api.post('/cart/items', { product_id: productId, quantity }),
    removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
    clearCart: () => api.delete('/cart')
};

export const wishlistService = {
    getWishlist: () => api.get('/wishlist'),
    toggleItem: async (productId) => {
        const items = await api.get('/wishlist');
        const exists = items.find(i => i.product.id === productId);
        if (exists) {
            await api.delete(`/wishlist/${productId}`);
            return false;
        } else {
            await api.post(`/wishlist/${productId}`);
            return true;
        }
    }
};

export const addressesService = {
    getAll: () => api.get('/addresses'),
    create: (data) => api.post('/addresses', data)
};

export const ordersService = {
    getAll: () => api.get('/orders'),
    create: (data) => api.post('/orders', data)
};

export const paymentsService = {
    create: (data) => api.post('/payments/create', data),
    process: (data) => api.post('/payments/process', data),
    refund: (paymentId, amount) => api.post(`/payments/refund?payment_id=${paymentId}&amount=${amount}`)
};
