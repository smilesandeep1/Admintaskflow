import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Users from './pages/Users';
import Reports from './pages/Reports';
import DownloadReports from './pages/DownloadReports';
import TaskReports from './pages/TaskReports';
import AIInsights from './pages/AIInsights';
import Chat from './pages/Chat';
import Login from './pages/Login';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string | ReactNode;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const ChatIcon = () => (
  <img 
    src="https://miaoda-conversation-file.s3cdn.medo.dev/user-7ooucjdxhcsg/conv-7oowe77h6v40/20251127/file-7ud1shl72ebk.png" 
    alt="Chat" 
    className="w-12 h-12 inline-block object-contain"
  />
);

const routes: RouteConfig[] = [
  {
    name: 'Dashboard',
    path: '/',
    element: <Dashboard />
  },
  {
    name: 'Tasks',
    path: '/tasks',
    element: <Tasks />
  },
  {
    name: 'Users',
    path: '/users',
    element: <Users />
  },
  {
    name: 'Reports',
    path: '/reports',
    element: <Reports />
  },
  {
    name: 'Download Reports',
    path: '/download-reports',
    element: <DownloadReports />
  },
  {
    name: 'Task Reports',
    path: '/task-reports',
    element: <TaskReports />
  },
  {
    name: 'AI Insights',
    path: '/ai-insights',
    element: <AIInsights />
  },
  {
    name: <ChatIcon />,
    path: '/messages',
    element: <Chat />
  },
  {
    name: 'Login',
    path: '/login',
    element: <Login />,
    visible: false
  }
];

export default routes;