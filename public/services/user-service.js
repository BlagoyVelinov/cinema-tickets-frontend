import UserDto from '../models/UserDto';

// User Service that works with Spring Security
const userService = {
    // Базовият URL на фронтенд приложението
    frontendBaseUrl: window.location.origin, // Например: http://localhost:5173
    
    // Current auth state kept in memory
    _authState: {
        isAuthenticated: false,
        currentUser: null,
        isAdmin: false,
        initialized: false
    },
    
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
                console.log('Session data:', data);
                
                // Update auth state
                this._authState.isAuthenticated = data.isAuthenticated;
                return data.isAuthenticated;
            }
            
            // If response not ok, clear auth state
            this._authState.isAuthenticated = false;
            this._authState.currentUser = null;
            this._authState.isAdmin = false;
            
            return false;
        } catch (error) {
            console.error('Error checking authentication status:', error);
            
            // Clear auth state on error
            this._authState.isAuthenticated = false;
            this._authState.currentUser = null;
            this._authState.isAdmin = false;
            
            // Update UI to reflect logged out state
            this.updateUIAuthState();
            
            return false;
        }
    },
    
    // Get current user data
    async getCurrentUser() {
        try {
            // If we already have user data in memory and they're authenticated, use that
            if (this._authState.initialized && this._authState.currentUser && this._authState.isAuthenticated) {
                return this._authState.currentUser;
            }
            
            // Check authentication status first
            const isAuth = await this.isLoggedIn();
            if (!isAuth) {
                this._authState.currentUser = null;
                this._authState.isAdmin = false;
                this._authState.initialized = true;
                return null;
            }
            
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
                this._authState.currentUser = null;
                this._authState.isAdmin = false;
                this._authState.initialized = true;
                this.updateUIAuthState(); // Update UI to reflect state
                return null;
            }
            
            const sessionData = await sessionResponse.json();
            console.log('Full session data:', sessionData); // Добавяме лог
            
            // Проверяваме дали имаме username
            if (!sessionData.username) {
                console.log('No username in session data');
                this._authState.currentUser = null;
                this._authState.isAdmin = false;
                this._authState.initialized = true;
                this.updateUIAuthState(); // Update UI to reflect state
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
                const user = UserDto.fromJSON(data);
                
                // Update auth state with user data
                this._authState.currentUser = user;
                this._authState.isAdmin = user.isAdmin();
                this._authState.initialized = true;
                
                return user;
            }
            
            console.log('User API response not ok:', response.status);
            this._authState.currentUser = null;
            this._authState.isAdmin = false;
            this._authState.initialized = true;
            this.updateUIAuthState(); // Update UI to reflect state
            return null;
        } catch (error) {
            console.error('Error getting current user:', error);
            
            // Clear auth state on error
            this._authState.currentUser = null;
            this._authState.isAdmin = false;
            this._authState.initialized = true;
            
            // Update UI to reflect logged out state
            this.updateUIAuthState();
            
            return null;
        }
    },
    
    // Check if user has admin role
    async isAdmin() {
        try {
            // If we've already initialized the auth state, use that
            if (this._authState.initialized) {
                return this._authState.isAdmin;
            }
            
            const userData = await this.getCurrentUser();
            console.log('User data for admin check:', userData);
            
            const isAdmin = userData?.isAdmin() || false;
            this._authState.isAdmin = isAdmin;
            
            return isAdmin;
        } catch (error) {
            console.error('Error checking admin status:', error);
            this._authState.isAdmin = false;
            this.updateUIAuthState();
            return false;
        }
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
            
            // Clear auth state on logout
            this._authState.isAuthenticated = false;
            this._authState.currentUser = null;
            this._authState.isAdmin = false;
            
            // Update UI to reflect logged out state
            this.updateUIAuthState();
            
            // Независимо от резултата, пренасочваме към началната страница на фронтенда
            window.location.href = this.frontendBaseUrl;
        } catch (error) {
            console.error('Error during logout:', error);
            
            // Clear auth state on error
            this._authState.isAuthenticated = false;
            this._authState.currentUser = null;
            this._authState.isAdmin = false;
            
            // Update UI to reflect logged out state
            this.updateUIAuthState();
            
            // При грешка,也应该 пренасочваме към началната страница на фронтенда
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
    
    // Update UI elements based on current auth state without querying server
    updateUIAuthState() {
        const isLoggedIn = this._authState.isAuthenticated;
        const userData = this._authState.currentUser;
        const isAdmin = this._authState.isAdmin;
        
        console.log('Updating UI with auth state:', { isLoggedIn, userData, isAdmin });
        
        // Get navigation element
        const navElement = document.getElementById('header');
        if (!navElement) return;
        
        // Update navigation elements based on authentication status
        const welcomeSection = navElement.querySelector('.welcome-message');
        const loginItem = navElement.querySelector('a[href="/users/login"]')?.parentElement;
        const registerItem = navElement.querySelector('a[href="/users/register"]')?.parentElement;
        
        // Обработка на логаут формата
        const logoutForm = navElement.querySelector('form[action="/api/users/logout"]');
        
        if (isLoggedIn && userData) {
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
    },
    
    // Set up navigation based on authentication status
    async setupNavigation() {
        try {
            const isLoggedIn = await this.isLoggedIn();
            console.log('Is logged in:', isLoggedIn);
            
            const userData = await this.getCurrentUser();
            console.log('User data for navigation:', userData);
            
            const isAdmin = await this.isAdmin();
            console.log('Is admin:', isAdmin);
            
            // Update UI based on auth state
            this.updateUIAuthState();
        } catch (error) {
            console.error('Error setting up navigation:', error);
            
            // Clear auth state on error
            this._authState.isAuthenticated = false;
            this._authState.currentUser = null;
            this._authState.isAdmin = false;
            
            // Update UI to reflect logged out state
            this.updateUIAuthState();
        }
    },
    
    // Force refresh the authentication state (call this on network errors or auth issues)
    async refreshAuthState() {
        try {
            // Clear current state
            this._authState.initialized = false;
            
            // Re-fetch authentication data
            await this.isLoggedIn();
            await this.getCurrentUser();
            await this.isAdmin();
            
            // Update UI based on new state
            this.updateUIAuthState();
        } catch (error) {
            console.error('Error refreshing auth state:', error);
            
            // Clear auth state on error
            this._authState.isAuthenticated = false;
            this._authState.currentUser = null;
            this._authState.isAdmin = false;
            this._authState.initialized = true;
            
            // Update UI to reflect logged out state
            this.updateUIAuthState();
        }
    }
};

// Setup event handler for network errors that could affect authentication
window.addEventListener('error', (e) => {
    if (e.message && (e.message.includes('network') || e.message.includes('fetch'))) {
        console.warn('Network error detected, refreshing auth state');
        userService.refreshAuthState();
    }
});

export default userService;
