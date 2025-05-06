// const container = document.querySelector('.container');
// const seats = document.querySelector('.row-seat .seat:not(.sold)');
// const count = document.getElementById('count');
// const total = document.getElementById('total');
// const movieSelect = document.getElementById('movie');
//
//
// populateUI();
//
// let ticketPrice = +movieSelect.nodeValue;
//
// function setMovieData(movieIndex, moviePrice) {
//     localStorage.setItem('selectedMovieIndex', movieIndex);
//     localStorage.setItem('selectedMoviePrice', moviePrice);
// }
//
// function updateSelectedCount() {
//     const selectedSeats = document.querySelectorAll('.row-seat .seat.selected');
//     const seatsIndex = [...selectedSeats].map(seat => [...seats].indexOf(seat));
//
//     localStorage.setItem('selectedSeats', JSON.stringify(seatsIndex));
//
//     const selectedSeatsCount = selectedSeats.length;
//     count.innerText = selectedSeatsCount;
//     total.innerText = selectedSeatsCount * ticketPrice;
//
//     setMovieData(movieSelect.selectedIndex, movieSelect.value);
//
// }
//
// function populateUI() {
//     const selectedSeats = JSON.parse(localStorage.getItem('selectedSeats'));
//
//     if (selectedSeats !== null && selectedSeats.length > -1) {
//         seats.forEach((seat, index) => {
//             if (selectedSeats.indexOf(index) > -1) {
//                 seat.classList.add("selected");
//             }
//         });
//     }
//     const selectedMovieIndex = localStorage.getItem('selectedMovieIndex');
//
//     if (selectedSeats !== null) {
//         movieSelect.selectedIndex = selectedMovieIndex;
//     }
// }
//
// movieSelect.addEventListener('change', e => {
//     ticketPrice += e.target.value;
//     setMovieData(e.target.selectedIndex, e.target.value);
//     updateSelectedCount();
// });
//
// container.addEventListener('click', evt => {
//     if (evt.target.classList.contains('seat') && !evt.target.classList.contains('sold')) {
//         evt.target.classList.toggle('selected');
//
//         updateSelectedCount();
//     }
// });
//
// updateSelectedCount();

const seatsContainer = document.getElementById('seats-container');
class Seat {
    constructor(row, col, booked) {
        this.row = row;
        this.col = col;
        this.booked = booked;

    }
}

seatsObjArr = [];

// for (let i = 0; i < 10; i++) {
//     for (let j = 0; j < 20; j++) {
//         seatsObjArr.push(new Seat(i, j, false));
//     }
// }

seatsObjArr.forEach(seat =>{
    const seatDiv = document.createElement('div');
    seatDiv.classList.add('seatt');
    seatDiv.classList.add(`row-${seat.row}`);
    seatDiv.classList.add(`row-${seat.col}`);

    seatsContainer.appendChild(seatDiv);
});

const toggleSelected = e => e.target.classList.toggle('selected');
let seats = Array.from(document.getElementsByClassName('seatt'));

for(seatt of seats) {
    seatt.addEventListener('click', toggleSelected);
}

bookBtn = document.getElementById('bookBtn');
const bookSeats = () => {
    seats.forEach(seat => {
        if (seat.classList.contains('selected')) {
            seat.classList.add('booked');
            seat.classList.remove('selected');
        }
    });
}

bookBtn.addEventListener('click', bookSeats);