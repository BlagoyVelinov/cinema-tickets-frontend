import { createApp, ref, onMounted } from 'vue';
import { movieService } from '../services/movie-service.js';

console.log("movie-view.js зареден");

/**
 * Компонент за списък с филми
 */
const MovieListApp = {
  template: `
    <div v-if="isLoading" class="loading-message">
      <p>Loading movies...</p>
      <p class="debug">{{ debugInfo }}</p>
    </div>
    <div v-else-if="hasError" class="error-message">
      <p>There was an error loading the movies. Showing sample data instead.</p>
      <p class="debug">{{ debugInfo }}</p>
    </div>
    <div v-else-if="movies.length === 0" class="empty-message">
      <p>No movies available at the moment.</p>
      <p class="debug">{{ debugInfo }}</p>
    </div>
    <ul class="movies" v-else>
      <li v-for="(movie, index) in movies" :key="movie.id || index">
        <h4>{{ movie.name || '' }}</h4>
        <img class="movie-1-pic" :src="movie.imageUrl" :alt="movie.name" width="224" height="269" />
        <p>{{ movie.description || 'Няма описание' }}</p>
        
        <div class="button-trailer-button">
          <a :href="'/?trailer=' + movie.id" class="link2">
            <span><span>See Trailer</span></span>
          </a>
        </div>
      </li>
      <li class="clear">&nbsp;</li>
    </ul>
  `,
  setup() {
    console.log("MovieListApp setup извикан");
    const movies = ref([]);
    const isLoading = ref(true);
    const hasError = ref(false);
    const debugInfo = ref('Зареждане...');

    onMounted(async () => {
      console.log("MovieListApp onMounted извикан");
      try {
        console.log('Зареждане на предстоящи филми...');
        isLoading.value = true;
        debugInfo.value = 'Изпращане на заявка към API...';

        // Use the movie service to get upcoming movies (with empty bookingTimes)
        console.log("Извикване на movieService.getUpcomingMovies()");
        const upcomingMovies = await movieService.getUpcomingMovies();
        console.log('Получени данни за предстоящи филми:', upcomingMovies);
        debugInfo.value = `Получени филми: ${upcomingMovies ? upcomingMovies.length : 0}`;
        
        // Директно извеждаме имената на филмите в конзолата за дебъгване
        if (upcomingMovies && upcomingMovies.length > 0) {
          console.log('Имена на заредените филми:');
          upcomingMovies.forEach((movie, index) => {
            console.log(`${index + 1}. ${movie.name} (ID: ${movie.id})`);
          });
        }
        
        movies.value = upcomingMovies;
        console.log("movies.value установен на:", movies.value);
        
        // If no movies were found, provide some fallback data
        if (movies.value.length === 0) {
          console.warn('No upcoming movies found or API not available');
          debugInfo.value = 'Няма намерени филми';
          // Fallback data
          movies.value = [];
        } else {
          debugInfo.value = `Успешно заредени ${movies.value.length} филми`;
        }
      } catch (error) {
        console.error('Грешка при зареждане на филми:', error);
        hasError.value = true;
        debugInfo.value = `Грешка: ${error.message}`;
        // Empty array on error
        movies.value = [];
      } finally {
        isLoading.value = false;
        console.log("isLoading.value установен на: false");
        console.log("Текущо състояние на компонента:", {
          movies: movies.value,
          isLoading: isLoading.value,
          hasError: hasError.value,
          debugInfo: debugInfo.value
        });
      }
    });

    return { movies, isLoading, hasError, debugInfo };
  }
};

/**
 * Създава Vue приложение за списъка с филми
 * @returns {import('vue').App} Vue приложение
 */
function createMovieListApp() {
  console.log("createMovieListApp извикан");
  // Създаваме Vue инстанция
  const app = createApp(MovieListApp);
  console.log("Vue приложение създадено с createApp");
  return app;
}

// Експортираме необходимите функции
console.log("Експортираме createMovieListApp");
export { createMovieListApp }; 