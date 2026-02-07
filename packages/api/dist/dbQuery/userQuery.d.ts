export declare const createUser: (username: string, email: string, password_hash: string) => Promise<{
    username: string;
    email: string;
    password_hash: string;
    created_at: Date | null;
    updated_at: Date | null;
    user_id: number;
}>;
export declare const getUserByEmail: (email: string) => Promise<{
    username: string;
    email: string;
    password_hash: string;
    created_at: Date | null;
    updated_at: Date | null;
    user_id: number;
} | null>;
//# sourceMappingURL=userQuery.d.ts.map