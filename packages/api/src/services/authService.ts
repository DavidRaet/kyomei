import {createUser, getUserByEmail} from "../dbQuery/userQuery.js";
import { confirmPassword, hashPassword } from "../helpers/bcrypt.js";
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';


dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET;

/**
 * note: i should consider adding JWT to supplement user authentication 
 * Why JWT? JWT is often the most common implementation to identify authenticated users.
 * although this is simply a personal project, learning abot JWT will come in handy when 
 * diving into enterprise codebases that use it. 
 * the JWT is a standard for "transmitting information between two parties" in the form of a token (server -> client)
 * this token encapsulates and cryptographically (if thats a word) signs data, preventing malicious users from manipulating the data
 * JWT Structure: Header, Payload, Signature
 * Header defines the JWT Type and the algorithm used (RS256 or HS256)
 * Payload contains the information including the user ID, issue date, and authority 
 * The signature is the seal of authentication for the overall JWT, ensuring that 
 * the token has not been tampered with 
 */
export class AuthService {
    async signUp(username: string, email: string, password: string) {
        // note: the info the user inputted will be validated using zod 
        const password_hash = await hashPassword(password);
        const signedInUser = await createUser(username, email, password_hash); 
        if(!SECRET_KEY){
            throw new Error("Missing secret key.")
        }
        const token = jwt.sign({
            userId: signedInUser.user_id,
        }, 
            SECRET_KEY, 
        {
            expiresIn: '7d'
        }
        );
        return {
            token,
            user: {
                id: signedInUser.user_id,
                username: signedInUser.username,
                email: signedInUser.email
            }
        };
    }

    async login(email: string, password: string) {
        const loggedInUser =  await getUserByEmail(email); 

        if (!loggedInUser) {
            throw new Error("Incorrect email or password.")
        }


        const isPasswordCorrect = await confirmPassword(password, loggedInUser?.password_hash);

        if(!isPasswordCorrect) {
            throw new Error("Incorrect email or password");
        }

        if(!SECRET_KEY){
            throw new Error("Missing secret key.")
        }
        const token = jwt.sign({
            userId: loggedInUser.user_id,
        }, 
            SECRET_KEY, 
        {
            expiresIn: '7d'
        }
        );
        
        return {
            token,
            user: {
                id: loggedInUser.user_id,
                username: loggedInUser.username,
                email: loggedInUser.email
            }
        };
    }
}






export const authService = new AuthService();