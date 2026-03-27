import React, { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { ROMANIAN_COUNTIES } from '../constants/romanianCounties';
import { ROMANIAN_UATS } from '../constants/romanianUATs';

// Configurație globală pentru axios
axios.defaults.withCredentials = true;


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

  const inputClass = `field-input${error ? ' error' : ''}`;

  const handleInputChange = (e) => {
    if (onlyNumbers) {
      const newValue = e.target.value.replace(/[^0-9]/g, '');
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
    <div className="mb-2">
      <label htmlFor={id} className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1">
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
    className={`p-1 rounded transition-colors duration-150 ${colorClass === 'primary' ? 'text-primary-500 hover:text-primary-700 hover:bg-primary-50' :
      colorClass === 'green' ? 'text-green-500 hover:text-green-700 hover:bg-green-50' :
        colorClass === 'red' ? 'text-red-500 hover:text-red-700 hover:bg-red-50' :
          'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    title={title}
  >
    <Icon className="h-4 w-4" />
  </button>
);

// Header pentru fiecare secțiune
const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center space-x-1.5 mb-0 pb-0">
    <Icon className="h-4 w-4" style={{ color: '#1c3183' }} />
    <h3 className="text-[13px] font-semibold" style={{ color: 'var(--color-neutral-700)' }}>{title}</h3>
  </div>
);

function FilterComplaintFormFixed() {
  const [name] = useOutletContext();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [filterData, setFilterData] = useState({
    numarContestatie: '',
    nume: '',
    prenume: '',
    cnp: '',
    regiune: '',
    uat: '',
    numarContract: '',
    idImobil: '',
    statusDecizie: '',
    verificatTeren: '',
    dataStart: '',
    dataEnd: ''
  });

  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const availableUATs = useMemo(() => {
    if (!filterData.regiune) return [];
    return ROMANIAN_UATS[filterData.regiune] || [];
  }, [filterData.regiune]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'regiune') {
      setFilterData(prev => ({ ...prev, regiune: value, uat: '' }));
    } else {
      setFilterData(prev => ({ ...prev, [name]: value }));
    }
  };

  const clearFilters = () => {
    setFilterData({
      numarContestatie: '',
      nume: '',
      prenume: '',
      cnp: '',
      regiune: '',
      uat: '',
      numarContract: '',
      idImobil: '',
      statusDecizie: '',
      verificatTeren: '',
      dataStart: '',
      dataEnd: ''
    });
    setShowResults(false);
    setFilteredComplaints([]);
  };

  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowResults(false);
    setSuccessMessage('');

    try {
      const formData = {
        ...filterData,
        numarContestatie: filterData.numarContestatie.trim(),
        nume: filterData.nume.trim(),
        prenume: filterData.prenume.trim(),
        cnp: filterData.cnp.trim(),
        uat: filterData.uat.trim(),
        numarContract: filterData.numarContract.trim(),
        idImobil: filterData.idImobil.trim(),
        statusDecizie: filterData.statusDecizie,
        verificatTeren: filterData.verificatTeren
      };

      const response = await axios.post('/filter-contestatii', formData, {
        withCredentials: true,
        timeout: 20000
      });

      if (response && response.data) {
        let safeData = [];

        if (Array.isArray(response.data)) {
          safeData = response.data;
        } else if (typeof response.data === 'object') {
          safeData = Array.isArray(response.data.data) ? response.data.data : [response.data];
        }

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
      setPage(0);

      if (successMessage) {
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      }
    }
  };

  const handleViewDetails = (complaintId) => {
    navigate(`/dashboard/edit-contestatie/${complaintId}`);
  };


  // ⭐ Download Excel borderou pentru o singură contestație
  const handleSingleExcelExport = async (complaintId) => {
    try {
      const response = await axios.get(`/contestatii/${complaintId}/export-excel`, {
        responseType: 'blob',
        withCredentials: true,
      });
      const today = new Date().toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\./g, '_');
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Borderou_Expediere_Nr${complaintId}_${today}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccessMessage('Excel generat cu succes.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Eroare la generarea Excel:', error);
      setError('Nu s-a putut genera fișierul Excel.');
    }
  };

  // ⭐ Download ZIP cu copii PDF per destinatar (Primăria, Autorizat, Persoana, Membri)
  const handleDownloadPDF = async (complaint) => {
    try {
      const response = await axios.post('/reports/batch-unsigned', { ids: [complaint.id] }, {
        responseType: 'blob',
        withCredentials: true
      });

      const nr = complaint.numar_contestatie || 'PV';
      const today = new Date();
      const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      const fileName = `PV_${nr}_${dateStr}.pdf`;

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccessMessage(`PDF generat cu succes: ${fileName}`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Eroare la descărcarea PDF:', error);
      setError('Eroare la generarea PDF-ului.');
    }
  };

  const handleToggleLock = async (id, currentlyLocked) => {
    const action = currentlyLocked ? 'debloca' : 'bloca';
    const confirmed = window.confirm(`Sunteți sigur că vreți să ${action}ți această contestație?`);
    if (!confirmed) return;
    try {
      const endpoint = currentlyLocked ? '/contestatii/unlock' : '/contestatii/lock';
      await axios.post(endpoint, { ids: [id] });
      setSuccessMsg(`Contestația a fost ${currentlyLocked ? 'deblocată' : 'blocată'} cu succes.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      // Refresh results in-place
      setFilteredComplaints(prev =>
        prev.map(c => (c.id === id || c.uniqueId === id) ? { ...c, locked: currentlyLocked ? 0 : 1 } : c)
      );
    } catch (err) {
      setError(`Eroare la ${action}rea contestației.`);
    }
  };

  const handleDeleteClick = (complaintId) => {
    setDeleteId(complaintId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/contestatii/${deleteId}`);

      const updatedComplaints = filteredComplaints.filter(
        complaint => complaint.uniqueId !== deleteId && complaint.id !== deleteId
      );
      setFilteredComplaints(updatedComplaints);

      setShowDeleteModal(false);
      setDeleteId(null);

      setSuccessMessage('Contestația a fost ștearsă cu succes.');
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Eroare la ștergerea contestației:', error);
      setError('Nu s-a putut șterge contestația');
    }
  };

  const displayedComplaints = filteredComplaints.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const safeDate = (d) => {
    if (!d || d === '0000-00-00') return '—';
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return '—';
    parsed.setMinutes(parsed.getMinutes() + parsed.getTimezoneOffset());
    return parsed.toLocaleDateString('ro-RO');
  };

  const summaryAdmis = filteredComplaints.filter(c => c.admis === 1).length;
  const summaryRespins = filteredComplaints.filter(c => c.respins === 1).length;

  const fi = "field-input";
  const fl = "field-label";

  return (
    <div className="w-full max-w-7xl mx-auto pb-10">
      {/* Page header */}
      <div className="mb-4">
        <h1 className="text-[20px] font-semibold text-gray-800">Filtrare Contestații</h1>
        <p className="text-[13px] text-gray-400 mt-0.5">Căutați și gestionați contestațiile înregistrate</p>
      </div>

      {/* Banners */}
      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded flex items-center gap-1.5 text-[13px]">
          <ExclamationCircleIcon className="h-4 w-4 text-red-400 flex-shrink-0" />
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-3 bg-green-50 border border-green-200 text-green-800 px-3 py-2.5 rounded flex items-center gap-1.5 text-[13px]">
          <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Filters */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-gray-200 rounded-md p-4 mb-3">
          <div className="flex items-center gap-1.5 mb-3">
            <FunnelIcon className="h-4 w-4" style={{ color: '#1c3183' }} />
            <h2 className="text-[13px] font-semibold" style={{ color: 'var(--color-neutral-700)' }}>Filtre contestații</h2>
          </div>

          {/* Row 1: Nr. Contestație | Nume | Prenume | CNP | Județ | UAT */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
            <div>
              <label className={fl}>Nr. Contestație</label>
              <input type="text" name="numarContestatie" value={filterData.numarContestatie}
                onChange={handleChange} placeholder="ex: 123" className={fi} />
            </div>
            <div>
              <label className={fl}>Nume</label>
              <input type="text" name="nume" value={filterData.nume}
                onChange={handleChange} placeholder="Nume" className={fi} />
            </div>
            <div>
              <label className={fl}>Prenume</label>
              <input type="text" name="prenume" value={filterData.prenume}
                onChange={handleChange} placeholder="Prenume" className={fi} />
            </div>
            <div>
              <label className={fl}>CNP</label>
              <input type="text" name="cnp" value={filterData.cnp}
                onChange={handleChange} placeholder="13 cifre" maxLength={13} className={fi} />
            </div>
            <div>
              <label className={fl}>Județ</label>
              <select name="regiune" value={filterData.regiune} onChange={handleChange} className={fi}>
                <option value="">Toate județele</option>
                {ROMANIAN_COUNTIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={fl}>UAT</label>
              <select name="uat" value={filterData.uat} onChange={handleChange} className={fi}>
                <option value="">{filterData.regiune ? 'Toate localitățile' : 'Selectați mai întâi județul'}</option>
                {availableUATs.map((uat, i) => (
                  <option key={uat.id || i} value={uat.name || uat}>{uat.name || uat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Contract | ID Imobil | Status Decizie | Verificat Teren | De la | Până la */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className={fl}>Contract</label>
              <input type="text" name="numarContract" value={filterData.numarContract}
                onChange={handleChange} placeholder="Nr. contract" className={fi} />
            </div>
            <div>
              <label className={fl}>ID Imobil</label>
              <input type="text" name="idImobil" value={filterData.idImobil}
                onChange={handleChange} placeholder="ID imobil" className={fi} />
            </div>
            <div>
              <label className={fl}>Status Decizie</label>
              <select name="statusDecizie" value={filterData.statusDecizie} onChange={handleChange} className={fi}>
                <option value="">Toate</option>
                <option value="admis">✅ Admis</option>
                <option value="respins">❌ Respins</option>
                <option value="pending">⏳ În așteptare</option>
              </select>
            </div>
            <div>
              <label className={fl}>Verificat Teren</label>
              <select name="verificatTeren" value={filterData.verificatTeren} onChange={handleChange} className={fi}>
                <option value="">Toate</option>
                <option value="1">Da</option>
                <option value="0">Nu</option>
              </select>
            </div>
            <div>
              <label className={fl}>De la</label>
              <input type="date" name="dataStart" value={filterData.dataStart}
                onChange={handleChange} className={fi} />
            </div>
            <div>
              <label className={fl}>Până la</label>
              <input type="date" name="dataEnd" value={filterData.dataEnd}
                onChange={handleChange} className={fi} />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : <MagnifyingGlassIcon className="h-4 w-4" />}
            {loading ? 'Se filtrează...' : 'Filtrează'}
          </button>
          <button type="button" onClick={clearFilters} className="btn btn-outline">
            <ArrowPathIcon className="h-4 w-4" />
            Resetează filtrele
          </button>
        </div>
      </form>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-10 gap-2" style={{ color: '#1c3183' }}>
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-[13px] font-medium">Se caută contestații...</span>
        </div>
      )}

      {/* No results */}
      {!loading && showResults && filteredComplaints.length === 0 && (
        <div className="mb-3 px-3 py-2.5 rounded flex items-center gap-1.5 text-[13px]" style={{ backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--color-primary-200)', color: 'var(--color-primary-500)' }}>
          <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-primary-500)' }} />
          Niciun rezultat găsit. Încercați cu alte filtre.
        </div>
      )}

      {/* Summary bar */}
      {!loading && showResults && filteredComplaints.length > 0 && (
        <div className="mb-3 px-4 py-2.5 rounded flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] font-medium" style={{ backgroundColor: 'var(--color-neutral-800)', color: 'white' }}>
          <span>Rezultate: <strong>{filteredComplaints.length}</strong> contestații</span>
          <span className="flex items-center gap-1">
            <CheckCircleIcon className="h-4 w-4 text-green-300" />
            <strong>{summaryAdmis}</strong> Admise
          </span>
          <span className="flex items-center gap-1">
            <XCircleIcon className="h-4 w-4 text-red-300" />
            <strong>{summaryRespins}</strong> Respinse
          </span>
        </div>
      )}

      {/* Placeholder */}
      {!loading && !showResults && (
        <div className="text-center py-10 text-gray-400">
          <FunnelIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-[13px]">Selectați filtrele și apăsați <strong className="text-gray-500">Filtrează</strong> pentru a vedea rezultatele.</p>
        </div>
      )}

      {/* Results table */}
      {!loading && showResults && filteredComplaints.length > 0 && (
        <>
          {/* Table controls */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[12px] text-gray-500">
              <span>Rânduri per pagină:</span>
              <select
                value={rowsPerPage}
                onChange={handleChangeRowsPerPage}
                className="px-2 py-0.5 border border-gray-200 rounded text-[12px] focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span className="text-[12px] text-gray-400">
              Pagina {page + 1} din {Math.ceil(filteredComplaints.length / rowsPerPage)} ({filteredComplaints.length} total)
            </span>
          </div>

          <div className="bg-white border border-gray-200 rounded-md overflow-hidden mb-3">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-[13px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Nr.</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Nume</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Prenume</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">CNP</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">ID Imobil</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Județ</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">UAT</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Contract</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Verificat Teren</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Data</th>
                    <th className="px-3 py-2 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Blocare</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedComplaints.map((complaint, idx) => (
                    <tr
                      key={complaint.uniqueId || complaint.id}
                      className="transition-colors"
                      style={{ backgroundColor: complaint.locked ? '#fee2e2' : 'var(--surface-primary)' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = complaint.locked ? '#fecaca' : 'var(--color-neutral-25)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = complaint.locked ? '#fee2e2' : 'var(--surface-primary)'}
                    >
                      <td className="px-3 py-2 whitespace-nowrap font-mono font-semibold text-gray-800">
                        {page * rowsPerPage + idx + 1}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                        {complaint.nume || '—'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                        {complaint.prenume || '—'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500 font-mono text-[12px]">
                        {complaint.cnp || '—'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-600 font-mono">
                        {complaint.id_imobil || '—'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                        {complaint.regiune || '—'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                        {complaint.uat || '—'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[13px] text-gray-600 font-mono">
                        {complaint.numar_contract || '—'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {complaint.locked ? (
                          <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>🔒 Blocat</span>
                        ) : complaint.admis === 1 ? (
                          <span className="badge badge-success">Admis</span>
                        ) : complaint.respins === 1 ? (
                          <span className="badge badge-danger">Respins</span>
                        ) : (
                          <span className="badge badge-warning">În așteptare</span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        {complaint.verificat_teren ? (
                          <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 500 }}>Da</span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--color-neutral-400)' }}>Nu</span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-400">
                        {safeDate(complaint.data_aleasa)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleToggleLock(complaint.id, complaint.locked)}
                          title={complaint.locked ? 'Deblocare contestație' : 'Blocare contestație'}
                          style={{
                            padding: '4px 6px', borderRadius: 4, border: 'none', cursor: 'pointer',
                            backgroundColor: complaint.locked ? '#fca5a5' : '#f3f4f6',
                            color: complaint.locked ? '#7f1d1d' : '#6b7280',
                          }}
                        >
                          {complaint.locked ? (
                            <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          ) : (
                            <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => !complaint.locked && handleViewDetails(complaint.id)}
                            disabled={!!complaint.locked}
                            className={`p-1 rounded transition-colors duration-150 ${complaint.locked ? 'text-gray-300 cursor-not-allowed opacity-30' : 'text-primary-500 hover:text-primary-700 hover:bg-primary-50'}`}
                            title={complaint.locked ? 'Contestația este blocată' : 'Editează'}
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <ActionButton
                            onClick={() => handleDownloadPDF(complaint)}
                            icon={DocumentArrowDownIcon}
                            title="Descarcă PDF"
                            colorClass="green"
                          />
                          <ActionButton
                            onClick={() => handleSingleExcelExport(complaint.id)}
                            icon={TableCellsIcon}
                            title="Exportă adrese Excel"
                            colorClass="default"
                          />
                          <button
                            onClick={() => !complaint.locked && handleDeleteClick(complaint.uniqueId || complaint.id)}
                            disabled={!!complaint.locked}
                            className={`p-1 rounded transition-colors duration-150 ${complaint.locked ? 'text-gray-300 cursor-not-allowed opacity-30' : 'text-red-500 hover:text-red-700 hover:bg-red-50'}`}
                            title={complaint.locked ? 'Contestația este blocată' : 'Șterge'}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[12px] text-gray-400">
                {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredComplaints.length)} din {filteredComplaints.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleChangePage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >‹</button>
                {Array.from({ length: Math.ceil(filteredComplaints.length / rowsPerPage) }, (_, i) => i)
                  .filter(p => Math.abs(p - page) <= 2)
                  .map(p => (
                    <button
                      key={p}
                      onClick={() => handleChangePage(p)}
                      className={`w-7 h-7 rounded text-[12px] ${p === page ? 'font-semibold' : 'hover:bg-gray-100 text-gray-600'}`}
                      style={p === page ? { backgroundColor: 'var(--color-primary-600)', color: 'white' } : {}}
                    >{p + 1}</button>
                  ))}
                <button
                  onClick={() => handleChangePage(Math.min(Math.ceil(filteredComplaints.length / rowsPerPage) - 1, page + 1))}
                  disabled={page >= Math.ceil(filteredComplaints.length / rowsPerPage) - 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >›</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-neutral-800)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ExclamationCircleIcon style={{ width: 15, height: 15, color: 'var(--color-danger)' }} />
                Confirmare ștergere
              </h3>
              <button onClick={() => setShowDeleteModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-400)', display: 'flex' }}>
                <XMarkIcon style={{ width: 15, height: 15 }} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--color-neutral-600)', margin: 0 }}>
                Sunteți sigur că doriți să ștergeți această contestație? Această acțiune nu poate fi anulată.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setShowDeleteModal(false)} className="btn btn-outline btn-sm">
                <XMarkIcon style={{ width: 13, height: 13 }} />
                Anulare
              </button>
              <button type="button" onClick={handleDeleteConfirm} className="btn btn-danger btn-sm">
                <TrashIcon style={{ width: 13, height: 13 }} />
                Șterge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterComplaintFormFixed;