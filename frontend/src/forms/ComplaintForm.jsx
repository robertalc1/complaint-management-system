import React, { useState, useEffect } from 'react';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  PlusIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  UserPlusIcon,
  UserGroupIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  IdentificationIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckIcon,
  CalendarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { ROMANIAN_COUNTIES } from '../constants/romanianCounties';


// Componentă reutilizabilă pentru câmpurile de formular
const FormField = ({
  id,
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  error,
  placeholder = "",
  options = null,
  rows = null,
  tabIndex,
  autoFocus = false,
  onKeyDown,
  onBlur,
  disabled = false,
  onlyNumbers = false
}) => {
  const isSelect = options !== null;
  const isTextarea = rows !== null;

  // Clasa CSS pentru stările input-ului - modernizată
  const inputClass = `field-input${error ? ' error' : ''}${disabled ? ' opacity-60' : ''}`;

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

  // Props comune pentru toate tipurile de input
  const commonProps = {
    id,
    name,
    value,
    tabIndex,
    required,
    autoFocus,
    onKeyDown,
    onBlur,
    disabled,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : undefined
  };

  return (
    <div className="form-field mb-2">
      <label htmlFor={id} className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {isSelect ? (
        <select
          {...commonProps}
          onChange={onChange}
          className={inputClass}
        >
          <option value="">{placeholder || "Selectați o opțiune"}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      ) : isTextarea ? (
        <textarea
          {...commonProps}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          className={inputClass}
        />
      ) : (
        <input
          {...commonProps}
          type={type}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={inputClass}
          maxLength={type === "text" && name === "cnp" ? 13 : undefined}
        />
      )}

      {error && (
        <p id={`${id}-error`} style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 3 }} role="alert">{error}</p>
      )}
    </div>
  );
};

