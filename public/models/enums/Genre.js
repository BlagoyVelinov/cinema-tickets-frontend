export const Genre = {
    ACTION: "Action",
    ADVENTURE: "Adventure",
    ANIMATION: "Animation",
    BULGARIAN: "Bulgarian",
    COMEDY: "Comedy",
    FAMILY: "Family",
    FANTASY: "Fantasy",
    HORROR: "Horror",
    MYSTERY: "Mystery",
    ROMANTIC: "Romantic",
    THRILLER: "Thriller",
    DRAMA: "Drama"
  };

  export const GenreOptions = Object.entries(Genre).map(([key, value]) => ({
    label: `Genre ${value}`,
    value: key
  }));
  