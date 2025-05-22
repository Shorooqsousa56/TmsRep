const db = require('./db')
const bcrypt = require('bcrypt');

const { GraphQLDateTime } = require('graphql-scalars');

const STATUS_ORDER = {
    'Not Started': 0,
    'In Progress': 1,
    'Complete': 2,
};


const resolvers = {

    Query: {
        users: async () => {
            return await db('users').select('*');
        },
        students: async () => {
            return await db('users').whereNotNull('university_id').select('*');
        },

        dashboardStats: async (_, args, context) => {
            const userId = context.userId;
            const { role, username } = args;

            const user = await db('users').where('username', username).first(); // صح

            if (!user) throw new Error('User not found');

            const [allProjects, allTasks, students] = await Promise.all([
                db('projects').select('*'),
                db('task').select('*'),
                db('users').whereNotNull('university_id'),
            ]);

            const finishedProjects = allProjects.filter(p => p.project_status === 'Completed').length;

            if (role === 'admin') {
                return {
                    projects: allProjects.length,
                    tasks: allTasks.length,
                    students: students.length,
                    finishedProjects,
                };
            } else {
                // ترشيح المشاريع والتاسكات التي تخص الطالب بناءً على username
                const studentProjects = allProjects.filter(project =>
                    project.student_list && project.student_list.includes(username)
                );

                const studentTasks = allTasks.filter(task =>
                    task.student && task.student.includes(username)
                );

                return {
                    projects: studentProjects.length,
                    tasks: studentTasks.length,
                    students: null,
                    finishedProjects: studentProjects.filter(p => p.project_status === 'Completed').length,
                };
            }
        },



        login: async (_, { username, password }) => {
            const user = await db('users').where({ username }).first();
            if (!user || !(await bcrypt.compare(password, user.password))) {
                throw new Error('Invalid username or password');
            }

            return {
                id: user.id,
                username: user.username,
                university_id: user.university_id,
                role: user.university_id ? 'student' : 'admin',
            };
        },

        allProjects: async () => {
            const projects = await db('projects').select('*');
            return projects.map(p => ({
                ...p,
                student_list: p.student_list ? JSON.parse(p.student_list) : [],
                start_date: p.start_date ? new Date(p.start_date).toISOString() : null,
                end_date: p.end_date ? new Date(p.end_date).toISOString() : null

            }))



        },

        AdminTask: async () => {
            const tasks = await db('task').select('*');
            return tasks.map(t => ({
                ...t,
                due: t.due ? new Date(t.due) : null
            }));
        },
        project: async (_, { id }) => {
            const project = await db('projects').where({ id }).first();
            if (!project) return null;
            return {
                ...project,
                student_list: project.student_list ? JSON.parse(project.student_list) : [],
                start_date: project.start_date ? new Date(project.start_date).toISOString() : null,
                end_date: project.end_date ? new Date(project.end_date).toISOString() : null
            }

        },
        projectsBySN: async (_, { studentName }) => {

            const projects = await db('projects').select('*');
            return projects.map(p =>
            ({
                ...p,
                student_list: p.student_list ? JSON.parse(p.student_list) : [],
                start_date: p.start_date ? new Date(p.start_date).toISOString() : null,
                end_date: p.end_date ? new Date(p.end_date).toISOString() : null
            })

            ).filter(p => p.student_list.includes(studentName));


        },

        userTasks: async (_, { student }) => {
            const tasks = await db('task').where({ student });
            return tasks.map(t => ({
                ...t,
                due: t.due ? new Date(t.due) : null
            }));
        },


        tasks: async (_, { sortBy }) => {
            const tasks = await db('task').select('*');

            return tasks
                .map(t => ({
                    ...t,
                    due: t.due ? new Date(t.due) : null
                }))
                .sort((a, b) => {
                    if (sortBy === 'TASK_STATUS') {
                        return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
                    } else if (sortBy === 'PROJECT_NAME') {
                        return a.project.localeCompare(b.project);
                    } else if (sortBy === 'DUE_DATE') {
                        return new Date(a.due) - new Date(b.due);
                    } else if (sortBy === 'ASSIGNED_STUDENT_NAME') {
                        return a.student.localeCompare(b.student);
                    } else if (sortBy === 'TASK_NAME') {
                        return a.name.localeCompare(b.name);
                    } else {
                        return 0;
                    }
                });
        },
        getuserTasksord: async (_, { student, sortBy }) => {
            const tasks = await db('task')
                .select('*')
                .where('student', student); // فلترة حسب اسم الطالب

            return tasks
                .map(t => ({
                    ...t,
                    due: t.due ? new Date(t.due) : null
                }))
                .sort((a, b) => {
                    if (sortBy === 'TASK_STATUS') {
                        return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
                    } else if (sortBy === 'PROJECT_NAME') {
                        return a.project.localeCompare(b.project);
                    } else if (sortBy === 'DUE_DATE') {
                        return new Date(a.due) - new Date(b.due);
                    } else if (sortBy === 'ASSIGNED_STUDENT_NAME') {
                        return a.student.localeCompare(b.student);
                    } else if (sortBy === 'TASK_NAME') {
                        return a.name.localeCompare(b.name);
                    } else {
                        return 0;
                    }
                });
        },
        getMessages: async (_, { sender, recipient }) => {
            const messages = await db('chat')
                .where(function () {
                    this.where('sender', sender).andWhere('recipient', recipient);
                })
                .orWhere(function () {
                    this.where('sender', recipient).andWhere('recipient', sender);
                })
                .orderBy('timestap', 'asc');

            return messages.map((msg) => ({
                ...msg,
                timestap: (() => {
                    const d = new Date(msg.timestap);
                    return `${String(d.getDate()).padStart(2, '0')}:${String(d.getMonth() + 1).padStart(2, '0')}:${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                })(),
            }));
        },
        admins: async () => {
            return await db('users').whereNull('university_id').select('*');
        }



    },
    Mutation: {
        signUp: async (_, { username, password, university_id }) => {
            const existing = await db('users').where({ username }).first();
            if (existing) throw new Error('Username already exists.');

            if (university_id != null) {
                const uniIdStr = university_id.toString();
                if (uniIdStr.length !== 8 || !/^\d+$/.test(uniIdStr)) {
                    throw new Error('University ID must be exactly 8 digits.');
                }
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const [id] = await db('users').insert({
                username,
                password: hashedPassword,
                university_id,
            });

            return await db('users').where({ id }).first();
        },
        addProject: async (_, args) => {

            const {
                project_title,
                project_desc,
                student_list,
                category,
                start_date,
                end_date,
                project_status
            } = args;

            const formattedStartDate = start_date ? new Date(start_date).toISOString() : null;
            const formattedEndDate = end_date ? new Date(end_date).toISOString() : null;
            const [id] = await db('projects').insert({

                project_title,
                project_desc,
                student_list: student_list ? JSON.stringify(student_list) : null,
                category,
                start_date: formattedStartDate,
                end_date: formattedEndDate,
                project_status

            });
            const newProject = await db('projects').where({ id }).first();
            return {
                ...newProject,
                student_list: newProject.student_list ? JSON.parse(newProject.student_list) : [],
                start_date: newProject.start_date ? new Date(newProject.start_date).toISOString() : null,
                end_date: newProject.end_date ? new Date(newProject.end_date).toISOString() : null
            }

        },

        createTask: async (_, args) => {
            const {
                name,
                project,
                student,
                status,
                due,
                description
            } = args;

            const [id] = await db('task').insert({
                name,
                project,
                student,
                status,
                due,
                description
            });
            const newTask = await db('task').where({ id }).first();
            return {
                ...newTask,
                due: newTask.due ? new Date(newTask.due) : null
            }
        },
        sendMessage: async (_, { sender, recipient, content, timestap }) => {
            const [id] = await db('chat').insert({
                sender,
                recipient,
                content,
                timestap,
            });
            return { id, sender, recipient, content, timestap };
        }





    }

}
module.exports = resolvers;