// Modal de confirmare pentru opțiuni cu membri sau finalizare
const ConfirmSubmitModal = ({ onClose, onAddMember, onFinalize }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-neutral-800)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserPlusIcon style={{ width: 16, height: 16, color: 'var(--color-primary-500)' }} />
            Adăugare membri adiționale
          </h3>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: 'var(--color-neutral-600)', marginBottom: 0 }}>
            Doriți să adăugați membri adiționale la această contestație sau să finalizați contestația?
          </p>
        </div>
        <div className="modal-footer">
          <button onClick={onAddMember} className="btn btn-outline">
            <PlusIcon style={{ width: 14, height: 14 }} />
            Adaugă Membru
          </button>
          <button onClick={onFinalize} className="btn btn-primary">
            <CheckIcon style={{ width: 14, height: 14 }} />
            Finalizează contestație
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ Componentă simplificată pentru adăugarea membrilor TEMPORAR
const AddMemberForm = ({ onClose, onAddMember, additionalMembers, onFinalize }) => {
  const [memberData, setMemberData] = useState({
    nume: '',
    prenume: '',
    cnp: '',
    adresaPersonala: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMemberData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!memberData.nume) newErrors.nume = 'Numele este obligatoriu';
    if (!memberData.prenume) newErrors.prenume = 'Prenumele este obligatoriu';
    if (!memberData.cnp) {
      newErrors.cnp = 'CNP-ul este obligatoriu';
    } else if (!/^\d{13}$/.test(memberData.cnp)) {
      newErrors.cnp = 'CNP-ul trebuie să conțină exact 13 cifre';
    }
    if (!memberData.adresaPersonala) newErrors.adresaPersonala = 'Adresa personală este obligatorie';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length === 0) {
      onAddMember(memberData);
      setMemberData({ nume: '', prenume: '', cnp: '', adresaPersonala: '' });
      setErrors({});
    } else {
      setErrors(newErrors);
    }
  };

  const handleRemoveMember = (index) => {
    const newMembers = additionalMembers.filter((_, i) => i !== index);
    onAddMember(null, newMembers);
  };

  const handleEditMember = (index, field, value) => {
    const updatedMembers = [...additionalMembers];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    onAddMember(null, updatedMembers);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-neutral-800)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserPlusIcon style={{ width: 16, height: 16, color: 'var(--color-primary-500)' }} />
            Adăugare Membri Adiționale ({additionalMembers.length})
          </h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-400)', display: 'flex', padding: 4 }}>
            <XMarkIcon style={{ width: 16, height: 16 }} />
          </button>
        </div>
        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--color-primary-200)' }}>
            <div className="flex items-start">
              <InformationCircleIcon className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" style={{ color: '#1c3183' }} />
              <p className="text-sm" style={{ color: '#1c3183' }}>
                <strong>Informație:</strong> Membrii adăugați aici vor fi salvați împreună cu contestația când apăsați "Trimite Contestația".
              </p>
            </div>
          </div>
          {additionalMembers.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                Membri adăugați ({additionalMembers.length}):
              </h4>
              <div className="space-y-2">
                {additionalMembers.map((member, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-semibold text-gray-500">Membru {index + 1}</span>
                      <button type="button" onClick={() => handleRemoveMember(index)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                        title="Șterge membru">
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-400 mb-0.5">Nume *</label>
                        <input type="text" value={member.nume}
                          onChange={(e) => handleEditMember(index, 'nume', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-[13px] border border-gray-200 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-400 mb-0.5">Prenume *</label>
                        <input type="text" value={member.prenume}
                          onChange={(e) => handleEditMember(index, 'prenume', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-[13px] border border-gray-200 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-400 mb-0.5">CNP * (13 cifre)</label>
                        <input type="text" value={member.cnp} maxLength={13}
                          onChange={(e) => handleEditMember(index, 'cnp', e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full px-2.5 py-1.5 text-[13px] border border-gray-200 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-mono" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-400 mb-0.5">Adresă Personală *</label>
                        <input type="text" value={member.adresaPersonala}
                          onChange={(e) => handleEditMember(index, 'adresaPersonala', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-[13px] border border-gray-200 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" style={{ color: '#1c3183' }} />
              Adaugă membru nou:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField id="membru-nume" label="Nume" name="nume" value={memberData.nume} onChange={handleChange} required={true} error={errors.nume} placeholder="Introduceți numele" autoFocus={true} />
              <FormField id="membru-prenume" label="Prenume" name="prenume" value={memberData.prenume} onChange={handleChange} required={true} error={errors.prenume} placeholder="Introduceți prenumele" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <FormField id="membru-cnp" label="CNP" name="cnp" value={memberData.cnp} onChange={handleChange} required={true} error={errors.cnp} placeholder="Introduceți CNP-ul (13 cifre)" onlyNumbers={true} />
              <FormField id="membru-adresaPersonala" label="Adresă Personală" name="adresaPersonala" value={memberData.adresaPersonala} onChange={handleChange} required={true} error={errors.adresaPersonala} placeholder="Introduceți adresa personală" />
            </div>
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-4 flex items-start">
                <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{errors.submit}</span>
              </div>
            )}
            <div className="flex justify-between items-center" style={{ paddingTop: 14, borderTop: '1px solid var(--border-subtle)', marginTop: 14 }}>
              <button type="submit" className="btn btn-outline">
                <PlusIcon style={{ width: 14, height: 14 }} />
                Adaugă Membru
              </button>
              <button type="button" onClick={onClose} className="btn btn-primary">
                <CheckIcon style={{ width: 14, height: 14 }} />
                Gata ({additionalMembers.length} {additionalMembers.length === 1 ? 'membru' : 'membri'})
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};



// Header pentru fiecare secțiune
const SectionHeader = ({ icon: Icon, title }) => (
  <div className="section-header flex items-center gap-1.5">
    <Icon style={{ width: 14, height: 14, color: 'var(--color-primary-500)', flexShrink: 0 }} />
    <span>{title}</span>
  </div>
);

function ComplaintForm() {
  const [name] = useOutletContext();
  const location = useLocation();
  const navigate = useNavigate();

  // Încărcăm datele de locație din sessionStorage
  const [locationData, setLocationData] = useState(null);

  // State pentru gestionarea modalelor
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [savedContestationId, setSavedContestationId] = useState(null);

  // Indicator dacă contestația a fost deja creată
  const [contestationCreated, setContestationCreated] = useState(false);

  // Căutare contract
  const [contractSearch, setContractSearch] = useState('');
  const [contractResults, setContractResults] = useState([]);
  const [additionalMembers, setAdditionalMembers] = useState(() => {
    try {
      const saved = sessionStorage.getItem('additionalMembers');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  useEffect(() => {
    // Verificăm dacă avem date de locație în sessionStorage
    const storedLocationData = sessionStorage.getItem('locationData');

    if (storedLocationData) {
      setLocationData(JSON.parse(storedLocationData));
    } else {
      // Dacă nu există date de locație, redirectăm înapoi la pagina de preselecție
      navigate('/dashboard/contract');
    }
  }, [navigate]);

  const [formData, setFormData] = useState(() => {
    const defaults = {
      nume: '',
      prenume: '',
      cnp: '',
      adresaPersonala: '',
      regiune: '',
      uat: '',
      sectorCadastral: '',
      numarContract: '',
      numarDecizieDirector: '',
      adresaImobil: '',
      observatii: '',
      dataAleasa: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
      numarProcesVerbal: '',
      dataProcesVerbal: '',
      numarCerere: '',
      dataCerere: '',
      adresaPrimarie: '',
      autorizat: '',
      adresaAutorizat: '',
      idImobil: '',
      documenteAtasate: '',
      status: ''
    };
    try {
      const saved = sessionStorage.getItem('complaintFormData');
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch (e) { return defaults; }
  });

  // Precompletăm formularul cu datele de locație
  useEffect(() => {
    if (locationData) {
      setFormData(prev => ({
        ...prev,
        regiune: locationData.regiune || '',
        uat: locationData.uat || '',
        sectorCadastral: locationData.sectorCadastral || '',
        numarContract: locationData.numarContract || '',
        numarDecizieDirector: locationData.numarDecizieDirector || '',
        adresaPrimarie: locationData.adresaPrimarie || '',
        autorizat: locationData.autorizat || '',
        adresaAutorizat: locationData.adresaAutorizat || ''
      }));
    }
  }, [locationData]);

  useEffect(() => {
    sessionStorage.setItem('additionalMembers', JSON.stringify(additionalMembers));
  }, [additionalMembers]);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Validare formular
  const validateForm = () => {
    const newErrors = {};
    if (!formData.nume) newErrors.nume = 'Numele este obligatoriu';
    if (!formData.prenume) newErrors.prenume = 'Prenumele este obligatoriu';
    if (!formData.cnp) {
      newErrors.cnp = 'CNP-ul este obligatoriu';
    } else if (!/^\d{13}$/.test(formData.cnp)) {
      newErrors.cnp = 'CNP-ul trebuie să conțină exact 13 cifre';
    }
    if (!formData.adresaPersonala) newErrors.adresaPersonala = 'Adresa personală este obligatorie';
    if (!formData.regiune) newErrors.regiune = 'Selectarea județului este obligatorie';

    return newErrors;
  };

  // Handler pentru modificări în câmpuri
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      sessionStorage.setItem('complaintFormData', JSON.stringify(updated));
      return updated;
    });

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handler pentru checkboxuri
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Schimbă datele de locație
  const changeLocationData = () => {
    // Eliminăm datele de locație din sessionStorage
    sessionStorage.removeItem('locationData');
    // Redirectăm către pagina de preselecție
    navigate('/dashboard/contract');
  };

  // Funcție pentru butonul "Trimite Contestația" - verifică dacă contestația există deja

  // Funcție pentru adăugarea/ștergerea membrilor adiționale
  const handleAddAdditionalMember = (memberData, updatedList = null) => {
    if (updatedList !== null) {
      setAdditionalMembers(updatedList);
    } else {
      setAdditionalMembers(prev => [...prev, memberData]);
    }
  };

  const handleSubmitClick = async (e) => {
    e.preventDefault();

    // Verificăm dacă contestația a fost deja creată
    if (contestationCreated || savedContestationId) {
      setErrors({
        submit: 'Contestația a fost deja creată. Utilizați butonul "Adaugă membru" pentru a adăuga membri suplimentari sau apăsați "FINALIZARE" pentru a completa o nouă contestație.'
      });
      return;
    }

    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      // Trimiterea datelor contestației
      setSubmitting(true);
      try {
        console.log('📋 Trimit contestația cu:', {
          membriComisie: locationData?.commissionMembers?.length || 0,
          membriAditionali: additionalMembers.length
        });

        // Trimitem contestația completă într-o singură cerere
        const response = await axios.post('/contestatii', {
          ...formData,
          admis: formData.status === 'admis',
          respins: formData.status === 'respins',
          commissionMembers: locationData?.commissionMembers || [],
          additionalMembers: additionalMembers
        }, {
          withCredentials: true
        });

        if (response.data.status === 'success') {
          // Marcăm contestația ca fiind creată
          setContestationCreated(true);
          setSavedContestationId(response.data.id);

          // Curățăm sessionStorage după salvare cu succes
          sessionStorage.removeItem('complaintFormData');
          sessionStorage.removeItem('additionalMembers');
          sessionStorage.removeItem('locationFormData');
          sessionStorage.removeItem('locationData');
          sessionStorage.removeItem('commissionMembers');

          // Afișăm mesaj de succes
          setSubmitSuccess(true);

          setTimeout(() => {
            setSubmitSuccess(false);
            setAdditionalMembers([]);
          }, 5000);
        } else {
          throw new Error('Trimiterea contestației a eșuat');
        }
      } catch (error) {
        console.error('Eroare la trimiterea contestației:', error);
        setErrors({
          submit: 'Nu s-a putut trimite contestația. Vă rugăm să încercați din nou.'
        });
      } finally {
        setSubmitting(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  // Handler pentru click pe butonul "Adaugă membru" - MODIFICAT PENTRU A DESCHIDE DOAR POP-UP
  const handleAddMemberClick = () => {
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      // Doar deschidem pop-up-ul, nu facem nicio trimitere către server
      setShowAddMemberModal(true);
    } else {
      setErrors(newErrors);
    }
  };

  // Handler pentru finalizarea contestației 
  const handleFinalize = () => {
    setShowConfirmModal(false);
    setShowAddMemberModal(false);
    setSubmitSuccess(true);

    // Resetăm formularul și starea aplicației pentru o nouă contestație
    resetForm();
    setContestationCreated(false);
    setSavedContestationId(null);

    setTimeout(() => {
      setSubmitSuccess(false);
      setAdditionalMembers([]);
    }, 5000);
  };

  // Handler pentru trimiterea datelor membrului și contestației
  const handleMemberAndContestationSubmit = async (contestationId) => {
    // Actualizăm ID-ul contestației salvat
    if (contestationId) {
      setSavedContestationId(contestationId);
      // Marcăm contestația ca fiind creată
      setContestationCreated(true);
    }

    // Returnăm true pentru a indica succes
    return true;
  };

  // Resetează formularul
  const resetForm = () => {
    setFormData({
      nume: '',
      prenume: '',
      cnp: '',
      adresaPersonala: '',
      regiune: locationData?.regiune || '',
      adresaImobil: '',
      observatii: '',
      dataAleasa: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
      numarProcesVerbal: '',
      dataProcesVerbal: '',
      numarCerere: '',
      dataCerere: '',
      uat: locationData?.uat || '',
      adresaPrimarie: locationData?.adresaPrimarie || '',
      autorizat: locationData?.autorizat || '',
      adresaAutorizat: locationData?.adresaAutorizat || '',
      idImobil: '',
      documenteAtasate: '',
      status: ''
    });
  };

  // Handler pentru anularea adăugării de membru și închiderea pop-up-ului
  const handleCloseAddMemberModal = () => {
    setShowAddMemberModal(false);

    // Afișăm notificare dacă o contestație a fost creată
    if (contestationCreated) {
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setAdditionalMembers([]);
      }, 5000);
    }
  };

  const handleContractSearch = async () => {
    if (!contractSearch.trim()) return;
    try {
      const res = await axios.get(`/contracts/search?q=${encodeURIComponent(contractSearch.trim())}`);
      setContractResults(res.data);
    } catch (err) {
      console.error('Eroare căutare contract:', err);
    }
  };

  const handleSelectContract = (contract) => {
    const newLocationData = {
      regiune: contract.judet || '',
      uat: contract.uat || '',
      sectorCadastral: contract.sector_cadastral || '',
      autorizat: contract.autorizat || '',
      adresaAutorizat: contract.adresa_autorizat || '',
      adresaPrimarie: contract.adresa_primarie || '',
      numarContract: contract.numar_contract || '',
      numarDecizieDirector: contract.numar_decizie_director || '',
      commissionMembers: contract.commissionMembers || []
    };
    sessionStorage.setItem('locationData', JSON.stringify(newLocationData));
    setLocationData(newLocationData);
    setFormData(prev => ({
      ...prev,
      regiune: contract.judet || prev.regiune,
      uat: contract.uat || prev.uat,
      sectorCadastral: contract.sector_cadastral || prev.sectorCadastral,
      autorizat: contract.autorizat || prev.autorizat,
      adresaAutorizat: contract.adresa_autorizat || prev.adresaAutorizat,
      adresaPrimarie: contract.adresa_primarie || prev.adresaPrimarie,
      numarContract: contract.numar_contract || prev.numarContract,
      numarDecizieDirector: contract.numar_decizie_director || prev.numarDecizieDirector
    }));
    setContractResults([]);
    setContractSearch('');
  };

  // Dacă nu avem încă date de locație, afișăm un spinner
  if (!locationData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#1c3183' }}></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto pb-10">
      {/* Header de pagină */}
      <div className="mb-4">
        <h1 className="page-title">Adăugare Contestație</h1>
        <p className="page-subtitle" style={{ marginTop: 2 }}>Completați datele contestației și salvați</p>
      </div>

      {/* Căutare după Nr. Contract */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Caută după număr contract
            </label>
            <div className="relative">
              <input
                type="text"
                value={contractSearch}
                onChange={(e) => setContractSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleContractSearch()}
                placeholder="Introduceți numărul contractului..."
                className="w-full px-3 py-2 pr-10 border border-gray-200 rounded text-[13px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={handleContractSearch}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        {contractResults.length > 0 && (
          <div className="mt-3 border border-gray-200 rounded overflow-hidden">
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider px-3 py-1.5 bg-gray-50 border-b">
              Contracte găsite ({contractResults.length})
            </div>
            {contractResults.map((contract, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectContract(contract)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[13px] font-medium text-gray-800">
                      Contract: {contract.numar_contract}
                    </span>
                    <span className="text-[12px] text-gray-400 ml-3">
                      {contract.judet} • {contract.uat} • Prestator: {contract.autorizat}
                    </span>
                  </div>
                  <span className="text-[11px] text-blue-600 font-medium">Selectează →</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Banner compact locație */}
      <div className="mb-3">
        <div className="card" style={{ padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
          <div className="flex items-center gap-3 flex-wrap" style={{ fontSize: 11, color: 'var(--color-neutral-500)' }}>
            <InformationCircleIcon style={{ width: 13, height: 13, color: 'var(--color-primary-500)', flexShrink: 0 }} />
            <span><strong style={{ color: 'var(--color-neutral-700)' }}>Județ:</strong> {ROMANIAN_COUNTIES.find(c => c.id === locationData.regiune)?.name || '—'}</span>
            <span style={{ color: 'var(--color-neutral-300)' }}>|</span>
            <span><strong style={{ color: 'var(--color-neutral-700)' }}>UAT:</strong> {locationData.uat || '—'}</span>
            <span style={{ color: 'var(--color-neutral-300)' }}>|</span>
            <span><strong style={{ color: 'var(--color-neutral-700)' }}>Prestator:</strong> {locationData.autorizat || '—'}</span>
            <span style={{ color: 'var(--color-neutral-300)' }}>|</span>
            <span><strong style={{ color: 'var(--color-neutral-700)' }}>Contract:</strong> {locationData.numarContract || '—'}</span>
          </div>
          <button type="button" onClick={changeLocationData} className="btn btn-ghost btn-sm">
            Schimbă locația
          </button>
        </div>
      </div>

      {submitSuccess && (
        <div className="alert alert-success mb-3">
          <CheckCircleIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
          {contestationCreated
            ? 'Contestația a fost creată. Puteți adăuga membri suplimentari sau crea o nouă contestație.'
            : 'Contestația a fost trimisă cu succes!'}
        </div>
      )}

      {/* Formular principal — layout compact */}
      <div className="card mb-3" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Antet */}
        <div style={{ backgroundColor: 'var(--surface-secondary)', padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="flex items-center gap-1.5">
            <ClipboardDocumentCheckIcon style={{ width: 14, height: 14, color: 'var(--color-primary-500)' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-neutral-700)' }}>
              Formular de Contestație
            </p>
            {contestationCreated && (
              <span className="badge badge-success" style={{ marginLeft: 4 }}>Creată</span>
            )}
          </div>
          <div className="flex items-center" style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div className="flex items-center" style={{ padding: '0 8px', height: 28 }}>
              <CalendarIcon style={{ width: 12, height: 12, color: 'var(--color-primary-500)', marginRight: 5 }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-neutral-500)' }}>Data:</span>
            </div>
            <input
              id="dataAleasa" name="dataAleasa" type="date"
              value={formData.dataAleasa} onChange={handleChange}
              disabled={contestationCreated} tabIndex={5}
              style={{ height: 28, padding: '0 8px', background: 'none', border: 'none', borderLeft: '1px solid var(--border-default)', color: 'var(--color-neutral-800)', fontSize: 12, outline: 'none' }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmitClick} style={{ padding: '18px 20px' }}>

          {/* ── Secțiunea 1: DATE PERSONALE ── */}
          <div style={{ marginBottom: 20 }}>
            <p className="section-header">Date personale</p>
            {/* Rândul 1: Nume | Prenume | CNP — toate pe un rând */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <FormField
                id="nume" label="Nume" name="nume" value={formData.nume}
                onChange={handleChange} required error={errors.nume}
                placeholder="Numele" tabIndex={1} autoFocus disabled={contestationCreated}
              />
              <FormField
                id="prenume" label="Prenume" name="prenume" value={formData.prenume}
                onChange={handleChange} required error={errors.prenume}
                placeholder="Prenumele" tabIndex={2} disabled={contestationCreated}
              />
              <FormField
                id="cnp" label="CNP" name="cnp" value={formData.cnp}
                onChange={handleChange} required error={errors.cnp}
                placeholder="13 cifre" tabIndex={3}
                onBlur={(e) => {
                  if (e.target.value && !/^\d{13}$/.test(e.target.value)) {
                    setErrors(prev => ({ ...prev, cnp: 'CNP-ul trebuie să conțină exact 13 cifre' }));
                  }
                }}
                disabled={contestationCreated} onlyNumbers
              />
            </div>
            {/* Rândul 2: Adresă personală — full-width */}
            <FormField
              id="adresaPersonala" label="Adresă personală" name="adresaPersonala"
              value={formData.adresaPersonala} onChange={handleChange}
              required error={errors.adresaPersonala}
              placeholder="Strada, număr, bloc, scara, etaj, apartament, localitate, județ" tabIndex={4} disabled={contestationCreated}
            />
          </div>

          {/* ── Secțiunea 2: INFORMAȚII PROCES VERBAL ── */}
          <div style={{ marginBottom: 20 }}>
            <p className="section-header">Informații proces verbal</p>
            {/* Rândul 1: Nr PV + Data PV | Nr Cerere + Data Cerere — 4 coloane, perechi logice */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <FormField
                id="numarProcesVerbal" label="Nr. Proces Verbal" name="numarProcesVerbal"
                value={formData.numarProcesVerbal} onChange={handleChange}
                placeholder="Numărul" tabIndex={6} disabled={contestationCreated} onlyNumbers
              />
              <FormField
                id="dataProcesVerbal" label="Data Proces Verbal" name="dataProcesVerbal"
                type="date" value={formData.dataProcesVerbal} onChange={handleChange}
                tabIndex={7} disabled={contestationCreated}
              />
              <FormField
                id="numarCerere" label="Nr. Cerere" name="numarCerere"
                value={formData.numarCerere} onChange={handleChange}
                placeholder="Numărul" tabIndex={8} disabled={contestationCreated} onlyNumbers
              />
              <FormField
                id="dataCerere" label="Data Cerere" name="dataCerere"
                type="date" value={formData.dataCerere} onChange={handleChange}
                tabIndex={9} disabled={contestationCreated}
              />
            </div>
            {/* Rândul 2: ID Imobil (1/3) + Adresă Imobil (2/3) — câmpuri legate */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FormField
                id="idImobil" label="ID Imobil" name="idImobil"
                value={formData.idImobil} onChange={handleChange}
                placeholder="Identificator imobil" tabIndex={10} disabled={contestationCreated} onlyNumbers
              />
              <div className="md:col-span-2">
                <FormField
                  id="adresaImobil" label="Adresă Imobil" name="adresaImobil"
                  value={formData.adresaImobil} onChange={handleChange}
                  placeholder="Adresa completă a imobilului" tabIndex={11} disabled={contestationCreated}
                />
              </div>
            </div>
          </div>

          {/* ── Secțiunea 3: DECIZIE ── */}
          <div style={{ marginBottom: 20 }}>
            <p className="section-header">Decizie</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="status" className="field-label">Status contestație</label>
                <select
                  id="status" name="status" value={formData.status}
                  onChange={handleChange} disabled={contestationCreated}
                  tabIndex={12} className={`field-input${contestationCreated ? ' opacity-60' : ''}`}
                >
                  <option value="">— Neselectat —</option>
                  <option value="admis">Admis</option>
                  <option value="respins">Respins</option>
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: contestationCreated ? 'not-allowed' : 'pointer', fontSize: 13, color: 'var(--color-neutral-600)' }}>
                  <input
                    type="checkbox" name="verificatTeren"
                    checked={formData.verificatTeren || false}
                    onChange={handleCheckboxChange}
                    disabled={contestationCreated}
                    style={{ width: 14, height: 14, accentColor: 'var(--color-primary-600)', cursor: 'pointer' }}
                  />
                  Verificat în teren
                </label>
              </div>
            </div>
          </div>

          {/* ── Secțiunea 4: DOCUMENTE & OBSERVAȚII ── */}
          <div style={{ marginBottom: 14 }}>
            <p className="section-header">Documente & Observații</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                id="documenteAtasate" label="Documente Atașate" name="documenteAtasate"
                value={formData.documenteAtasate} onChange={handleChange}
                rows={3} placeholder="Enumerați documentele atașate" tabIndex={13}
                disabled={contestationCreated}
              />
              <FormField
                id="observatii" label="Observații" name="observatii"
                value={formData.observatii} onChange={handleChange}
                rows={3} placeholder="Observații relevante" tabIndex={14}
                disabled={contestationCreated}
              />
            </div>
          </div>

          {/* Eroare la trimitere */}
          {errors.submit && (
            <div className="alert alert-danger mb-3">
              <ExclamationCircleIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
              {errors.submit}
            </div>
          )}

          {/* Preview Membri Adiționale */}
          {additionalMembers.length > 0 && (
            <div style={{ marginBottom: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-2 mb-2">
                <UserGroupIcon style={{ width: 13, height: 13, color: 'var(--color-primary-500)' }} />
                <p className="section-header" style={{ margin: 0 }}>Membri Adiționale</p>
                <span className="badge badge-info">{additionalMembers.length} {additionalMembers.length === 1 ? 'membru' : 'membri'}</span>
              </div>
              <div className="space-y-1">
                {additionalMembers.map((member, index) => (
                  <div key={index} className="flex items-center justify-between" style={{ background: 'var(--surface-secondary)', padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: 12 }}>
                    <div>
                      <span style={{ fontWeight: 500, color: 'var(--color-neutral-700)' }}>{index + 1}. {member.nume} {member.prenume}</span>
                      <span style={{ color: 'var(--color-neutral-400)', marginLeft: 8 }}>CNP: {member.cnp}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'var(--color-neutral-400)' }}>{member.adresaPersonala}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = additionalMembers.filter((_, i) => i !== index);
                          setAdditionalMembers(updated);
                          sessionStorage.setItem('additionalMembers', JSON.stringify(updated));
                        }}
                        className="ml-1 text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors flex-shrink-0"
                        title="Șterge membru"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Butoane de acțiune */}
          <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {contestationCreated ? (
              <>
                <button type="button" onClick={handleAddMemberClick} className="btn btn-outline" disabled={submitting}>
                  <UserPlusIcon style={{ width: 14, height: 14 }} />
                  Adaugă Membru
                </button>
                <button type="button" onClick={handleFinalize} className="btn btn-primary"
                  style={{ backgroundColor: 'var(--color-success)' }}>
                  <CheckIcon style={{ width: 14, height: 14 }} />
                  Contestație Nouă
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={handleAddMemberClick} className="btn btn-outline" disabled={submitting}>
                  <UserPlusIcon style={{ width: 14, height: 14 }} />
                  Adaugă Membru
                </button>
                <button type="submit" disabled={submitting || contestationCreated}
                  className="btn btn-primary" tabIndex={50} aria-busy={submitting}>
                  {submitting ? (
                    <>
                      <svg className="animate-spin" style={{ width: 14, height: 14 }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Se trimite...
                    </>
                  ) : (
                    <>
                      <ArrowUpTrayIcon style={{ width: 14, height: 14 }} />
                      Salvează Contestația
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Modal pentru adăugarea unui membru */}
      {showAddMemberModal && (
        <AddMemberForm
          onClose={handleCloseAddMemberModal}
          onAddMember={handleAddAdditionalMember}
          additionalMembers={additionalMembers}
          onFinalize={handleFinalize}
        />
      )}

      {/* Modal de confirmare pentru opțiunile cu membri */}
      {showConfirmModal && (
        <ConfirmSubmitModal
          onClose={() => setShowConfirmModal(false)}
          onAddMember={() => { }}
          onFinalize={handleFinalize}
        />
      )}
    </div>
  );
}

export default ComplaintForm;