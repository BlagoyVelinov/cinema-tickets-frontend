export class CityDto {
    constructor({id, location}) {
        this.id = id;
        this.location = location;
    }

    static fromJSON(json) {
        return new CityDto({
            id: json.id,
            location: json.location
        });
    }

    toJSON() {
        return {
            id: this.id,
            location: this.location
        };
    }
}
