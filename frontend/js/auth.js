import { api } from './api.js';

export const auth = {
    async login(email, password) {
        // FastAPI OAuth2PasswordRequestForm requires form data
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const data = await api.post('/auth/login', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        localStorage.setItem('nexora_token', data.access_token);
        return await this.fetchCurrentUser();
    },

    async register(userData) {
        return await api.post('/auth/register', userData);
    },

    logout() {
        // Clear all session data
        localStorage.removeItem('nexora_token');
        localStorage.removeItem('nexora_user');
        localStorage.removeItem('nexora_vendor'); // In case vendor info is cached
        
        // Broadcast logout event so UI can update immediately
        window.dispatchEvent(new Event('auth-state-changed'));
        
        // Redirect to login page and prevent back button
        window.location.replace('/pages/login.html?logout=true');
    },

    async fetchCurrentUser() {
        if (!this.isAuthenticated()) return null;
        
        try {
            const user = await api.get('/auth/me');
            localStorage.setItem('nexora_user', JSON.stringify(user));
            return user;
        } catch (error) {
            if (error.message.includes('connect') || error.message.includes('fetch')) {
                throw error; // keep session on network failure
            }
            this.logout();
            throw error;
        }
    },

    getCurrentUser() {
        const userStr = localStorage.getItem('nexora_user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated() {
        return !!localStorage.getItem('nexora_token');
    },

    hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    }
};
