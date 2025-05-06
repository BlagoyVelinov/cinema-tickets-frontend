import { MovieClassEnum } from "./enums/MovieClassEnum.js";

class MovieClass {
  constructor(name = null) {
    this.id;
    this.name = null;
    this.icon = '';
    this.description = '';

    if (name) {
      this.setName(name);
    }
  }

  setId(id) {
    this.id = id;
    return this;
  }

  getId() {
    return this.id;
  }

  setName(name) {
    if (!MovieClassEnum[name]) {
      throw new Error(`Invalid MovieClassEnum: ${name}`);
    }

    this.name = name;
    this.setDescriptionFromEnum(name);
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

  setDescriptionFromEnum(enumKey) {
    const entry = MovieClassEnum[enumKey];
    if (entry) {
      this.description = entry.description;
      this.icon = entry.value;
    }
  }

  static generateId() {
    if (!this._counter) this._counter = 1;
    return this._counter++;
  }
}

export default MovieClass;

