import MovieClass from '../models/MovieClass.js';
import MovieDto from '../models/MovieDto.js';
import BookingTime from '../models/BookingTime.js';
import { createApp, ref, onMounted } from 'vue';

/**
 * Service for handling movie-related operations and API requests
 */
class MovieService {
  constructor() {
    // Използваме релативен път за API, защото Vite го проксира към бекенда
    // Прегледът на vite.config.js показва, че '/api' се проксира към 'http://localhost:8080'
    // За директно използване на бекенда (без прокси) би било 'http://localhost:8080/movies'
    this.moviesEndpoint = '/movies';
    
    console.log('MovieService initialized with endpoint:', this.moviesEndpoint);
  }

  /**
   * Fetch all movies from the backend
   * @returns {Promise<Array<MovieDto>>} Array of MovieDto instances
   */
  async getAllMovies() {
    try {
      const url = `${this.moviesEndpoint}`;
      console.log('Fetching all movies from URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        console.error(`Error response from server: ${response.status} ${response.statusText}`);
        throw new Error(`Error fetching movies: ${response.status}`);
      }

      let responseData;
      try {
        responseData = await response.json();
        console.log('Parsed response data:', responseData);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        return [];
      }
      
      // Проверяваме дали отговорът е масив или съдържа масив
      let moviesData = [];
      
      if (Array.isArray(responseData)) {
        // Ако отговорът е директно масив от филми
        console.log('Response is an array of movies');
        moviesData = responseData;
      } else if (responseData && Array.isArray(responseData)) {
        // Ако отговорът е масив
        console.log('Response is an array');
        moviesData = responseData;
      } else {
        console.error('Could not find movie array in response:', responseData);
        return [];
      }
      
      console.log('Extracted movies data:', moviesData.length, 'movies');
      
      if (moviesData.length === 0) {
        console.warn('No movies found in response');
        return [];
      }
      
      // Конвертираме филмите в очаквания от UI формат
      const movies = moviesData.map(movieJson => {
        try {
          // Използваме MovieDto.fromJSON за преобразуване
          const dto = MovieDto.fromJSON(movieJson);
          
          // Форматираме обекта според очакванията на UI компонента
          return {
            id: dto.id,
            name: dto.name,
            icon: dto.movieClass.icon,
            imageUrl: dto.imageUrl,
            audio: dto.audio,
            subtitles: dto.subtitles,
            description: dto.description,
            // Допълнителни полета, които може да са нужни
            duration: dto.movieLength,
            genre: Array.isArray(dto.genreCategories) 
              ? dto.genreCategories.join(', ') 
              : (typeof dto.genreCategories === 'string' ? dto.genreCategories : ''),
            trailerUrl: dto.trailerUrl,
            projectionFormat: dto.projectionFormat,
            bookingTimes: dto.bookingTimes || []
          };
        } catch (err) {
          console.error('Error converting movie:', err, movieJson);
          // В случай на грешка връщаме минимален валиден обект
          return {
            id: movieJson.id || 0,
            name: movieJson.name || 'Error Loading Movie',
            imageUrl: movieJson.imageUrl || '/images/default-movie.jpg',
            description: 'Error loading movie data',
            icon: movieJson.movieClass.icon,
            projectionFormat: movieJson.projectionFormat,
            bookingTimes: movieJson.bookingTimes || []
          };
        }
      });
      
      console.log('Final movies for UI:', movies);
      
      return movies;
    } catch (error) {
      console.error('Failed to fetch movies:', error);
      // In case of error, return empty array
      return [];
    }
  }

