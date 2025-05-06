// Service to handle registration functionality
import userService from './user-service.js';

const registerService = {
    // Базовият URL на фронтенд приложението
    frontendBaseUrl: window.location.origin, // Например: http://localhost:5173
    
    // Initialize registration functionality
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            // Check if we're on the register page
            const registerForm = document.querySelector('form[action="/users/register"]');
            if (!registerForm) return;
            
            // Update navigation
            userService.setupNavigation();
            
            // Update form action to match Spring Security endpoint
            registerForm.action = '/api/users/register';
            
            // Handle form submission
            registerForm.addEventListener('submit', this.handleRegistration.bind(this));
        });
    },
    
    // Handle registration form submission
    async handleRegistration(e) {
        e.preventDefault();
        
        const registerForm = e.target;
        const errorMessage = document.querySelector('.text-danger');
        if (!errorMessage) return;
        
        // Get form data
        const formData = new FormData(registerForm);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        // Basic validation
        if (password !== confirmPassword) {
            errorMessage.textContent = 'Passwords do not match!';
            errorMessage.style.display = 'block';
            return;
        }
        
        // Convert form data to JSON
        const jsonData = {};
        formData.forEach((value, key) => {
            if (key !== 'confirmPassword') { // Exclude confirmPassword
                jsonData[key] = value;
            }
        });
        
        try {
            // Send registration request
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include', // Important for cookies
                body: JSON.stringify(jsonData)
            });
            
            if (response.ok) {
                // Registration successful, redirect to login page
                window.location.href = `${this.frontendBaseUrl}/users/login`;
            } else {
                // Show error message from server
                const data = await response.json();
                if (data.errors && data.errors.length > 0) {
                    errorMessage.textContent = data.errors[0].defaultMessage || 'Registration failed!';
                } else {
                    errorMessage.textContent = data.message || 'Registration failed!';
                }
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Registration error:', error);
            errorMessage.textContent = 'An error occurred during registration!';
            errorMessage.style.display = 'block';
        }
    }
};

// Auto-initialize the service
registerService.init();

export default registerService; 