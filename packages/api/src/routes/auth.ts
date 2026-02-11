import express from 'express';
import { authService } from '../services/authService.js';
import { signUpSchema } from '../schema/signUpSchema.js';
import { signInSchema } from '../schema/signInSchema.js';
const authRouter = express.Router();

// extra notes: Zod Schema validation and creating interfaces for the User type should be considered
// next steps: create zod schema validation
authRouter.post('/signup', async (req, res, next) => {
    const validateSignUp = signUpSchema.safeParse(req.body);

    if(!validateSignUp.success){
        return res.status(400).json({
            message: "Invalid sign up input",
            error: validateSignUp.error.issues
        });
    }
    try {
        const data = validateSignUp.data;
        const signedInUser = await authService.signUp(data.username, data.email, data.password);
        return res.status(201).json({
        message: "Sign up successful!",
        signedInUser
    });
    } catch (err){
        return res.status(401).json({message: "Sign up failed."});
    } 

});

authRouter.post('/login', async (req, res, next) => {
    // missing schema validation. will implement later
    const validateLogIn = signInSchema.safeParse(req.body);
    if(!validateLogIn.success){
        return res.status(400).json({
            message: "Invalid sign in input",
            error: validateLogIn.error.issues 
        });
    }
    // authService will return the user after it was queried into the db
    try {
        const data = validateLogIn.data;
        const loggedInUser = await authService.login(data.email, data.password);
        return res.status(200).json({
         message: "Login successful!",
         loggedInUser
    });
    } catch (err){
        return res.status(401).json({message: "Invalid login information"});
    } 
});

export default authRouter;