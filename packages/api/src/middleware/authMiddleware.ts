import type {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import type { CustomJwtPayload } from '../types/express.js';
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET;

// next steps:
// take a step back and internalize the type safety patterns in TypeScript as well as explain why it had to be implemented 
// when i had issues:
// attaching the verified token to the user request id
// adding a global type for req to recognize the user id 
// 
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).send("Missing Token.");
        return;
    }
    const token = authHeader.split('Bearer ')[1];
    if(!token){
        res.status(401).send("Token does not exist.");
        return;
    }
    if (!SECRET_KEY){
        res.status(500).send("Internal server error.");
        return;
    }
    try {
        const verifiedToken = jwt.verify(token, SECRET_KEY) as CustomJwtPayload;
        req.userId = verifiedToken.userId; 
    } catch (err) {
        return next(err);
    }
    next();
}