/**
 * Error handling middleware for Express.js applications.
 */


import type { NextFunction, Request, Response } from 'express';


export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    
};