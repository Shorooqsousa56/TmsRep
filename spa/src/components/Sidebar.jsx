import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react'; // أيقونة الهمبرغر
const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) { // sm breakpoint في tailwind
        setIsOpen(true);
      }
    };

    // استدعاء أولي
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        className="sm:hidden fixed top-4 left-4 z-50 bg-zinc-900 text-white p-2 rounded-md"
        onClick={toggleSidebar}
      >
        <Menu size={24} />
      </button>
      <div className={`fixed left-0 h-full w-64 bg-gradient-to-b from-zinc-900 to-zinc-800 text-white p-4 z-40 transition-transform duration-300
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    sm:translate-x-0 sm:static sm:block sm:mt-16 sm:h-[calc(100vh-4rem)]`}
        style={{ top: isOpen || window.innerWidth >= 640 ? '2rem' : '0' }}>
        <nav className="flex flex-col gap-4 text-white">

          <NavLink
            to="/dashboard/home"
            end
            className={({ isActive }) =>
              `px-4 py-3 rounded-md text-left  ${isActive ? 'bg-blue-500' : 'bg-zinc-800 hover:bg-blue-500'
              }`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/dashboard/projects"
            className={({ isActive }) =>
              `px-4 py-3 rounded-md text-left ${isActive ? 'bg-blue-500' : 'bg-zinc-800 hover:bg-blue-500'
              }`
            }
          >
            Projects
          </NavLink>
          <NavLink
            to="/dashboard/tasks"
            className={({ isActive }) =>
              `px-4 py-3 rounded-md text-left ${isActive ? 'bg-blue-500' : 'bg-zinc-800 hover:bg-blue-500'
              }`
            }
          >
            Tasks
          </NavLink>
          <NavLink
            to="/dashboard/chat"
            className={({ isActive }) =>
              `px-4 py-3 rounded-md text-left ${isActive ? 'bg-blue-500' : 'bg-zinc-800 hover:bg-blue-500'
              }`
            }
          >
            Chat
          </NavLink>
        </nav>
      </div>

    </>

  );
};

export default Sidebar;
