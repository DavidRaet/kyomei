import 'express';
import type { JwtPayload } from 'jsonwebtoken';
import type { is } from 'zod/locales';

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

export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}