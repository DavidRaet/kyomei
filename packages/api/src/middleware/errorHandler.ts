/**
 * Error handling middleware for Express.js applications.
 */


import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/error.js';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
        });
    } else {
        return res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
};