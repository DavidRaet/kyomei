import { createUser } from "../dbQuery/userQuery.js";
/**
 * TODO: 
 * Implement signUp and login functions for the authService 
 */
export class AuthService {
    async signUp(username: string, email: string, password: string) {
        const user = createUser(username, email, password); 
        return user;
    }


    async login(email: string, password: string) {
        // will create a confirmUser function in the userQuery that 
        // will confirm the users information
        // one of the resulting errors may be thrown:
        // email is incorrect or doesn't exist,
        // password same concept
        // of both were typed wrong
        // either way return the same error status code 
        // and message
        return {}
    }


}


export const authService = new AuthService();