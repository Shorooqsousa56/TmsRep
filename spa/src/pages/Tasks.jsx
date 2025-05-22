import { useState, useContext, useEffect } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { UserContext } from '../UserContext';


//for student
const GET_USER_TASKS = gql`
  query GetUserTasks($student: String!,$sortBy: TaskSortBy) {
    getuserTasksord(student: $student,sortBy: $sortBy) {
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
//for admin
const TASKS_QUERY = gql`
  query GetTasks($sortBy: TaskSortBy) {
    tasks(sortBy: $sortBy) {
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

const CREATE_TASK_MUTATION = gql`
  mutation CreateTask(
    $name: String!
    $project: String!
    $student: String!
    $status: String!
    $due: Date!
    $description: String!
  ) {
    createTask(
      name: $name
      project: $project
      student: $student
      status: $status
      due: $due
      description: $description
    ) {
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

const GET_PROJECTS_QUERY = gql`
  query GetProjects {
    allProjects {
      id
      project_title
      student_list
      start_date
      end_date
    }
  }
`;

const GET_STUDENTS_QUERY = gql`
  query GetStudents {
    students {
      id
     username
    password
    university_id
    }
  }
`;

const GET_PROJECTS_BY_STUDENT = gql`
  query GetProjectsByStudent($studentName: String!) {
    projectsBySN(studentName: $studentName) {
      id
      project_title
      student_list
      start_date
      end_date
    }
  }
`;



const Tasks = () => {
  const { user } = useContext(UserContext);


  const { loading: projectsLoading, error: projectsError, data: projectsData } = useQuery(GET_PROJECTS_QUERY);
  const allProjects = projectsData ? projectsData.allProjects : [];

  const { loading: studentsLoading, error: studentsError, data: studentsData } = useQuery(GET_STUDENTS_QUERY);
  const allStudents = studentsData ? studentsData.students : [];

  const { data: filteredProjectsData } = useQuery(GET_PROJECTS_BY_STUDENT, {
    variables: { studentName: user?.username || "" },
    skip: user?.role !== "student"
  });

  const projectsToDisplay = user?.role === "student" ? filteredProjectsData?.projectsBySN || [] : allProjects;
  const studentsToDisplay = user?.role === "student" ? [{ username: user.username, id: user.id }] : allStudents;



  useEffect(() => {
    if (user?.role === "student") {
      setFormData((prev) => ({ ...prev, student: user.username }));
    }
  }, [user]);

  const [showModal, setShowModal] = useState(false);
  const [sortBy, setSortBy] = useState("DUE_DATE");
  const [formData, setFormData] = useState({
    project: "",
    name: "",
    description: "",
    student: "",
    status: "Not Started",
    due: ""
  });
  const { loading, error, data, refetch: tasksRefetch } = useQuery(TASKS_QUERY, {
    variables: { sortBy }
  });

  const { data: userTasksData, loading: userTasksLoading, refetch: userTasksRefetch } = useQuery(GET_USER_TASKS, {
    variables: { student: user?.username, sortBy },
    skip: user?.role !== "student"
  });

  const tasksToDisplay = user?.role === "student" ? userTasksData?.getuserTasksord || [] : data?.tasks || [];


  const [createTask] = useMutation(CREATE_TASK_MUTATION, {
    onCompleted: () => {

      if (user?.role === "student") {
        userTasksRefetch(); // تعيد تحميل مهام الطالب
      } else {
        tasksRefetch(); // تعيد تحميل مهام الأدمن
      }
      setShowModal(false);
      setFormData({
        project: "",
        name: "",
        description: "",
        student: "",
        status: "Not Started",
        due: ""
      });
    },
    onError: (err) => console.error("Error creating task:", err)
  });

  const handleSort = (e) => {
    const criteriaMap = {
      status: "TASK_STATUS",
      project: "PROJECT_NAME",
      date: "DUE_DATE",
      student: "ASSIGNED_STUDENT_NAME",
      name: "TASK_NAME"
    };
    setSortBy(criteriaMap[e.target.value]);
    refetch({ sortBy: criteriaMap[e.target.value] });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const variables = {
      name: formData.name,
      project: formData.project,
      student: formData.student,
      status: formData.status,
      due: formData.due || new Date().toISOString().slice(0, 10),
      description: formData.description
    };
    createTask({ variables });
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="flex justify-between items-center mb-6 w-full max-w-6xl">
        <div className="flex items-center gap-2">
          <label htmlFor="sort">Sort By:</label>
          <select
            id="sort"
            onChange={handleSort}
            className="px-3 py-2 rounded bg-zinc-800 text-white outline-none border border-zinc-700"
          >
            <option value="status">Task Status</option>
            <option value="project">Project</option>
            <option value="date">Due Date</option>
            <option value="student">Assigned Student</option>
          </select>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create a New Task
        </button>
      </div>

      <div className="rounded-lg shadow-lg shadow-sm shadow-zinc-950 overflow-x-auto w-full max-w-6xl bg-zinc-850">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="border-b-2 border-zinc-700">
            <tr>
              <th className="p-3">Task ID</th>
              <th className="p-3">Project</th>
              <th className="p-3">Task Name</th>
              <th className="p-3">Description</th>
              <th className="p-3">Assigned Student</th>
              <th className="p-3">Status</th>
              <th className="p-3">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="p-3 text-center">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="7" className="p-3 text-center text-red-500">
                  Error fetching tasks.
                </td>
              </tr>
            ) : (
              tasksToDisplay.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-zinc-700 hover:bg-zinc-800"
                >
                  <td className="p-3">{task.id}</td>
                  <td className="p-3">{task.project}</td>
                  <td className="p-3">{task.name}</td>
                  <td className="p-3">{task.description}</td>
                  <td className="p-3">{task.student}</td>
                  <td className="p-3">{task.status}</td>
                  <td className="p-3">{task.due}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-[#1e1e1e] border border-[#444] p-6 rounded-lg w-[500px] max-w-full relative">
            <span
              className="absolute top-2 right-4 text-2xl text-gray-400 cursor-pointer hover:text-white"
              onClick={() => setShowModal(false)}
            >
              &times;
            </span>
            <h2 className="text-blue-500 text-lg font-semibold mb-4">
              Create New Task
            </h2>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 text-white w-full max-w-md mx-auto"
            >
              <div>
                <label htmlFor="project">Project:</label>
                <select
                  id="project"
                  name="project"
                  value={formData.project}
                  onChange={handleInputChange}
                  className="w-full bg-[#444] text-white p-2 rounded mt-1"

                >
                  <option value="" disabled>
                    Select a project
                  </option>
                  {projectsToDisplay.map((project) => (
                    <option key={project.id} value={project.project_title}>
                      {project.project_title}
                    </option>
                  ))}
                </select>
              </div>


              <div>
                <label htmlFor="task-name">Task Name:</label>
                <input
                  type="text"
                  id="task-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-[#444] text-white p-2 rounded mt-1"
                />
              </div>

              <div>
                <label htmlFor="description">Description:</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full bg-[#444] text-white p-2 rounded mt-1"
                />
              </div>

              <div>
                <label htmlFor="assigned-student">Assigned Student:</label>
                <select
                  id="assigned-student"
                  name="student"
                  value={formData.student}
                  onChange={handleInputChange}
                  className="w-full bg-[#444] text-white p-2 rounded mt-1"

                >
                  <option value="" disabled>
                    Select a student
                  </option>
                  {studentsToDisplay.map((student) => (
                    <option key={student.id} value={student.username}>
                      {student.username}
                    </option>
                  ))}
                </select>
              </div>


              <div>
                <label htmlFor="status">Status:</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full bg-[#444] text-white p-2 rounded mt-1"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label htmlFor="due-date">Due Date:</label>
                <input
                  type="date"
                  id="due-date"
                  name="due"
                  value={formData.due}
                  onChange={handleInputChange}
                  className="w-full bg-[#444] text-white p-2 rounded mt-1"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded mt-4"
              >
                Add Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
