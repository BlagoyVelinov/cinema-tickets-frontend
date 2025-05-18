// Service to handle login functionality
import userService from './user-service.js';
import loginView from '../js/login-view.js';

const loginService = {
    // Базовият URL на фронтенд приложението
    frontendBaseUrl: window.location.origin, // Например: http://localhost:5173
    
    // Initialize login functionality
    init() {
        // Използваме login-view.js за управление на изгледа
        loginView.init();
    }
};

// Auto-initialize the service
loginService.init();

export default loginService; 