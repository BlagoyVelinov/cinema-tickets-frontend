
class OrderDto {
    constructor() {
      this.id = null;
      this.movieId = null;
      this.bookingTimeId = null;
      this.movieViewName = '';
      this.orderNumber = null;
      this.childQuantity = null;
      this.overSixtyQuantity = '';
      this.regularQuantityitles = '';
      this.studentQuantity = '';
      this.totalPrice = '';
      this.bookingTime = '';
      this.tickets = [];
      this.projectionDate = null;
      this.location = null;
      this.user = null;
      this.startDate = "";
      this.endDate = "";

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
        regularQuantityitles: this.regularQuantityitles,
        studentQuantity: this.studentQuantity,
        totalPrice: this.totalPrice,
        bookingTime: this.bookingTime,
        tickets: this.tickets,
        projectionDate: this.projectionDate,
        location: this.location,
        user: this.user,
        startDate: this.startDate,
        endDate: this.endDate,
      };
    }
  
    static fromJSON(json) {
      if (!json) {
        console.error('Received null or undefined JSON data');
        return null;
      }
  
      console.log('Parsing OrderDto from JSON:', json);
      
    }
  }
  
  export default OrderDto;