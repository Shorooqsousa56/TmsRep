import React, { useState, useEffect, useRef, useContext } from "react";
import { UserContext } from "../UserContext";
import { gql, useMutation, useLazyQuery } from "@apollo/client";

const GRAPHQL_ENDPOINT = "http://localhost:3000/graphql";

const Chat = () => {
  const { user } = useContext(UserContext);
  const [usersList, setUsersList] = useState([]); // will hold students for now
  const [adminsList, setAdminsList] = useState([]); // to hold admins
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const ws = useRef(null);

  const formatDateTimeForMySQL = (date) => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  // GraphQL queries/mutations

  const GET_STUDENTS = gql`
    query GetStudents {
      students {
        username
      }
    }
  `;

  const GET_ADMINS = gql`
    query GetAdmins {
      admins {
        username
      }
    }
  `;

  const GET_MESSAGES = gql`
    query GetMessages($sender: String!, $recipient: String!) {
      getMessages(sender: $sender, recipient: $recipient) {
        id
        sender
        recipient
        content
        timestap
      }
    }
  `;

  const SEND_MESSAGE = gql`
    mutation SendMessage($sender: String!, $recipient: String!, $content: String!, $timestap: String!) {
      sendMessage(sender: $sender, recipient: $recipient, content: $content, timestap: $timestap) {
        id
        sender
        recipient
        content
        timestap
      }
    }
  `;

  const [sendMessageMutation] = useMutation(SEND_MESSAGE);
  const [fetchStudents, { data: studentsData }] = useLazyQuery(GET_STUDENTS);
  const [fetchAdmins, { data: adminsData }] = useLazyQuery(GET_ADMINS);

  // Step 3 and 4: Fetch students and admins on mount
  useEffect(() => {
    fetchStudents();
    fetchAdmins();
  }, []);

  useEffect(() => {
    if (studentsData?.students) {
      setUsersList(studentsData.students.map(s => s.username));
    }
  }, [studentsData]);

  useEffect(() => {
    if (adminsData?.admins) {
      setAdminsList(adminsData.admins.map(a => a.username));
    }
  }, [adminsData]);

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:4000");

    ws.current.onopen = () => {
      ws.current.send(
        JSON.stringify({
          type: "auth",
          username: user?.username,
        })
      );
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (
        (message.sender === user?.username && message.recipient === selectedStudent) ||
        (message.recipient === user?.username && message.sender === selectedStudent)
      ) {
        setMessages((prev) => [...prev, message]);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.current.close();
    };
  }, [selectedStudent, user?.username]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!user?.username || !selectedStudent) return;

      try {
        const res = await fetch(GRAPHQL_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: GET_MESSAGES.loc.source.body,
            variables: {
              sender: user.username,
              recipient: selectedStudent,
            },
          }),
        });

        const result = await res.json();
        console.log(result);
        setMessages(result.data.getMessages);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    loadMessages();
  }, [selectedStudent, user?.username]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const message = {
      sender: user?.username,
      recipient: selectedStudent,
      content: input.trim(),
    };

    ws.current.send(
      JSON.stringify({
        sender: message.sender,
        text: message.content,
        time: new Date().toLocaleTimeString(),
      })
    );

    try {
      await sendMessageMutation({
        variables: {
          sender: message.sender,
          recipient: message.recipient,
          content: message.content,
          timestap: formatDateTimeForMySQL(new Date()),
        },
      });
    } catch (err) {
      console.error("GraphQL Error:", err);
    }

    setMessages((prev) => [
      ...prev,
      {
        sender: message.sender,
        text: message.content,
        time: message.timestap
      },
    ]);

    setInput('');
  };
  const header = user?.role === "student" ? " List of Admins" : " List of Students";
  return (
    <div className="flex flex-grow min-h-[calc(100vh-64px)] gap-4">
      <aside className="w-64 bg-zinc-800 p-5 rounded border border-zinc-700">
        <h2 className="text-base mb-4 font-semibold">{header}</h2>
        <ul className="space-y-2">
          {(user?.role === "student" ? adminsList : usersList).map((username) => (
            <li
              key={username}
              className={`p-2 rounded cursor-pointer ${selectedStudent === username
                  ? "bg-blue-600 text-white"
                  : "bg-[#444] hover:bg-[#555] text-white"
                }`}
              onClick={() => {
                setSelectedStudent(username);
                setMessages([]);
              }}
            >
              {username}
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex-1 flex flex-col bg-[#1f1f1f] p-5 rounded border border-zinc-700 shadow">
        <header className="bg-[#333] p-4 rounded text-lg font-medium mb-4">
          Chat with {selectedStudent || "..."}
        </header>

        <section className="flex-1 overflow-y-auto bg-[#222] p-4 rounded space-y-3 mb-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded text-white ${msg.sender === user?.username ? "bg-green-600" : "bg-gray-700"
                }`}
            >
              <strong>{msg.sender}</strong>: {msg.text || msg.content}
              <span className="text-xs block text-right">
                {msg.time || msg.timestap}
              </span>
            </div>
          ))}
        </section>

        <footer className="flex items-center bg-[#333] p-3 rounded space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedStudent ? "Type your message..." : "Select a student first"
            }
            className="flex-1 bg-[#444] text-white p-2 rounded border-none outline-none"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={!selectedStudent}
          />
          <button
            onClick={sendMessage}
            className="bg-[#28a745] hover:bg-[#218838] text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={!selectedStudent}
          >
            Send
          </button>
        </footer>
      </main>
    </div>
  );
};

export default Chat;