  /**
   * Get movies without booking times (for home page)
   * @returns {Promise<Array<MovieDto>>} Array of MovieDto instances with empty bookingTimes
   */
  async getUpcomingMovies() {
    try {
      const url = `${this.moviesEndpoint}/upcoming`;
      console.log('Извличане на предстоящи филми от URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Статус на отговора:', response.status, response.statusText);
      
      // Опитваме да изведем хедърите за дебъгване
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
      
      if (!response.ok) {
        console.error(`Грешка от сървъра: ${response.status} ${response.statusText}`);
        
        // Ако има проблем с upcoming endpoint, опитваме с всички филми
        console.log('Пробваме с общия endpoint за филми вместо upcoming...');
        return await this.getAllMovies();
      }

      // Запазваме raw response за дебъгване
      const responseText = await response.text();
      console.log('Raw response body:', responseText);
      
      let responseData;
      try {
        // Парсваме JSON ръчно, за да можем да дебъгнем
        responseData = JSON.parse(responseText);
        console.log('Получени данни (парсирани):', responseData);
      } catch (parseError) {
        console.error('Грешка при обработка на JSON:', parseError);
        console.log('Някои сървъри връщат празен обект или грешен JSON формат, опитваме алтернативен подход...');
        
        // Ако има проблем с JSON парсирането, опитваме да вземем всички филми
        return await this.getAllMovies();
      }
      
      // Проверяваме дали отговорът е масив или съдържа масив
      let moviesData = [];
      
      if (Array.isArray(responseData)) {
        // Ако отговорът е директно масив от филми
        console.log('Отговорът е масив от филми');
        moviesData = responseData;
      } else if (responseData && typeof responseData === 'object') {
        // Проверка за различни структури на отговора от API
        if (Array.isArray(responseData.content)) {
          console.log('Отговорът е пагиниран обект с поле content');
          moviesData = responseData.content;
        } else if (Array.isArray(responseData.data)) {
          console.log('Отговорът е обект с поле data');
          moviesData = responseData.data;
        } else if (responseData.movies && Array.isArray(responseData.movies)) {
          console.log('Отговорът е обект с поле movies');
          moviesData = responseData.movies;
        } else {
          // Ако няма ясна структура, но отговорът е обект, опитваме се да го третираме като единичен филм
          console.log('Опитваме се да разглеждаме отговора като единичен филм обект');
          // Проверяваме дали има поне id и name за да го третираме като филм
          if (responseData.id !== undefined && responseData.name) {
            console.log('Отговорът изглежда е единичен филм');
            moviesData = [responseData];
          } else {
            console.log('Опитваме се да намерим филм данни в отговора рекурсивно...');
            // Търсим дълбоко в отговора нещо, което прилича на филм
            for (const key in responseData) {
              if (responseData[key] && typeof responseData[key] === 'object') {
                if (responseData[key].id !== undefined && responseData[key].name) {
                  console.log(`Намерихме данни, подобни на филм в поле ${key}`);
                  moviesData = [responseData[key]];
                  break;
                }
              }
            }
          }
        }
      }
      
      console.log('Извлечени филми:', moviesData.length, 'филма');
      
      if (moviesData.length === 0) {
        console.warn('Няма намерени филми в отговора, пробваме getAllMovies');
        // Ако няма филми от upcoming, опитваме с всички филми
        return await this.getAllMovies();
      }
      
      // Конвертираме филмите в очаквания от UI формат
      const movies = moviesData.map((movieJson, index) => {
        try {
          console.log(`Обработка на филм ${index + 1}:`, movieJson);
          
          // Използваме MovieDto.fromJSON за преобразуване
          const dto = MovieDto.fromJSON(movieJson);
          console.log(`Филм ${index + 1} име:`, dto.name);
          
          // Форматираме обекта според очакванията на UI компонента
          return {
            id: dto.id,
            name: dto.name,
            imageUrl: dto.imageUrl || '/images/default-movie.jpg',
            description: dto.description || 'Няма описание',
            // Допълнителни полета, които може да са нужни
            duration: dto.movieLength,
            genre: Array.isArray(dto.genreCategories) 
              ? dto.genreCategories.join(', ') 
              : (typeof dto.genreCategories === 'string' ? dto.genreCategories : ''),
            trailerUrl: dto.trailerUrl,
            bookingTimes: dto.bookingTimes || []
          };
        } catch (err) {
          console.error(`Грешка при конвертиране на филм ${index + 1}:`, err, movieJson);
          // В случай на грешка връщаме минимален валиден обект
          return {
            id: movieJson.id || index + 1,
            name: movieJson.name || `Филм без име ${index + 1}`,
            imageUrl: movieJson.imageUrl || '/images/default-movie.jpg',
            description: movieJson.description || 'Няма налично описание',
            duration: movieJson.movieLength || movieJson.duration || 0,
            genre: '',
            bookingTimes: []
          };
        }
      });
      
      console.log('Готови филми за UI:', movies.length);
      // Извеждаме имената на всички филми за дебъгване
      movies.forEach((movie, index) => {
        console.log(`Филм ${index + 1} за UI: ${movie.name} (ID: ${movie.id})`);
      });
      
      return movies;
    } catch (error) {
      console.error('Грешка при извличане на предстоящи филми:', error);
      console.log('След грешка опитваме getAllMovies...');
      // Ако има грешка с upcoming, опитваме всички филми
      try {
        return await this.getAllMovies();
      } catch (e) {
        console.error('И getAllMovies се провали:', e);
        return [];
      }
    }
  }

