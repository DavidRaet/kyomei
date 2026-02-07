import z from 'zod';


export const signInSchema = z.object({
    email: z.string().max(100),
    password: z.string().max(25)
})