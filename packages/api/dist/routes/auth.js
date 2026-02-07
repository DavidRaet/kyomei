import express from 'express';
import { authService } from '../services/authService.js';
const authRouter = express.Router();
// extra notes: Zod Schema validation and creating interfaces for the User type should be considered
// next steps: error handling and then creating Data Transfer Objects 
authRouter.post('/signup', async (req, res, next) => {
    const { username, email, password } = req.body;
    try {
        const signedInUser = await authService.signUp(username, email, password);
        return res.status(200).json({
            message: "Sign up successful!",
            signedInUser
        });
    }
    catch (err) {
        console.log("Something went wrong", err);
    }
});
authRouter.post('/login', async (req, res, next) => {
    // missing schema validation. will implement later
    const { email, password } = req.body;
    // authService will return the user after it was queried into the db
    try {
        const loggedInUser = await authService.login(email, password);
        return res.status(200).json({
            message: "Login successful!",
            loggedInUser
        });
    }
    catch (err) {
        console.log("Something went wrong", err);
    }
});
//# sourceMappingURL=auth.js.map