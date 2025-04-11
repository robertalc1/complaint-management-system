import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowRightIcon,
  ExclamationCircleIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  UserIcon
} from '@heroicons/react/24/outline';

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
  icon = null
}) => {
  const isSelect = options !== null;
  const isTextarea = rows !== null;
  const hasIcon = icon !== null;
  
  // Clasa CSS pentru stările input-ului - modernizată
  const inputClass = `w-full px-3 py-2 bg-white border ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} rounded-lg shadow-sm transition-all duration-150 focus:outline-none focus:ring-1 ${value ? 'text-gray-900' : 'text-gray-500'} ${hasIcon ? 'pl-10' : ''}`;
  
  return (
    <div className="form-field mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
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
            className={inputClass}
            required={required}
            tabIndex={tabIndex}
            autoFocus={autoFocus}
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
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            rows={rows}
            placeholder={placeholder}
            className={inputClass}
            required={required}
            tabIndex={tabIndex}
          />
        ) : (
          <input
            id={id}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={inputClass}
            required={required}
            tabIndex={tabIndex}
            autoFocus={autoFocus}
          />
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">{error}</p>
      )}
    </div>
  );
};

function LocationPreselectionForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    regiune: '',
    uat: '',
    adresaPrimarie: '',
    autorizat: '',
    adresaAutorizat: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validăm că toate câmpurile sunt completate
      if (!formData.regiune || !formData.uat || !formData.adresaPrimarie || !formData.autorizat || !formData.adresaAutorizat) {
        throw new Error('Toate câmpurile sunt obligatorii');
      }
      
      // Salvăm datele de locație în sessionStorage pentru a fi disponibile în formularul complet
      sessionStorage.setItem('locationData', JSON.stringify(formData));
      
      // Opțional: Putem salva datele și în baza de date pentru persistență
      const response = await axios.post('http://localhost:8082/location-preselection', formData, {
        withCredentials: true
      });
      
      if (response.data.status === 'success') {
        // Redirecționăm către formularul complet
        navigate('/dashboard/contestatii-form', { 
          state: { locationId: response.data.id }
        });
      } else {
        throw new Error('Eroare la salvarea datelor de locație');
      }
    } catch (error) {
      console.error('Eroare:', error);
      setError(error.message || 'Nu s-au putut salva datele de locație. Vă rugăm încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Date Locație Contestație
        </h1>
        <p className="text-gray-600">
          Completați informațiile despre locație pentru a continua la adăugarea contestației.
        </p>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 border-b border-blue-200">
          <h2 className="text-lg font-semibold text-white">
            Formular Date Locație
          </h2>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Coloana stânga */}
              <div className="space-y-4">
                <FormField 
                  id="regiune" 
                  label="Județ" 
                  name="regiune" 
                  value={formData.regiune} 
                  onChange={handleChange} 
                  required={true} 
                  options={ROMANIAN_COUNTIES}
                  placeholder="Selectați județul"
                  tabIndex={1}
                  autoFocus={true}
                  icon={<MapPinIcon className="h-5 w-5 text-gray-400" />}
                />
                
                <FormField 
                  id="uat" 
                  label="UAT" 
                  name="uat" 
                  value={formData.uat} 
                  onChange={handleChange}
                  placeholder="Unitatea administrativ-teritorială"
                  tabIndex={2}
                  required={true}
                  icon={<BuildingOfficeIcon className="h-5 w-5 text-gray-400" />}
                />
                
                <FormField 
                  id="adresaPrimarie" 
                  label="Adresă Primărie" 
                  name="adresaPrimarie" 
                  value={formData.adresaPrimarie} 
                  onChange={handleChange}
                  rows={4}
                  placeholder="Adresa completă a primăriei"
                  tabIndex={3}
                  required={true}
                />
              </div>
              
              {/* Coloana dreapta */}
              <div className="space-y-4">
                <FormField 
                  id="autorizat" 
                  label="Autorizat" 
                  name="autorizat" 
                  value={formData.autorizat} 
                  onChange={handleChange}
                  placeholder="Numele persoanei autorizate"
                  tabIndex={4}
                  required={true}
                  icon={<UserIcon className="h-5 w-5 text-gray-400" />}
                />
                
                <FormField 
                  id="adresaAutorizat" 
                  label="Adresă Autorizat" 
                  name="adresaAutorizat" 
                  value={formData.adresaAutorizat} 
                  onChange={handleChange}
                  rows={4}
                  placeholder="Adresa persoanei autorizate"
                  tabIndex={5}
                  required={true}
                />
              </div>
            </div>
            
            <div className="flex justify-center mt-8">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center py-2.5 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Se salvează...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    Continuă la formular
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LocationPreselectionForm;