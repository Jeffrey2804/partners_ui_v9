import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate user authentication
    const mockUser = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Sales Representative',
      department: 'Sales',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      permissions: ['view_tasks', 'create_tasks', 'edit_tasks', 'delete_tasks'],
      preferences: {
        theme: 'light',
        notifications: true,
        taskView: 'list',
      },
    };

    // Store user in localStorage for persistence
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    setUser(mockUser);
    setLoading(false);
  }, []);


  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const updatePreferences = (preferences) => {
    const updatedUser = {
      ...user,
      preferences: { ...user.preferences, ...preferences },
    };
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    updateUser,
    updatePreferences,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
