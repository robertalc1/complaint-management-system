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
  ExclamationCircleIcon,
  DocumentTextIcon,
  IdentificationIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

// Lista județelor din România
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
  const inputClass = `w-full px-3 py-2 bg-white border ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} rounded-lg shadow-sm transition-all duration-150 focus:outline-none focus:ring-1 ${value ? 'text-gray-900' : 'text-gray-500'} ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`;
  
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
    <div className="form-field mb-3">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
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
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600" role="alert">{error}</p>
      )}
    </div>
  );
};

// Modal de confirmare pentru opțiuni cu membri sau finalizare
const ConfirmSubmitModal = ({ onClose, onAddMember, onFinalize }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl mx-auto z-10 relative overflow-hidden transition-all transform scale-100">
        <div className="p-5 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 flex items-center">
            <UserPlusIcon className="h-5 w-5 mr-2 text-blue-700" />
            Adăugare membri aditionali
          </h3>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Doriți să adăugați membri aditionali la această contestație sau să finalizați contestația?
          </p>
          
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-6">

            
            <button
              onClick={onAddMember}
              className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Adaugă Membru
            </button>
            
            <button
              onClick={onFinalize}
              className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              Finalizează contestație
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componentă pentru adăugarea membrilor
const AddMemberForm = ({ contestationData, onClose, onSubmit, onFinalize }) => {
  const [memberData, setMemberData] = useState({
    nume: '',
    prenume: '',
    cnp: '',
    adresaPersonala: ''
  });
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      try {
        // Primul pas: Dacă nu avem încă un ID de contestație, creăm contestația
        let contestatieId = contestationData.contestationId;
        
        if (!contestatieId) {
          // Creăm contestația și adresa, dar nu persoana principală
          const contestationResponse = await axios.post('http://localhost:8082/contestatii-only', {
            // Datele pentru contestație
            numarProcesVerbal: contestationData.numarProcesVerbal,
            dataProcesVerbal: contestationData.dataProcesVerbal,
            numarCerere: contestationData.numarCerere,
            dataCerere: contestationData.dataCerere,
            dataAleasa: contestationData.dataAleasa,
            idImobil: contestationData.idImobil,
            documenteAtasate: contestationData.documenteAtasate,
            observatii: contestationData.observatii,
            verificatTeren: contestationData.verificatTeren,
            
            // Datele pentru adresă
            regiune: contestationData.regiune, 
            uat: contestationData.uat,
            adresaImobil: contestationData.adresaImobil,
            adresaPrimarie: contestationData.adresaPrimarie,
            autorizat: contestationData.autorizat,
            adresaAutorizat: contestationData.adresaAutorizat
          }, { withCredentials: true });
          
          if (contestationResponse.data.status === 'success') {
            contestatieId = contestationResponse.data.id;
            
            // Adăugăm persoana principală ca prim membru
            await axios.post('http://localhost:8082/membri-contestatie', {
              contestatie_id: contestatieId,
              nume: contestationData.nume,
              prenume: contestationData.prenume,
              cnp: contestationData.cnp,
              adresaPersonala: contestationData.adresaPersonala
            }, { withCredentials: true });
          } else {
            throw new Error('Trimiterea contestației a eșuat');
          }
        }
        
        // Al doilea pas: Adăugăm membrul nou
        const response = await axios.post('http://localhost:8082/membri-contestatie', {
          contestatie_id: contestatieId,
          nume: memberData.nume,
          prenume: memberData.prenume,
          cnp: memberData.cnp,
          adresaPersonala: memberData.adresaPersonala
        }, { withCredentials: true });
        
        if (response.data.status === 'success') {
          // Trimitem ID-ul contestației către componenta părinte
          await onSubmit(contestatieId);
          
          // Resetăm formularul pentru a adăuga un alt membru
          setMemberData({
            nume: '',
            prenume: '',
            cnp: '',
            adresaPersonala: ''
          });
        } else {
          throw new Error('Trimiterea datelor membrului a eșuat');
        }
      } catch (error) {
        console.error('Eroare la trimiterea datelor:', error);
        setErrors({
          submit: 'Nu s-a putut adăuga membrul. Vă rugăm să încercați din nou.'
        });
      } finally {
        setSubmitting(false);
      }
    } else {
      setErrors(newErrors);
      setSubmitting(false);
    }
  };
  
  // Funcție pentru finalizarea contestației și adăugarea datelor dacă există
  const handleFinalizeWithMember = async () => {
    setSubmitting(true);
    
    try {
      // Verificăm dacă avem date de membru de trimis
      const hasValidMemberData = memberData.nume && memberData.prenume && memberData.cnp && memberData.adresaPersonala;
      
      // Primul pas: Dacă nu avem încă un ID de contestație, creăm contestația
      let contestatieId = contestationData.contestationId;
      
      if (!contestatieId) {
        // Formatăm datele de tip dată pentru server
        const formattedData = {
          ...contestationData,
          dataProcesVerbal: contestationData.dataProcesVerbal || null,
          dataCerere: contestationData.dataCerere || null,
          dataAleasa: contestationData.dataAleasa || null
        };
        
        // Creăm contestația și adresa, dar nu persoana principală
        const contestationResponse = await axios.post('http://localhost:8082/contestatii-only', {
          // Datele pentru contestație
          numarProcesVerbal: formattedData.numarProcesVerbal,
          dataProcesVerbal: formattedData.dataProcesVerbal,
          numarCerere: formattedData.numarCerere,
          dataCerere: formattedData.dataCerere,
          dataAleasa: formattedData.dataAleasa,
          idImobil: formattedData.idImobil,
          documenteAtasate: formattedData.documenteAtasate,
          observatii: formattedData.observatii,
          verificatTeren: formattedData.verificatTeren,
          
          // Datele pentru adresă
          regiune: formattedData.regiune, 
          uat: formattedData.uat,
          adresaImobil: formattedData.adresaImobil,
          adresaPrimarie: formattedData.adresaPrimarie,
          autorizat: formattedData.autorizat,
          adresaAutorizat: formattedData.adresaAutorizat
        }, { withCredentials: true });
        
        if (contestationResponse.data.status === 'success') {
          contestatieId = contestationResponse.data.id;
          
          // Adăugăm persoana principală ca prim membru
          await axios.post('http://localhost:8082/membri-contestatie', {
            contestatie_id: contestatieId,
            nume: contestationData.nume,
            prenume: contestationData.prenume,
            cnp: contestationData.cnp,
            adresaPersonala: contestationData.adresaPersonala
          }, { withCredentials: true });
        } else {
          throw new Error('Trimiterea contestației a eșuat');
        }
      }
      
      // Al doilea pas: Dacă avem date valide de membru, le trimitem
      if (hasValidMemberData) {
        // Validăm datele membrului
        const newErrors = validateForm();
        if (Object.keys(newErrors).length === 0) {
          // Trimitem datele membrului
          const response = await axios.post('http://localhost:8082/membri-contestatie', {
            contestatie_id: contestatieId,
            nume: memberData.nume,
            prenume: memberData.prenume,
            cnp: memberData.cnp,
            adresaPersonala: memberData.adresaPersonala
          }, { withCredentials: true });
          
          if (response.data.status === 'success') {
            // Trimitem ID-ul contestației către componenta părinte
            await onSubmit(contestatieId);
          }
        }
      }
      
      // Indiferent dacă am avut date de membru sau nu, finalizăm contestația
      onFinalize();
      
    } catch (error) {
      console.error('Eroare la finalizarea contestației:', error);
      setErrors({
        submit: 'Nu s-a putut finaliza contestația. Vă rugăm să încercați din nou.'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-auto z-10 relative overflow-hidden transition-all transform scale-100">
        <div className="p-5 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-blue-800 flex items-center">
              <UserPlusIcon className="h-5 w-5 mr-2 text-blue-700" />
              Adăugare Membru Adițional
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-4 text-sm bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-700">
            <p className="font-medium mb-1">Instrucțiuni pentru adăugarea membrilor:</p>
            <p>Completați datele pentru fiecare membru adițional al contestației. Toate câmpurile sunt obligatorii. După completare, puteți adăuga un alt membru sau finaliza procesul.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                id="membru-nume" 
                label="Nume" 
                name="nume" 
                value={memberData.nume} 
                onChange={handleChange} 
                required={true} 
                error={errors.nume}
                placeholder="Introduceți numele"
                autoFocus={true}
              />
              
              <FormField 
                id="membru-prenume" 
                label="Prenume" 
                name="prenume" 
                value={memberData.prenume} 
                onChange={handleChange} 
                required={true} 
                error={errors.prenume}
                placeholder="Introduceți prenumele"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                id="membru-cnp" 
                label="CNP" 
                name="cnp" 
                value={memberData.cnp} 
                onChange={handleChange} 
                required={true} 
                error={errors.cnp}
                placeholder="Introduceți CNP-ul (13 cifre)"
                onBlur={(e) => {
                  if (e.target.value && !/^\d{13}$/.test(e.target.value)) {
                    setErrors(prev => ({
                      ...prev,
                      cnp: 'CNP-ul trebuie să conțină exact 13 cifre'
                    }));
                  }
                }}
                onlyNumbers={true}
              />
              
              <FormField 
                id="membru-adresaPersonala" 
                label="Adresă Personală" 
                name="adresaPersonala" 
                value={memberData.adresaPersonala} 
                onChange={handleChange}
                required={true}
                error={errors.adresaPersonala}
                placeholder="Introduceți adresa personală"
              />
            </div>
            
            {errors.submit && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                {errors.submit}
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-3 mt-8 pt-4 border-t border-gray-200">
              
              <button
                type="submit"
                className="w-full px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Se trimite...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Adaugă Membru
                  </span>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleFinalizeWithMember}
                className="w-full px-4 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Se procesează...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Finalizează contestație
                  </span>
                )}
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
  <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-gray-200">
    <Icon className="h-5 w-5 text-blue-600" />
    <h3 className="text-base font-medium text-gray-800">{title}</h3>
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
  
  useEffect(() => {
    // Verificăm dacă avem date de locație în sessionStorage
    const storedLocationData = sessionStorage.getItem('locationData');
    
    if (storedLocationData) {
      setLocationData(JSON.parse(storedLocationData));
    } else {
      // Dacă nu există date de locație, redirectăm înapoi la pagina de preselecție
      navigate('/dashboard/contestatii');
    }
  }, [navigate]);
  
  const [formData, setFormData] = useState({
    nume: '',
    prenume: '',
    cnp: '',
    adresaPersonala: '',
    regiune: '',
    adresaImobil: '',
    observatii: '',
    dataAleasa: '',
    numarProcesVerbal: '',
    dataProcesVerbal: '',
    numarCerere: '',
    dataCerere: '',
    uat: '',
    adresaPrimarie: '',
    autorizat: '',
    adresaAutorizat: '',
    idImobil: '',
    documenteAtasate: ''
  });
  
  // Precompletăm formularul cu datele de locație
  useEffect(() => {
    if (locationData) {
      setFormData(prev => ({
        ...prev,
        regiune: locationData.regiune || '',
        uat: locationData.uat || '',
        adresaPrimarie: locationData.adresaPrimarie || '',
        autorizat: locationData.autorizat || '',
        adresaAutorizat: locationData.adresaAutorizat || ''
      }));
    }
  }, [locationData]);
  
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
    setFormData(prev => ({
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
    navigate('/dashboard/contestatii');
  };

  // Funcție pentru butonul "Trimite Contestația" - verifică dacă contestația există deja
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
        // Trimitem contestația completă într-o singură cerere
        const response = await axios.post('http://localhost:8082/contestatii', formData, { 
          withCredentials: true 
        });
        
        if (response.data.status === 'success') {
          // Marcăm contestația ca fiind creată
          setContestationCreated(true);
          setSavedContestationId(response.data.id);
          
          // Afișăm mesaj de succes
          setSubmitSuccess(true);
          
          setTimeout(() => {
            setSubmitSuccess(false);
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
      dataAleasa: '',
      numarProcesVerbal: '',
      dataProcesVerbal: '',
      numarCerere: '',
      dataCerere: '',
      uat: locationData?.uat || '',
      adresaPrimarie: locationData?.adresaPrimarie || '',
      autorizat: locationData?.autorizat || '',
      adresaAutorizat: locationData?.adresaAutorizat || '',
      idImobil: '',
      documenteAtasate: ''
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
      }, 5000);
    }
  };

  // Dacă nu avem încă date de locație, afișăm un spinner
  if (!locationData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="complaint-form-container w-full px-2">
      {/* Header de pagină */}
      <div className="flex flex-col mb-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Adăugare Contestație
        </h1>
      </div>
      
      {/* Banner cu informații - afișează toate datele de locație precompletate */}
      <div className="mb-4 max-w-2xl">
        <div className="bg-blue-50 rounded-lg border border-blue-200 overflow-hidden shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3 pb-1 border-b border-blue-100">
              <div className="flex items-center">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-blue-700">
                  Date de locație precompletate
                </h3>
              </div>
              
              <button 
                type="button" 
                onClick={changeLocationData} 
                className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded-md transition-colors"
              >
                Schimbă locația
              </button>
            </div>
            
            <div className="grid grid-cols-[150px_1fr] gap-y-3 text-sm">
              <div className="text-gray-700 font-medium">Județ:</div>
              <div className="text-gray-800">{ROMANIAN_COUNTIES.find(county => county.id === locationData.regiune)?.name || 'Neselectat'}</div>
              
              <div className="text-gray-700 font-medium">UAT:</div>
              <div className="text-gray-800">{locationData.uat || 'Nespecificat'}</div>
              
              <div className="text-gray-700 font-medium">Adresă Primărie:</div>
              <div className="text-gray-800">{locationData.adresaPrimarie || 'Nespecificat'}</div>
              
              <div className="text-gray-700 font-medium">Autorizat:</div>
              <div className="text-gray-800">{locationData.autorizat || 'Nespecificat'}</div>
              
              <div className="text-gray-700 font-medium">Adresă Autorizat:</div>
              <div className="text-gray-800">{locationData.adresaAutorizat || 'Nespecificat'}</div>
            </div>
          </div>
        </div>
      </div>
      
      {submitSuccess && (
        <div className="mb-4 bg-green-50 border border-green-100 text-green-800 p-3 rounded-lg flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
          {contestationCreated 
            ? "Contestația a fost creată. Puteți adăuga membri suplimentari sau crea o nouă contestație."
            : "Contestația a fost trimisă cu succes!"}
        </div>
      )}
      
      {/* Formular principal - îmbunătățit și mai compact */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
        {/* Antet formular */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-blue-700 flex items-center">
              <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2 text-blue-600" />
              Formular de Contestație
              {contestationCreated && (
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                  Contestație creată
                </span>
              )}
            </h2>
            
            <div className="flex items-center bg-white rounded-lg border border-blue-200 shadow-sm">
              <div className="flex items-center h-9 px-3">
                <CalendarIcon className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-700">Data:</span>
              </div>
              <input
                id="dataAleasa"
                name="dataAleasa"
                type="date"
                value={formData.dataAleasa}
                onChange={handleChange}
                disabled={contestationCreated}
                className="h-9 px-3 bg-white border-0 border-l border-blue-100 text-gray-900 rounded-r-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                tabIndex={5}
              />
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmitClick} className="p-5">
          {/* Prima linie: Date personale și Informații proces verbal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* Secțiunea Date personale */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
              <SectionHeader icon={IdentificationIcon} title="Date personale" />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField 
                  id="nume" 
                  label="Nume" 
                  name="nume" 
                  value={formData.nume} 
                  onChange={handleChange} 
                  required={true} 
                  error={errors.nume}
                  placeholder="Introduceți numele"
                  tabIndex={1}
                  autoFocus={true}
                  disabled={contestationCreated}
                />
                
                <FormField 
                  id="prenume" 
                  label="Prenume" 
                  name="prenume" 
                  value={formData.prenume} 
                  onChange={handleChange} 
                  required={true} 
                  error={errors.prenume}
                  placeholder="Introduceți prenumele"
                  tabIndex={2}
                  disabled={contestationCreated}
                />
              </div>
              
              <FormField 
                id="cnp" 
                label="CNP" 
                name="cnp" 
                value={formData.cnp} 
                onChange={handleChange} 
                required={true} 
                error={errors.cnp}
                placeholder="Introduceți CNP-ul (13 cifre)"
                tabIndex={3}
                onBlur={(e) => {
                  if (e.target.value && !/^\d{13}$/.test(e.target.value)) {
                    setErrors(prev => ({
                      ...prev,
                      cnp: 'CNP-ul trebuie să conțină exact 13 cifre'
                    }));
                  }
                }}
                disabled={contestationCreated}
                onlyNumbers={true}
              />
              
              <FormField 
                id="adresaPersonala" 
                label="Adresă Personală" 
                name="adresaPersonala" 
                value={formData.adresaPersonala} 
                onChange={handleChange}
                required={true}
                error={errors.adresaPersonala}
                placeholder="Introduceți adresa personală"
                tabIndex={4}
                disabled={contestationCreated}
              />
            </div>
            
            {/* Secțiunea Informații proces verbal - acum include ID imobil și Adresă imobil */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
              <SectionHeader icon={DocumentTextIcon} title="Informații proces verbal" />
              
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField 
                    id="numarProcesVerbal" 
                    label="Număr proces verbal" 
                    name="numarProcesVerbal" 
                    value={formData.numarProcesVerbal} 
                    onChange={handleChange}
                    placeholder="Introduceți numărul"
                    tabIndex={6}
                    disabled={contestationCreated}
                    onlyNumbers={true}
                  />
                  
                  <FormField 
                    id="dataProcesVerbal" 
                    label="Data proces verbal" 
                    name="dataProcesVerbal" 
                    type="date" 
                    value={formData.dataProcesVerbal} 
                    onChange={handleChange}
                    tabIndex={7}
                    disabled={contestationCreated}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField 
                    id="numarCerere" 
                    label="Număr cerere" 
                    name="numarCerere" 
                    value={formData.numarCerere} 
                    onChange={handleChange}
                    placeholder="Introduceți numărul"
                    tabIndex={8}
                    disabled={contestationCreated}
                    onlyNumbers={true}
                  />
                  
                  <FormField 
                    id="dataCerere" 
                    label="Data cerere" 
                    name="dataCerere" 
                    type="date" 
                    value={formData.dataCerere} 
                    onChange={handleChange}
                    tabIndex={9}
                    disabled={contestationCreated}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField 
                    id="idImobil" 
                    label="ID imobil" 
                    name="idImobil" 
                    value={formData.idImobil} 
                    onChange={handleChange}
                    placeholder="Identificator imobil"
                    tabIndex={10}
                    disabled={contestationCreated}
                    onlyNumbers={true}
                  />
                
                  <FormField 
                    id="adresaImobil" 
                    label="Adresă imobil" 
                    name="adresaImobil" 
                    value={formData.adresaImobil} 
                    onChange={handleChange}
                    placeholder="Introduceți adresa imobilului"
                    tabIndex={11}
                    disabled={contestationCreated}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* A doua linie: Documente atașate și Observații - acum pe același rând */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* Secțiunea Documente atașate */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
              <SectionHeader icon={DocumentTextIcon} title="Documente atașate" />
              
              <FormField 
                id="documenteAtasate" 
                label="Lista documentelor" 
                name="documenteAtasate" 
                value={formData.documenteAtasate} 
                onChange={handleChange}
                rows={5}
                placeholder="Enumerați documentele atașate acestei contestații"
                tabIndex={12}
                disabled={contestationCreated}
              />
            </div>
            
            {/* Secțiunea Observații */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
              <SectionHeader icon={ChatBubbleBottomCenterTextIcon} title="Observații" />
              
              <FormField 
                id="observatii" 
                label="Observații" 
                name="observatii" 
                value={formData.observatii} 
                onChange={handleChange}
                rows={5}
                placeholder="Adăugați observații relevante"
                tabIndex={13}
                disabled={contestationCreated}
              />
            </div>
          </div>
          
          {/* Eroare la trimitere */}
          {errors.submit && (
            <div className="mt-3 mb-4 bg-red-50 text-red-700 p-4 rounded-lg text-sm flex items-center">
              <ExclamationCircleIcon className="h-5 w-5 mr-3 text-red-500 flex-shrink-0" />
              {errors.submit}
            </div>
          )}
          
          {/* Butoane de acțiune - Adaugă membru și Trimite contestația */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contestationCreated ? (
              <>
                <button
                  type="button"
                  onClick={handleAddMemberClick}
                  className="flex justify-center items-center py-3 px-5 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  disabled={submitting}
                >
                  <UserPlusIcon className="mr-2 h-5 w-5 text-gray-600" />
                  Adaugă membru
                </button>
                
                <button
                  type="button"
                  onClick={handleFinalize}
                  className="flex justify-center items-center py-3 px-5 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <CheckIcon className="mr-2 h-5 w-5" />
                  Adaugă Contestație nouă
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleAddMemberClick}
                  className="flex justify-center items-center py-3 px-5 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  disabled={submitting}
                >
                  <UserPlusIcon className="mr-2 h-5 w-5 text-gray-600" />
                  Adaugă membru
                </button>
                
                <button
                  type="submit"
                  disabled={submitting || contestationCreated}
                  className={`flex justify-center items-center py-3 px-5 border border-transparent rounded-lg shadow-sm text-base font-medium text-white ${contestationCreated ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70`}
                  tabIndex={50}
                  aria-busy={submitting}
                  aria-describedby={errors.submit ? 'submit-error' : undefined}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Se trimite...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <ArrowUpTrayIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                      Trimite Contestația
                    </span>
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
          contestationData={{
            ...formData,
            contestationId: savedContestationId
          }}
          onClose={handleCloseAddMemberModal}
          onSubmit={handleMemberAndContestationSubmit}
          onFinalize={handleFinalize}
        />
      )}
      
      {/* Modal de confirmare pentru opțiunile cu membri */}
      {showConfirmModal && (
        <ConfirmSubmitModal 
          onClose={() => setShowConfirmModal(false)} 
          onAddMember={() => {}}
          onFinalize={handleFinalize}
        />
      )}
    </div>
  );
}

export default ComplaintForm;