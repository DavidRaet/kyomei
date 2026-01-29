import { useContext, useState, createContext } from "react";
import type { ReactNode } from 'react'


interface SignInContextType {
    email: string,
    setEmail: (email: string) => void 
    password: string,
    setPassword: (password: string) => void,
    onSignIn?: (email: string, password: string) => void,
}



export const MyContext = createContext<SignInContextType | undefined>(undefined); 


const SignInProvider = ({children}: {children: ReactNode}) => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');



    const value: SignInContextType = {
        email,
        setEmail,
        password,
        setPassword
    };



    return (
        <MyContext.Provider value={value}>
            {children}
        </MyContext.Provider>
    )
}


export const useSignIn = () => {
    const context = useContext(MyContext);

    if (!context) {
        throw new Error("useSignIn must be used within SignInProvider");
    }

    return context;
}


export default SignInProvider;