import 'express';
import type { JwtPayload } from 'jsonwebtoken';

declare global {
    namespace Express {
        interface Request {
            userId?: string | number;
        }
    }
}


export interface CustomJwtPayload extends JwtPayload {
    userId: string;
}