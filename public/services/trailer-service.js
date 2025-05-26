import { createApp, ref, onMounted } from 'vue';
import { createTrailerApp } from '../js/trailer-view.js';

class TrailerService {
  constructor() {
    console.log('TrailerService initialized');
  }
  
  /**
   * Извиква API за получаване на данни за филм по ID
   * @param {string|number} id - ID на филма
   * @returns {Promise<Object>} - Данни за филма
   */
  async getMovieTrailer(id) {
    try {
      const response = await fetch(`/movies/${id}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading movie data:', error);
      throw error;
    }
  }
  
  /**
   * Инициализира Vue приложение за трейлър страницата
   * @returns {import('vue').App} Vue приложение
   */
  initTrailerVue() {
    // Вече не създаваме компонента тук, а използваме функцията от view файла
    return createTrailerApp();
  }
  
  initialize() {
    const params = new URLSearchParams(window.location.search);
    const trailerId = params.get('trailer');
    
    if (trailerId) {
      this.showTrailer(trailerId);
    }
    
    this.setupTrailerLinks();
    
    window.addEventListener('popstate', () => {
      const params = new URLSearchParams(window.location.search);
      const trailerId = params.get('trailer');
      
      if (trailerId) {
        this.showTrailer(trailerId);
      } else {
        // Затваряме трейлъра, ако е отворен
        const trailerModal = document.querySelector('.trailer-modal');
        if (trailerModal && trailerModal.style.display === 'flex') {
          trailerModal.style.display = 'none';
        }
      }
    });
  }
  
  /**
   * Затваря трейлър модалния прозорец
   */
  closeTrailer() {
    const trailerModal = document.querySelector('.trailer-modal');
    const trailerApp = document.getElementById('trailer-app');
    
    // Спираме видеото като намираме iframe и нулираме неговия src
    const iframe = document.querySelector('.movie-trailer iframe');
    if (iframe) {
      // Запазваме оригиналния URL, за да можем да го възстановим при нужда
      const originalSrc = iframe.src;
      iframe.src = '';
      // Опционално: възстановяваме iframe src след кратко забавяне
      // setTimeout(() => { iframe.src = originalSrc; }, 100);
    }
    
    if (trailerModal) {
      // Премахваме класовете, което стартира анимацията за затваряне
      trailerModal.classList.remove('show');
      if (trailerApp) {
        trailerApp.classList.remove('show');
      }
      
      // Първо се връщаме към предишния URL
      window.history.back();
      
      // Изчакваме анимацията да приключи преди да скрием елемента
      setTimeout(() => {
        trailerModal.style.display = 'none';
      }, 300); // 300ms съответства на продължителността на transition в CSS
    }
  }
  
  /**
   * Показва трейлър по ID
   * @param {string|number} movieId - ID на филма
   */
  showTrailer(movieId) {
    // Проверяваме дали вече имаме трейлър изглед
    let trailerContainer = document.getElementById('trailer-app');
    let modalContainer;
    
    if (!trailerContainer) {
      // Създаваме нов контейнер ако не съществува
      trailerContainer = document.createElement('div');
      trailerContainer.id = 'trailer-app';
      
      // Създаваме модално окно
      modalContainer = document.createElement('div');
      modalContainer.className = 'trailer-modal';
      modalContainer.appendChild(trailerContainer);
      
      // Добавяме бутон за затваряне
      const closeButton = document.createElement('button');
      closeButton.className = 'trailer-close-button';
      closeButton.textContent = '×';
      closeButton.title = 'Затвори (Escape)';
      closeButton.onclick = () => this.closeTrailer();
      modalContainer.appendChild(closeButton);
      
      // Добавяме модалния прозорец към body
      document.body.appendChild(modalContainer);
      
      // Добавяме събитие за затваряне при клик извън трейлъра
      modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
          this.closeTrailer();
        }
      });
    } else {
      // Ако контейнерът вече съществува, намираме модалното окно
      modalContainer = trailerContainer.closest('.trailer-modal') || document.querySelector('.trailer-modal');
    }
    
    // Монтираме Vue приложението, използвайки метода initTrailerVue()
    const trailerApp = this.initTrailerVue();
    trailerApp.mount('#trailer-app');
    
    // Показваме модалното окно с анимация
    if (modalContainer) {
      // Първо правим видим модалния прозорец без да е непрозрачен
      modalContainer.style.display = 'flex';
      
      // Малко забавяне, за да позволи начално рендиране преди анимацията
      setTimeout(() => {
        // Добавяме класовете, отговорни за анимацията
        modalContainer.classList.add('show');
        trailerContainer.classList.add('show');
      }, 10);
    }
  }
  
  /**
   * Настройва линковете към трейлъри в документа
   */
  setupTrailerLinks() {
    // Функция за настройване на линкове
    const setupLink = (link) => {
      if (!link.getAttribute('href') || link.hasAttribute('data-processed-trailer')) {
        return;
      }
      
      const href = link.getAttribute('href');
      if (href && href.includes('?trailer=')) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          
          const trailerId = new URLSearchParams(href.substring(href.indexOf('?'))).get('trailer');
          
          if (trailerId) {
            // Променяме URL без да презареждаме страницата
            history.pushState({}, '', href);
            
            // Показваме трейлъра
            this.showTrailer(trailerId);
          }
        });
        
        link.setAttribute('data-processed-trailer', 'true');
      }
    };
    
    // Настройваме съществуващите линкове
    document.querySelectorAll('a[href*="?trailer="]').forEach(setupLink);
    
    // Настройваме MutationObserver за динамично добавени линкове
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {  // Element node
              // Проверяваме добавения елемент
              if (node.tagName === 'A') {
                setupLink(node);
              }
              // Проверяваме децата му
              node.querySelectorAll('a[href*="?trailer="]').forEach(setupLink);
            }
          });
        }
      });
    });
    
    // Стартираме наблюдението
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

// Създаваме singleton инстанция
const trailerService = new TrailerService();

// Инициализираме услугата при зареждане на страницата
document.addEventListener('DOMContentLoaded', () => {
  trailerService.initialize();
});

export { trailerService };
export default trailerService; 