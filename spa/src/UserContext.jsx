import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    // Try to get user from localStorage/sessionStorage on load
    const storedUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));

    const [user, setUser] = useState(storedUser);

    // Optional: update local/session storage when user changes
    useEffect(() => {
        if (user) {
            // Save to localStorage or sessionStorage depending on your logic
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
        }
    }, [user]);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};
