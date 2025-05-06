import App from './App.vue'
import router from './router'

createApp(App)
  .use(router)
  .mount('#app');

  document.addEventListener('DOMContentLoaded', function() {
    const loginLink = document.querySelector('a[href="/users/login"]');
    const homeLink = document.querySelector('a[href="/"]');
  
    // Примерна обработка на линковете за навигация (ако е необходимо да направиш нещо с JavaScript)
    loginLink.addEventListener('click', (event) => {
      event.preventDefault();
      window.location.href = '/users/login';
    });
  
    homeLink.addEventListener('click', (event) => {
      event.preventDefault();
      window.location.href = '/';
    });
  });