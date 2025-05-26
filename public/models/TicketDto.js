import { CityDto } from './CityDto';


export class Ticket {
    constructor({
      movieName,
      hallNumber,
      numberOfSeat,
      numberOfRow,
      price,
      projectionDate,
      movieClassDescription,
      bookingTime,
      ticketType,
      city,
      isFinished
    }) {
      this.movieName = movieName;
      this.hallNumber = hallNumber;
      this.numberOfSeat = numberOfSeat;
      this.numberOfRow = numberOfRow;
      this.price = price;
      this.projectionDate = projectionDate;
      this.movieClassDescription = movieClassDescription;
      this.bookingTime = bookingTime;
      this.ticketType = ticketType;
      this.city = city ? CityDto.fromJSON(city) : null;
      this.isFinished = isFinished;
    }
  
    static fromJSON(json) {
      return new Ticket({
        ...json,
        projectionDate: json.projectionDate ? new Date(json.projectionDate) : null
      });
    }
  
    toJSON() {
      return {
        movieName: this.movieName,
        hallNumber: this.hallNumber,
        numberOfSeat: this.numberOfSeat,
        numberOfRow: this.numberOfRow,
        price: this.price,
        projectionDate: this.projectionDate ? this.projectionDate.toISOString().split('T')[0] : null,
        movieClassDescription: this.movieClassDescription,
        bookingTime: this.bookingTime,
        ticketType: this.ticketType,
        city: this.city,
        isFinished: this.isFinished
      };
    }
  }
  