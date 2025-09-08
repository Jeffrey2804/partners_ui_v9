// ========================================
// 🎯 ROLE SWITCHER COMPONENT
// ========================================

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiUser, FiShield, FiUsers } from 'react-icons/fi';
import { useRole } from '@context/RoleContext';

const RoleSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentRole, changeRole, roles } = useRole();

  // Enhanced roles configuration with UI properties
  const enhancedRoles = roles.map(role => ({
    ...role,
    icon: role.id === 'LO' ? FiUser : role.id === 'LOA' ? FiShield : FiUsers,
    color: role.id === 'LO' ? 'text-blue-600' : role.id === 'LOA' ? 'text-red-600' : 'text-green-600',
    bgColor: role.id === 'LO' ? 'bg-blue-50' : role.id === 'LOA' ? 'bg-red-50' : 'bg-green-50',
    borderColor: role.id === 'LO' ? 'border-blue-200' : role.id === 'LOA' ? 'border-red-200' : 'border-green-200',
  }));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleChange = (role) => {
    changeRole(role.id);
    setIsOpen(false);

    // Navigate to the appropriate dashboard
    navigate(role.path);
  };

  const currentRoleConfig = enhancedRoles.find(role => role.id === currentRole) || enhancedRoles[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200
          hover:shadow-md hover:scale-105
          ${currentRoleConfig.bgColor} ${currentRoleConfig.borderColor}
          ${currentRoleConfig.color}
        `}
      >
        <currentRoleConfig.icon className="w-4 h-4" />
        <span className="text-sm font-medium">{currentRoleConfig.name}</span>
        <FiChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
          >
                         <div className="p-2">
               {enhancedRoles.map((role) => {
                 const Icon = role.icon;
                 const isActive = role.id === currentRole;

                return (
                  <button
                    key={role.id}
                    onClick={() => handleRoleChange(role)}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200
                      ${isActive
                        ? `${role.bgColor} ${role.borderColor} border`
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <div className={`
                      p-2 rounded-lg ${role.bgColor}
                      ${isActive ? role.color : 'text-gray-500 dark:text-gray-400'}
                    `}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`
                        text-sm font-medium
                        ${isActive ? role.color : 'text-gray-700 dark:text-gray-300'}
                      `}>
                        {role.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {role.description}
                      </div>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoleSwitcher;
