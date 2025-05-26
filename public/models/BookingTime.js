export default class BookingTime {
  constructor(id, bookingTime) {
    this.id = id;
    this.bookingTime = bookingTime;
  }

  getId() {
    return this.id;
  }

  getBookingTime() {
    return this.bookingTime;
  }

  setBookingTime(bookingTime) {
    if (!bookingTime) {
      console.warn('Empty booking time provided');
      this.bookingTime = null;
      return this;
    }
    
    this.bookingTime = bookingTime;
    return this;
  }

  /**
   * Форматира времето от формата "_18_20" в "18:20"
   * @returns {string} Форматирано време
   */
  getFormattedTime() {
    if (!this.bookingTime) return '';
    return this.bookingTime.replace('_', ' ').replace('_', ':');
  }

  /**
   * Създава BookingTime обект от JSON данни
   * @param {Object} json - JSON обект с id и bookingTime
   * @returns {BookingTime} Нова инстанция на BookingTime
   */
  static fromJSON(json) {
    if (!json) return null;
    
    return new BookingTime(
      json.id || 0,
      json.bookingTime || null
    );
  }
}
