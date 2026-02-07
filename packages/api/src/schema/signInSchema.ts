import { z } from 'zod';


export const signInSchema = z.object({
    email: z.email().max(100),
    password: z.string().min(8).max(64)
})