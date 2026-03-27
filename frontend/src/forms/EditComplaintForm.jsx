import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeftIcon,
  CheckIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  IdentificationIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleBottomCenterTextIcon,
  CalendarIcon,
  HashtagIcon,
  MapPinIcon,
  UserGroupIcon,
  PlusIcon,
  XMarkIcon,
  UserPlusIcon
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
  onlyNumbers = false
}) => {
  const isSelect = options !== null;
  const isTextarea = rows !== null;

  const inputClass = `field-input${error ? ' error' : ''}`;

  const handleInputChange = (e) => {
    if (onlyNumbers) {
      const newValue = e.target.value.replace(/[^0-9]/g, '');
      const syntheticEvent = {
        ...e,
        target: { ...e.target, name: e.target.name, value: newValue }
      };
      onChange(syntheticEvent);
    } else {
      onChange(e);
    }
  };

  const commonProps = {
    id, name, value, tabIndex, required, autoFocus, onKeyDown, onBlur,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : undefined
  };

  return (
    <div style={{ marginBottom: 8 }}>
      <label htmlFor={id} className="field-label">
        {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
      </label>

      {isSelect ? (
        <select {...commonProps} onChange={onChange} className={inputClass}>
          <option value="">{placeholder || "Selectați o opțiune"}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </select>
      ) : isTextarea ? (
        <textarea {...commonProps} onChange={onChange} rows={rows} placeholder={placeholder} className={inputClass} />
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
        <p id={`${id}-error`} style={{ marginTop: 2, fontSize: 11, color: 'var(--color-danger)' }} role="alert">{error}</p>
      )}
    </div>
  );
};

// Componentă pentru checkbox
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
            style={{ width: 14, height: 14, accentColor: 'var(--color-primary-600)', cursor: 'pointer' }}
            aria-checked={checked}
          />
          <div className="absolute inset-0 -m-1 rounded opacity-0 group-hover:opacity-10 bg-primary-500 pointer-events-none transition-opacity duration-150"></div>
        </div>
        <span style={{ marginLeft: 6, fontSize: 13, color: 'var(--color-neutral-600)' }}>{label}</span>
      </label>
    </div>
  );
};

