import { movieService } from '../services/movie-service.js'
import { createOrderVue } from '../js/order-view.js'

class OrderService {
    constructor() {
        this.orderEndpoint = '/api/order'
        console.log('OrderService initialized with endpoint:', this.orderEndpoint)
    }

    getParam(name) {
        const url = new URL(window.location.href)
        return url.searchParams.get(name) || ''
    }

    formatDateMonth(dateStr) {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    }

    formatDateDayOfWeek(dateStr) {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { weekday: 'long' })
    }

    async getOrderById(orderId) {
        try {
            const response = await fetch(`${this.orderEndpoint}/${orderId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })

            if (!response.ok) {
                throw new Error(`Error fetching order: ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('Error fetching order:', error)
            return null
        }
    }

    async getMovieInfo(movieId) {
        try {
            const movie = await movieService.getMovieById(movieId)
            if (!movie) {
                throw new Error('Movie not found')
            }

            const date = this.getParam('date') || new Date().toLocaleDateString()
            const time = this.getParam('time') || '19:00'
            const location = this.getParam('location') || 'Cinema Tickets - Sofia'

            return {
                name: movie.name || this.getParam('movieName') || '',
                imageUrl: movie.imageUrl,
                cinema: `Cinema Tickets - ${location}`,
                date: this.formatDateMonth(date),
                dayOfWeek: this.formatDateDayOfWeek(date),
                time: time,
                duration: `${movie.movieLength} min.` || '120 min',
                language: movie.subtitles || 'BG',
                audio: movie.audio || '',
                premiere: `Premiere: ${date}` || 'Premiere'
            }
        } catch (error) {
            console.error('Error loading movie info:', error)
            return null
        }
    }

    async createOrder(orderData) {
        try {
            const response = await fetch(this.orderEndpoint, {
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

    initOrderVue() {
        console.log('order-service.js: Initializing OrderVue from order-view.js')
        return createOrderVue()
    }
}

const orderService = new OrderService()
export { orderService }
export default orderService