// Centralized API handler and interceptor
const BASE_URL = '/api';

export async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        // Parse JSON response safely
        let data;
        try {
            data = await response.json();
        } catch {
            data = { success: false, error: 'Invalid server response' };
        }

        // Handle 401 Unauthorized globally
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.hash = '#/login';
            return { success: false, error: 'Session expired. Please log in again.' };
        }

        // Catch explicitly failed statuses (like Zod 400 Bad Request)
        if (!response.ok) {
            return {
                success: false,
                error: data.error || 'API Request Failed',
                details: data.details
            };
        }

        return data;

    } catch (error) {
        console.error('API Fetch Error:', error);
        return { success: false, error: 'Network error. Make sure you are connected.' };
    }
}
