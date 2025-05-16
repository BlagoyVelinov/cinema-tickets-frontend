import { trailerService } from '../services/trailer-service.js';

// Initialize trailer viewer component when document is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing trailer viewer');
  const app = trailerService.initTrailerVue();
  app.mount('#trailer-app');
}); 