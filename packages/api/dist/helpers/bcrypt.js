import bcrypt from 'bcrypt';
export const confirmPassword = async (userPasswordInputted, savedEncryptedPassword) => {
    return await bcrypt.compare(userPasswordInputted, savedEncryptedPassword);
};
export const hashPassword = async (password) => {
    const SALT_ROUNDS = 10;
    return await bcrypt.hash(password, SALT_ROUNDS);
};
//# sourceMappingURL=bcrypt.js.map