import { createApp, ref, onMounted, watch } from 'vue'
import { orderService } from '../services/order-service.js'
import BookingTime from '../models/BookingTime.js'

const OrderApp = {
    setup() {
        const order = ref(null)
        const isLoading = ref(true)
        const hasError = ref(false)
        const debugInfo = ref('Loading...')
        const selectedSeats = ref([])
        const showTicketSelection = ref(false)
        const showOrderTab = ref(false)
        const MAX_SELECT = 10
        const ROWS = 12
        const COLS = 20
        const wheelchairSeats = [
            { row: 12, col: 1 }, { row: 12, col: 2 }, { row: 12, col: 3 },
            { row: 12, col: 18 }, { row: 12, col: 19 }, { row: 12, col: 20 }
        ]
        const occupiedSeats = [
            { row: 8, col: 8 }, { row: 8, col: 9 }, { row: 8, col: 10 },
            { row: 9, col: 8 }, { row: 9, col: 9 }, { row: 9, col: 10 },
            { row: 10, col: 8 }, { row: 10, col: 9 }, { row: 10, col: 10 },
        ]

        const onSeatClick = (row, col) => {
            if (occupiedSeats.some(s => s.row === row && s.col === col) || 
                wheelchairSeats.some(s => s.row === row && s.col === col)) {
                return
            }
            const idx = selectedSeats.value.findIndex(s => s.row === row && s.col === col)
            if (idx === -1) {
                if (selectedSeats.value.length >= MAX_SELECT) return
                selectedSeats.value.push({ row, col })
            } else {
                selectedSeats.value.splice(idx, 1)
            }
        }

        const isSeatSelected = (row, col) => {
            return selectedSeats.value.some(s => s.row === row && s.col === col)
        }

        const isSeatOccupied = (row, col) => {
            return occupiedSeats.some(s => s.row === row && s.col === col)
        }

        const isWheelchairSeat = (row, col) => {
            return wheelchairSeats.some(s => s.row === row && s.col === col)
        }

        const goBack = () => {
            if (showTicketSelection.value) {
                showTicketSelection.value = false
            } else {
                window.history.back()
            }
        }

        const confirmSelection = async () => {
            if (!showTicketSelection.value) {
                showTicketSelection.value = true
                return
            }

            if (!showOrderTab.value) {
                showOrderTab.value = true
                return
            }

            try {
                const orderData = {
                    movieId: order.value.id,
                    name: order.value.name,
                    seats: selectedSeats.value,
                    date: order.value.date,
                    time: order.value.bookingTimeId,
                    city: order.value.cinema.toUpperCase()
                }
                
                const result = await orderService.createOrder(orderData)
                if (result) {
                    alert('Order created successfully!')
                    window.location.href = '/orders'
                }
            } catch (error) {
                alert('Error creating order: ' + error.message)
            }
        }

        onMounted(async () => {
            try {
                console.log('Order view mounted');
                const urlParams = new URLSearchParams(window.location.search)
                const movieId = urlParams.get('movieId')
                const bookingTimeValue = urlParams.get('bookingTimeValue')
                const date = urlParams.get('date')
                const location = urlParams.get('location')
                
                console.log('URL params:', { movieId, bookingTimeValue, date, location });
                
                if (!movieId) {
                    throw new Error('Movie ID not found')
                }

                if (!bookingTimeValue) {
                    throw new Error('Booking time value is required')
                }

                // Get booking time data from sessionStorage
                const bookingTimeDataStr = sessionStorage.getItem('bookingTimeData')
                console.log('Raw booking time data from sessionStorage:', bookingTimeDataStr);
                
                if (!bookingTimeDataStr) {
                    throw new Error('Booking time data not found in sessionStorage')
                }

                const bookingTimeData = JSON.parse(bookingTimeDataStr)
                console.log('Using booking time data:', bookingTimeData);

                const movieInfo = await orderService.getMovieInfo(movieId)
                if (!movieInfo) {
                    throw new Error('Movie info not found')
                }

                console.log('Movie info:', movieInfo);

                // Add booking time info to the movie info
                order.value = {
                    ...movieInfo,
                    bookingTimeId: bookingTimeData.id,
                    time: new BookingTime(bookingTimeData.id, bookingTimeData.bookingTime).getFormattedTime(),
                    date,
                    cinema: location
                }
                console.log('Final order value:', order.value);
                console.log('Time order value:', order.value.time);
                console.log('Time Id order value:', order.value.bookingTimeId);
                console.log('Order data-cinema:', order.value.cinema);
                console.log('Order data-Date:', order.value.date);
                
                isLoading.value = false
            } catch (error) {
                console.error('Error in onMounted:', error);
                hasError.value = true
                debugInfo.value = error.message
                isLoading.value = false
            }
        })

        return {
            order,
            isLoading,
            hasError,
            debugInfo,
            selectedSeats,
            ROWS,
            COLS,
            onSeatClick,
            isSeatSelected,
            isSeatOccupied,
            isWheelchairSeat,
            goBack,
            confirmSelection,
            showTicketSelection,
            showOrderTab
        }
    },
    template: `
    <div class="order-tickets-wrapper">
        <div class="order-tickets-content">
            <div class="breadcrumbs">
                <span :class="{ 'active': !showTicketSelection && !showOrderTab }">SEATS</span> &gt; 
                <span :class="{ 'active': showTicketSelection && !showOrderTab }">TICKETS</span> &gt; 
                <span :class="{ 'active': showOrderTab }">ORDER</span>
            </div>
            <div v-if="isLoading">Loading...</div>
            <div v-else-if="hasError">Error: {{ debugInfo }}</div>
            <div v-else>
                <div class="movie-info">
                    <img :src="order?.imageUrl || '../images/default-movie.jpg'" class="movie-poster" alt="Plakat">
                    <div class="movie-details">
                        <h2 class="movie-title">{{ order?.name || 'Loading...' }}</h2>
                        <div class="info-row">{{ order?.cinema }}</div>
                        <div class="info-row">
                            <i class='bx bx-calendar'></i>
                            <span>Projection in {{ order?.dayOfWeek }} {{ order?.date }} {{ order?.time }}</span>
                        </div>
                        <div class="info-row">
                            <span>{{ order?.duration }}</span>
                            <span>{{ order?.audio }} / {{ order?.language }}</span>
                            <span>{{ order?.premiere }}</span>
                        </div>
                    </div>
                </div>

                <!-- Seat Selection Tab -->
                <div v-if="!showTicketSelection">
                    <div class="max-seats-msg">You can choose a maximum of 10 seats.</div>
                    <div class="screen-label">IMAX</div>
                    <div class="hall-scheme">
                        <div class="seats">
                            <div v-for="row in ROWS" :key="row" class="seat-row">
                                <div v-for="col in COLS" 
                                    :key="col" 
                                    class="seat"
                                    :class="{
                                        'selected': isSeatSelected(row, col),
                                        'occupied': isSeatOccupied(row, col),
                                        'wheelchair': isWheelchairSeat(row, col)
                                    }"
                                    @click="onSeatClick(row, col)">
                                    {{ col }}
                                </div>
                            </div>
                        </div>
                        <div class="legend">
                            <span class="legend-item legend-free"></span> free seats
                            <span class="legend-item legend-selected"></span> your choice
                            <span class="legend-item legend-occupied"></span> occupied seats
                            <span class="legend-item legend-wheelchair"></span> wheelchair spaces
                        </div>
                        <div class="seat-counter">
                            <i class='bx bx-ticket'></i> <span>{{ selectedSeats.length }}</span>
                        </div>
                        <div class="actions">
                            <button class="btn-cancel" @click="goBack">Cancel</button>
                            <button class="btn-confirm" :disabled="selectedSeats.length === 0" @click="confirmSelection">Confirm</button>
                        </div>
                    </div>
                </div>

                <!-- Ticket Selection Tab -->
                <container v-else class="change-tickets">
                    <header class="title">
                        <h3>Choose tickets</h3>
                        <p>You have <span>{{ selectedSeats.length }}</span> seats selected, please SELECT THE TYPE OF EACH TICKET:</p>
                    </header>
                    <hr>
                    <section v-for="seat in selectedSeats" :key="seat.row + '-' + seat.col" class="section ticket-section">
                        <container class="seats-info">
                            <article class="icon-and-title">
                                <i class="fa-solid fa-ticket"></i>
                                <span>Regular</span>
                            </article>
                            <article class="row-and-coll">
                                <span class="row">Row: {{ seat.row }}</span>
                                <span class="coll">Place: {{ seat.col }}</span>
                            </article>
                        </container>
                        <container class="button-and-price">
                            <button class="change-type-ticket"> CHANGE </button>
                            <span class="price-ticket"> 17,00 lv.</span>
                            <button class="delete-ticket"> x </button>
                        </container>
                    </section>
                    <hr>
                    <section class="section price-section">
                        <article class="price-text">
                            <p class="price-description">Total (including all taxes and fees)</p>
                            <p class="price-fee">Includes administrative fee (1.98 lv)</p>
                        </article>
                        <p class="total-price">{{ (selectedSeats.length * 17 + 1.98).toFixed(2) }} lv.</p>
                    </section>
                    <div class="actions">
                        <button class="btn-cancel" @click="goBack">Cancel</button>
                        <button class="btn-confirm" @click="confirmSelection">Next</button>
                    </div>
                </container>
            </div>
        </div>
    </div>
    `
}

// Function for creating Vue application
export function createOrderVue() {
    console.log("Creating order Vue from order-view.js")
    const app = createApp({
        components: {
            OrderApp
        },
        template: '<order-app></order-app>'
    })
    
    return app
}
