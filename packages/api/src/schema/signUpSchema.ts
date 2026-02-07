import z from 'zod';


export const signUpSchema = z.object({
    username: z.string().max(50),
    email: z.string().max(100),
    password: z.string().max(25)
});