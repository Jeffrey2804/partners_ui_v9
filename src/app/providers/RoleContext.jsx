// ========================================
// 🎯 ROLE CONTEXT FOR ROLE MANAGEMENT
// ========================================

import { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState('LO');

  // Available roles configuration
  const roles = [
    {
      id: 'LO',
      name: 'LO',
      description: 'Loan Officer dashboard',
              path: '/user-dashboard/user',
      color: 'blue',
    },
    {
      id: 'LOA',
      name: 'LOA',
      description: 'Loan Officer Assistant dashboard',
              path: '/admin-dashboard/user',
      color: 'red',
    },
    {
      id: 'Production Partner',
      name: 'Production Partner',
      description: 'Partner management',
              path: '/partner-dashboard/user',
      color: 'green',
    },
  ];

  // Initialize role from localStorage
  useEffect(() => {
    const storedRole = localStorage.getItem('currentRole') || 'LO';
    setCurrentRole(storedRole);
  }, []);

  const changeRole = (newRole) => {
    setCurrentRole(newRole);
    localStorage.setItem('currentRole', newRole);
  };

  const getCurrentRoleConfig = () => {
    return roles.find(role => role.id === currentRole) || roles[0];
  };

  const value = {
    currentRole,
    changeRole,
    roles,
    getCurrentRoleConfig,
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

export default RoleContext;
