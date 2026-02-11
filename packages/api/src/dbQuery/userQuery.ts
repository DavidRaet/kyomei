import prisma from '../lib/prisma.js';




export const createUser = async (username: string, email: string, password_hash: string) => {
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
    const user = await prisma.users.findUnique({
        where: {
            email: email
        }
    });

    return user;
}