// Componentă pentru adăugarea/gestionarea membrilor adiționale
const AddMemberForm = ({ onClose, onAddMember, additionalMembers }) => {
  const [memberData, setMemberData] = useState({
    nume: '',
    prenume: '',
    cnp: '',
    adresaPersonala: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMemberData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
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
      <div className="modal-card" style={{ maxWidth: 800 }}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <UserPlusIcon style={{ width: 16, height: 16 }} />
            Gestionare Membri Adiționale ({additionalMembers.length})
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-400)', display: 'flex' }}>
            <XMarkIcon style={{ width: 16, height: 16 }} />
          </button>
        </div>
        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          <div className="alert alert-info mb-4">
            <InformationCircleIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
            <span><strong>Informație:</strong> Membrii adăugați/modificați vor fi salvați când apăsați "Salvează Modificările".</span>
          </div>
          {additionalMembers.length > 0 && (
            <div className="mb-4">
              <p className="field-label mb-2">Membri existenți ({additionalMembers.length}):</p>
              <div className="space-y-2">
                {additionalMembers.map((member, index) => (
                  <div key={index} className="card" style={{ padding: '10px 12px' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-neutral-500)' }}>Membru {index + 1}</span>
                      <button type="button" onClick={() => handleRemoveMember(index)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex' }}
                        title="Șterge membru">
                        <XMarkIcon style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="field-label">Nume *</label>
                        <input type="text" value={member.nume}
                          onChange={(e) => handleEditMember(index, 'nume', e.target.value)}
                          className="field-input" />
                      </div>
                      <div>
                        <label className="field-label">Prenume *</label>
                        <input type="text" value={member.prenume}
                          onChange={(e) => handleEditMember(index, 'prenume', e.target.value)}
                          className="field-input" />
                      </div>
                      <div>
                        <label className="field-label">CNP * (13 cifre)</label>
                        <input type="text" value={member.cnp} maxLength={13}
                          onChange={(e) => handleEditMember(index, 'cnp', e.target.value.replace(/[^0-9]/g, ''))}
                          className="field-input font-mono" />
                      </div>
                      <div>
                        <label className="field-label">Adresă Personală *</label>
                        <input type="text" value={member.adresaPersonala}
                          onChange={(e) => handleEditMember(index, 'adresaPersonala', e.target.value)}
                          className="field-input" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <p className="section-header" style={{ marginBottom: 8 }}>Adaugă membru nou</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <FormField id="edit-membru-nume" label="Nume" name="nume" value={memberData.nume} onChange={handleChange} required={true} error={errors.nume} placeholder="Introduceți numele" autoFocus={true} />
              <FormField id="edit-membru-prenume" label="Prenume" name="prenume" value={memberData.prenume} onChange={handleChange} required={true} error={errors.prenume} placeholder="Introduceți prenumele" />
              <FormField id="edit-membru-cnp" label="CNP" name="cnp" value={memberData.cnp} onChange={handleChange} required={true} error={errors.cnp} placeholder="Introduceți CNP-ul (13 cifre)" onlyNumbers={true} />
              <FormField id="edit-membru-adresa" label="Adresă Personală" name="adresaPersonala" value={memberData.adresaPersonala} onChange={handleChange} required={true} error={errors.adresaPersonala} placeholder="Introduceți adresa personală" />
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-outline btn-sm">
                <PlusIcon style={{ width: 13, height: 13 }} />
                Adaugă Membru
              </button>
              <button type="button" onClick={onClose} className="btn btn-primary btn-sm">
                <CheckIcon style={{ width: 13, height: 13 }} />
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
  <div className="flex items-center gap-1.5 mb-2">
    <Icon style={{ width: 14, height: 14, color: 'var(--color-primary-500)', flexShrink: 0 }} />
    <p className="section-header" style={{ margin: 0 }}>{title}</p>
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
    sectorCadastral: '',
    numarContract: '',
    numarDecizieDirector: '',
    adresaPrimarie: '',
    autorizat: '',
    adresaAutorizat: '',
    idImobil: '',
    documenteAtasate: '',
    verificatTeren: false,
    admis: false,
    respins: false,
    status: ''
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [locked, setLocked] = useState(false);
  const [additionalMembers, setAdditionalMembers] = useState([]);
  const [showMemberForm, setShowMemberForm] = useState(false);

  const formatDate = (dateString, fallback = '') => {
    if (!dateString || dateString === '0000-00-00') return fallback;
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return fallback;
      d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch (error) {
      return fallback;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const contestatieResponse = await axios.get(`/contestatii/${id}`);

        try {
          const membersResponse = await axios.get(`/contestatii/${id}/members`);
          if (membersResponse.data && Array.isArray(membersResponse.data)) {
            setAdditionalMembers(membersResponse.data);
          }
        } catch (membersErr) {
          console.warn('Nu s-au putut încărca membrii adiționale:', membersErr);
        }

        setFormData(prev => ({
          ...prev,
          ...contestatieResponse.data,
          numarProcesVerbal: contestatieResponse.data.numar_proces_verbal || '',
          dataProcesVerbal: formatDate(contestatieResponse.data.data_proces_verbal, ''),
          numarCerere: contestatieResponse.data.numar_cerere || '',
          dataCerere: formatDate(contestatieResponse.data.data_cerere, ''),
          dataAleasa: formatDate(contestatieResponse.data.data_aleasa, ''),
          adresaPersonala: contestatieResponse.data.adresa_personala || '',
          uat: contestatieResponse.data.uat || '',
          sectorCadastral: contestatieResponse.data.sector_cadastral || '',
          numarContract: contestatieResponse.data.numar_contract || '',
          numarDecizieDirector: contestatieResponse.data.numar_decizie_director || '',
          adresaPrimarie: contestatieResponse.data.adresa_primarie || '',
          autorizat: contestatieResponse.data.autorizat || '',
          adresaAutorizat: contestatieResponse.data.adresa_autorizat || '',
          adresaImobil: contestatieResponse.data.adresa || '',
          idImobil: contestatieResponse.data.id_imobil || '',
          documenteAtasate: contestatieResponse.data.documente_atasate || '',
          verificatTeren: Boolean(contestatieResponse.data.verificat_teren),
          admis: Boolean(contestatieResponse.data.admis),
          respins: Boolean(contestatieResponse.data.respins),
          status: contestatieResponse.data.admis ? 'admis' : (contestatieResponse.data.respins ? 'respins' : '')
        }));
        setLocked(!!contestatieResponse.data.locked);
      } catch (error) {
        setError('Nu s-au putut încărca datele contestației');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    if (name === 'admis' && checked) {
      setFormData(prev => ({ ...prev, admis: true, respins: false }));
    } else if (name === 'respins' && checked) {
      setFormData(prev => ({ ...prev, admis: false, respins: true }));
    } else {
      setFormData(prev => ({ ...prev, [name]: checked }));
    }
  };

  const handleDecizieChange = (e) => {
    const digits = e.target.value.replace(/[^0-9]/g, '');
    let formatted = '';
    if (digits.length <= 3) {
      formatted = digits;
    } else if (digits.length <= 5) {
      formatted = digits.slice(0, 3) + '/' + digits.slice(3);
    } else if (digits.length <= 7) {
      formatted = digits.slice(0, 3) + '/' + digits.slice(3, 5) + '.' + digits.slice(5);
    } else {
      formatted = digits.slice(0, 3) + '/' + digits.slice(3, 5) + '.' + digits.slice(5, 7) + '.' + digits.slice(7, 11);
    }
    setFormData(prev => ({ ...prev, numarDecizieDirector: formatted }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const dataToSubmit = {
        ...formData,
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
        admis: formData.status === 'admis' ? 1 : 0,
        respins: formData.status === 'respins' ? 1 : 0,
        sector_cadastral: formData.sectorCadastral,
        numar_contract: formData.numarContract,
        numar_decizie_director: formData.numarDecizieDirector,
        additionalMembers
      };

      await axios.put(`/contestatii/${id}`, dataToSubmit);
      setSuccess('Contestația a fost actualizată cu succes!');

      setTimeout(() => {
        navigate('/dashboard/filter-contestatii');
      }, 2000);
    } catch (error) {
      setError('Nu s-a putut actualiza contestația');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full" style={{ minHeight: '50vh' }}>
        <div className="animate-spin rounded-full" style={{ width: 32, height: 32, borderWidth: 2, borderStyle: 'solid', borderColor: 'var(--color-neutral-100)', borderTopColor: 'var(--color-primary-600)' }}></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header cu buton înapoi */}
      <div className="flex items-center mb-3" style={{ gap: 10 }}>
        <button
          onClick={() => navigate('/dashboard/filter-contestatii')}
          style={{ background: 'none', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '4px 6px', display: 'flex', color: 'var(--color-neutral-500)' }}
          aria-label="Înapoi la lista de contestații"
        >
          <ArrowLeftIcon style={{ width: 14, height: 14 }} />
        </button>
        <h1 className="page-title">Editare Contestație {formData.numar_contestatie}</h1>
      </div>

      {/* Mesaje de eroare/succes */}
      {error && (
        <div className="alert alert-danger mb-3">
          <ExclamationCircleIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-3">
          <CheckCircleIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
          <span>{success}</span>
        </div>
      )}

      {/* Banner compact locație */}
      <div className="mb-3">
        <div className="card" style={{ padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <InformationCircleIcon style={{ width: 13, height: 13, color: 'var(--color-primary-500)', flexShrink: 0 }} />
          <div className="flex items-center gap-3 flex-wrap" style={{ fontSize: 11, color: 'var(--color-neutral-500)', flex: 1 }}>
            <span><strong>Județ:</strong> {ROMANIAN_COUNTIES.find(c => c.id === formData.regiune)?.name || '—'}</span>
            <span style={{ color: 'var(--color-neutral-300)' }}>|</span>
            <span><strong>UAT:</strong> {formData.uat || '—'}</span>
            <span style={{ color: 'var(--color-neutral-300)' }}>|</span>
            <span><strong>Prestator:</strong> {formData.autorizat || '—'}</span>
            <span style={{ color: 'var(--color-neutral-300)' }}>|</span>
            <span><strong>Contract:</strong> {formData.numarContract || '—'}</span>
          </div>
        </div>
      </div>

      {/* Banner blocare */}
      {locked && (
        <div className="mb-3 flex items-center gap-2 px-4 py-3 rounded" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}>
          <svg style={{ width: 16, height: 16, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600 }}>⚠️ Această contestație este blocată și nu poate fi editată. Puteți doar vizualiza datele.</span>
        </div>
      )}

      {/* Formular principal — un singur card compact */}
      <div className="card mb-3" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Antet */}
        <div style={{ backgroundColor: 'var(--surface-secondary)', padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="flex items-center gap-1.5">
            <ClipboardDocumentCheckIcon style={{ width: 13, height: 13, color: 'var(--color-primary-500)' }} />
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-neutral-700)', margin: 0 }}>Formular de Contestație</p>
          </div>
          <div className="flex items-center" style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div className="flex items-center" style={{ padding: '0 8px', height: 28 }}>
              <CalendarIcon style={{ width: 12, height: 12, color: 'var(--color-primary-500)', marginRight: 5 }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-neutral-500)' }}>Data:</span>
            </div>
            <input
              id="dataAleasa" name="dataAleasa" type="date"
              value={formData.dataAleasa} onChange={handleChange}
              style={{ height: 28, padding: '0 8px', background: 'none', border: 'none', borderLeft: '1px solid var(--border-default)', color: 'var(--color-neutral-800)', fontSize: 12, outline: 'none' }}
              tabIndex={1}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '18px 20px' }}>
          <fieldset disabled={locked} style={{ border: 'none', padding: 0, margin: 0 }}>

          {/* ── SECȚIUNEA 1: DATE PERSONALE ── */}
          <div style={{ marginBottom: 20 }}>
            <p className="section-header">Date Personale</p>
            {/* Rândul 1: Nume | Prenume | CNP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <FormField
                id="nume" label="Nume" name="nume" value={formData.nume}
                onChange={handleChange} required={true} placeholder="Introduceți numele" tabIndex={2}
              />
              <FormField
                id="prenume" label="Prenume" name="prenume" value={formData.prenume}
                onChange={handleChange} required={true} placeholder="Introduceți prenumele" tabIndex={3}
              />
              <FormField
                id="cnp" label="CNP" name="cnp" value={formData.cnp}
                onChange={handleChange} required={true} placeholder="13 cifre"
                tabIndex={4} onlyNumbers={true}
                onBlur={(e) => {
                  if (e.target.value && !/^\d{13}$/.test(e.target.value)) {
                    alert('CNP-ul trebuie să conțină exact 13 cifre');
                  }
                }}
              />
            </div>
            {/* Rândul 2: Adresă — full-width */}
            <FormField
              id="adresaPersonala" label="Adresă Personală" name="adresaPersonala" value={formData.adresaPersonala}
              onChange={handleChange} required={true} placeholder="Strada, număr, bloc, scara, etaj, apartament, localitate, județ" tabIndex={5}
            />
          </div>

          {/* ── SECȚIUNEA 2: INFORMAȚII PROCES VERBAL ── */}
          <div style={{ marginBottom: 20 }}>
            <p className="section-header">Informații Proces Verbal</p>
            {/* Rândul 1: Nr PV + Data PV | Nr Cerere + Data Cerere */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <FormField
                id="numarProcesVerbal" label="Nr. Proces Verbal" name="numarProcesVerbal"
                value={formData.numarProcesVerbal} onChange={handleChange} placeholder="Numărul" tabIndex={6} onlyNumbers={true}
              />
              <FormField
                id="dataProcesVerbal" label="Data Proces Verbal" name="dataProcesVerbal"
                type="date" value={formData.dataProcesVerbal} onChange={handleChange} tabIndex={7}
              />
              <FormField
                id="numarCerere" label="Nr. Cerere" name="numarCerere"
                value={formData.numarCerere} onChange={handleChange} placeholder="Numărul" tabIndex={8} onlyNumbers={true}
              />
              <FormField
                id="dataCerere" label="Data Cerere" name="dataCerere"
                type="date" value={formData.dataCerere} onChange={handleChange} tabIndex={9}
              />
            </div>
            {/* Rândul 2: ID Imobil (1/3) + Adresă Imobil (2/3) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FormField
                id="idImobil" label="ID Imobil" name="idImobil" value={formData.idImobil}
                onChange={handleChange} placeholder="Identificator imobil" tabIndex={10} onlyNumbers={true}
              />
              <div className="md:col-span-2">
                <FormField
                  id="adresaImobil" label="Adresă Imobil" name="adresaImobil" value={formData.adresaImobil}
                  onChange={handleChange} placeholder="Adresa completă a imobilului" tabIndex={11}
                />
              </div>
            </div>
          </div>

          {/* ── SECȚIUNEA 3: DECIZIE & CONFIGURAȚIE ── */}
          <div style={{ marginBottom: 20 }}>
            <p className="section-header">Decizie & Configurație</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div>
                <label htmlFor="status" className="field-label">Status decizie</label>
                <select id="status" name="status" value={formData.status} onChange={handleChange} tabIndex={12} className="field-input">
                  <option value="">— În așteptare —</option>
                  <option value="admis">✅ Admis</option>
                  <option value="respins">❌ Respins</option>
                </select>
              </div>
              <div>
                <label htmlFor="sectorCadastral" className="field-label">Sector Cadastral <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input id="sectorCadastral" name="sectorCadastral" type="number" value={formData.sectorCadastral} onChange={handleChange} placeholder="Ex: 34" required className="field-input" tabIndex={13} />
              </div>
              <div>
                <label htmlFor="numarContract" className="field-label">Nr. Contract <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input id="numarContract" name="numarContract" type="text" value={formData.numarContract} onChange={handleChange} placeholder="Ex: 12345" required className="field-input" tabIndex={14} />
              </div>
              <div>
                <label htmlFor="numarDecizieDirector" className="field-label">Nr. Decizie Director <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input id="numarDecizieDirector" name="numarDecizieDirector" type="text" value={formData.numarDecizieDirector} onChange={handleDecizieChange} placeholder="123/01.01.2000" maxLength={25} required className="field-input" tabIndex={15} />
              </div>
            </div>
            <FormCheckbox id="verificatTeren" name="verificatTeren" label="Verificat în teren" checked={formData.verificatTeren} onChange={handleCheckboxChange} tabIndex={16} />
          </div>

          {/* ── SECȚIUNEA 4: DOCUMENTE & OBSERVAȚII ── */}
          <div style={{ marginBottom: 14 }}>
            <p className="section-header">Documente & Observații</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                id="documenteAtasate" label="Documente Atașate" name="documenteAtasate"
                value={formData.documenteAtasate} onChange={handleChange} rows={3}
                placeholder="Enumerați documentele atașate" tabIndex={17}
              />
              <FormField
                id="observatii" label="Observații" name="observatii"
                value={formData.observatii} onChange={handleChange} rows={3}
                placeholder="Adăugați observații relevante" tabIndex={18}
              />
            </div>
          </div>

          {/* ── MEMBRI ADIȚIONALE ── */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 10, paddingTop: 10 }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <UserGroupIcon style={{ width: 13, height: 13, color: 'var(--color-primary-500)' }} />
                <p className="section-header" style={{ margin: 0 }}>Membri Adiționale</p>
                {additionalMembers.length > 0 && (
                  <span className="badge badge-info">
                    {additionalMembers.length} {additionalMembers.length === 1 ? 'membru' : 'membri'}
                  </span>
                )}
              </div>
              <button type="button" onClick={() => setShowMemberForm(true)} className="btn btn-outline btn-sm">
                <PlusIcon style={{ width: 12, height: 12 }} />
                {additionalMembers.length > 0 ? 'Gestionează' : 'Adaugă'}
              </button>
            </div>
            {additionalMembers.length > 0 && (
              <div className="space-y-1.5">
                {additionalMembers.map((member, index) => (
                  <div key={index} className="flex items-center justify-between" style={{ background: 'var(--surface-secondary)', padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-neutral-700)' }}>
                        {index + 1}. {member.nume} {member.prenume}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-neutral-400)', marginLeft: 8 }}>CNP: {member.cnp}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--color-neutral-400)' }}>{member.adresaPersonala}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── BUTOANE ── */}
          </fieldset>
          <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 12, paddingTop: 12, display: 'flex', gap: 8 }}>
            {!locked && (
              <button
                id="submit-button"
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                tabIndex={19}
                aria-busy={submitting}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Se procesează...
                  </>
                ) : (
                  <>
                    <CheckIcon style={{ width: 14, height: 14 }} aria-hidden="true" />
                    Salvează Modificările
                  </>
                )}
              </button>
            )}
            <button type="button" onClick={() => navigate('/dashboard/filter-contestatii')} className="btn btn-outline" tabIndex={20}>
              {locked ? 'Înapoi' : 'Anulează'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal Membri Adiționale */}
      {showMemberForm && (
        <AddMemberForm
          onClose={() => setShowMemberForm(false)}
          onAddMember={(newMember, updatedList) => {
            if (updatedList !== undefined) {
              setAdditionalMembers(updatedList);
            } else if (newMember) {
              setAdditionalMembers(prev => [...prev, newMember]);
            }
          }}
          additionalMembers={additionalMembers}
        />
      )}
    </div>
  );
}

export default EditComplaintForm;