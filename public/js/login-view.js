import loginService from '../services/login-service.js';
import userService from '../services/user-service.js';

/**
 * Модул за управление на изгледа на логин страницата
 */
const loginView = {
  /**
   * Инициализира изгледа на логин страницата
   */
  init() {
    document.addEventListener('DOMContentLoaded', () => {
      // Check if we're on the login page
      const loginForm = document.querySelector('form[action="/api/users/login"]');
      if (!loginForm) return;
      
      // Check for error parameter in URL
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('error')) {
        const errorMessage = document.querySelector('.text-danger');
        if (errorMessage) {
          errorMessage.style.display = 'block';
        }
      }
      
      // Добавяме обработка на формата
      loginForm.addEventListener('submit', this.handleLoginForm.bind(this));
      
      // Initialize navigation
      userService.setupNavigation();
    });
  },
  
  /**
   * Обработка на формата за вход
   * @param {Event} e - Събитие на формата
   */
  async handleLoginForm(e) {
    // Спираме стандартното действие на формата
    e.preventDefault();
    
    const form = e.target;
    const username = form.querySelector('input[name="username"]').value;
    const password = form.querySelector('input[name="password"]').value;
    const rememberMe = form.querySelector('input[name="rememberMe"]')?.checked || false;
    
    // Ако липсват задължителни полета, не продължаваме
    if (!username || !password) {
      const errorMessage = document.querySelector('.text-danger');
      if (errorMessage) {
        errorMessage.textContent = 'Моля, въведете потребителско име и парола!';
        errorMessage.style.display = 'block';
      }
      return;
    }
    
    try {
      // Изпращаме заявка към Spring Security за логване
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include',
        body: new URLSearchParams({
          'username': username,
          'password': password,
          'remember-me': rememberMe ? 'on' : ''
        })
      });
      
      if (response.ok) {
        // Успешно логване, пренасочваме към началната страница на фронтенда
        window.location.href = loginService.frontendBaseUrl;
      } else {
        // Показваме съобщение за грешка
        const errorMessage = document.querySelector('.text-danger');
        if (errorMessage) {
          errorMessage.textContent = 'Грешно потребителско име или парола!';
          errorMessage.style.display = 'block';
        }
      }
    } catch (error) {
      console.error('Грешка при логване:', error);
      const errorMessage = document.querySelector('.text-danger');
      if (errorMessage) {
        errorMessage.textContent = 'Възникна грешка при логване!';
        errorMessage.style.display = 'block';
      }
    }
  }
};

// Експортираме модула и инициализираме го
export default loginView;
document.addEventListener('DOMContentLoaded', () => {
  loginView.init();
}); 