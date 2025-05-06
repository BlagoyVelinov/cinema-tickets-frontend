export const HallNumber = {
    HALL_1: "1",
    HALL_2: "2",
    HALL_3: "3",
    HALL_4: "4",
    HALL_5: "5",
    HALL_6: "6",
    HALL_7: "7",
    HALL_8: "8"
  };
  
  // Ако искаш и масив от стойности за dropdown-и:
  export const HallNumberOptions = Object.entries(HallNumber).map(([key, value]) => ({
    label: `Hall ${value}`,
    value: key
  }));
  