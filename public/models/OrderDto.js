import { Ticket } from './TicketDto.js';
import UserDto from './UserDto.js';

export class OrderDto {
  constructor({
    id = null,
    movieId = null,
    bookingTimeId = null,
    movieViewName = '',
    orderNumber = '',
    childQuantity = 0,
    overSixtyQuantity = 0,
    regularQuantity = 0,
    studentQuantity = 0,
    totalPrice = 0.0,
    bookingTime = '',
    tickets = [],
    projectionDate = null,
    location = null,
    user = null,
    startDate = null,
    endDate = null,
    isFinished = false
  } = {}) {
    this.id = id;
    this.movieId = movieId;
    this.bookingTimeId = bookingTimeId;
    this.movieViewName = movieViewName;
    this.orderNumber = orderNumber;
    this.childQuantity = childQuantity;
    this.overSixtyQuantity = overSixtyQuantity;
    this.regularQuantity = regularQuantity;
    this.studentQuantity = studentQuantity;
    this.totalPrice = totalPrice;
    this.bookingTime = bookingTime;
    this.tickets = tickets;
    this.projectionDate = projectionDate ? new Date(projectionDate) : null;
    this.location = location;
    this.user = user;
    this.startDate = startDate ? new Date(startDate) : null;
    this.endDate = endDate ? new Date(endDate) : null;
    this.isFinished = isFinished;
  }

  toJSON() {
    // Format date to YYYY-MM-DD
    const formatDate = (date) => {
      if (!date) return null;
      const d = new Date(date);
      return d.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    };

    return {
      id: this.id,
      movieId: this.movieId,
      bookingTimeId: this.bookingTimeId,
      movieViewName: this.movieViewName,
      orderNumber: this.orderNumber,
      childQuantity: this.childQuantity,
      overSixtyQuantity: this.overSixtyQuantity,
      regularQuantity: this.regularQuantity,
      studentQuantity: this.studentQuantity,
      totalPrice: this.totalPrice,
      bookingTime: this.bookingTime,
      tickets: this.tickets.map(ticket => ({
        movieName: this.movieViewName,
        hallNumber: null,
        numberOfSeat: ticket.col,
        numberOfRow: ticket.row,
        price: ticket.price || 0,
        projectionDate: formatDate(this.projectionDate),
        movieClassDescription: null,
        bookingTime: this.bookingTime,
        ticketType: ticket.type,
        city: { location: this.location },
        isFinished: false
      })),
      projectionDate: formatDate(this.projectionDate),
      location: this.location,
      user: this.user ? {
        id: this.user.id,
        username: this.user.username,
        name: this.user.name,
        email: this.user.email,
        admin: this.user.admin
      } : null,
      startDate: formatDate(this.startDate),
      endDate: formatDate(this.endDate),
      isFinished: this.isFinished
    };
  }

  static fromJSON(json) {
    if (!json) return null;
    return new OrderDto(json);
  }

  get projectionDateView() {
    if (!this.projectionDate) return '';
    return this.projectionDate.toLocaleDateString('bg-BG');
  }
}

export default OrderDto;
