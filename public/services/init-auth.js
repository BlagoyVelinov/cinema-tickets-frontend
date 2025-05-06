// Initialization script for auth services
import userService from './user-service.js';

// Initialize user service on all pages
document.addEventListener('DOMContentLoaded', () => {
    userService.setupNavigation();
});

export default userService; 