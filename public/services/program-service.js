import { createApp, ref, onMounted } from 'vue'
import MovieService from './MovieService.js'

class ProgramService {
  constructor() {
    this.programEndpoint = '/api/program'
    console.log('ProgramService initialized with endpoint:', this.programEndpoint)
  }
  
  /**
  * Fetch all movies for the program page
  * @returns {Promise<Array>} Array of movies
  */
  async getAllMoviesForProgram() {
    try {
      const movies = await MovieService.getAllMovies()
      return movies
    } catch (error) {
      console.error('Failed to fetch movies for program:', error)
      return []
    }
  }
  
  /**
  * Create a new order
  * @param {Object} orderData - Order data
  * @returns {Promise<Object>} Response from the server
  */
  async createOrder(orderData) {
    try {
      const response = await fetch(this.programEndpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(orderData)
      })
      
      if (!response.ok) {
        throw new Error(`Error creating order: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to create order:', error)
      throw error
    }
  }
  
  /**
  * Cancel unfinished orders
  * @returns {Promise<Object>} Response from the server
  */
  async cancelOrders() {
    try {
      const response = await fetch(`${this.programEndpoint}/order-tickets`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`Error canceling orders: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to cancel orders:', error)
      throw error
    }
  }
  
  /**
  * Get movie details for updating projection time
  * @param {number} id - Movie ID
  * @returns {Promise<Object>} Movie details
  */
  async getMovieForUpdate(id) {
    try {
      const response = await fetch(`${this.programEndpoint}/update-projection-time/${id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Error fetching movie for update: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch movie for update:', error)
      return null
    }
  }
  
  /**
  * Update movie projection time
  * @param {number} id - Movie ID
  * @param {Object} bookingTimes - New booking times
  * @returns {Promise<Object>} Response from the server
  */
  async updateProjectionTime(id, bookingTimes) {
    try {
      const response = await fetch(`${this.programEndpoint}/update-projection-time/${id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingTimes)
      })
      
      if (!response.ok) {
        throw new Error(`Error updating projection time: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to update projection time:', error)
      throw error
    }
  }
  
  /**
  * Initialize Vue component for program page
  * @returns {Object} Vue app instance
  */
  initProgramVue() {
    const ProgramApp = {
      setup() {
        const movies = ref([])
        const isLoading = ref(true)
        const hasError = ref(false)
        const debugInfo = ref('Loading...')
        const selectedDate = ref('')
        const selectedCity = ref('')
        
        onMounted(async () => {
          try {
            console.log('Loading program movies...')
            isLoading.value = true
            debugInfo.value = 'Fetching movies from API...'
            
            movies.value = await programService.getAllMoviesForProgram()
            for (const movie of movies.value) {
              console.log(movies.value);
            }
            
            if (movies.value.length === 0) {
              debugInfo.value = 'No movies found'
            } else {
              debugInfo.value = `Successfully loaded ${movies.value.length} movies`            }
            } catch (error) {
              console.error('Error loading program movies:', error)
              hasError.value = true
              debugInfo.value = `Error: ${error.message}`
            } finally {
              isLoading.value = false
            }
          })
          
          return { 
            movies, 
            isLoading, 
            hasError, 
            debugInfo,
            selectedDate,
            selectedCity
          }
        }
      }
      
      // Create Vue component for movie list
      const app = createApp(ProgramApp)
      
      app.component('program-movie-list', {
        props: ['movies'],
        template: `
        <li v-if="movies.length === 0" class="no-movies">
          <p>No movies available for the selected date and city.</p>
        </li>
        <template v-else>
          <li v-for="(movie, index) in movies" :key="movie.id || index" class="movieList">
            <img :src="movie.imageUrl" :alt="movie.name" width="204" height="219" />
            <a :href="'/trailer/' + movie.id" class="title-movie">{{ movie.name }}</a>
            <span class="qb-movie-rating-info">
              <img :src="movie.icon " alt="Rating" height="30" class="rating-icon mr-sm" />
              <div class="qb-movie-info-wrapper">
                <div class="pt-xs">
                  <span class="mr-sm">{{ movie.genre }}</span>
                  <span class="ml-xs">|</span>
                  <span class="mr-xs">{{ movie.duration }} min.</span>
                </div>
              </div>
            </span>
            <section class="movie-info-program">
            <div class="screening-type">{{ movie.projectionFormat || '2D' }}</div>

            <div class="info-booking-times">
              <template v-if="!movie.bookingTimes || movie.bookingTimes.length === 0">
                <a class="h4">Coming soon</a>
              </template>
            
              <template v-else>
                <a v-for="time in movie.bookingTimes" 
                    :key="time.id" 
                    :href="'/program'" 
                    class="btn btn-primary btn-lg">
                    {{ time.bookingTime.replace('_', ' ').replace('_', ':') }}
                </a>
              </template>
            </div>
            <div class="qb-movie-info-column">
              <div class="movie-info-column-item">
                <span class="movie-info-column-value">{{ movie.audio }}.</span>
                <span class="movie-info-column-label">-(SUB:</span>
                <span class="movie-info-column-value">{{ movie.subtitles }}.)</span>
              </div>
            </div>
              <template v-if="isAdmin">
                <a :href="'/program/update-projection-time/' + movie.id" 
                  class="btn btn-primary btn-lg">
                  Update projection time
                </a>
                <form :action="'/movies/delete-movie/' + movie.id" method="delete">
                  <div class="button-holder d-flex justify-content-center">
                    <button type="submit" class="btn btn-info mb-3">Delete Movie</button>
                  </div>
                </form>
              </template>
            </section>
          </li>
          <li class="clear">&nbsp;</li>
        </template>
      `
      })
      
      return app
    }
  }
  
  // Export a singleton instance
  export const programService = new ProgramService()
  export default programService
  