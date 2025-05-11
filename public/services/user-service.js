import UserDto from '../models/UserDto';

// User Service that works with Spring Security
const userService = {
    // Базовият URL на фронтенд приложението
    frontendBaseUrl: window.location.origin, // Например: http://localhost:5173
    
    // Check if user is logged in by querying the session endpoint
    async isLoggedIn() {
        try {
            const response = await fetch('/api/users/session', {
                method: 'GET',
                credentials: 'include', // Include cookies for session
                headers: {
                    'X-Requested-With': 'XMLHttpRequest' // For CORS
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Session data:', data); // Добавяме лог
                return data.isAuthenticated;
            }
            return false;
        } catch (error) {
            console.error('Error checking authentication status:', error);
            return false;
        }
    },
    
    // Get current user data
    async getCurrentUser() {
        try {
            // Първо взимаме сесията за да получим username на потребителя
            const sessionResponse = await fetch('/api/users/session', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!sessionResponse.ok) {
                console.log('Session response not ok:', sessionResponse.status);
                return null;
            }
            
            const sessionData = await sessionResponse.json();
            console.log('Full session data:', sessionData); // Добавяме лог
            
            // Проверяваме дали имаме username
            if (!sessionData.username) {
                console.log('No username in session data');
                return null;
            }
            
            console.log('Using username:', sessionData.username); // Добавяме лог
            
            // След това взимаме пълните данни за потребителя по username
            const response = await fetch(`/api/user/${sessionData.username}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('User data from API:', data); // Добавяме лог
                return UserDto.fromJSON(data);
            }
            console.log('User API response not ok:', response.status);
            return null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    },
    
    // Check if user has admin role
    async isAdmin() {
        const userData = await this.getCurrentUser();
        console.log('User data for admin check:', userData); // Добавяме лог
        return userData?.isAdmin() || false;
    },
    
    // Log out the user through Spring Security
    async logout() {
        try {
            const response = await fetch('/api/users/logout', {
                method: 'POST',
                credentials: 'include', // Include cookies for session
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            // Независимо от резултата, пренасочваме към началната страница на фронтенда
            window.location.href = this.frontendBaseUrl;
        } catch (error) {
            console.error('Error during logout:', error);
            // При грешка, също пренасочваме към началната страница на фронтенда
            window.location.href = this.frontendBaseUrl;
        }
    },
    
    // Обработка на логаут формата
    handleLogoutForm(e) {
        e.preventDefault(); // Спираме стандартното действие
        this.logout(); // Използваме нашата логаут функция
    },
    
    // Initialize user-related functionality on page load
    init() {
        document.addEventListener('DOMContentLoaded', this.setupNavigation.bind(this));
    },
    
    // Set up navigation based on authentication status
    async setupNavigation() {
        const isLoggedIn = await this.isLoggedIn();
        console.log('Is logged in:', isLoggedIn); // Добавяме лог
        
        const userData = await this.getCurrentUser();
        console.log('User data for navigation:', userData); // Добавяме лог
        
        const isAdmin = userData?.isAdmin() || false;
        console.log('Is admin:', isAdmin); // Добавяме лог
        
        // Get navigation element
        const navElement = document.getElementById('header');
        if (!navElement) return;
        
        // Update navigation elements based on authentication status
        const welcomeSection = navElement.querySelector('.welcome-message');
        const loginItem = navElement.querySelector('a[href="/users/login"]')?.parentElement;
        const registerItem = navElement.querySelector('a[href="/users/register"]')?.parentElement;
        
        // Обработка на логаут формата
        const logoutForm = navElement.querySelector('form[action="/api/users/logout"]');
        
        if (isLoggedIn && userData) { // Добавяме проверка за userData
            // Show logged-in elements, hide guest elements
            if (loginItem) loginItem.style.display = 'none';
            if (registerItem) registerItem.style.display = 'none';
            
            // Добавяме обработка на формата за логаут
            if (logoutForm) {
                logoutForm.addEventListener('submit', this.handleLogoutForm.bind(this));
            }
            
            // Update welcome message if it exists
            if (welcomeSection) {
                welcomeSection.style.display = '';
                const welcomeSpan = welcomeSection.querySelector('.logged-user span');
                if (welcomeSpan) {
                    welcomeSpan.textContent = userData.getUsername();
                }
            }

            // Show/hide admin buttons
            const adminElements = document.querySelectorAll('.admin-only');
            adminElements.forEach(element => {
                if (isAdmin) {
                    element.classList.add('visible');
                } else {
                    element.classList.remove('visible');
                }
            });
        } else {
            // Show guest elements, hide logged-in elements
            if (loginItem) loginItem.style.display = '';
            if (registerItem) registerItem.style.display = '';
            
            // Hide logged-in user elements
            if (welcomeSection) welcomeSection.style.display = 'none';

            // Hide admin buttons
            const adminElements = document.querySelectorAll('.admin-only');
            adminElements.forEach(element => {
                element.classList.remove('visible');
            });
        }
    }
};

export default userService;