  /**
   * Get movies with booking times (for program page)
   * @param {string} date - Optional date filter
   * @param {string} location - Optional location filter
   * @returns {Promise<Array<MovieClass>>} Array of MovieClass instances with non-empty bookingTimes
   */
  async getMoviesWithProjections(date = null, location = null) {
    const allMovies = await this.getAllMovies();
    // Filter movies that have booking times
    let filteredMovies = allMovies.filter(movie => movie.bookingTimes.length > 0);
    
    // Apply date filter if provided
    if (date) {
      filteredMovies = filteredMovies.filter(movie => {
        return movie.bookingTimes.some(time => time.date === date);
      });
    }
    
    // Apply location filter if provided
    if (location) {
      filteredMovies = filteredMovies.filter(movie => {
        return movie.bookingTimes.some(time => time.location === location);
      });
    }
    
    return filteredMovies;
  }

  /**
   * Get a single movie by ID
   * @param {number} id - Movie ID
   * @returns {Promise<MovieDto|null>} MovieDto instance or null if not found
   */
  async getMovieById(id) {
    try {
      const url = `${this.moviesEndpoint}/trailer/${id}`;
      console.log(`Fetching movie with ID ${id} from URL:`, url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        console.error(`Error response from server: ${response.status} ${response.statusText}`);
        throw new Error(`Error fetching movie: ${response.status}`);
      }

      const movieData = await response.json();
      console.log('Parsed movie data:', movieData);
      
      // Конвертираме филма в очаквания от UI формат
      try {
        const dto = MovieDto.fromJSON(movieData);
        
        return {
          id: dto.id,
          name: dto.name,
          imageUrl: dto.imageUrl,
          description: dto.description,
          duration: dto.movieLength,
          genre: Array.isArray(dto.genreCategories) 
            ? dto.genreCategories.join(', ') 
            : (typeof dto.genreCategories === 'string' ? dto.genreCategories : ''),
          trailerUrl: dto.trailerUrl,
          bookingTimes: dto.bookingTimes || []
        };
      } catch (err) {
        console.error('Error converting movie:', err, movieData);
        return null;
      }
    } catch (error) {
      console.error(`Failed to fetch movie with ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Create a new movie (admin function)
   * @param {MovieDto} movieDto - Data for the new movie
   * @returns {Promise<MovieDto|null>} Created MovieDto or null if failed
   */
  async createMovie(movieDto) {
    try {
      const url = `${this.moviesEndpoint}/add-movie`;
      console.log('Creating movie at URL:', url, 'with data:', movieDto);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(movieDto)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        console.error(`Error response from server: ${response.status} ${response.statusText}`);
        throw new Error(`Error creating movie: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Create movie response:', responseData);
      
      if (typeof responseData === 'string') {
        // Сървърът връща само съобщение за успех
        console.log('Server returned success message:', responseData);
        return movieDto; // Връщаме оригиналния DTO
      }
      
      // Иначе сървърът е върнал новия филм
      return MovieDto.fromJSON(responseData);
    } catch (error) {
      console.error('Failed to create movie:', error);
      return null;
    }
  }

  /**
   * Update an existing movie (admin function)
   * @param {number} id - Movie ID to update
   * @param {MovieDto} movieDto - Updated movie data
   * @returns {Promise<MovieClass|null>} Updated MovieClass or null if failed
   */
  async updateMovie(id, movieDto) {
    try {
      const response = await fetch(`${this.moviesEndpoint}/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include',
        body: JSON.stringify(movieDto)
      });

      if (!response.ok) {
        throw new Error(`Error updating movie: ${response.status}`);
      }

      let updatedMovie;
      try {
        const responseText = await response.text();
        console.log('Update movie response:', responseText);
        
        if (!responseText || responseText.trim() === '') {
          console.warn('Empty response received from server');
          return null;
        }
        
        updatedMovie = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        return null;
      }
      
      // Handle different response structures
      if (updatedMovie && updatedMovie.data) {
        updatedMovie = updatedMovie.data;
      }
      
      // Transform to UI format
      if (MovieDto.fromJSON) {
        const dto = MovieDto.fromJSON(updatedMovie);
        return {
          id: dto.id,
          name: dto.name,
          imageUrl: dto.imageUrl,
          description: dto.description,
          duration: dto.movieLength,
          genre: dto.genreCategories && dto.genreCategories.length > 0 
            ? dto.genreCategories.join(', ') 
            : '',
          trailerUrl: dto.trailerUrl,
          bookingTimes: dto.bookingTimes || []
        };
      } else {
        return {
          id: updatedMovie.id,
          name: updatedMovie.name || 'Updated Movie',
          imageUrl: updatedMovie.imageUrl || '/images/default-movie.jpg',
          description: updatedMovie.description || '',
          duration: updatedMovie.duration || updatedMovie.movieLength || 0,
          genre: updatedMovie.genre || '',
          trailerUrl: updatedMovie.trailerUrl || '',
          bookingTimes: updatedMovie.bookingTimes || []
        };
      }
    } catch (error) {
      console.error(`Failed to update movie with ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Delete a movie by ID (admin function)
   * @param {number} id - Movie ID to delete
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  async deleteMovie(id) {
    try {
      const url = `${this.moviesEndpoint}/delete-movie/${id}`;
      console.log(`Deleting movie with ID ${id} at URL:`, url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Accept': 'text/plain'
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        console.error(`Error response from server: ${response.status} ${response.statusText}`);
        return false;
      }

      console.log('Delete movie response:', await response.text());
      return true;
    } catch (error) {
      console.error(`Failed to delete movie with ID ${id}:`, error);
      return false;
    }
  }

  /**
   * Convert plain movie object from API to MovieClass instance
   * @param {Object} movieData - Raw movie data from API
   * @returns {MovieClass} Properly formatted MovieClass instance
   * @private
   */
  _convertToMovieClass(movieData) {
    try {
      console.log('Converting movie data:', movieData);
      
      if (!movieData) {
        console.error('Received null or undefined movieData');
        return this._createFallbackMovie();
      }
      
      const movie = new MovieClass(movieData.ageRestriction || 'TBC');
      
      // Set basic properties
      movie.setId(movieData.id || 0);
      
      // Set name directly (without validation as it's coming from backend)
      movie.name = movieData.name || 'Unknown Movie';
      
      // Set description directly
      movie.description = movieData.description || '';
      
      // Set additional properties directly on the object
      movie.imageUrl = movieData.imageUrl || '/images/default-movie.jpg';
      movie.trailerUrl = movieData.trailerUrl || '';
      movie.duration = movieData.duration || 0;
      movie.genre = movieData.genre || '';
      
      // Initialize bookingTimes array
      movie.bookingTimes = [];
      
      // If bookingTimes are present, convert them to BookingTime instances
      if (movieData.bookingTimes && Array.isArray(movieData.bookingTimes)) {
        console.log('Processing booking times:', movieData.bookingTimes);
        
        movie.bookingTimes = movieData.bookingTimes
          .map(time => {
            if (!time) {
              console.warn('Null or undefined booking time entry');
              return null;
            }
            
            console.log('Processing booking time:', time);
            
            if (time.id !== undefined) {
              const bookingTime = new BookingTime(time.id);
              if (time.time) {
                bookingTime.bookingTime = time.time;
              }
              return bookingTime;
            }
            
            console.warn('Invalid booking time data (missing id):', time);
            return null;
          })
          .filter(time => time !== null);
          
        console.log('Processed booking times:', movie.bookingTimes);
      }
      
      console.log('Converted movie:', movie);
      return movie;
    } catch (error) {
      console.error('Error converting movie data:', error, movieData);
      return this._createFallbackMovie(movieData);
    }
  }
  
  /**
   * Create a fallback movie instance in case of errors
   * @param {Object} movieData - Partial movie data if available
   * @returns {MovieClass} A minimal valid MovieClass instance
   * @private
   */
  _createFallbackMovie(movieData = {}) {
    const fallbackMovie = new MovieClass('TBC');
    fallbackMovie.setId(movieData.id || 0);
    fallbackMovie.name = movieData.name || 'Error Loading Movie';
    fallbackMovie.description = movieData.description || 'There was an error loading this movie data.';
    fallbackMovie.imageUrl = '/images/default-movie.jpg';
    fallbackMovie.trailerUrl = '';
    fallbackMovie.duration = 0;
    fallbackMovie.genre = '';
    fallbackMovie.bookingTimes = [];
    
    return fallbackMovie;
  }

  /**
   * Create a MovieDto from form data or MovieClass
   * @param {Object|MovieClass} movieData - Movie data or MovieClass instance
   * @returns {MovieDto} MovieDto instance ready for API requests
   */
  createMovieDto(movieData) {
    const movieDto = new MovieDto();
    
    if (movieData.id) {
      movieDto.setId(movieData.id);
    }
    
    movieDto.setName(movieData.name || '');
    movieDto.setDescription(movieData.description || '');
    movieDto.setImageUrl(movieData.imageUrl || '');
    movieDto.setTrailerUrl(movieData.trailerUrl || '');
    movieDto.setMovieLength(movieData.duration || 0);
    
    if (movieData.genre) {
      movieDto.setGenreCategories([movieData.genre]);
    }
    
    return movieDto;
  }

  /**
   * Инициализира Vue приложение за списъка с филми
   * @returns {import('vue').App} Vue приложение
   */
  initMovieListVue() {
    const movieServiceInstance = this;  // Запазваме референция към this
    
    const MovieListApp = {
      setup() {
        const movies = ref([])
        const isLoading = ref(true)
        const hasError = ref(false)
        const debugInfo = ref('Зареждане...')

        onMounted(async () => {
          try {
            console.log('Зареждане на предстоящи филми...')
            isLoading.value = true
            debugInfo.value = 'Изпращане на заявка към API...'

            // Use the movie service to get upcoming movies (with empty bookingTimes)
            const upcomingMovies = await movieServiceInstance.getUpcomingMovies()
            console.log('Получени данни за предстоящи филми:', upcomingMovies)
            debugInfo.value = `Получени филми: ${upcomingMovies ? upcomingMovies.length : 0}`
            
            // Директно извеждаме имената на филмите в конзолата за дебъгване
            if (upcomingMovies && upcomingMovies.length > 0) {
              console.log('Имена на заредените филми:')
              upcomingMovies.forEach((movie, index) => {
                console.log(`${index + 1}. ${movie.name} (ID: ${movie.id})`)
              })
            }
            
            movies.value = upcomingMovies
            
            // If no movies were found, provide some fallback data
            if (movies.value.length === 0) {
              console.warn('No upcoming movies found or API not available')
              debugInfo.value = 'Няма намерени филми'
              // Fallback data
              movies.value = []
            } else {
              debugInfo.value = `Успешно заредени ${movies.value.length} филми`
            }
          } catch (error) {
            console.error('Грешка при зареждане на филми:', error)
            hasError.value = true
            debugInfo.value = `Грешка: ${error.message}`
            // Empty array on error
            movies.value = []
          } finally {
            isLoading.value = false
          }
        })

        return { movies, isLoading, hasError, debugInfo }
      }
    }

    // Създаваме Vue инстанция
    const app = createApp(MovieListApp)

    // Правим компонент за списъка с филми
    app.component('movie-list', {
      props: ['movies'],
      template: `
        <li v-if="movies.length === 0" class="no-movies">
          <p>Няма налични филми за показване.</p>
        </li>
        <template v-else>
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
        </template>
      `
    });

    return app;
  }
}

// Export a singleton instance
export const movieService = new MovieService();
export default movieService;