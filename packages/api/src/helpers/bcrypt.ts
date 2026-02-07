import bcrypt from 'bcrypt';



export const confirmPassword = async (userPasswordInputted: string, savedEncryptedPassword: string) => {
    return await bcrypt.compare(userPasswordInputted, savedEncryptedPassword); 
}


export const hashPassword = async (password: string) => {
    const SALT_ROUNDS = 10;
    return await bcrypt.hash(password, SALT_ROUNDS);
}