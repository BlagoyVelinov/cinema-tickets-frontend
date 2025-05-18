// Service to handle registration functionality
import userService from './user-service.js';
import registerView from '../js/register-view.js';

const registerService = {
    // Базовият URL на фронтенд приложението
    frontendBaseUrl: window.location.origin, // Например: http://localhost:5173
    
    // Initialize registration functionality
    init() {
        // Използваме register-view.js за управление на изгледа
        registerView.init();
    }
};

// Auto-initialize the service
registerService.init();

export default registerService; 