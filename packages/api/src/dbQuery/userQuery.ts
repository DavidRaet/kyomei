import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';

const SALT_ROUNDS = 10;


export const createUser = async (username: string, email: string, password: string) => {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.users.create({
        data: {
            username,
            email,
            password_hash
        }
    });

    return user;
}

export const getUserByEmail = async (email: string) => {
    const user = prisma.users.findUnique({
        where: {
            email: email
        }
    });

    return user;
}

