import { apiFetch } from './api.js';
import { showToast } from './utils.js';

export function renderAuth() {
    const container = document.getElementById('auth-container');

    container.innerHTML = `
        <div class="auth-card glass" id="login-view">
            <h2>Welcome Back</h2>
            <p>Login to Zorvyn NGO</p>
            <form id="login-form">
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" id="login-email" class="form-control" required placeholder="director@zorvyn-ngo.org">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="login-password" class="form-control" required placeholder="••••••••">
                </div>
                <button type="submit" class="btn-primary" id="btn-login">Login</button>
            </form>
            <div class="auth-switch">
                Don't have an account? <a href="#" id="go-register">Sign Up</a>
            </div>
        </div>

        <div class="auth-card glass hidden" id="register-view">
            <h2>Create Account</h2>
            <p>Join Zorvyn NGO</p>
            <form id="register-form">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="reg-name" class="form-control" required placeholder="John Doe">
                </div>
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" id="reg-email" class="form-control" required placeholder="john@example.com">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="reg-password" class="form-control" required placeholder="Min 8 chars, 1 uppercase, 1 number">
                </div>
                <button type="submit" class="btn-primary" id="btn-register">Register</button>
            </form>
            <div class="auth-switch">
                Already have an account? <a href="#" id="go-login">Log In</a>
            </div>
        </div>
    `;

    bindAuthEvents();
}

function bindAuthEvents() {
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');

    // Toggle Views
    document.getElementById('go-register').addEventListener('click', (e) => {
        e.preventDefault();
        loginView.classList.add('hidden');
        registerView.classList.remove('hidden');
    });

    document.getElementById('go-login').addEventListener('click', (e) => {
        e.preventDefault();
        registerView.classList.add('hidden');
        loginView.classList.remove('hidden');
    });

    // Login Submit
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-login');
        btn.innerHTML = '<span class="loader"></span>';
        btn.disabled = true;

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const res = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        btn.innerHTML = 'Login';
        btn.disabled = false;

        if (res.success) {
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            showToast('Login successful!', 'success');
            window.location.hash = '#/dashboard';
        } else {
            showToast(res.error, 'error');
        }
    });

    // Register Submit
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-register');
        btn.innerHTML = '<span class="loader"></span>';
        btn.disabled = true;

        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        const res = await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });

        btn.innerHTML = 'Register';
        btn.disabled = false;

        if (res.success) {
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            showToast('Registration successful!', 'success');
            window.location.hash = '#/dashboard';
        } else {
            // Render Zod form details safely
            if (res.details && res.details.length > 0) {
                showToast(res.details[0].message, 'error');
            } else {
                showToast(res.error || 'Registration failed', 'error');
            }
        }
    });
}
