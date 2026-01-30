import express from 'express';
import { authService } from '../services/authService.js';

export const authRouter = express.Router();


authRouter.post('/signup', async (req, res, next) => {
    // missing same things in login 
    const { email, password } = req.body;

    const handleUserSignUp = await authService.signUp(email, password);
    res.json({
        message: "Sign up successful!",
        ...handleUserSignUp
    });
    
});

authRouter.post('/login', async (req, res, next) => {
    // missing schema validation. will implement later
    const { email, password } = req.body; 

    // authService will return the user after it was queried into the db
    const handleUserLogin = await authService.login(email, password);
    res.json({
         message: "Login successful!",
         ...handleUserLogin
    });
    
});


