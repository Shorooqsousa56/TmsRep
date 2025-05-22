import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Import Routes and Route here
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Home from './Home';
import Projects from './Projects';
import Tasks from './Tasks';
import Chat from './Chat';

const Dashboard = () => {
    return (
        <div className="h-full flex flex-col">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />

                <main className="flex-1 p-4 bg-zinc-900 overflow-auto ml-0 sm:ml-64">
                    <Routes>
                        <Route path="home" element={<Home />} />
                        <Route path="projects" element={<Projects />} />
                        <Route path="tasks" element={<Tasks />} />
                        <Route path="chat" element={<Chat />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
