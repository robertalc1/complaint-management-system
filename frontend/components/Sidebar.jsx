import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon,
  DocumentPlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

function Sidebar() {
  const location = useLocation();
  
  const menuItems = [
    {
      path: '/dashboard',
      icon: HomeIcon,
      title: 'Dashboard',
      description: 'Tablou de bord și statistici'
    },
    {
      path: '/dashboard/contestatii',
      icon: DocumentPlusIcon,
      title: 'Adaugă Contestație',
      description: 'Creează contestație nouă'
    },
    {
      path: '/dashboard/filter-contestatii',
      icon: MagnifyingGlassIcon,
      title: 'Caută Contestații',
      description: 'Căutare și gestionare'
    },
    {
      path: '/dashboard/generare-raport',
      icon: DocumentTextIcon,
      title: 'Generare Raport',
      description: 'Creează rapoarte PDF'
    }
  ];

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 pt-16 z-20">
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-3">
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-3 rounded-lg group transition-all duration-200 ${
                    active 
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500' 
                      : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
                >
                  <Icon 
                    className={`flex-shrink-0 h-5 w-5 ${
                      active ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-600'
                    }`} 
                  />
                  <div className="ml-3 flex-1">
                    <p className={`text-sm font-medium ${active ? 'text-blue-700' : 'text-gray-700'}`}>
                      {item.title}
                    </p>
                    <p className={`text-xs ${active ? 'text-blue-600' : 'text-gray-500'}`}>
                      {item.description}
                    </p>
                  </div>
                  {active && (
                    <ChevronRightIcon className="h-4 w-4 text-blue-500" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
