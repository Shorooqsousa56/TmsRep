import React, { useEffect, useRef, useContext } from 'react';
import { gql, useQuery } from '@apollo/client';
import Chart from 'chart.js/auto';
import { UserContext } from '../UserContext';

const DASHBOARD_STATS_QUERY = gql`
  query GetDashboardStats($role: String!, $username: String!) {
    dashboardStats(role: $role, username: $username) {
      projects
      tasks
      students
      finishedProjects
    }
  }
`;

const Home = () => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const { user } = useContext(UserContext);

    const { data, loading, error, refetch } = useQuery(DASHBOARD_STATS_QUERY, {
        variables: { role: user?.role || '', username: user?.username || '' },
        skip: !user?.username,
    });

    useEffect(() => {




        const updateDateTime = () => {
            const now = new Date();
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            };
            const dateTimeEl = document.getElementById('dateTime');
            if (dateTimeEl) {
                dateTimeEl.textContent = now.toLocaleString('en-US', options);
            }
        };

        updateDateTime();
        const interval = setInterval(updateDateTime, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (user?.username) {
                refetch(); // يحدث البيانات من السيرفر
            }
        }, 1000); // كل 60 ثانية

        return () => clearInterval(interval);
    }, [user, refetch]);
    useEffect(() => {
        if (!data || !chartRef.current) return;

        const { projects, students, tasks, finishedProjects } = data.dashboardStats;

        if (chartInstance.current) chartInstance.current.destroy();

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Projects', 'Students', 'Tasks', 'Finished Projects'],
                datasets: [{
                    label: 'Count',
                    data: [projects, students || 0, tasks, finishedProjects],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(153, 102, 255, 0.6)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: user?.role === 'student' ? 'Student Dashboard Overview' : 'Admin Dashboard Overview',
                        color: '#aaa',
                        font: { size: 16 }
                    },
                    legend: { labels: { color: '#aaa' } }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#aaa' },
                        grid: { color: 'rgba(71, 68, 68, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#aaa' },
                        grid: { color: 'rgba(71, 68, 68, 0.1)' }
                    }
                }
            }
        });

        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
        };
    }, [data]);

    if (loading) return <div className="text-white">Loading...</div>;
    if (error) return <div className="text-red-500">Error: {error.message}</div>;

    const { projects, tasks, students, finishedProjects } = data.dashboardStats;

    return (
        <div className="p-6 bg-zinc-900">
            <div className="flex justify-between items-center w-full mb-8">
                <h2 className="text-2xl font-semibold text-blue-500">Welcome to the Task Management System</h2>
                <div className="text-sm text-gray-300" id="dateTime"></div>
            </div>
            <div className="flex justify-evenly flex-wrap gap-6 mb-10">

                <div className="bg-[#2a2a2a] p-6 rounded-md text-center shadow-md shadow-zinc-950 w-60">
                    <h2 className="text-white text-lg font-medium mb-2">Number of Projects</h2>
                    <p className="text-2xl text-white">{projects}</p>
                </div>

                {students !== null && (
                    <div className="bg-[#2a2a2a] p-6 rounded-md text-center shadow-md shadow-zinc-950 w-60">
                        <h2 className="text-white text-lg font-medium mb-2">Number of Students</h2>
                        <p className="text-2xl text-white">{students}</p>
                    </div>
                )}

                <div className="bg-[#2a2a2a] p-6 rounded-md text-center shadow-md shadow-zinc-950 w-60">
                    <h2 className="text-white text-lg font-medium mb-2">Number of Tasks</h2>
                    <p className="text-2xl text-white">{tasks}</p>
                </div>

                <div className="bg-[#2a2a2a] p-6 rounded-md text-center shadow-md shadow-zinc-950 w-60">
                    <h2 className="text-white text-lg font-medium mb-2">Number of Finished Projects</h2>
                    <p className="text-2xl text-white">{finishedProjects}</p>
                </div>
            </div>


            <div className="w-full h-[400px]">
                <canvas ref={chartRef} height="400"></canvas>
            </div>
        </div>
    );
};

export default Home;
