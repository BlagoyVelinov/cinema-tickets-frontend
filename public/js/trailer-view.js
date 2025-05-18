import { trailerService } from '../services/trailer-service.js';
import { createApp, ref, onMounted } from 'vue';
import userService from '../services/user-service.js';

// Дефинираме Vue компонента в изгледния файл
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
        trailerService.closeTrailer();
      }
    };
    
    // Функция за обработка на грешки при API заявки
    const handleApiError = (error) => {
      console.error('Грешка при зареждане на филма:', error);
      hasError.value = true;
      errorMessage.value = error.message || 'Възникна грешка при зареждане на информацията за филма';
      
      // Проверка за грешки свързани с автентикацията
      if (error.message && (error.message.includes('401') || error.message.includes('auth'))) {
        console.log('Открита е грешка с автентикацията, опресняване на състоянието');
        userService.refreshAuthState();
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
        const movieData = await trailerService.getMovieTrailer(movieId);
        
        // Проверка за валиден отговор
        if (!movieData) {
          hasError.value = true;
          errorMessage.value = 'Филмът не може да бъде зареден';
          isLoading.value = false;
          return;
        }
        
        movie.value = movieData;
        console.log('Данни за филм:', movie.value);
        
        // Задаваме цвят за фона с withAlpha вместо withOpacity
        const alpha = Math.round(0.8 * 255);
        overlayColor.value = `rgba(0,0,0,${alpha})`;
        
        // Добавяне на обработчик за клавиша Escape
        const handleEscape = (e) => {
          if (e.key === 'Escape') {
            trailerService.closeTrailer();
          }
        };
        
        document.addEventListener('keydown', handleEscape);
        
        // Премахваме събитието при размонтиране
        return () => {
          document.removeEventListener('keydown', handleEscape);
        };
      } catch (error) {
        handleApiError(error);
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

// Функция за създаване и връщане на vue приложението
function createTrailerApp() {
  return createApp(TrailerApp);
}

// Initialize trailer viewer component when document is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing trailer viewer');
  try {
    const app = createTrailerApp();
    app.mount('#trailer-app');
  } catch (error) {
    console.error('Error initializing trailer viewer:', error);
    // If there's an error during initialization, refresh auth state
    userService.refreshAuthState();
  }
});

// Handle global error events for the trailer component
window.addEventListener('error', (event) => {
  if (event.target && (event.target.tagName === 'IFRAME' || event.target.closest('.trailer-container'))) {
    console.warn('Error in trailer component, refreshing auth state');
    userService.refreshAuthState();
  }
});

// Експортираме необходимите функции за сервиса
export { createTrailerApp }; 