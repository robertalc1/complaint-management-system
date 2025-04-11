import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  DocumentArrowDownIcon,
  FunnelIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  CalendarIcon,
  ArrowsUpDownIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Configurație globală pentru axios
axios.defaults.withCredentials = true;

// Lista județelor din România sortată alfabetic
const ROMANIAN_COUNTIES = [
  { id: "AB", name: "Alba" },
  { id: "AR", name: "Arad" },
  { id: "AG", name: "Argeș" },
  { id: "BC", name: "Bacău" },
  { id: "BH", name: "Bihor" },
  { id: "BN", name: "Bistrița-Năsăud" },
  { id: "BT", name: "Botoșani" },
  { id: "BR", name: "Brăila" },
  { id: "BV", name: "Brașov" },
  { id: "B", name: "București" },
  { id: "BZ", name: "Buzău" },
  { id: "CL", name: "Călărași" },
  { id: "CS", name: "Caraș-Severin" },
  { id: "CJ", name: "Cluj" },
  { id: "CT", name: "Constanța" },
  { id: "CV", name: "Covasna" },
  { id: "DJ", name: "Dolj" },
  { id: "GL", name: "Galați" },
  { id: "GR", name: "Giurgiu" },
  { id: "GJ", name: "Gorj" },
  { id: "HR", name: "Harghita" },
  { id: "HD", name: "Hunedoara" },
  { id: "IL", name: "Ialomița" },
  { id: "IS", name: "Iași" },
  { id: "IF", name: "Ilfov" },
  { id: "MM", name: "Maramureș" },
  { id: "MH", name: "Mehedinți" },
  { id: "MS", name: "Mureș" },
  { id: "NT", name: "Neamț" },
  { id: "OT", name: "Olt" },
  { id: "PH", name: "Prahova" },
  { id: "SJ", name: "Sălaj" },
  { id: "SM", name: "Satu Mare" },
  { id: "SB", name: "Sibiu" },
  { id: "SV", name: "Suceava" },
  { id: "TR", name: "Teleorman" },
  { id: "TM", name: "Timiș" },
  { id: "TL", name: "Tulcea" },
  { id: "VS", name: "Vaslui" },
  { id: "VL", name: "Vâlcea" },
  { id: "VN", name: "Vrancea" }
].sort((a, b) => a.name.localeCompare(b.name));

// Componentă reutilizabilă pentru câmpurile de filtrare
const FilterField = ({ 
  id, 
  label, 
  name, 
  value, 
  onChange, 
  type = "text", 
  placeholder = "", 
  options = null,
  icon = null,
  error = null,
  required = false,
  onlyNumbers = false
}) => {
  const isSelect = options !== null;
  const hasIcon = icon !== null;
  
  // Clasa CSS pentru stările input-ului - modernizată
  const inputClass = `w-full px-3 py-2 bg-white border ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} rounded-lg shadow-sm transition-all duration-150 focus:outline-none focus:ring-1 ${value ? 'text-gray-900' : 'text-gray-500'}`;
  
  // Handler pentru input cu validare pentru numere
  const handleInputChange = (e) => {
    if (onlyNumbers) {
      // Permite doar cifrele (0-9)
      const newValue = e.target.value.replace(/[^0-9]/g, '');
      
      // Crează un eveniment sintetic similar cu evenimentul original
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          name: e.target.name,
          value: newValue
        }
      };
      
      onChange(syntheticEvent);
    } else {
      onChange(e);
    }
  };
  
  return (
    <div className="mb-3">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className={`relative ${hasIcon ? 'has-icon' : ''}`}>
        {hasIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        {isSelect ? (
          <select
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            className={`${inputClass} ${hasIcon ? 'pl-10' : ''}`}
          >
            <option value="">{placeholder || "Toate opțiunile"}</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={id}
            name={name}
            type={type}
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={`${inputClass} ${hasIcon ? 'pl-10' : ''}`}
            maxLength={type === "text" && name === "cnp" ? 13 : undefined}
          />
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">{error}</p>
      )}
    </div>
  );
};

// Componentă separată pentru butonul de acțiune din tabel
const ActionButton = ({ onClick, icon: Icon, title, colorClass }) => (
  <button
    onClick={onClick}
    className={`p-1.5 rounded-md transition-colors duration-150 ${
      colorClass === 'primary' ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-50' :
      colorClass === 'green' ? 'text-green-600 hover:text-green-800 hover:bg-green-50' :
      colorClass === 'red' ? 'text-red-600 hover:text-red-800 hover:bg-red-50' :
      'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
    }`}
    title={title}
  >
    <Icon className="h-5 w-5" />
  </button>
);

