const { gql } = require('apollo-server')

const typeDefs = gql`

type User {
    id: ID!
    username: String!
    password: String!
    university_id: Int
  }

type Project{
id:ID!,
project_title:String!,
project_desc:String!,
 student_list: [String],
  category: String,
  start_date: String,
  end_date: String,
  project_status: String

}

type ChatMessage {
  id: ID!
  sender: String!
  recipient: String!
  content: String!
  timestap: String!
} 

scalar Date
type Tasks {
        id: ID!,
        name: String!,
        project: String!,
        student: String!,
        status: String!,
        due: Date!, 
        description: String!
}
enum TaskSortBy {
        TASK_STATUS
        PROJECT_NAME
        DUE_DATE
        ASSIGNED_STUDENT_NAME
        TASK_NAME # Good to have if you want to sort by task name itself
}

type DashboardStats {
    projects: Int
    students: Int
    tasks: Int
    finishedProjects: Int
  }

  type AuthPayload {
    id: ID!
    username: String!
    university_id: Int
    role: String!
  }



type Query{

students: [User] ,
users: [User],
AdminTask:[Tasks!],
dashboardStats(role: String!, username: String!): DashboardStats,
allProjects:[Project!],
project(id:ID!):Project,
projectsBySN(studentName:String!):[Project]
login(username: String!, password: String!): AuthPayload,
userTasks (student: String!): [Tasks!],
tasks(
    sortBy: TaskSortBy
   
  ): [Tasks!],
   getMessages(sender: String!, recipient: String!): [ChatMessage!]!,
   admins: [User],
  getuserTasksord (student: String!, sortBy: TaskSortBy): [Tasks!]

}

type Mutation{
 signUp(username: String!, password: String!, university_id: Int): User,
addProject(
 project_title: String!
 project_desc: String!
    student_list: [String]
    category: String
    start_date: String
    end_date: String
    project_status: String
):Project,

createTask (name: String!, project: String!, student: String!, status: String!, due: Date!, description: String!): Tasks,
sendMessage(recipient: String!, content: String!, timestap: String!, sender: String!): ChatMessage!


}

`
module.exports = typeDefs