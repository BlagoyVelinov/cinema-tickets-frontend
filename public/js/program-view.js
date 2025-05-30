import { createApp, ref, onMounted, watch } from 'vue'
import userService from '../services/user-service.js'
import { programService } from '../services/program-service.js'
import { movieService } from '../services/movie-service.js'
import BookingTime from '../models/BookingTime.js'

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
        // Load saved city and date from localStorage
        const savedCity = localStorage.getItem('selectedCity');
        if (savedCity) selectedCity.value = savedCity;
        const savedDate = localStorage.getItem('selectedDate');
        if (savedDate) selectedDate.value = savedDate;

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
    
    // Watchers to save city and date to localStorage
    watch(selectedCity, (newCity) => {
      if (newCity) localStorage.setItem('selectedCity', newCity);
    });
    watch(selectedDate, (newDate) => {
      if (newDate) localStorage.setItem('selectedDate', newDate);
    });
    
    // Form validation function
    const validateForm = async () => {
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
      
      // If form is valid, fetch and filter movies
      if (isValid) {
        try {
          isLoading.value = true
          // Get movies with projections for selected date and city
          const filteredMovies = await movieService.getMoviesWithProjections()
          movies.value = filteredMovies
          
          if (filteredMovies.length === 0) {
            debugInfo.value = 'No movies found for the selected date and city.'
          } else {
            debugInfo.value = `Found ${filteredMovies.length} movies for ${selectedDate.value} in ${formatCityName(selectedCity.value)}`
          }
        } catch (error) {
          console.error('Error fetching movies:', error)
          hasError.value = true
          debugInfo.value = `Error: ${error.message}`
        } finally {
          isLoading.value = false
        }
      }
    }
    
    // Format city name function
    const formatCityName = (cityName) => {
      if (!cityName) return '';
      return cityName.replace('_', ' ').split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    // Function to toggle the view between the add movie form and the movie list
    const toggleAddMovieForm = () => {
      showAddMovieForm.value = !showAddMovieForm.value;
      console.log('Showing the add movie form:', showAddMovieForm.value);
    }
    
    // function for adding a movie
    const handleAddMovieForm = async (event) => {
      event.preventDefault();
      
      try {
        // Take the data from the form
        const form = event.target;
        const formData = new FormData(form);
        
        // Use movieService to create the movie
        await movieService.createMovieFromForm(formData);
        
        // Reload the movies and hide the form
        movies.value = await programService.getAllMoviesForProgram();
        showAddMovieForm.value = false;
        
      } catch (error) {
        console.error('Error creating movie:', error);
        alert(`Error adding movie: ${error.message}`);
      }
    };
    
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
      toggleAddMovieForm,
      handleAddMovieForm
    }
  },
  template: `
    <div class="program-container">
      
      <div class="form-row m-5">
        <form @submit.prevent>
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
              <option value="Sofia">Sofia</option>
              <option value="Plovdiv">Plovdiv</option>
              <option value="Stara_Zagora">Stara Zagora</option>
              <option value="Ruse">Ruse</option>
              <option value="Burgas">Burgas</option>
              <option value="Varna">Varna</option>
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
      
      <!-- ADD MOVIE FORM - when showAddMovieForm is true -->
      <div class="content" v-if="showAddMovieForm && isadmin">
        <h1 class="text-center mt-2">
        <span class="badge badge-pill badge-add">Add</span>
        <span class="badge badge-pill badge-movie">Movie</span>
        </h1>

        <form class="welcome add-movie-form" @submit="handleAddMovieForm">
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
                <select class="browser-default custom-select movie-add" id="classMovie" name="movieClass">
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
  data() {
    return {
      editingMovieId: null,
      submissionAttempted: {},
      errorMessages: {},
      isAuthenticated: false
    }
  },
  async created() {
    // Check authentication status when component is created
    try {
      const user = await userService.getCurrentUser();
      this.isAuthenticated = !!user;
    } catch (error) {
      console.error('Error checking authentication:', error);
      this.isAuthenticated = false;
    }
  },
  methods: {
    // Add formatBookingTime method
    formatBookingTime(time) {
      if (!time) return '';
      const bookingTimeObj = new BookingTime(null, time);
      return bookingTimeObj.getFormattedTime();
    },
    
    toggleEditMode(movieId) {
      this.editingMovieId = this.editingMovieId === movieId ? null : movieId;
      // Reset validation state when toggling edit mode
      if (this.editingMovieId === movieId) {
        this.submissionAttempted[movieId] = false;
        this.errorMessages[movieId] = "";
      }
    },
    cancelEdit() {
      this.editingMovieId = null;
    },
    validateAndSubmit(event, movieId) {
      event.preventDefault();
      this.submissionAttempted[movieId] = true;
      
      // Get the select element
      const selectElement = event.target.form.querySelector('select[name="startMovie[]"]');
      
      // Check if at least one option is selected
      if (selectElement.selectedOptions.length === 0) {
        this.errorMessages[movieId] = "You must select at least one booking time!";
        return;
      }

      // Convert selected options to array of values
      const selectedTimes = Array.from(selectElement.selectedOptions).map(option => option.value);
      
      // Call the service to update projection time
      programService.updateProjectionTime(movieId, selectedTimes)
        .then(async response => {
          // Refresh all movies data
          const updatedMovies = await programService.getAllMoviesForProgram();
          this.$parent.movies = updatedMovies;
          
          // Reset edit mode and error state
          this.editingMovieId = null;
          this.submissionAttempted[movieId] = false;
          this.errorMessages[movieId] = "";
        })
        .catch(error => {
          console.error('Error updating projection time:', error);
          this.errorMessages[movieId] = error.message || "Failed to update projection time";
        });
    },
    // Function for deleting a movie
    async deleteMovie(event, movieId) {
      event.preventDefault();
      
      if (!confirm('Are you sure you want to delete this movie?')) {
        return;
      }

      try {
        await movieService.deleteMovie(movieId);
        // Refresh all movies data after successful deletion
        const updatedMovies = await programService.getAllMoviesForProgram();
        this.$parent.movies = updatedMovies;
      } catch (error) {
        console.error('Error deleting movie:', error);
        alert('Failed to delete movie: ' + error.message);
      }
    },
    async handleBookingTimeClick(movieId, bookingTime) {
      // Clear all previous error messages
      this.errorMessages = {};
      this.submissionAttempted = {};
      
      console.log('handleBookingTimeClick called with:', { movieId, bookingTime });
      
      // Check if date and city are selected
      const selectedDate = this.$parent.selectedDate;
      const selectedCity = this.$parent.selectedCity;
      
      if (!selectedDate || !selectedCity) {
        this.errorMessages[movieId] = "Please select a date and city before reserving a ticket!";
        this.submissionAttempted[movieId] = true;
        return;
      }
      
      // Check if user is authenticated
      if (!this.isAuthenticated) {
        this.errorMessages[movieId] = "Please log in to reserve a ticket!";
        this.submissionAttempted[movieId] = true;
        return;
      }
      
      // If all validations pass, proceed with booking
      const movie = this.movies.find(m => m.id === movieId);
      console.log('Found movie:', movie);
      
      if (movie) {
        console.log('Movie booking times:', movie.bookingTimes);
        
        // Find the booking time object from movie.bookingTimes
        const selectedBookingTime = movie.bookingTimes.find(bt => bt.bookingTime === bookingTime);
        console.log('Selected booking time:', selectedBookingTime);
        
        if (!selectedBookingTime) {
          console.error('Booking time not found:', bookingTime);
          return;
        }

        try {
          // Store the selected booking time object in sessionStorage
          console.log('Storing selected booking time:', selectedBookingTime);
          sessionStorage.setItem('bookingTimeData', JSON.stringify(selectedBookingTime));
          
          // Verify the data was stored
          const storedData = sessionStorage.getItem('bookingTimeData');
          console.log('Verified stored data:', storedData);
          
          const params = new URLSearchParams({
            movieId: movieId,
            bookingTimeValue: selectedBookingTime.bookingTime,
            movieName: movie.name,
            date: selectedDate,
            location: selectedCity
          });
          
          console.log('Redirecting with params:', params.toString());
          window.location.href = `/order/order-tickets?${params.toString()}`;
        } catch (error) {
          console.error('Error storing booking time data:', error);
          alert('Error preparing booking data. Please try again.');
        }
      }
    }
  },
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
        <div class="screening-type">{{ movie.projectionFormat ? movie.projectionFormat.slice(2) : '2D' }}</div>

        <div class="info-booking-times">
          <!-- Show form when editing this movie, otherwise show times -->
          <template v-if="editingMovieId === movie.id">
            <section class="update-projection-time-section">
              <!--Choose new projection time -->
              <form @submit.prevent="validateAndSubmit" class="form-group">
                <select class="browser-default custom-select" name="startMovie[]" id="startMovie" multiple>
                  <option value="">Select booking time</option>
                  <option value="_10_20">10:20</option>
                  <option value="_11_50">11:50</option>
                  <option value="_12_20">12:20</option>
                  <option value="_13_50">13:50</option>
                  <option value="_14_20">14:20</option>
                  <option value="_15_50">15:50</option>
                  <option value="_16_20">16:20</option>
                  <option value="_17_50">17:50</option>
                  <option value="_18_20">18:20</option>
                  <option value="_19_50">19:50</option>
                  <option value="_20_20">20:20</option>
                  <option value="_20_50">20:50</option>
                </select>

                <small class="text-danger" v-show="submissionAttempted[movie.id] && errorMessages[movie.id]">{{ errorMessages[movie.id] }}</small>

                <!-- Save and Cancel buttons -->
                <div class="button-holder d-flex justify-edit-time">
                  <button type="submit" class="btn btn-info admin-btn-add" @click="validateAndSubmit($event, movie.id)">Save</button>
                  <button type="button" @click="cancelEdit" class="btn btn-cancel mb-2">Cancel</button>
                </div>
              </form>
            </section>
          </template>
          <template v-else>
            <template v-if="!movie.bookingTimes || movie.bookingTimes.length === 0">
              <a class="h4">Coming soon</a>
            </template>
            <template v-else>
              <a v-for="time in movie.bookingTimes" 
                  :key="time.id" 
                  @click.prevent="handleBookingTimeClick(movie.id, time.bookingTime)"
                  class="btn btn-primary btn-lg">
                  {{ formatBookingTime(time.bookingTime) }}
              </a>
            </template>
          </template>
        </div>
        <div class="qb-movie-info-column">
          <div class="movie-info-column-item">
            <span class="movie-info-column-value">{{ movie.audio }}.</span>
            <span class="movie-info-column-label">-(SUB:</span>
            <span class="movie-info-column-value">{{ movie.subtitles }}.)</span>
          </div>
          <div class="admin-program-buttons" v-if="isadmin && editingMovieId !== movie.id">
            <a href="#" @click.prevent="toggleEditMode(movie.id)" 
              class="btn-lg">
              Update projection time
            </a>
            <div class="button-holder d-flex justify-content-center">
              <button type="button" class="btn btn-info mb-3" @click="deleteMovie($event, movie.id)">Delete Movie</button>
            </div>
          </div>
        </div>
        <!-- Error message for authentication -->
        <small class="text-danger" v-show="submissionAttempted[movie.id] && errorMessages[movie.id]">{{ errorMessages[movie.id] }}</small>
        </section>
      </li>
      <li class="clear">&nbsp;</li>
    </template>
  `
}

// Function for creating Vue application
export function createProgramVue() {
  console.log("Creating program Vue from program-view.js");
  const app = createApp({
    components: {
      ProgramApp
    },
    template: '<program-app></program-app>'
  });
  
  // Register global component
  app.component('program-movie-list', ProgramMovieList);
  
  return app;
}
