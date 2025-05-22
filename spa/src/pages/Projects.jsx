import React, { useState, useEffect, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { UserContext } from '../UserContext';


const ALL_PROJECTS_QUERY = gql`
  query GetAllProjects {
    allProjects {
      id
      project_title
      project_desc
      student_list
      category
      start_date
      end_date
      project_status
    }
  }
`;

const PROJECTS_BY_STUDENT_QUERY = gql`
  query ProjectsBySN($studentName: String!) {
    projectsBySN(studentName: $studentName) {
      id
      project_title
      project_desc
      student_list
      category
      start_date
      end_date
      project_status
    }
  }
`;

const ADD_PROJECT = gql`
  mutation AddProject(
    $project_title: String!,
    $project_desc: String!,
    $student_list: [String],
    $category: String,
    $start_date: String,
    $end_date: String,
    $project_status: String
  ) {
    addProject(
      project_title: $project_title,
      project_desc: $project_desc,
      student_list: $student_list,
      category: $category,
      start_date: $start_date,
      end_date: $end_date,
      project_status: $project_status
    ) {
      id
      project_title
      project_desc
      student_list
      category
      start_date
      end_date
      project_status
    }
  }
`;

const STUDENTS_QUERY = gql`
  query {
    students {
      id
      university_id
      username
    }
  }
`;


const ADMIN_TASKS_QUERY = gql`
  query {
    AdminTask {
      id
      name
      project
      student
      status
      due
      description
    }
  }
`;

const USER_TASKS_QUERY = gql`
  query UserTasks($student: String!) {
    userTasks(student: $student) {
      id
      name
      project
      student
      status
      due
      description
    }
  }
`;



const initialTasks = [
    { id: 1, project: 'AI Chatbot', name: 'Build NLP model', description: 'Create and train NLP model.', student: 'john_doe', status: 'In Progress' },
    { id: 2, project: 'React Dashboard', name: 'Design UI', description: 'Create UI mockups.', student: 'jane_smith', status: 'Completed' },
    { id: 3, project: 'React Dashboard', name: 'UI', description: 'Create UI mockups.', student: 'jane_smith', status: 'Completed' }
];

const Projects = () => {
    const { user } = useContext(UserContext);
    const isStudent = user.role === "student";

    const { loading, error, data, refetch } = useQuery(
        isStudent ? PROJECTS_BY_STUDENT_QUERY : ALL_PROJECTS_QUERY,
        {
            variables: isStudent ? { studentName: user.username } : {},
            skip: !user.role,  // نتأكد انه في دور قبل التنفيذ
        }
    );

    const [students, setStudents] = useState([]);

    const { data: studentsData } = useQuery(STUDENTS_QUERY, {
        skip: user.role !== "admin",
    });


    useEffect(() => {
        if (user.role === "admin" && studentsData?.students) {
            setStudents(studentsData.students.map((s) => ({
                username: s.username,
            })));
        } else if (user.role === "student") {
            setStudents([{ username: user.username }]);
        }
    }, [user.role, studentsData, user.username]);

    const { data: adminTasksData, refetch: refetchAdminTasks } = useQuery(ADMIN_TASKS_QUERY, {
        skip: user.role !== 'admin',
    });

    // جلب مهام الطالب حسب اسمه
    const { data: userTasksData, refetch: refetchUserTasks } = useQuery(USER_TASKS_QUERY, {
        variables: { student: user.username },
        skip: user.role !== 'student',
    });

    useEffect(() => {
        if (user.role === 'admin') {
            refetchAdminTasks();
        } else if (user.role === 'student') {
            refetchUserTasks();
        }
    }, []);
    useEffect(() => {
        if (user.role === 'admin' && adminTasksData?.AdminTask) {
            setTasks(adminTasksData.AdminTask);

        } else if (user.role === 'student' && userTasksData?.userTasks) {
            setTasks(userTasksData.userTasks);
        }
    }, [user.role, adminTasksData, userTasksData]);



    const [projects, setProjects] = useState([]);
    //const [tasks] = useState(initialTasks);
    const [tasks, setTasks] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarProject, setSidebarProject] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [addProjectMutation] = useMutation(ADD_PROJECT);


    useEffect(() => {
        if (!data) return;

        const projectsRaw = isStudent ? data.projectsBySN : data.allProjects;

        if (projectsRaw) {
            const projectsMapped = projectsRaw.map((p) => ({
                id: p.id,
                projectTitle: p.project_title,
                projectDescription: p.project_desc,
                students: p.student_list,
                projectCategory: p.category,
                startingDate: new Date(p.start_date).toLocaleDateString().replace(/\//g, "-"),
                endingDate: new Date(p.end_date).toLocaleDateString().replace(/\//g, "-"),
                projectStatus: p.project_status,
            }));

            setProjects(projectsMapped);
        }
    }, [data, isStudent]);


    const toggleStudentSelection = (username) => {
        setSelectedStudents((prev) =>
            prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]
        );
    };

    const handleSaveProject = async () => {
        const title = document.querySelector('.input-title').value;
        const description = document.querySelector('.text-area-description').value;
        const category = document.querySelector('.Select-category').value;
        const startingDate = document.querySelector('.input-starting-date').value;
        const endingDate = document.querySelector('.input-ending-date').value;
        const status = document.querySelector('.select-Status').value;
        console.log("Starting Date:", startingDate);
        console.log("Ending Date:", endingDate);
        if (!title || !description || !category || !startingDate || !endingDate) {
            alert('All fields are required!');
            return;
        }

        if (startingDate >= endingDate) {
            alert('Starting date must be before ending date!');
            return;
        }


        try {
            await addProjectMutation({
                variables: {
                    project_title: title,
                    project_desc: description,
                    student_list: selectedStudents,
                    category,
                    start_date: new Date(startingDate).toISOString(),
                    end_date: new Date(endingDate).toISOString(),
                    project_status: status,
                }
            });

            await refetch(); // إعادة تحميل البيانات
            setShowModal(false);
            setSelectedStudents([]);
        } catch (err) {
            console.error("Error saving project:", err);
            alert('Failed to save project!');
        }
    };

    const calculateProgress = (start, end) => {
        const now = new Date();
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (now < startDate) return 0;
        if (now > endDate) return 100;
        return Math.floor(((now - startDate) / (endDate - startDate)) * 100);
    };

    const filteredProjects = projects.filter((p) => {
        const statusMatch = statusFilter === 'All Statuses' || p.projectStatus === statusFilter;
        const searchMatch =
            p.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.projectDescription.toLowerCase().includes(searchQuery.toLowerCase());
        return statusMatch && searchMatch;
    });

    const filteredTasks = (projectTitle) =>
        tasks.filter((task) => task.project.toLowerCase() === projectTitle.toLowerCase());

    if (loading) return <p>Loading projects...</p>;
    if (error) return <p>Error loading projects!</p>;
    return (
        <div className="flex flex-col h-full w-full bg-zinc-900 p-5 overflow-y-auto">
            <div className="flex justify-start  mb-[10px] text-[25px] font-bold text-[#3366ff]">
                <h2>Projects Overview</h2>
            </div>
            <div className="flex flex-row items-center gap-[10px] mt-0">
                <button className={`px-3 py-2 w-[160px] rounded-md transition-transform
    ${user.role === "student"
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                        : '!bg-[#007bff] text-white hover:bg-[#3c9aff] hover:font-bold hover:scale-105'}
  `} onClick={() => user.role !== "student" && setShowModal(true)}>
                    Add New Project
                </button>
                <input
                    className="flex-grow px-2.5 py-2.5 ml-5 border-0 rounded-md w-[900px] bg-white text-black"
                    placeholder="Search projects by title or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border-0 rounded-md bg-white text-black px-2.5 py-2.5 text-sm"

                >
                    <option>All Statuses</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Pending</option>
                    <option>On Hold</option>
                    <option>Cancelled</option>
                </select>
            </div>

            <div className="w-full mt-5 grid lg:grid-cols-3 sm:grid-cols-1  gap-2.5 justify-items-center sm:ml-0 ml-4">
                {filteredProjects.map((project, index) => (
                    <div
                        key={index}
                        className="bg-[#363636] p-4 rounded-lg w-[280px] h-[230px] border-[3px] border-[#b6b6b6] shadow-[0_0_10px_rgba(0,0,0,0.737)] text-white cursor-pointer hover:!border-orange-500"
                        onClick={() => setSidebarProject(project)}
                    >
                        <h3 className="text-[#3366ff] font-bold">{project.projectTitle}</h3>
                        <p><strong>Description:</strong> {project.projectDescription}</p>
                        <p><strong>Students:</strong> {project.students.join(', ')}</p>
                        <p><strong>Category:</strong> {project.projectCategory}</p>
                        <div className="bg-[#222] rounded-md overflow-hidden h-[20px] mt-7 relative">
                            <div className="h-[40px] bg-[#3c9aff] text-center leading-[20px] text-[12px] font-bold text-white" style={{ width: `${calculateProgress(project.startingDate, project.endingDate)}%` }}>
                                {calculateProgress(project.startingDate, project.endingDate)}%
                            </div>
                        </div>
                        <p className="text-[12px] text-white mt-[5px]">{project.startingDate} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {project.endingDate}</p>
                    </div>
                ))}
            </div>

            {sidebarProject && (
                <div id="rightSidebar" className={`fixed top-[11%] ${sidebarProject ? 'right-0' : 'right-[-400px]'} w-[360px] h-full !bg-[#1e1e1e] shadow-[-2px_0_5px_rgba(0,0,0,0.3)] transition-all duration-300 ease-in-out p-[15px] overflow-y-auto z-[9999]`}>
                    <button onClick={() => setSidebarProject(null)} className="absolute top-[10px] right-[15px] flex justify-center items-center bg-transparent text-white border-none w-[30px] h-[30px] text-[18px] font-bold cursor-pointer hover:!bg-[darkred] hover:!rounded-[6px]">×</button>
                    <h2 className="text-[#44ccfd] pb-[10px] mb-[10px] mt-[10px] border-b-2 border-[#383838] font-bold text-[20px]">{sidebarProject.projectTitle}</h2>
                    <p><strong>Description:</strong> {sidebarProject.projectDescription}</p>
                    <p><strong>Category:</strong> {sidebarProject.projectCategory}</p>
                    <p><strong>Students:</strong> {sidebarProject.students.join(', ')}</p>
                    <p><strong>Start Date:</strong> {sidebarProject.startingDate}</p>
                    <p><strong>End Date:</strong> {sidebarProject.endingDate}</p>
                    <h2 className="text-[#44ccfd] pb-[10px] mb-[10px] mt-[10px] border-b-2 border-[#383838] font-bold text-[20px]">Tasks</h2>
                    {filteredTasks(sidebarProject.projectTitle).length > 0 ? (
                        filteredTasks(sidebarProject.projectTitle).map((task) => (
                            <div key={task.id} className="mb-5 p-2.5 border-2 border-[#0d6751] rounded bg-[#383838] shadow-[0_4px_5px_rgba(0,0,0,0.1)]">
                                <p><strong>Task ID:</strong> {task.id}</p>
                                <p><strong>Task Name:</strong> {task.name}</p>
                                <p><strong>Description:</strong> {task.description}</p>
                                <p><strong>Assigned Student:</strong> {task.student}</p>
                                <p><strong>Status:</strong> {task.status}</p>
                            </div>
                        ))
                    ) : (
                        <p>No tasks found for this project.</p>
                    )}
                </div>
            )}

            {showModal && (
                <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center z-[1000] overflow-y-auto bg-[rgba(0,0,0,0.5)] font-sans text-white">
                    <div className="bg-[#222] p-5 rounded-lg w-[700px] shadow-md relative mt-[78px] overflow-y-auto scrollbar-hide">
                        <button className="absolute top-[10px] right-[15px] flex justify-center items-center bg-transparent text-white border-none w-[30px] h-[30px] text-[18px] font-bold cursor-pointer hover:!bg-[darkred] hover:!rounded-[6px]" onClick={() => setShowModal(false)}>×</button>
                        <h2 className="text-[#3366ff] font-bold text-[20px] mb-3" >Add New Project</h2>
                        <label>Project Title:</label>
                        <input type="text" className="input-title w-[97.8%] p-2 mb-2.5 border-0 rounded bg-[#333] text-white" />
                        <label>Project Description:</label>
                        <textarea rows="3" className="text-area-description w-[97.8%] p-2 mb-2.5 border-none rounded bg-[#333] text-white"></textarea>
                        <label>Students List:</label>
                        <div className="h-[80px] overflow-y-auto bg-[#333] p-2 rounded cursor-pointer">
                            {students.map((student, index) => (
                                <div
                                    key={index}
                                    className={`student-item ${selectedStudents.includes(student.username) ? '!bg-blue-500 !text-white' : '!bg-[#333] !text-white'}`}
                                    onClick={() => toggleStudentSelection(student.username)}
                                >
                                    {student.username}
                                </div>
                            ))}
                        </div>
                        <label>Project Category:</label>
                        <select className="Select-category w-full p-2 mb-2 rounded border-0 !bg-[#333] !text-white focus:outline-none" defaultValue="Select a category">
                            <option disabled>Select a category</option>
                            <option>Web Development</option>
                            <option>Mobile Development</option>
                            <option>Data Science</option>
                            <option>Machine Learning</option>
                        </select>
                        <label>Starting Date:</label>
                        <input type="date" className="input-starting-date w-[97.8%] p-2 mb-2 rounded border-0 bg-[#333] text-white focus:outline-none" />
                        <label>Ending Date:</label>
                        <input type="date" className="input-ending-date w-[97.8%] p-2 mb-2 rounded border-0 bg-[#333] text-white focus:outline-none" />
                        <label>Status:</label>
                        <select className="select-Status w-full p-2 mb-2 rounded border-0 !bg-[#333] text-white hover:!bg-[#444] !text-white focus:outline-none" defaultValue="In Progress">
                            <option>In Progress</option>
                            <option>Completed</option>
                            <option>Pending</option>
                            <option>On Hold</option>
                            <option>Cancelled</option>
                        </select>
                        <button className="!bg-[#28a745] text-white p-2 border-none rounded cursor-pointer w-full text-[16px] mt-[10px] hover:!bg-[#218838]" onClick={handleSaveProject}>Save Project</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;