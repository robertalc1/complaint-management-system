import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  BellIcon
} from '@heroicons/react/24/outline';

const Header = ({ name }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const res = await axios.get('http://localhost:8082/logout');
      if (res.data.Status === "Success") {
        navigate('/login');
      }
    } catch (err) {
      navigate('/login');
    }
  };

  return (
    <header className="fixed w-full top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5 lg:px-6">
        <div className="flex items-center">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-1.5 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-gray-800 hidden md:block">
              Sistem Gestionare Contestații
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-1">
            <button className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <BellIcon className="h-5 w-5" />
            </button>
            <button className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <Cog6ToothIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex items-center">
            <div className="flex items-center bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
              <UserCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                {name || 'Utilizator'}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title="Deconectare"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1.5" />
            Deconectare
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
