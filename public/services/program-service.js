import MovieService from './movie-service.js'
import { createProgramVue } from '../js/program-view.js'

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
    // Използваме функцията от program-view.js за създаване на Vue приложение
    console.log('program-service.js: Извикваме createProgramVue от program-view.js')
    return createProgramVue();
  }
}

// Export a singleton instance
const programService = new ProgramService()
export { programService }
export default programService
  