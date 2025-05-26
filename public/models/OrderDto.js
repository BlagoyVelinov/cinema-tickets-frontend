import { Ticket } from './TicketDto.js';
import { UserDto } from './UserDto.js';

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
    this.tickets = tickets.map(t => Ticket.fromJSON(t));
    this.projectionDate = projectionDate ? new Date(projectionDate) : null;
    this.location = location;
    this.user = user ? UserDto.fromJSON(user) : null;
    this.startDate = startDate ? new Date(startDate) : null;
    this.endDate = endDate ? new Date(endDate) : null;
  }

  toJSON() {
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
      tickets: this.tickets.map(t => t.toJSON()),
      projectionDate: this.projectionDate ? this.projectionDate.toISOString().split('T')[0] : null,
      location: this.location,
      user: this.user,
      startDate: this.startDate ? this.startDate.toISOString().split('T')[0] : null,
      endDate: this.endDate ? this.endDate.toISOString().split('T')[0] : null,
    };
  }

  static fromJSON(json) {
    if (!json) return null;
    return new OrderDto(json);
  }

  get projectionDateView() {
    if (!this.projectionDate) return '';
    return this.projectionDate.toLocaleDateString('bg-BG'); // или използвай formatter ако искаш "dd-MM-yyyy"
  }
}

export default OrderDto;
