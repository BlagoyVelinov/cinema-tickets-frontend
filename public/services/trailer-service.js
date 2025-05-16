import { createApp, ref, onMounted } from 'vue';

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
      const response = await fetch(`/movies/trailer/${id}`);
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
    const trailerServiceInstance = this;
    
    const TrailerApp = {
      template: `
        <div class="trailer-container" :style="{ backgroundColor: overlayColor }">
          <div v-if="isLoading" class="loading">
            <p>Зареждане...</p>
          </div>
          
          <div v-else-if="hasError" class="error">
            <h3>Грешка при зареждане</h3>
            <p>{{ errorMessage }}</p>
          </div>
          
          <div v-else-if="movie" class="movie-trailer">
          <header class="trailer-header">
            <h3>{{ movie.name }}</h3>
            </header>
            <button @click="closeTrailer" class="trailer-action-button">X</button>
            <li>
              <iframe
                width="780"
                height="425"
                :src="movie.trailerUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ'"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen>
              </iframe>
            </li>
            <p>{{ movie.description || 'Няма описание' }}</p>
            
          </div>
          
          <div v-else class="no-movie">
            <h3>The movie is not found</h3>
            <p>Please try with another movie or return to the <a href="/">Home page</a>.</p>
          </div>
        </div>
      `,
      setup() {
        const movie = ref(null);
        const isLoading = ref(true);
        const hasError = ref(false);
        const errorMessage = ref('');
        const overlayColor = ref('#000000');
        
        // Функция за затваряне на трейлъра
        const closeTrailer = () => {
          const trailerModal = document.querySelector('.trailer-modal');
          if (trailerModal) {
            // Използваме анимирано затваряне
            trailerServiceInstance.closeTrailer();
          }
        };
        
        // При зареждане на страницата
        onMounted(async () => {
          try {
            // Извличаме ID от URL параметъра
            const params = new URLSearchParams(window.location.search);
            const movieId = params.get('trailer');
            console.log('Зареждане на данни за филм с ID:', movieId);
            
            if (!movieId) {
              hasError.value = true;
              errorMessage.value = 'Не е намерен ID на филм в URL';
              isLoading.value = false;
              return;
            }
            
            // Извикване на услугата за данни
            const movieData = await trailerServiceInstance.getMovieTrailer(movieId);
            movie.value = movieData;
            console.log('Данни за филм:', movie.value);
            
            // Задаваме цвят за фона с withAlpha вместо withOpacity
            const alpha = Math.round(0.8 * 255);
            overlayColor.value = `rgba(0,0,0,${alpha})`;
            
            // Добавяне на обработчик за клавиша Escape
            const handleEscape = (e) => {
              if (e.key === 'Escape') {
                trailerServiceInstance.closeTrailer();
              }
            };
            
            document.addEventListener('keydown', handleEscape);
            
            // Премахваме събитието при размонтиране
            return () => {
              document.removeEventListener('keydown', handleEscape);
            };
          } catch (error) {
            console.error('Грешка при зареждане на филма:', error);
            hasError.value = true;
            errorMessage.value = error.message || 'Възникна грешка при зареждане на информацията за филма';
          } finally {
            isLoading.value = false;
          }
        });
        
        return {
          movie,
          isLoading,
          hasError,
          errorMessage,
          overlayColor,
          closeTrailer
        };
      }
    };
    
    const app = createApp(TrailerApp);
    return app;
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
    
    if (trailerModal) {
      // Премахваме класовете, което стартира анимацията за затваряне
      trailerModal.classList.remove('show');
      if (trailerApp) {
        trailerApp.classList.remove('show');
      }
      
      // Изчакваме анимацията да приключи преди да скрием елемента
      setTimeout(() => {
        trailerModal.style.display = 'none';
        // Връщаме се назад в историята на браузъра
        window.history.back();
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
    
    // Монтираме Vue приложението
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