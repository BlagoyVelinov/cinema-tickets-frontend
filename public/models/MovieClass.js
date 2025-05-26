class MovieClass {
  constructor(name = null) {
    this.id = null;
    this.name = name;
    this.icon = '';
    this.description = '';
  }

  setId(id) {
    this.id = id;
    return this;
  }

  getId() {
    return this.id;
  }

  setName(name) {
    this.name = name;
    return this;
  }

  getName() {
    return this.name;
  }

  setIcon(icon) {
    this.icon = icon;
    return this;
  }

  getIcon() {
    return this.icon;
  }

  setDescription(description) {
    this.description = description;
    return this;
  }

  getDescription() {
    return this.description;
  }

  static fromJSON(json) {
    if (!json) return null;
    
    const movieClass = new MovieClass();
    movieClass.setId(json.id || null)
              .setName(json.name || null)
              .setIcon(json.icon || '')
              .setDescription(json.description || '');
    
    return movieClass;
  }
}

export default MovieClass;

