import BookingTimeEnum from './enums/booking-time-enum.js';

export default class BookingTime {
  constructor(id, bookingTime = null) {
    this.id = id || 0;
    this.bookingTime = bookingTime;
  }

  getId() {
    return this.id;
  }

  getBookingTime() {
    return this.bookingTime;
  }

  setBookingTime(bookingTime) {
    try {
      if (!bookingTime) {
        console.warn('Empty booking time provided');
        this.bookingTime = null;
        return this;
      }
      
      if (!BookingTimeEnum.values().includes(bookingTime)) {
        console.warn(`Invalid booking time: ${bookingTime}, using as-is`);
        this.bookingTime = bookingTime;
      } else {
        this.bookingTime = bookingTime;
      }
      return this;
    } catch (error) {
      console.error('Error setting booking time:', error);
      this.bookingTime = bookingTime; // Запазваме стойността въпреки грешката
      return this;
    }
  }

  static fromJSON(json) {
    console.log('Parsing BookingTime from', json);
    if (!json) return null;
    
    try {
      // Създаваме нова инстанция на BookingTime с подадените id и bookingTime
      const bookingTime = new BookingTime(json.id, json.bookingTime);
      
      // Допълнителни полета, ако има такива във входните данни
      if (json.date) bookingTime.date = json.date;
      if (json.location) bookingTime.location = json.location;
      if (json.time) bookingTime.time = json.time;
      
      return bookingTime;
    } catch (error) {
      console.error('Error creating BookingTime from JSON:', error, json);
      // Връщаме минимален валиден обект
      return new BookingTime(json.id || 0, null);
    }
  }
}
