export default class UserDto {
    constructor() {
        this.id = null;
        this.username = '';
        this.email = '';
        this.admin = false;
    }

   getId() {
    return this.id;
   }

   getUsername() {
    return this.username;
   }    

   getEmail() {
    return this.email;
   }

   isAdmin() {
    return this.admin;
   }
    
   toJSON() {
    return {
        id: this.id,
        username: this.username,
        email: this.email,
        admin: this.admin
    }
   }

   static fromJSON(json) {
    const user = new UserDto();
    user.id = json.id;
    user.username = json.username;
    user.email = json.email;
    user.admin = json.admin;
    return user;
   }    
   
}