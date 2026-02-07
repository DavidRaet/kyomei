import { z } from 'zod';


export const signUpSchema = z.object({
    username: z.string().min(1).max(50),
    email: z.email().max(100),
    password: z.string().min(8).max(64)
});