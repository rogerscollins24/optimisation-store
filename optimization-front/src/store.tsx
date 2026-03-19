import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Task {
  id: string;
  title: string;
  image: string;
  price: number;
  commission: number;
  status: 'pending' | 'completed';
  createdAt: string;
  taskCode: string;
}

interface UserState {
  records: Task[];
  setRecords: React.Dispatch<React.SetStateAction<Task[]>>;
  addTask: (task: Task) => void;
  completeTask: (taskId: string) => void;
}

const UserContext = createContext<UserState | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [records, setRecords] = useState<Task[]>([]);

  const addTask = (task: Task) => {
    setRecords((prev) => [task, ...prev]);
  };

  const completeTask = (taskId: string) => {
    setRecords((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: 'completed' } : task
      )
    );
  };

  return (
    <UserContext.Provider value={{ records, setRecords, addTask, completeTask }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
