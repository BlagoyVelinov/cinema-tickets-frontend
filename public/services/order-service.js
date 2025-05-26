import { movieService } from '../services/movie-service.js'

function getParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name) || '';
}

function formatDateMonth(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function formatDateDayOfWeek(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

async function loadMovieInfo() {
  try {
    const movieId = getParam('movieId');
    if (!movieId) {
      console.error('No movie ID provided');
      return;
    }

    const movie = await movieService.getMovieById(movieId);
    if (!movie) {
      console.error('Movie not found');
      return;
    }

    // Debug информация
    console.log('Movie data from API:', movie);
    console.log('Movie name:', movie.name);
    console.log('Movie subtitles:', movie.subtitles);
    console.log('Movie audio:', movie.audio);
    console.log('Movie length:', movie.movieLength);

    const movieData = {
      name: movie.name || getParam('movieName') || '',
      imageUrl: movie.imageUrl,
      cinema: getParam('location') || 'Cinema City Sofia - Mall of Sofia',
      date: getParam('date') || 'May',
      time: getParam('time') || '19:00',
      duration: movie.movieLength || '169 min',
      language: movie.subtitles || 'Sub BG',
      audio: movie.audio || '',
      premiere: getParam('date') || 'Premiere date: May 23'
    };

    // Update DOM elements if they exist
    const elements = {
      'movieName': movieData.name,
      'moviePoster': movieData.imageUrl,
      'movieCinema': `Cinema Tickets - ${movieData.cinema.charAt(0).toUpperCase() + movieData.cinema.slice(1).replace('_', ' ').toLowerCase()}`,
      'movieDateTime': `Projection in ${formatDateDayOfWeek(movieData.date)} ${formatDateMonth(movieData.date)} ${movieData.time.replace('_', ' ').replace('_', ':')}`,
      'movieDuration': `${movieData.duration} min`,
      'movieLanguage': `${movieData.audio} / ${movieData.language}`,
      'moviePremiere': movieData.premiere
    };

    for (const [id, value] of Object.entries(elements)) {
      const element = document.getElementById(id);
      element.style.textTransform = "none";
      element.style.fontSize = "1.2rem";  
      if (element) {
        if (id === 'moviePoster') {
          element.src = value;
        } else {
          element.textContent = value;
        }
      } else {
        console.warn(`Element with id "${id}" not found`);
      }
    }
  } catch (error) {
    console.error('Error loading movie info:', error);
  }
}

// --- Seat map logic ---
const ROWS = 12;
const COLS = 20;
const MAX_SELECT = 10;
const wheelchairSeats = [
  { row: 12, col: 1 }, { row: 12, col: 2 }, { row: 12, col: 3 },
  { row: 12, col: 18 }, { row: 12, col: 19 }, { row: 12, col: 20 }
];
const occupiedSeats = [
  { row: 8, col: 8 }, { row: 8, col: 9 }, { row: 8, col: 10 },
  { row: 9, col: 8 }, { row: 9, col: 9 }, { row: 9, col: 10 },
  { row: 10, col: 8 }, { row: 10, col: 9 }, { row: 10, col: 10 },
];
let selectedSeats = [];

function renderSeats() {
  const container = document.getElementById('seatsContainer');
  if (!container) {
    console.error('Seats container not found');
    return;
  }

  container.innerHTML = '';
  for (let row = 1; row <= ROWS; row++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'seat-row';
    for (let col = 1; col <= COLS; col++) {
      const seatDiv = document.createElement('div');
      seatDiv.className = 'seat';
      seatDiv.textContent = col;
      // Wheelchair
      if (wheelchairSeats.some(s => s.row === row && s.col === col)) {
        seatDiv.classList.add('wheelchair');
        seatDiv.title = 'Инвалидно място';
      }
      // Occupied
      else if (occupiedSeats.some(s => s.row === row && s.col === col)) {
        seatDiv.classList.add('occupied');
        seatDiv.title = 'Заето място';
      }
      // Selected
      else if (selectedSeats.some(s => s.row === row && s.col === col)) {
        seatDiv.classList.add('selected');
        seatDiv.title = 'Вашият избор';
      }
      seatDiv.dataset.row = row;
      seatDiv.dataset.col = col;
      seatDiv.addEventListener('click', onSeatClick);
      rowDiv.appendChild(seatDiv);
    }
    container.appendChild(rowDiv);
  }

  const selectedCountElement = document.getElementById('selectedCount');
  const confirmBtn = document.getElementById('confirmBtn');
  
  if (selectedCountElement) {
    selectedCountElement.textContent = selectedSeats.length;
  }
  
  if (confirmBtn) {
    confirmBtn.disabled = selectedSeats.length === 0;
  }
}

function onSeatClick(e) {
  const seat = e.currentTarget;
  const row = parseInt(seat.dataset.row);
  const col = parseInt(seat.dataset.col);
  if (seat.classList.contains('occupied') || seat.classList.contains('wheelchair')) return;
  const idx = selectedSeats.findIndex(s => s.row === row && s.col === col);
  if (idx === -1) {
    if (selectedSeats.length >= MAX_SELECT) return;
    selectedSeats.push({ row, col });
  } else {
    selectedSeats.splice(idx, 1);
  }
  renderSeats();
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  await loadMovieInfo();
  
  const confirmBtn = document.getElementById('confirmBtn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', function() {
      alert('Избраните места: ' + selectedSeats.map(s => `Р${s.row}-М${s.col}`).join(', '));
      // Тук може да се направи POST заявка към бекенда с избраните места
    });
  }
  
  renderSeats();
});