import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
export const createUser = async (username, email, password_hash) => {
    const user = await prisma.users.create({
        data: {
            username,
            email,
            password_hash
        }
    });
    return user;
};
export const getUserByEmail = async (email) => {
    const user = await prisma.users.findUnique({
        where: {
            email: email
        }
    });
    return user;
};
//# sourceMappingURL=userQuery.js.map