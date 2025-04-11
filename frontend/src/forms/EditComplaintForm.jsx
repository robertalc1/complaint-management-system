import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  QuestionMarkCircleIcon,
  IdentificationIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleBottomCenterTextIcon,
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
  onlyNumbers = false
}) => {
  const isSelect = options !== null;
  const isTextarea = rows !== null;
  
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

// Componentă pentru checkbox optimizată pentru accesibilitate
const FormCheckbox = ({ id, label, name, checked, onChange, tabIndex, onKeyDown }) => {
  return (
    <div className="flex items-center h-full">
      <label className="flex items-center cursor-pointer group" htmlFor={id}>
        <div className="relative flex items-center">
          <input
            id={id}
            type="checkbox"
            name={name}
            checked={checked}
            onChange={onChange}
            tabIndex={tabIndex}
            onKeyDown={onKeyDown}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-colors"
            aria-checked={checked}
          />
          {/* Indicator vizual de focus și hover */}
          <div className="absolute inset-0 -m-1 rounded opacity-0 group-hover:opacity-10 bg-blue-500 pointer-events-none transition-opacity duration-150"></div>
        </div>
        <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-150">{label}</span>
      </label>
    </div>
  );
};

// Componentă pentru butonul de status contestație (Admis/Respins)
const StatusButton = ({ id, label, name, icon: Icon, checked, onChange, activeColor, inactiveColor, tabIndex }) => {
  return (
    <button
      type="button"
      id={id}
      onClick={() => onChange({ target: { name, checked: !checked } })}
      tabIndex={tabIndex}
      className={`flex items-center justify-center px-4 py-2 rounded-lg border transition-all duration-200 ${
        checked 
          ? `bg-${activeColor}-50 border-${activeColor}-200 text-${activeColor}-700` 
          : `bg-white border-gray-300 text-${inactiveColor}-600 hover:bg-gray-50`
      }`}
      aria-pressed={checked}
    >
      <Icon className={`h-5 w-5 mr-2 ${checked ? `text-${activeColor}-500` : 'text-gray-400'}`} />
      <span className="font-medium">{label}</span>
    </button>
  );
};

// Header pentru fiecare secțiune
const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-gray-200">
    <Icon className="h-5 w-5 text-blue-600" />
    <h3 className="text-base font-medium text-gray-800">{title}</h3>
  </div>
);

function EditComplaintForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nume: '',
    prenume: '',
    cnp: '',
    adresaPersonala: '',
    regiune: '',
    adresaImobil: '',
    observatii: '',
    dataAleasa: '',
    numarContestatie: '',
    numarProcesVerbal: '',
    dataProcesVerbal: '',
    numarCerere: '',
    dataCerere: '',
    uat: '',
    adresaPrimarie: '',
    autorizat: '',
    adresaAutorizat: '',
    idImobil: '',
    documenteAtasate: '',
    verificatTeren: false,
    admis: false,
    respins: false
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Funcție pentru formatarea datelor
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      // Încercăm să convertim data
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return ''; // Data invalidă
      
      // Formatare YYYY-MM-DD pentru input type="date"
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Eroare la formatarea datei:', error);
      return '';
    }
  };

  // Încarcă datele
  useEffect(() => {
    const fetchData = async () => {
      try {
        const contestatieResponse = await axios.get(`http://localhost:8082/contestatii/${id}`);
        
        // Formatăm datele pentru a asigura compatibilitatea cu input type="date"
        setFormData(prev => ({
          ...prev,
          ...contestatieResponse.data,
          // Adaptare nume câmpuri din BD în format camelCase pentru React
          numarProcesVerbal: contestatieResponse.data.numar_proces_verbal || '',
          dataProcesVerbal: formatDate(contestatieResponse.data.data_proces_verbal),
          numarCerere: contestatieResponse.data.numar_cerere || '',
          dataCerere: formatDate(contestatieResponse.data.data_cerere),
          dataAleasa: formatDate(contestatieResponse.data.data_aleasa),
          adresaPersonala: contestatieResponse.data.adresa_personala || '',
          uat: contestatieResponse.data.uat || '',
          adresaPrimarie: contestatieResponse.data.adresa_primarie || '',
          autorizat: contestatieResponse.data.autorizat || '',
          adresaAutorizat: contestatieResponse.data.adresa_autorizat || '',
          adresaImobil: contestatieResponse.data.adresa || '',
          idImobil: contestatieResponse.data.id_imobil || '',
          documenteAtasate: contestatieResponse.data.documente_atasate || '',
          verificatTeren: Boolean(contestatieResponse.data.verificat_teren),
          admis: Boolean(contestatieResponse.data.admis),
          respins: Boolean(contestatieResponse.data.respins)
        }));
      } catch (error) {
        console.error('Eroare la încărcarea datelor:', error);
        setError('Nu s-au putut încărca datele contestației');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Gestionează schimbările în câmpuri
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gestionează schimbările în checkbox-uri
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    
    // Pentru checkboxurile Admis/Respins, asigură-te că doar unul este activ
    if (name === 'admis' && checked) {
      setFormData(prev => ({
        ...prev,
        admis: true,
        respins: false
      }));
    } else if (name === 'respins' && checked) {
      setFormData(prev => ({
        ...prev,
        admis: false,
        respins: true
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    }
  };

  // Gestionează trimiterea formularului
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // Pregătim datele pentru trimitere către server
      const dataToSubmit = {
        ...formData,
        // Convertim camelCase în snake_case pentru server
        numar_proces_verbal: formData.numarProcesVerbal,
        data_proces_verbal: formData.dataProcesVerbal,
        numar_cerere: formData.numarCerere,
        data_cerere: formData.dataCerere,
        data_aleasa: formData.dataAleasa,
        adresa_personala: formData.adresaPersonala,
        adresa_primarie: formData.adresaPrimarie,
        adresa_autorizat: formData.adresaAutorizat,
        adresa: formData.adresaImobil,
        id_imobil: formData.idImobil,
        documente_atasate: formData.documenteAtasate,
        verificat_teren: formData.verificatTeren ? 1 : 0,
        admis: formData.admis ? 1 : 0,
        respins: formData.respins ? 1 : 0
      };

      await axios.put(`http://localhost:8082/contestatii/${id}`, dataToSubmit);
      setSuccess('Contestația a fost actualizată cu succes!');
      
      setTimeout(() => {
        navigate('/dashboard/filter-contestatii');
      }, 2000);
    } catch (error) {
      console.error('Eroare la actualizarea contestației:', error);
      setError('Nu s-a putut actualiza contestația');
    } finally {
      setSubmitting(false);
    }
  };

  // Afișare spinner în timpul încărcării
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-8 w-full px-2">
      {/* Header cu buton înapoi */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate('/dashboard/filter-contestatii')}
          className="mr-4 p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          aria-label="Înapoi la lista de contestații"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          Editare Contestație {formData.numar_contestatie}
        </h1>
      </div>
      
      {/* Mesaje de eroare/succes */}
      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Banner cu informații - afișează datele de locație precompletate */}
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
            </div>
            
            <div className="grid grid-cols-[150px_1fr] gap-y-3 text-sm">
              <div className="text-gray-700 font-medium">Județ:</div>
              <div className="text-gray-800">{ROMANIAN_COUNTIES.find(county => county.id === formData.regiune)?.name || 'Neselectat'}</div>
              
              <div className="text-gray-700 font-medium">UAT:</div>
              <div className="text-gray-800">{formData.uat || 'Nespecificat'}</div>
              
              <div className="text-gray-700 font-medium">Adresă Primărie:</div>
              <div className="text-gray-800">{formData.adresaPrimarie || 'Nespecificat'}</div>
              
              <div className="text-gray-700 font-medium">Autorizat:</div>
              <div className="text-gray-800">{formData.autorizat || 'Nespecificat'}</div>
              
              <div className="text-gray-700 font-medium">Adresă Autorizat:</div>
              <div className="text-gray-800">{formData.adresaAutorizat || 'Nespecificat'}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Secțiunea de status a contestației */}
      <div className="bg-white rounded-xl shadow-md mb-4 p-4">
        <div className="flex items-start">
          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Status Contestație
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Selectați statusul final al contestației. Acesta va apărea în toate documentele generate și rapoarte.
            </p>
            
            <div className="flex space-x-4">
              <StatusButton 
                id="admis-button"
                label="Admis"
                name="admis"
                icon={CheckCircleIcon}
                checked={formData.admis}
                onChange={handleCheckboxChange}
                activeColor="green"
                inactiveColor="gray"
                tabIndex={1}
              />
              
              <StatusButton 
                id="respins-button"
                label="Respins"
                name="respins"
                icon={XMarkIcon}
                checked={formData.respins}
                onChange={handleCheckboxChange}
                activeColor="red"
                inactiveColor="gray"
                tabIndex={2}
              />
            </div>
          </div>
          
          <div className="ml-4 p-3 bg-blue-50 rounded-lg border border-blue-100 max-w-sm">
            <div className="flex items-start">
              <QuestionMarkCircleIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-700 mb-1">Ghid status</h4>
                <p className="text-xs text-blue-600">
                  <strong>Admis</strong>: Contestația a fost analizată și aprobată.<br />
                  <strong>Respins</strong>: Contestația a fost analizată și respinsă.<br />
                  <strong>Neutru</strong>: Lăsați ambele opțiuni neselectate pentru contestații în așteptare sau în curs de analiză.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
            
      {/* Formular principal */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        {/* Antet formular */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-blue-700 flex items-center">
              <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2 text-blue-600" />
              Formular de Contestație
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
                className="h-9 px-3 bg-white border-0 border-l border-blue-100 text-gray-900 rounded-r-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                tabIndex={3}
              />
            </div>
          </div>
        </div>
        
        {/* Conținut formular */}
        <form onSubmit={handleSubmit} className="p-5">
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
                  placeholder="Introduceți numele"
                  tabIndex={4}
                />
                
                <FormField 
                  id="prenume" 
                  label="Prenume" 
                  name="prenume" 
                  value={formData.prenume} 
                  onChange={handleChange} 
                  required={true}
                  placeholder="Introduceți prenumele"
                  tabIndex={5}
                />
              </div>
              
              <FormField 
                id="cnp" 
                label="CNP" 
                name="cnp" 
                value={formData.cnp} 
                onChange={handleChange} 
                required={true}
                placeholder="Introduceți CNP-ul (13 cifre)"
                tabIndex={6}
                onlyNumbers={true}
                onBlur={(e) => {
                  if (e.target.value && !/^\d{13}$/.test(e.target.value)) {
                    alert('CNP-ul trebuie să conțină exact 13 cifre');
                  }
                }}
              />
              
              <FormField 
                id="adresaPersonala" 
                label="Adresă Personală" 
                name="adresaPersonala" 
                value={formData.adresaPersonala} 
                onChange={handleChange}
                required={true}
                placeholder="Introduceți adresa personală"
                tabIndex={7}
              />
            </div>
            
            {/* Secțiunea Informații proces verbal */}
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
                    tabIndex={8}
                    onlyNumbers={true}
                  />
                  
                  <FormField 
                    id="dataProcesVerbal" 
                    label="Data proces verbal" 
                    name="dataProcesVerbal" 
                    type="date" 
                    value={formData.dataProcesVerbal} 
                    onChange={handleChange}
                    tabIndex={9}
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
                    tabIndex={10}
                    onlyNumbers={true}
                  />
                  
                  <FormField 
                    id="dataCerere" 
                    label="Data cerere" 
                    name="dataCerere" 
                    type="date" 
                    value={formData.dataCerere} 
                    onChange={handleChange}
                    tabIndex={11}
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
                    tabIndex={12}
                    onlyNumbers={true}
                  />
                
                  <FormField 
                    id="adresaImobil" 
                    label="Adresă imobil" 
                    name="adresaImobil" 
                    value={formData.adresaImobil} 
                    onChange={handleChange}
                    placeholder="Introduceți adresa imobilului"
                    tabIndex={13}
                  />
                </div>
                
                <div className="py-2">
                  <FormCheckbox
                    id="verificatTeren"
                    name="verificatTeren"
                    label="Verificat în teren"
                    checked={formData.verificatTeren}
                    onChange={handleCheckboxChange}
                    tabIndex={14}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* A doua linie: Documente atașate și Observații */}
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
                tabIndex={15}
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
                tabIndex={16}
              />
            </div>
          </div>
          
          {/* Buton de trimitere mai compact și centrat */}
          <div className="mt-6 flex justify-center">
            <button
              id="submit-button"
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors max-w-xs"
              tabIndex={17}
              aria-busy={submitting}
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Se procesează...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <CheckIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                  Salvează Modificările
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditComplaintForm;