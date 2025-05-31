import { createApp, ref, onMounted, watch } from 'vue'
import { orderService } from '../services/order-service.js'
import BookingTime from '../models/BookingTime.js'
import userService from '../services/user-service.js'
import { OrderDto } from '../models/OrderDto.js'

const TICKET_TYPES = {
    CHILDREN_UNDER_16: { value: "Children under 16", price: 10.50 },
    PUPILS_AND_STUDENTS: { value: "Pupils and Students", price: 12.50 },
    PERSONS_OVER_60: { value: "People Over 60", price: 11.50 },
    REGULAR: { value: "Regular", price: 15.50 }
}

const OrderApp = {
    setup() {
        const order = ref(null)
        const orderDto = ref(new OrderDto())
        const isLoading = ref(true)
        const hasError = ref(false)
        const debugInfo = ref('Loading...')
        const selectedSeats = ref([])
        const showTicketSelection = ref(false)
        const showOrderTab = ref(false)
        const showTicketTypeDialog = ref(false)
        const currentSeat = ref(null)
        const seatTicketTypes = ref({})
        const userInfo = ref(null)
        const isTermsAccepted = ref(false)
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
            if (showOrderTab.value) {
                showOrderTab.value = false
                showTicketSelection.value = true
            } else if (showTicketSelection.value) {
                showTicketSelection.value = false
            } else {
                window.history.back()
            }
        }
        
        const deleteTicket = (seat) => {
            const idx = selectedSeats.value.findIndex(s => s.row === seat.row && s.col === seat.col)
            if (idx !== -1) {
                selectedSeats.value.splice(idx, 1)
                // If no more tickets, go back to seat selection
                if (selectedSeats.value.length === 0) {
                    showTicketSelection.value = false
                }
            }
        }
        
        const confirmSelection = async () => {
            if (!showTicketSelection.value) {
                showTicketSelection.value = true
                return
            }
            
            if (!showOrderTab.value) {
                try {
                    const currentUser = await userService.getCurrentUser()
                    console.log('Current user:', currentUser)
                    
                    if (currentUser) {
                        userInfo.value = {
                            firstName: currentUser.getUsername(),
                            lastName: currentUser.getName(),
                            email: currentUser.getEmail()
                        }
                        orderDto.value.user = currentUser
                        console.log('User info set:', userInfo.value)
                    } else {
                        alert('Please log in to continue with your order')
                        window.location.href = '/auth'
                        return
                    }
                } catch (error) {
                    console.error('Error getting current user:', error)
                    alert('Please log in to continue with your order')
                    window.location.href = '/auth'
                    return
                }
                showOrderTab.value = true
                return
            }
            
            if (!isTermsAccepted.value) {
                alert('Please accept the terms and conditions')
                return
            }
            
            try {
                // Update final order data in OrderDto
                orderDto.value.movieId = order.value.id
                orderDto.value.movieViewName = order.value.name
                orderDto.value.bookingTimeId = order.value.bookingTimeId
                orderDto.value.projectionDate = new Date(order.value.date)
                orderDto.value.location = order.value.cinema.toUpperCase()
                orderDto.value.bookingTime = order.value.time // Add booking time
                
                // Calculate ticket quantities
                orderDto.value.childQuantity = getTicketCount('CHILDREN_UNDER_16')
                orderDto.value.overSixtyQuantity = getTicketCount('PERSONS_OVER_60')
                orderDto.value.regularQuantity = getTicketCount('REGULAR')
                orderDto.value.studentQuantity = getTicketCount('PUPILS_AND_STUDENTS')
                
                orderDto.value.totalPrice = parseFloat(getTotalPrice())
                
                // Create tickets array with more details
                orderDto.value.tickets = selectedSeats.value.map(seat => ({
                    row: seat.row,
                    col: seat.col,
                    type: getTicketTypeForSeat(seat),
                    price: TICKET_TYPES[getTicketTypeForSeat(seat)].price,
                    movieName: order.value.name,
                    projectionDate: order.value.date,
                    bookingTime: order.value.time,
                    city: { location: order.value.cinema.toUpperCase() }
                }))
                
                // Log the order data before sending
                console.log('Sending order data to backend:', {
                    ...orderDto.value.toJSON(),
                    isFinished: false
                })
                
                const result = await orderService.createOrder(orderDto.value.toJSON())
                if (result) {
                    alert('Order created successfully!')
                    window.location.href = '/orders'
                }
            } catch (error) {
                console.error('Error creating order:', error)
                alert('Error creating order: ' + error.message)
            }
        }
        
        const openTicketTypeDialog = (seat) => {
            currentSeat.value = seat
            showTicketTypeDialog.value = true
        }
        
        const selectTicketType = (type) => {
            if (currentSeat.value) {
                const seatKey = `${currentSeat.value.row}-${currentSeat.value.col}`
                seatTicketTypes.value[seatKey] = type
                showTicketTypeDialog.value = false
            }
        }
        
        const getTicketTypeForSeat = (seat) => {
            const seatKey = `${seat.row}-${seat.col}`
            return seatTicketTypes.value[seatKey] || 'REGULAR'
        }
        
        const getTicketPrice = (seat) => {
            const type = getTicketTypeForSeat(seat)
            return TICKET_TYPES[type].price.toFixed(2)
        }
        
        const getTotalPrice = () => {
            return (selectedSeats.value.reduce((total, seat) => {
                return total + TICKET_TYPES[getTicketTypeForSeat(seat)].price
            }, 0) + 1.98).toFixed(2)
        }
        
        const getTicketTypeLabel = (seat) => {
            const type = getTicketTypeForSeat(seat)
            return TICKET_TYPES[type].value
        }
        
        const getTicketCount = (type) => {
            return selectedSeats.value.filter(seat => getTicketTypeForSeat(seat) === type).length
        }
        
        const getTicketTypeTotal = (type) => {
            const count = getTicketCount(type)
            return (count * TICKET_TYPES[type].price).toFixed(2)
        }
        
        const getOrderSummary = () => {
            const summary = []
            Object.keys(TICKET_TYPES).forEach(type => {
                const count = getTicketCount(type)
                if (count > 0) {
                    summary.push({
                        type: TICKET_TYPES[type].value,
                        count: count,
                        price: getTicketTypeTotal(type)
                    })
                }
            })
            return summary
        }
        
        onMounted(async () => {
            try {
                console.log('Order view mounted')
                const urlParams = new URLSearchParams(window.location.search)
                const movieId = urlParams.get('movieId')
                const bookingTimeValue = urlParams.get('bookingTimeValue')
                const date = urlParams.get('date')
                const location = urlParams.get('location')
                
                console.log('URL params:', { movieId, bookingTimeValue, date, location })
                
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
                
                // Get current user on mount
                try {
                    const currentUser = await userService.getCurrentUser()
                    if (currentUser) {
                        userInfo.value = {
                            firstName: currentUser.getUsername(),
                            lastName: currentUser.getName(),
                            email: currentUser.getEmail()
                        }
                        // Initialize OrderDto with user info
                        orderDto.value.user = currentUser
                        console.log('User info loaded on mount:', userInfo.value)
                    } else {
                        console.warn('No user found on mount')
                    }
                } catch (userError) {
                    console.warn('Error loading user info:', userError)
                }
                
                const movieInfo = await orderService.getMovieInfo(movieId)
                if (!movieInfo) {
                    throw new Error('Movie info not found')
                }
                
                console.log('Movie info:', movieInfo);
                
                // Add booking time info to the movie info
                order.value = {
                    ...movieInfo,
                    id: movieId,
                    bookingTimeId: bookingTimeData.id,
                    time: new BookingTime(bookingTimeData.id, bookingTimeData.bookingTime).getFormattedTime(),
                    date,
                    cinema: location
                }
                
                // Initialize OrderDto with movie and booking info
                orderDto.value.movieId = movieId
                orderDto.value.bookingTimeId = bookingTimeData.id
                orderDto.value.movieViewName = movieInfo.name
                orderDto.value.projectionDate = new Date(date)
                orderDto.value.location = location.toUpperCase()
                
                console.log('Final order value:', order.value);
                console.log('OrderDto initialized:', orderDto.value);
                
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
            orderDto,
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
            showOrderTab,
            deleteTicket,
            showTicketTypeDialog,
            openTicketTypeDialog,
            selectTicketType,
            getTicketTypeLabel,
            getTicketPrice,
            getTotalPrice,
            TICKET_TYPES,
            userInfo,
            isTermsAccepted,
            getOrderSummary,
            getTicketTypeForSeat,
            getTicketCount
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
                <section v-else-if="!showOrderTab" class="change-tickets">
                    <header class="title">
                        <h3>Choose tickets</h3>
                        <p>You have <span>{{ selectedSeats.length }}</span> seats selected, please SELECT THE TYPE OF EACH TICKET:</p>
                    </header>
                    <hr>
                    <section v-for="seat in selectedSeats" :key="seat.row + '-' + seat.col" class="section ticket-section">
                        <section class="seats-info">
                            <article class="icon-and-title">
                                <i class="fa-solid fa-ticket"></i>
                                <span>{{ getTicketTypeLabel(seat) }}</span>
                            </article>
                            <article class="row-and-coll">
                                <span class="row">Row: {{ seat.row }}</span>
                                <span class="coll">Place: {{ seat.col }}</span>
                            </article>
                        </section>
                        <section class="button-and-price">
                            <button class="change-type-ticket" @click="openTicketTypeDialog(seat)"> CHANGE </button>
                            <span class="price-ticket">{{ getTicketPrice(seat) }} lv.</span>
                            <button class="delete-ticket" @click="deleteTicket(seat)"> x </button>
                        </section>
                    </section>
                    <hr>
                    <section class="section price-section">
                        <article class="price-text">
                            <p class="price-description">Total (including all taxes and fees)</p>
                            <p class="price-fee">Includes administrative fee (1.98 lv)</p>
                        </article>
                        <p class="total-price">{{ getTotalPrice() }} lv.</p>
                    </section>
                    <div class="actions">
                        <button class="btn-cancel" @click="goBack">Back</button>
                        <button class="btn-confirm" @click="confirmSelection">Next</button>
                    </div>
                </section>
    
                <!-- Order Summary Tab -->
                <section v-else class="change-tickets">
                    <header class="title">
                        <h3>Order summary</h3>
                    </header>
                    <hr>
                    <section class="section ticket-section-summary">
                        <article v-for="item in getOrderSummary()" :key="item.type" class="count-tickets-summary">
                            <p></p>
                            <p>{{ item.count }} x {{ item.type }}</p>
                            <p>{{ item.price }} lv.</p>
                        </article>
                        <article class="admin-fee">
                            <p class="price-fee">Includes administrative fee 1.98 lv</p>
                        </article>
                    </section>
                    <hr>
                    <section class="section price-section-summary">
                        <article class="price-text">
                            <p class="price-description">Total (including all taxes and fees)</p>
                            <p class="total-price">{{ getTotalPrice() }} lv.</p>
                        </article>
                        <p class="price-info">This amount includes an administration fee.</p>
                        <p class="learn-more">Read more in <a href="/">Terms of online sales</a></p>
                    </section>
                    <section class="user-contacts">
                        <h2 class="title-summary">Your contacts</h2>
                        <p class="user-first-name">Username</p>
                        <p class="text">{{ userInfo?.firstName || 'N/A' }}</p>
                        <p class="user-last-name">Full Name</p>
                        <p class="text">{{ userInfo?.lastName || 'N/A' }}</p>
                        <p class="user-email">Email</p>
                        <p class="text">{{ userInfo?.email || 'N/A' }}</p>
                        </section>
                        
                    <article class="checkbox-container">
                        <input type="checkbox" id="myCheck" v-model="isTermsAccepted">
                        <label for="myCheck">I have read and agree to the Privacy Policy and General Terms and Conditions of Cinema City, the Rules for Online Reservation and Ticket Sales, and the 4DX Rules.</label>
                    </article>
                    <section class="payment-method">
                        <h2 class="title-payment">Choose a payment method</h2>
                        <button class="text-and-icon">
                            <i class="fa-regular fa-credit-card"></i>
                            <p class="text-payment">Payment with credit card</p>
                        </button>
                        <button class="payment-button" @click="confirmSelection">Pay Now</button>
                    </section>
                    <div class="actions">
                        <button class="btn-cancel" @click="goBack">Back</button>
                    </div>
                </section>
    
                <!-- Ticket Type Dialog -->
                <div v-if="showTicketTypeDialog" class="ticket-type-dialog-overlay">
                    <div class="ticket-type-dialog">
                        <h3>Select Ticket Type</h3>
                        <div class="ticket-type-options">
                            <button v-for="(type, key) in TICKET_TYPES" 
                                    :key="key"
                                    @click="selectTicketType(key)"
                                    class="ticket-type-option">
                                {{ type.value }} - {{ type.price.toFixed(2) }} lv.
                            </button>
                        </div>
                        <button class="btn-cancel" @click="showTicketTypeDialog = false">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
}

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
