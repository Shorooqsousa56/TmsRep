import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // ✅ Import useNavigate
import client from './graphqlClient';

const SignUp = () => {
    const navigate = useNavigate(); // ✅ Initialize navigate

    const [isStudent, setIsStudent] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        universityId: '',
    });

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        if (name === 'isStudent') {
            setIsStudent(checked);
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { username, password, universityId } = formData;

        if (!username || !password) {
            alert("Please fill in all required fields.");
            return;
        }

        if (isStudent) {
            if (!universityId) {
                alert('Please enter your University ID.');
                return;
            }
            if (universityId.length !== 8 || !/^\d+$/.test(universityId)) {
                alert('University ID must be exactly 8 digits.');
                return;
            }
        }

        const mutation = `
      mutation SignUp($username: String!, $password: String!, $university_id: Int) {
        signUp(username: $username, password: $password, university_id: $university_id) {
          id
          username
          university_id
        }
      }
    `;

        const variables = {
            username,
            password,
            university_id: isStudent ? Number(universityId) : null,
        };

        try {
            const data = await client.request(mutation, variables);
            alert("Registration successful!");
            setFormData({ username: '', password: '', universityId: '' });
            setIsStudent(false);
            navigate('/');
            // ✅ Correct SPA-friendly navigation
        } catch (error) {
            console.error("Signup error:", error);
            alert(`An error occurred during signup: ${error.response?.errors?.[0]?.message || error.message}`);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0e0e0e] px-4">
            <div className="bg-[#1b1b1b] p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold text-white mb-6 text-center">Sign Up</h1>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="username" className="block text-white mb-1">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 rounded bg-[#2a2a2a] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                            required
                            className="w-full px-3 py-2 rounded bg-[#2a2a2a] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    <div className="flex items-center mb-4">
                        <input
                            type="checkbox"
                            id="isStudent"
                            name="isStudent"
                            checked={isStudent}
                            onChange={handleChange}
                            className="mr-2"
                        />
                        <label htmlFor="isStudent" className="text-white">I am a student</label>
                    </div>

                    {isStudent && (
                        <div className="mb-4">
                            <label htmlFor="universityId" className="block text-white mb-1">University ID</label>
                            <input
                                type="text"
                                id="universityId"
                                name="universityId"
                                value={formData.universityId}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded bg-[#2a2a2a] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded"
                    >
                        Sign Up
                    </button>
                </form>

                <p className="text-center text-gray-400 text-sm mt-6">
                    Already have an account?{' '}
                    <Link to="/" className="text-green-500 hover:underline">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default SignUp;