import { createApp, ref, onMounted } from 'vue'
import userService from '../services/user-service.js'
import { programService } from '../services/program-service.js'

const ProgramApp = {
  setup() {
    const movies = ref([])
    const isLoading = ref(true)
    const hasError = ref(false)
    const debugInfo = ref('Loading...')
    const selectedDate = ref('')
    const selectedCity = ref('')
    const isAdmin = ref(false)
    const errors = ref({ dateError: false, cityError: false })
    const todayDate = ref('')
    const showAddMovieForm = ref(false)
    
    onMounted(async () => {
      try {
        console.log('Loading program movies...')
        isLoading.value = true
        debugInfo.value = 'Fetching movies from API...'
        
        // Set today's date
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        todayDate.value = `${year}-${month}-${day}`
        selectedDate.value = todayDate.value
        
        // Check if user is admin
        isAdmin.value = await userService.isAdmin()
        console.log('Is user admin status: ', isAdmin.value)
        
        // Зареждаме филмите от програма сервиза
        movies.value = await programService.getAllMoviesForProgram()
        
        if (movies.value.length === 0) {
          debugInfo.value = 'No movies found. Please select a date and location.'
        } else {
          debugInfo.value = `Successfully loaded ${movies.value.length} movies`            
        }
      } catch (error) {
        console.error('Error loading program movies:', error)
        hasError.value = true
        debugInfo.value = `Error: ${error.message}`
      } finally {
        isLoading.value = false
      }
    })
    
    // Form validation function
    const validateForm = () => {
      let isValid = true
      
      // Reset errors
      errors.value.dateError = false
      errors.value.cityError = false
      
      // Validate date
      if (!selectedDate.value || new Date(selectedDate.value) < new Date(todayDate.value)) {
        errors.value.dateError = true
        isValid = false
      }
      
      // Validate city
      if (!selectedCity.value) {
        errors.value.cityError = true
        isValid = false
      }
      
      // If form is valid, submit
      if (isValid) {
        document.querySelector('form[action="/program"]').submit()
      }
    }
    
    // Format city name function
    const formatCityName = (cityName) => {
      if (!cityName) return '';
      return cityName.replace('_', ' ').split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    // Функция за превключване на изгледа към/от формата за добавяне на филм
    const toggleAddMovieForm = () => {
      showAddMovieForm.value = !showAddMovieForm.value;
      console.log('Показване на формата за добавяне на филм:', showAddMovieForm.value);
    }
    
    return { 
      movies, 
      isLoading, 
      hasError, 
      debugInfo,
      selectedDate,
      selectedCity,
      isadmin: isAdmin,
      errors,
      todayDate,
      validateForm,
      formatCityName,
      showAddMovieForm,
      toggleAddMovieForm
    }
  },
  template: `
    <div class="program-container">
      
      <div class="form-row m-5">
        <form method="post" action="/program">
          <div class="col">
            <label for="dateInput">Date</label>
            <input 
              type="date" 
              name="projectionDate" 
              id="dateInput" 
              class="form-control"
              v-model="selectedDate" 
              :min="todayDate"
            />
            <small class="text-danger" v-show="errors.dateError">Reserved date cannot be in the past</small>
          </div>

          <div class="form-group">
            <label for="cityName">Select City</label>
            <select 
              class="browser-default custom-select" 
              id="cityName" 
              name="location"
              v-model="selectedCity"
            >
              <option value="">Select City</option>
              <option value="SOFIA">Sofia</option>
              <option value="PLOVDIV">Plovdiv</option>
              <option value="STARA_ZAGORA">Stara Zagora</option>
              <option value="RUSE">Ruse</option>
              <option value="BURGAS">Burgas</option>
              <option value="VARNA">Varna</option>
            </select>
            <small class="text-danger" v-show="errors.cityError">City Name is required</small>
          </div>

          <div class="button-holder d-flex justify-content-center">
            <button type="button" class="btn btn-primary btn-lg" @click="validateForm">Continue</button>
          </div>
        </form>
        <!-- Admin button for adding a movie -->
      <div v-if="isadmin" class="admin-controls mb-4">
        <button @click="toggleAddMovieForm" class="btn admin-btn-add">
          <i class='bx bx-plus'></i>
          {{ showAddMovieForm ? 'Show movies' : 'Add movie' }}
        </button>
      </div>
      </div>
      
      <!-- MOVIES -->
      <div class="content" v-if="!showAddMovieForm">
        <h4 id="displayDate">
          {{ selectedDate ? 'Projections on: ' + selectedDate : 'Choose a date and city for reserve ticket' }}
          {{ selectedCity ? ' in: ' + formatCityName(selectedCity) : '' }}
        </h4>
        
        <div v-if="isLoading" class="loading-message">
          <p>Loading movies...</p>
          <p class="debug">{{ debugInfo }}</p>
        </div>
        <div v-else-if="hasError" class="error-message">
          <p>There was an error loading the movies.</p>
          <p class="debug">{{ debugInfo }}</p>
        </div>
        <ul class="list" v-else>
          <program-movie-list :movies="movies" :isadmin="isadmin"></program-movie-list>
        </ul>
      </div>
      
      <!-- ADD MOVIE FORM - Показва се само за админи когато showAddMovieForm е true -->
      <div class="content" v-if="showAddMovieForm && isadmin">
        <h1 class="text-center mt-2">
        <span class="badge badge-pill badge-add">Add</span>
        <span class="badge badge-pill badge-movie">Movie</span>
        </h1>

        <form class="welcome add-movie-form" method="post" action="/movies/add-movie">
            <div class="form-group">
                <div class="label-holder text-white textCol d-flex justify-content-center">
                    <label for="name" class="h4 mb-2">Name</label>
                </div>
                <input type="text" class="form-control" id="name" name="name" />
                <small class="text-danger" id="error-name"></small>
            </div>

            <div class="form-group">
                <div class="label-holder text-white textCol d-flex justify-content-center">
                    <label for="movieLength" class="h4 mb-2">Movie Length</label>
                </div>
                <input type="number" class="form-control" id="movieLength" name="movieLength" min="20" max="180" />
                <small class="text-danger" id="error-movieLength"></small>
            </div>

            <div class="form-group">
                <div class="label-holder text-white textCol d-flex justify-content-center">
                    <label for="audio" class="h4 mb-2">Audio</label>
                </div>
                <input type="text" class="form-control" id="audio" name="audio" minlength="2" maxlength="20" />
                <small class="text-danger" id="error-audio"></small>
            </div>

            <div class="form-group">
                <div class="label-holder text-white textCol d-flex justify-content-center">
                    <label for="subtitles" class="h4 mb-2">Subtitles</label>
                </div>
                <input type="text" class="form-control" id="subtitles" name="subtitles" minlength="2" maxlength="20" />
                <small class="text-danger" id="error-subtitles"></small>
            </div>

            <div class="form-group">
                <div class="label-holder text-white textCol d-flex justify-content-center">
                    <label for="description" class="h4 mb-2">Description</label>
                </div>
                <textarea class="form-control" id="description" name="description" minlength="5" maxlength="250"></textarea>
                <small class="text-danger" id="error-description"></small>
            </div>

            <div class="form-group">
                <div class="label-holder text-white textCol d-flex justify-content-center">
                    <label for="imageUrl" class="h4 mb-2">Image URL</label>
                </div>
                <textarea class="form-control" id="imageUrl" name="imageUrl" minlength="10"></textarea>
                <small class="text-danger" id="error-imageUrl"></small>
            </div>

            <div class="form-group">
                <div class="label-holder text-white textCol d-flex justify-content-center">
                    <label for="trailerUrl" class="h4 mb-2">Trailer URL</label>
                </div>
                <textarea class="form-control" id="trailerUrl" name="trailerUrl" minlength="10" placeholder="https://www.youtube.com/embed/..."></textarea>
                <small class="text-danger" id="error-trailerUrl"></small>
            </div>

            <div class="form-group">
                <div class="label-holder text-white textCol d-flex justify-content-center">
                    <label for="projectionFormat" class="h4 mb-2">Projection Format</label>
                </div>
                <select class="browser-default custom-select movie-add" id="projectionFormat" name="projectionFormat">
                    <option value="">Select Projection Format</option>
                    <option value="D_2D">2D</option>
                    <option value="D_3D">3D</option>
                    <option value="D_4DX">4DX</option>
                </select>
                <small class="text-danger" id="error-projectionFormat"></small>
            </div>

            <div class="form-group">
                <div class="label-holder text-white textCol d-flex justify-content-center">
                    <label for="hallNumber" class="h4 mb-2">Hall Number</label>
                </div>
                <select class="browser-default custom-select movie-add" id="hallNumber" name="hallNumber">
                    <option value="">Select Hall Number</option>
                    <option value="HALL_1">1</option>
                    <option value="HALL_2">2</option>
                    <option value="HALL_3">3</option>
                    <option value="HALL_4">4</option>
                    <option value="HALL_5">5</option>
                    <option value="HALL_6">6</option>
                    <option value="HALL_7">7</option>
                    <option value="HALL_8">8</option>
                </select>
                <small class="text-danger" id="error-hallNumber"></small>
            </div>

            <div class="form-group">
                <div class="label-holder text-white textCol d-flex justify-content-center">
                    <label for="classMovie" class="h4 mb-2">Class Of Movie</label>
                </div>
                <select class="browser-default custom-select movie-add" id="classMovie" name="classMovie">
                    <option value="">Select Class Movie</option>
                    <option value="B_">B</option>
                    <option value="C_">C</option>
                    <option value="C_PLUS">C+</option>
                    <option value="D_">D</option>
                    <option value="X_">X</option>
                    <option value="TBC">?</option>
                </select>
                <small class="text-danger" id="error-classMovie"></small>
            </div>

            <div class="form-group">
                <div class="label-holder text-white textCol d-flex justify-content-center">
                    <label for="genreCategories" class="h4 mb-2">Genre Of Movie</label>
                </div>
                <select class="browser-default custom-select movie-add" name="genreCategories[]" id="genreCategories" multiple="multiple">
                    <option value="ACTION">Action</option>
                    <option value="ADVENTURE">Adventure</option>
                    <option value="ANIMATION">Animation</option>
                    <option value="BULGARIAN">Bulgarian</option>
                    <option value="COMEDY">Comedy</option>
                    <option value="FAMILY">Family</option>
                    <option value="FANTASY">Fantasy</option>
                    <option value="HORROR">Horror</option>
                    <option value="MYSTERY">Mystery</option>
                    <option value="ROMANTIC">Romantic</option>
                    <option value="THRILLER">Thriller</option>
                </select>
                <small class="text-danger" id="error-genreCategories"></small>
            </div>

            <div class="button-holder d-flex-add justify-content-center">
                <button type="submit" class="btn btn-info admin-btn-add">Add movie</button>
                <button type="button" @click="toggleAddMovieForm" class="btn btn-cancel mb-3 ml-3">Cancel</button>
            </div>
        </form>
      </div>
    </div>
  `
}

// Vue компонент за списък с филми
const ProgramMovieList = {
  props: ['movies', 'isadmin'],
  template: `
    <li v-if="movies.length === 0" class="no-movies">
      <p>No movies available for the selected date and city.</p>
    </li>
    <template v-else>
      <li v-for="(movie, index) in movies" :key="movie.id || index" class="movieList">
        <img :src="movie.imageUrl" :alt="movie.name" width="204" height="219" />
        <a :href="'/?trailer=' + movie.id" class="title-movie">{{ movie.name }}</a>
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
          <div class="admin-program-buttons">
          <template v-if="isadmin">
            <a :href="'/program/update-projection-time/' + movie.id" 
              class="btn-lg">
              Update projection time
            </a>
            <form :action="'/movies/delete-movie/' + movie.id" method="delete">
              <div class="button-holder d-flex justify-content-center">
                <button type="submit" class="btn btn-info mb-3">Delete Movie</button>
              </div>
            </form>
          </template>
        </div>
        </div>
        </section>
      </li>
      <li class="clear">&nbsp;</li>
    </template>
  `
}

// Функция за създаване на Vue приложение
export function createProgramVue() {
  console.log("Създавам програма Vue от program-view.js");
  const app = createApp({
    components: {
      ProgramApp
    },
    template: '<program-app></program-app>'
  });
  
  // Регистриране на глобален компонент
  app.component('program-movie-list', ProgramMovieList);
  
  return app;
}
