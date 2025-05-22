
import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from './graphqlClient';
import { UserContext } from '../UserContext';


const Login = () => {
    const { setUser } = useContext(UserContext);

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        staySignedIn: false,
    });

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { username, password, staySignedIn } = formData;


        if (!username || !password) {
            alert('Please enter both username and password.');
            return;
        }

        const query = `
      query Login($username: String!, $password: String!) {
        login(username: $username, password: $password) {
          id
          username
          university_id
          role
        }
      }
    `;

        const variables = { username, password };

        try {
            const data = await client.request(query, variables);
            const user = data.login;

            setUser(user);
            console.log('Username:', username);
            console.log('Password:', password);

            console.log('Role:', user.role);

            // Save to localStorage or sessionStorage
            const storage = staySignedIn ? localStorage : sessionStorage;
            storage.setItem('user', JSON.stringify(user));

            // Navigate based on role (optional logic)
            navigate('/dashboard/home');
        } catch (error) {
            console.error('Login error:', error);
            alert(`Login failed: ${error.response?.errors?.[0]?.message || error.message}`);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0e0e0e] px-4">
            <div className="bg-[#1b1b1b] p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold text-white mb-6 text-center">Sign In</h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="username" className="block text-white mb-1">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded bg-[#2a2a2a] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-white mb-1">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded bg-[#2a2a2a] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>
                    <div className="flex items-center mb-4">
                        <input
                            type="checkbox"
                            id="staySignedIn"
                            name="staySignedIn"
                            checked={formData.staySignedIn}
                            onChange={handleChange}
                            className="mr-2"
                        />
                        <label htmlFor="staySignedIn" className="text-white">Stay Signed In</label>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded"
                    >
                        Sign In
                    </button>
                </form>
                <p className="text-center text-gray-400 text-sm mt-6">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-green-500 hover:underline">Sign Up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
