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
export declare class AuthService {
    signUp(username: string, email: string, password: string): Promise<{
        token: string;
        user: {
            id: number;
            username: string;
            email: string;
        };
    }>;
    login(email: string, password: string): Promise<Error | {
        token: string;
        user: {
            id: number;
            username: string;
            email: string;
        };
    }>;
}
export declare const authService: AuthService;
//# sourceMappingURL=authService.d.ts.map