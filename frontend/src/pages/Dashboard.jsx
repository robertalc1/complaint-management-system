import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { 
  DocumentPlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowRightIcon,
  UserGroupIcon,
  CalendarIcon,
  QuestionMarkCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

function Dashboard() {
  const [name] = useOutletContext();
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  // Formatăm data curentă când componenta se încarcă
  useEffect(() => {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDate(now.toLocaleDateString('ro-RO', options));
  }, []);

  // Fetch statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8082/contestatii-stats', {
          withCredentials: true
        });
        
        if (response.data) {
          setStats({
            total: response.data.total || 0,
            approved: response.data.approved || 0,
            rejected: response.data.rejected || 0,
            pending: response.data.pending || 0
          });
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
        setError('Nu s-au putut încărca statisticile. Vă rugăm să reîncărcați pagina.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Calculăm procentul pentru contestații aprobate
  const approvalRate = stats.total > 0 
    ? Math.round((stats.approved / stats.total) * 100) 
    : 0;

  const menuItems = [
    {
      path: '/dashboard/contestatii',
      icon: DocumentPlusIcon,
      title: 'Adaugă Contestație',
      description: 'Înregistrați o nouă contestație în sistem',
      bgColor: 'bg-blue-50',
      hoverBgColor: 'hover:bg-blue-100',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-100',
    },
    {
      path: '/dashboard/filter-contestatii',
      icon: MagnifyingGlassIcon,
      title: 'Caută Contestații',
      description: 'Căutați și gestionați contestațiile existente',
      bgColor: 'bg-emerald-50',
      hoverBgColor: 'hover:bg-emerald-100',
      borderColor: 'border-emerald-200',
      iconColor: 'text-emerald-600',
      iconBgColor: 'bg-emerald-100',
    },
    {
      path: '/dashboard/generare-raport',
      icon: DocumentTextIcon,
      title: 'Generare Raport',
      description: 'Creați rapoarte pentru contestațiile înregistrate',
      bgColor: 'bg-amber-50',
      hoverBgColor: 'hover:bg-amber-100',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600',
      iconBgColor: 'bg-amber-100',
    }
  ];

  // Calculați procentul contestații admise vs. respinse pentru bara de progres
  const approvedPercentage = stats.total > 0 
    ? (stats.approved / stats.total) * 100 
    : 0;
  
  const rejectedPercentage = stats.total > 0 
    ? (stats.rejected / stats.total) * 100 
    : 0;

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header cu informații de bun venit și data curentă */}
      <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-blue-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                Bun venit, {name}
              </h1>
              <p className="text-gray-600 flex items-center text-sm">
                <CalendarIcon className="h-4 w-4 mr-1 text-blue-500" />
                {currentDate}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link 
                to="/dashboard/contestatii"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <DocumentPlusIcon className="h-4 w-4 mr-1.5" />
                Adaugă contestație nouă
              </Link>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
            Prezentare generală a sistemului
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Statistici principale - cu design îmbunătățit */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex">
              <div className="mr-4">
                <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-200">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-blue-700 font-medium text-sm">Total contestații</p>
                <div className="flex items-end">
                  <span className="text-2xl font-semibold text-gray-800">{stats.total}</span>
                  <span className="text-xs text-gray-500 ml-1 mb-1">înregistrate</span>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex">
              <div className="mr-4">
                <div className="bg-white p-3 rounded-lg shadow-sm border border-green-200">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div>
                <p className="text-green-700 font-medium text-sm">Contestații admise</p>
                <div className="flex items-end">
                  <span className="text-2xl font-semibold text-gray-800">{stats.approved}</span>
                  <span className="text-xs text-gray-500 ml-1 mb-1">({approvalRate}%)</span>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 rounded-xl p-4 border border-red-100 flex">
              <div className="mr-4">
                <div className="bg-white p-3 rounded-lg shadow-sm border border-red-200">
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div>
                <p className="text-red-700 font-medium text-sm">Contestații respinse</p>
                <div className="flex items-end">
                  <span className="text-2xl font-semibold text-gray-800">{stats.rejected}</span>
                  <span className="text-xs text-gray-500 ml-1 mb-1">{stats.total > 0 ? `(${Math.round((stats.rejected / stats.total) * 100)}%)` : '(0%)'}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex">
              <div className="mr-4">
                <div className="bg-white p-3 rounded-lg shadow-sm border border-amber-200">
                  <ClockIcon className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div>
                <p className="text-amber-700 font-medium text-sm">În așteptare</p>
                <div className="flex items-end">
                  <span className="text-2xl font-semibold text-gray-800">{stats.pending}</span>
                  <span className="text-xs text-gray-500 ml-1 mb-1">{stats.total > 0 ? `(${Math.round((stats.pending / stats.total) * 100)}%)` : '(0%)'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress bar pentru vizualizare statistici */}
          {stats.total > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs text-gray-500">Distribuția contestațiilor</p>
                <p className="text-xs text-gray-500">{stats.total} total</p>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="flex h-full">
                  <div 
                    className="bg-green-500 h-full" 
                    style={{ width: `${approvedPercentage}%` }}
                    title={`${stats.approved} contestații admise (${Math.round(approvedPercentage)}%)`}
                  ></div>
                  <div 
                    className="bg-red-500 h-full" 
                    style={{ width: `${rejectedPercentage}%` }}
                    title={`${stats.rejected} contestații respinse (${Math.round(rejectedPercentage)}%)`}
                  ></div>
                  <div 
                    className="bg-amber-400 h-full" 
                    style={{ width: `${100 - approvedPercentage - rejectedPercentage}%` }}
                    title={`${stats.pending} contestații în așteptare (${Math.round(100 - approvedPercentage - rejectedPercentage)}%)`}
                  ></div>
                </div>
              </div>
              <div className="flex text-xs mt-1">
                <span className="flex items-center mr-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-1"></div>
                  Admise
                </span>
                <span className="flex items-center mr-3">
                  <div className="h-2 w-2 bg-red-500 rounded-full mr-1"></div>
                  Respinse
                </span>
                <span className="flex items-center">
                  <div className="h-2 w-2 bg-amber-400 rounded-full mr-1"></div>
                  În așteptare
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Acțiuni rapide - cu design îmbunătățit */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 px-1 flex items-center">
          <UserGroupIcon className="h-5 w-5 mr-2 text-blue-600" />
          Acțiuni rapide
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`${item.bgColor} ${item.hoverBgColor} border ${item.borderColor} rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col`}
            >
              <div className="p-6">
                <div className={`inline-flex items-center justify-center p-3 rounded-xl ${item.iconBgColor} ${item.iconColor} mb-4 shadow-sm`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                <div className="mt-auto pt-2">
                  <span className={`inline-flex items-center text-sm font-medium ${item.iconColor}`}>
                    Accesați
                    <ArrowRightIcon className="ml-1 h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Comenzi rapide și informații ajutătoare */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-blue-600" />
              Comenzi rapide
            </h3>
            
            <div className="space-y-3">
              <Link 
                to="/dashboard/filter-contestatii"
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                <div className="flex items-center">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="text-gray-700">Vizualizează toate contestațiile</span>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-gray-400" />
              </Link>
              
              <Link 
                to="/dashboard/contestatii"
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                <div className="flex items-center">
                  <DocumentPlusIcon className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="text-gray-700">Adaugă contestație nouă</span>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-gray-400" />
              </Link>
              
              <Link 
                to="/dashboard/generare-raport"
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="text-gray-700">Generează raport</span>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <QuestionMarkCircleIcon className="h-5 w-5 mr-2 text-blue-600" />
              Informații utile
            </h3>
            
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="font-medium text-blue-800 mb-1 text-sm">Cum adaug o contestație?</h4>
                <p className="text-sm text-blue-700">
                  Accesați secțiunea "Adaugă Contestație" și completați toate câmpurile marcate ca obligatorii. 
                  Apoi apăsați butonul "Trimite Contestația".
                </p>
              </div>
              
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <h4 className="font-medium text-emerald-800 mb-1 text-sm">Cum caut contestații?</h4>
                <p className="text-sm text-emerald-700">
                  Utilizați secțiunea "Caută Contestații" pentru a filtra și găsi rapid contestațiile înregistrate
                  în sistem după diferite criterii.
                </p>
              </div>
              
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <h4 className="font-medium text-amber-800 mb-1 text-sm">Cum generez un raport?</h4>
                <p className="text-sm text-amber-700">
                  Accesați secțiunea "Generare Raport", selectați criteriile dorite și apăsați pe 
                  butonul "Generează Raport PDF".
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}

export default Dashboard;