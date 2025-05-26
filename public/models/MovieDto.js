import BookingTime from './BookingTime.js';

class MovieDto {
  constructor() {
    this.id = null;
    this.name = '';
    this.movieLength = null;
    this.hallNumber = null;
    this.audio = '';
    this.subtitles = '';
    this.description = '';
    this.imageUrl = '';
    this.trailerUrl = '';
    this.projectionFormat = null;
    this.movieClass = null;
    this.genreCategories = [];
    this.bookingTimes = [];
  }

  setId(id) {
    this.id = id;
    return this;
  }

  setName(name) {
    this.name = name;
    return this;
  }

  setMovieLength(length) {
    this.movieLength = length;
    return this;
  }

  setHallNumber(hallNumber) {
    this.hallNumber = hallNumber;
    return this;
  }

  setAudio(audio) {
    this.audio = audio;
    return this;
  }

  setSubtitles(subtitles) {
    this.subtitles = subtitles;
    return this;
  }

  setDescription(description) {
    this.description = description;
    return this;
  }

  setImageUrl(url) {
    this.imageUrl = url;
    return this;
  }

  setTrailerUrl(url) {
    this.trailerUrl = url;
    return this;
  }

  setProjectionFormat(format) {
    this.projectionFormat = format;
    return this;
  }

  setMovieClass(movieClass) {
    this.movieClass = movieClass;
    return this;
  }

  setGenreCategories(genres) {
    this.genreCategories = genres;
    return this;
  }

  setBookingTimes(times) {
    this.bookingTimes = times;
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      movieLength: this.movieLength,
      hallNumber: this.hallNumber,
      audio: this.audio,
      subtitles: this.subtitles,
      description: this.description,
      imageUrl: this.imageUrl,
      trailerUrl: this.trailerUrl,
      projectionFormat: this.projectionFormat,
      movieClass: this.movieClass,
      genreCategories: this.genreCategories,
      bookingTimes: this.bookingTimes,
    };
  }

  static fromJSON(json) {
    if (!json) {
      console.error('Received null or undefined JSON data');
      return null;
    }

    console.log('Parsing MovieDto from JSON:', json);
    
    try {
      const dto = new MovieDto();
      
      dto.setId(json.id || 0)
        .setName(json.name || 'Неизвестен филм')
        .setMovieLength(json.movieLength || json.duration || 0)
        .setHallNumber(json.hallNumber || null)
        .setAudio(json.audio || '')
        .setSubtitles(json.subtitles || '')
        .setDescription(json.description || 'Няма описание')
        .setImageUrl(json.imageUrl || '/images/default-movie.jpg')
        .setTrailerUrl(json.trailerUrl || '')
        .setProjectionFormat(json.projectionFormat || null);
  
      if (json.movieClass) {
        console.log('Setting movieClass:', json.movieClass);
        dto.setMovieClass(json.movieClass);
      }
  
      if (json.genreCategories && Array.isArray(json.genreCategories)) {
        console.log('Setting genreCategories:', json.genreCategories);
        dto.setGenreCategories(json.genreCategories);
      } else if (json.genre) {
        console.log('Setting genre as categories:', json.genre);
        if (typeof json.genre === 'string') {
          dto.setGenreCategories([json.genre]);
        } else if (Array.isArray(json.genre)) {
          dto.setGenreCategories(json.genre);
        } else {
          dto.setGenreCategories([]);
        }
      } else {
        dto.setGenreCategories([]);
      }

      if (json.bookingTimes && Array.isArray(json.bookingTimes)) {
        console.log('Converting booking times:', json.bookingTimes);
        try {
          const bookingTimes = json.bookingTimes
            .filter(bt => bt != null)
            .map(bt => BookingTime.fromJSON(bt));
          console.log('Processed booking times:', bookingTimes);
          dto.setBookingTimes(bookingTimes);
        } catch (err) {
          console.error('Error converting booking times:', err);
          dto.setBookingTimes([]);
        }
      } else {
        dto.setBookingTimes([]);
      }
      
      console.log('Successfully created MovieDto:', dto);
      return dto;
    } catch (err) {
      console.error('Error in MovieDto.fromJSON:', err);
      const fallbackDto = new MovieDto();
      fallbackDto.setId(json.id || 0)
                 .setName(json.name || 'Филм с грешка')
                 .setDescription('Грешка при обработка на данните')
                 .setImageUrl('/images/default-movie.jpg');
      return fallbackDto;
    }
  }
}

export default MovieDto;
