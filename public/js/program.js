import { createApp, ref, reactive, onMounted, watch } from 'vue'
import movieService from '../services/MovieService.js'

const ProgramApp = {
  setup() {
    const movies = ref([]);
    const filters = reactive({
      date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      location: '',
      isLoading: false,
      error: null,
      hasSearched: false
    });

    // Reference to the form elements
    const dateInput = ref(null);
    const citySelect = ref(null);

    // Method to load movies based on filters
    const loadMovies = async () => {
      if (!filters.date) {
        filters.error = "Please select a date";
        return;
      }

      if (!filters.location) {
        filters.error = "Please select a location";
        return;
      }

      filters.isLoading = true;
      filters.error = null;
      filters.hasSearched = true;

      try {
        const moviesWithProjections = await movieService.getMoviesWithProjections(
          filters.date, 
          filters.location
        );
        
        movies.value = moviesWithProjections;
        
        if (movies.value.length === 0) {
          filters.error = `No movies found for ${filters.location} on ${filters.date}`;
        }
      } catch (error) {
        console.error("Error loading movies:", error);
        filters.error = "Failed to load movies. Please try again.";
      } finally {
        filters.isLoading = false;
      }
    };

    // Format date for display
    const formatDate = (dateString) => {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Check if a date is in the past
    const isDateInPast = (dateString) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(dateString);
      return selectedDate < today;
    };
    
    // Watch for date changes to validate
    watch(() => filters.date, (newDate) => {
      if (isDateInPast(newDate)) {
        filters.error = "Selected date cannot be in the past";
      } else {
        filters.error = null;
      }
    });

    // Initialize with today's date
    onMounted(() => {
      if (dateInput.value) {
        dateInput.value.min = filters.date; // Prevent selecting past dates
      }
    });

    return {
      movies,
      filters,
      dateInput,
      citySelect,
      loadMovies,
      formatDate
    };
  },

  template: `
    <div>
      <h4 id="displayDate" v-if="filters.hasSearched">
        Movie Projections for {{filters.location}} on {{formatDate(filters.date)}}
      </h4>
      <h4 id="displayDate" v-else>Choose a date and city for reserve ticket</h4>
      
      <div v-if="filters.error" class="text-danger">{{filters.error}}</div>
      
      <div v-if="filters.isLoading" class="loading">Loading movies...</div>
      
      <ul class="list" id="movieList">
        <li class="movieList" v-for="movie in movies" :key="movie.id">
          <img :src="movie.imageUrl" :alt="movie.name" width="204px" height="219px" />
          <a :href="'/?trailer=' + movie.id" class="title-movie">{{movie.name}}</a><br />
          <span class="qb-movie-rating-info">
            <div class="qb-movie-info-wrapper">
              <div class="pt-xs">
                <span class="mr-sm">{{movie.genre}}</span>
                <span class="ml-xs">|</span>
                <span class="mr-xs">{{movie.duration}} min.</span>
                
                <!-- Booking times -->
                <div v-if="movie.bookingTimes && movie.bookingTimes.length > 0">
                  <template v-for="time in movie.bookingTimes.filter(t => t.date === filters.date && t.location === filters.location)">
                    <a :href="'/reservation/' + time.id" class="btn btn-primary btn-lg">{{time.time}}</a>
                  </template>
                </div>
                <div v-else>
                  <a class="h4">Coming soon</a>
                </div>
                
                <!-- Admin buttons - shown only for admins via CSS classes -->
                <a :href="'/program/update-projection-time/' + movie.id" class="btn btn-primary btn-lg admin-only">Update projection time</a>
                <form method="post" :action="'/movies/delete-movie/' + movie.id" class="admin-only">
                  <div class="button-holder d-flex justify-content-center">
                    <button type="submit" class="btn btn-info mb-3">Delete Movie</button>
                  </div>
                </form>
              </div>
            </div>
          </span>
        </li>
        <li v-if="movies.length === 0 && filters.hasSearched && !filters.error" class="no-results">
          No movies available for the selected date and location.
        </li>
      </ul>
    </div>
  `
};

// Mount the form handling component
const ProgramForm = {
  setup() {
    const programApp = ref(null);
    
    const submitForm = (e) => {
      e.preventDefault();
      
      // Call the loadMovies method from the ProgramApp component
      if (programApp.value) {
        programApp.value.loadMovies();
      }
    };
    
    return {
      programApp,
      submitForm
    };
  },
  
  template: `
    <form @submit="submitForm">
      <div class="col">
        <label for="dateInput">Date</label>
        <input 
          type="date" 
          name="projectionDate" 
          id="dateInput" 
          class="form-control"
          v-model="programApp.filters.date"
          ref="programApp.dateInput"
        />
        <small class="text-danger" v-if="programApp.filters.error && programApp.filters.error.includes('date')">
          {{programApp.filters.error}}
        </small>
      </div>

      <div class="form-group">
        <label for="cityName">Select City</label>
        <select 
          class="browser-default custom-select" 
          id="cityName" 
          name="location"
          v-model="programApp.filters.location"
          ref="programApp.citySelect"
        >
          <option value="">Select City</option>
          <option value="SOFIA">Sofia</option>
          <option value="PLOVDIV">Plovdiv</option>
          <option value="STARA_ZAGORA">Stara Zagora</option>
          <option value="RUSE">Ruse</option>
          <option value="BURGAS">Burgas</option>
          <option value="VARNA">Varna</option>
        </select>
        <small class="text-danger" v-if="programApp.filters.error && programApp.filters.error.includes('location')">
          {{programApp.filters.error}}
        </small>
      </div>

      <div class="button-holder d-flex justify-content-center">
        <button type="submit" class="btn btn-primary btn-lg">Search</button>
      </div>
    </form>
  `
};

document.addEventListener("DOMContentLoaded", function() {
  const movieListContainer = document.getElementById('movieList');
  const programFormContainer = document.querySelector('.form-row');
  
  if (movieListContainer) {
    const app = createApp(ProgramApp);
    const programAppInstance = app.mount('#movieList');
    
    if (programFormContainer) {
      const formApp = createApp(ProgramForm);
      formApp.provide('programApp', programAppInstance);
      formApp.mount('.form-row');
    }
  }
}); 