// Header pentru fiecare secțiune
const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-gray-200">
    <Icon className="h-5 w-5 text-blue-600" />
    <h3 className="text-base font-medium text-gray-800">{title}</h3>
  </div>
);

function FilterComplaintFormFixed() {
  const [name] = useOutletContext();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [filterData, setFilterData] = useState({
    nume: '',
    prenume: '',
    cnp: '',
    regiune: '',
    dataStart: '',
    dataEnd: '',
    numarContestatie: ''
  });

  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Paginare simplă
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Handler pentru modificarea câmpurilor
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Resetarea filtrelor
  const clearFilters = () => {
    setFilterData({
      nume: '',
      prenume: '',
      cnp: '',
      regiune: '',
      dataStart: '',
      dataEnd: '',
      numarContestatie: ''
    });
  };

  // Paginare
  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // Trimiterea formularului de filtrare
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowResults(false);
    setSuccessMessage('');

    try {
      const formData = {
        ...filterData,
        nume: filterData.nume.trim(),
        prenume: filterData.prenume.trim(),
        cnp: filterData.cnp.trim(),
        numarContestatie: filterData.numarContestatie.trim()
      };

      // Folosim un timeout pentru a evita blocarea aplicației
      const response = await axios.post('http://localhost:8082/filter-contestatii', formData, {
        withCredentials: true,
        timeout: 20000
      });

      if (response && response.data) {
        // Asigurăm-ne că datele sunt într-un format sigur
        let safeData = [];
        
        if (Array.isArray(response.data)) {
          safeData = response.data;
        } else if (typeof response.data === 'object') {
          // Dacă avem un obiect, încercăm să extragem datele relevante
          safeData = Array.isArray(response.data.data) ? response.data.data : [response.data];
        }
        
        // Adăugăm ID-uri unice
        const complaintsWithId = safeData.map((complaint, index) => ({
          ...complaint,
          uniqueId: complaint.id || `temp-${Date.now()}-${index}`
        }));
        
        setFilteredComplaints(complaintsWithId);
        if (complaintsWithId.length > 0) {
          setSuccessMessage(`S-au găsit ${complaintsWithId.length} contestații.`);
        } else {
          setSuccessMessage('Nu s-au găsit contestații pentru filtrele aplicate.');
        }
      } else {
        setFilteredComplaints([]);
        setSuccessMessage('Nu s-au găsit contestații pentru filtrele aplicate.');
      }
    } catch (error) {
      console.error('Eroare la filtrare:', error);
      setError('A apărut o eroare la filtrarea contestațiilor. Vă rugăm să încercați din nou.');
      setFilteredComplaints([]);
    } finally {
      setLoading(false);
      setShowResults(true);
      setPage(0); // Reset la prima pagină când avem rezultate noi
      
      // Ascundem mesajul de succes după 5 secunde
      if (successMessage) {
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      }
    }
  };

  // Acțiuni pentru contestații
  const handleViewDetails = (complaintId) => {
    navigate(`/dashboard/edit-contestatie/${complaintId}`);
  };

  const handleDownloadPDF = (complaint) => {
    try {
      const doc = new jsPDF();
      
      doc.setFont("helvetica");
      doc.setFontSize(16);
      doc.text('Contestație', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      let yPos = 40;
      
      // Informații de bază
      const addField = (label, value) => {
        if (value) {
          doc.text(`${label}: ${value}`, 20, yPos);
          yPos += 10;
        }
      };
      
      addField('Număr contestație', complaint.numar_contestatie || 'N/A');
      addField('Nume', complaint.nume || 'N/A');
      addField('Prenume', complaint.prenume || 'N/A');
      addField('CNP', complaint.cnp || 'N/A');
      
      const judet = ROMANIAN_COUNTIES.find(county => county.id === complaint.regiune);
      addField('Județ', judet ? judet.name : (complaint.regiune || 'N/A'));
      addField('Adresă', complaint.adresa);
      
      if (complaint.data_aleasa) {
        addField('Data', new Date(complaint.data_aleasa).toLocaleDateString('ro-RO'));
      }
      
      if (complaint.observatii) {
        doc.text('Observații:', 20, yPos);
        yPos += 10;
        const splitObservatii = doc.splitTextToSize(complaint.observatii, 170);
        doc.text(splitObservatii, 20, yPos);
      }
      
      doc.save(`contestatie-${complaint.numar_contestatie || 'necunoscut'}.pdf`);
      
      // Afișăm un mesaj de succes
      setSuccessMessage('PDF-ul a fost generat și descărcat cu succes.');
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Eroare la generarea PDF:', error);
      setError('Nu s-a putut genera PDF-ul. Verificați consola pentru detalii.');
    }
  };

  const handleDeleteClick = (complaintId) => {
    setDeleteId(complaintId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`http://localhost:8082/contestatii/${deleteId}`);
      
      const updatedComplaints = filteredComplaints.filter(
        complaint => complaint.uniqueId !== deleteId && complaint.id !== deleteId
      );
      setFilteredComplaints(updatedComplaints);
      
      setShowDeleteModal(false);
      setDeleteId(null);
      
      // Afișăm un mesaj de succes
      setSuccessMessage('Contestația a fost ștearsă cu succes.');
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Eroare la ștergerea contestației:', error);
      setError('Nu s-a putut șterge contestația');
    }
  };

  // Calculăm contestațiile pentru pagina curentă
  const displayedComplaints = filteredComplaints.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-8">
      {/* Zona de filtrare */}
      <div className="lg:w-1/4 xl:w-1/5 min-w-[280px]">
        <div className="bg-white rounded-xl shadow-md p-6 sticky top-20">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader icon={FunnelIcon} title="Filtrare Contestații" />
            <button
              onClick={clearFilters}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
              title="Resetează filtrele"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="border-t border-gray-200 -mx-6 px-6 pt-4">
            {error && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg flex items-start">
                <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                {successMessage}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <FilterField 
                id="numarContestatie" 
                label="Număr Contestație" 
                name="numarContestatie" 
                value={filterData.numarContestatie} 
                onChange={handleChange}
                placeholder="ex: 123456789"
                icon={<DocumentTextIcon className="h-5 w-5 text-gray-400" />}
                onlyNumbers={true}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FilterField 
                  id="nume" 
                  label="Nume" 
                  name="nume" 
                  value={filterData.nume} 
                  onChange={handleChange}
                  placeholder="Nume"
                />
                
                <FilterField 
                  id="prenume" 
                  label="Prenume" 
                  name="prenume" 
                  value={filterData.prenume} 
                  onChange={handleChange}
                  placeholder="Prenume"
                />
              </div>
              
              <FilterField 
                id="cnp" 
                label="CNP" 
                name="cnp" 
                value={filterData.cnp} 
                onChange={handleChange}
                placeholder="Introduceți CNP-ul"
                onlyNumbers={true}
              />
              
              <FilterField 
                id="regiune" 
                label="Județ" 
                name="regiune" 
                value={filterData.regiune} 
                onChange={handleChange}
                options={ROMANIAN_COUNTIES}
                placeholder="Toate județele"
              />
              
              <div className="bg-blue-50 rounded-lg border border-blue-100 p-3 mb-2">
                <div className="flex items-center mb-2">
                  <CalendarIcon className="h-5 w-5 text-blue-500 mr-2" />
                  <h4 className="text-sm font-medium text-blue-700">Interval de date</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FilterField 
                    id="dataStart" 
                    label="De la" 
                    name="dataStart" 
                    type="date" 
                    value={filterData.dataStart} 
                    onChange={handleChange}
                  />
                  
                  <FilterField 
                    id="dataEnd" 
                    label="Până la" 
                    name="dataEnd" 
                    type="date" 
                    value={filterData.dataEnd} 
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full py-2.5 mt-4 flex justify-center items-center bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Se filtrează...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <MagnifyingGlassIcon className="mr-2 h-5 w-5" />
                    Filtrează Contestațiile
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Zona de rezultate */}
      <div className="lg:w-3/4 xl:w-4/5 flex-grow">
        <div className="bg-white rounded-xl shadow-md overflow-hidden h-full flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2" />
                Rezultate Filtrare
                {filteredComplaints.length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {filteredComplaints.length} găsite
                  </span>
                )}
              </h2>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-0">
            {showResults && (
              filteredComplaints.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-1">
                    Nu s-au găsit contestații
                  </h3>
                  <p className="text-gray-500 max-w-md">
                    Încercați să modificați criteriile de filtrare sau să adăugați o contestație nouă.
                  </p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nr. Contestație
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nume
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prenume
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          CNP
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Județ
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acțiuni
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {displayedComplaints.map((complaint) => (
                        <tr 
                          key={complaint.uniqueId || complaint.id} 
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {complaint.numar_contestatie || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {complaint.nume || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {complaint.prenume || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {complaint.cnp || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {ROMANIAN_COUNTIES.find(county => county.id === complaint.regiune)?.name || complaint.regiune || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {complaint.data_aleasa ? new Date(complaint.data_aleasa).toLocaleDateString('ro-RO') : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <ActionButton
                                onClick={() => handleViewDetails(complaint.id)}
                                icon={PencilSquareIcon}
                                title="Vezi detalii"
                                colorClass="primary"
                              />
                              <ActionButton
                                onClick={() => handleDownloadPDF(complaint)}
                                icon={DocumentArrowDownIcon}
                                title="Descarcă PDF"
                                colorClass="green"
                              />
                              <ActionButton
                                onClick={() => handleDeleteClick(complaint.uniqueId || complaint.id)}
                                icon={TrashIcon}
                                title="Șterge"
                                colorClass="red"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
            
            {!showResults && (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-blue-50 rounded-full p-4 mb-4">
                  <FunnelIcon className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-1">
                  Utilizați filtrele pentru a căuta contestații
                </h3>
                <p className="text-gray-500 max-w-md">
                  Completați cel puțin un criteriu de filtrare și apăsați butonul "Filtrează"
                </p>
              </div>
            )}
          </div>
          
          {/* Paginare */}
          {showResults && filteredComplaints.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handleChangePage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    page === 0 
                      ? 'text-gray-400 bg-gray-50' 
                      : 'text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  Anterior
                </button>
                <button
                  onClick={() => handleChangePage(Math.min(Math.ceil(filteredComplaints.length / rowsPerPage) - 1, page + 1))}
                  disabled={page >= Math.ceil(filteredComplaints.length / rowsPerPage) - 1}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    page >= Math.ceil(filteredComplaints.length / rowsPerPage) - 1
                      ? 'text-gray-400 bg-gray-50' 
                      : 'text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  Următor
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Afișare <span className="font-medium">{page * rowsPerPage + 1}</span> la{' '}
                    <span className="font-medium">
                      {Math.min((page + 1) * rowsPerPage, filteredComplaints.length)}
                    </span>{' '}
                    din <span className="font-medium">{filteredComplaints.length}</span> rezultate
                  </p>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Rânduri pe pagină:</span>
                    <select
                      value={rowsPerPage}
                      onChange={handleChangeRowsPerPage}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[5, 10, 25, 50].map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                    
                    <div className="flex border border-gray-300 rounded-md overflow-hidden">
                      <button
                        onClick={() => handleChangePage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className={`relative inline-flex items-center px-2 py-2 ${
                          page === 0 
                            ? 'text-gray-400 bg-gray-50 cursor-not-allowed' 
                            : 'text-gray-700 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Anterior</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleChangePage(Math.min(Math.ceil(filteredComplaints.length / rowsPerPage) - 1, page + 1))}
                        disabled={page >= Math.ceil(filteredComplaints.length / rowsPerPage) - 1}
                        className={`relative inline-flex items-center px-2 py-2 ${
                          page >= Math.ceil(filteredComplaints.length / rowsPerPage) - 1
                            ? 'text-gray-400 bg-gray-50 cursor-not-allowed' 
                            : 'text-gray-700 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Următor</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog de confirmare ștergere - Actualizat pentru centrare corectă */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowDeleteModal(false)}></div>
          
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto z-10 relative overflow-hidden transition-all transform scale-100">
            <div className="p-5 bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-red-800 flex items-center">
                  <ExclamationCircleIcon className="h-5 w-5 mr-2 text-red-600" />
                  Confirmare ștergere
                </h3>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="text-sm text-gray-600 mb-4 text-center">
                Sunteți sigur că doriți să ștergeți această contestație? Această acțiune nu poate fi anulată.
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Anulare
                </button>
                
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Șterge contestația
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterComplaintFormFixed;