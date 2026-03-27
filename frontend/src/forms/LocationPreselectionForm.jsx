import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowRightIcon, ExclamationCircleIcon, MapPinIcon, BuildingOfficeIcon,
  UserIcon, UserGroupIcon, ArrowPathIcon, XMarkIcon, PlusIcon, InformationCircleIcon, HashtagIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { ROMANIAN_COUNTIES } from '../constants/romanianCounties';
import { ROMANIAN_UATS } from '../constants/romanianUATs';

const FormField = ({ id, label, name, value, onChange, type = "text", required = false,
  error, placeholder = "", options = null, rows = null, tabIndex, autoFocus = false, icon = null, disabled = false }) => {
  const isSelect = options !== null;
  const isTextarea = rows !== null;
  const inputClass = `field-input${error ? ' error' : ''}${disabled ? ' opacity-60' : ''}`;

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
      </label>
      <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">{icon}</div>}
        {isSelect ? (
          <select id={id} name={name} value={value} onChange={onChange} className={inputClass} required={required} tabIndex={tabIndex} autoFocus={autoFocus} disabled={disabled}>
            <option value="">{placeholder || "Selectați"}</option>
            {options.map(o => <option key={o.id} value={o.id}>{o.name}{o.type ? ` (${o.type})` : ''}</option>)}
          </select>
        ) : isTextarea ? (
          <textarea id={id} name={name} value={value} onChange={onChange} rows={rows} placeholder={placeholder} className={inputClass} required={required} tabIndex={tabIndex} disabled={disabled} />
        ) : (
          <input id={id} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} className={inputClass} required={required} tabIndex={tabIndex} autoFocus={autoFocus} disabled={disabled} />
        )}
      </div>
      {error && <p style={{ marginTop: 2, fontSize: 11, color: 'var(--color-danger)' }}>{error}</p>}
    </div>
  );
};

const FUNCTII_OPTIONS = [
  'Consilier Cadastru',
  'Asistent registrator principal',
  'Registrator de carte funciară',
  'Șef serviciu SIS',
  'Reprezentant al primăriei',
  'Reprezentant al prestatorului',
];

const CommissionMember = ({ index, member, onChange, onRemove, canRemove, onSignatureUpload }) => (
  <div className="card" style={{ padding: '10px 12px', position: 'relative' }}>
    <div style={{ position: 'absolute', top: -8, left: -8, width: 18, height: 18, backgroundColor: 'var(--color-primary-600)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
      {index + 1}
    </div>
    {canRemove && (
      <button type="button" onClick={() => onRemove(index)}
        style={{ position: 'absolute', top: -8, right: -8, width: 18, height: 18, backgroundColor: 'var(--color-danger)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
        <XMarkIcon style={{ width: 10, height: 10 }} />
      </button>
    )}
    <div className="space-y-1.5" style={{ marginTop: 4 }}>
      <input type="text" value={member.name} onChange={(e) => onChange(index, 'name', e.target.value)}
        placeholder="Nume complet" className="field-input" />
      <select value={member.role} onChange={(e) => onChange(index, 'role', e.target.value)} className="field-input">
        <option value="">Funcție</option>
        <option value="Președinte">Președinte</option>
        <option value="Secretar">Secretar</option>
        <option value="Membru">Membru</option>
        <option value="Membru Supleant">Membru Supleant</option>
      </select>
      <select value={member.functie || ''} onChange={(e) => onChange(index, 'functie', e.target.value)} className="field-input">
        <option value="">Selectează funcția...</option>
        {FUNCTII_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
      </select>
      {/* Semnătură upload */}
      {(member.signaturePreview || member.signaturePath) ? (
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'var(--surface-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <img
            src={member.signaturePreview || `http://${window.location.hostname}:8082${member.signaturePath}`}
            alt="Semnătură"
            style={{ height: 36, maxWidth: 110, objectFit: 'contain', background: 'white', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0 4px' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <label style={{ fontSize: 10, color: 'var(--color-primary-500)', cursor: 'pointer' }}>
              Schimbă
              <input type="file" accept="image/png,image/jpeg" style={{ display: 'none' }}
                onChange={(e) => e.target.files[0] && onSignatureUpload(index, e.target.files[0])} />
            </label>
            <button type="button"
              onClick={() => { onChange(index, 'signaturePath', ''); onChange(index, 'signaturePreview', ''); }}
              style={{ fontSize: 10, color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
              Șterge
            </button>
          </div>
        </div>
      ) : (
        <label style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, color: 'var(--color-neutral-400)', border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '6px 8px' }}>
          <DocumentTextIcon style={{ width: 12, height: 12, flexShrink: 0 }} />
          <span>Adaugă semnătură (PNG/JPG)</span>
          <input type="file" accept="image/png,image/jpeg" style={{ display: 'none' }}
            onChange={(e) => e.target.files[0] && onSignatureUpload(index, e.target.files[0])} />
        </label>
      )}
    </div>
  </div>
);

const DEFAULT_MEMBERS = [
  { name: 'Luminița Pușchiază', role: 'Președinte', functie: 'Registrator de carte funciară', signaturePath: '', signaturePreview: '' },
  { name: 'Diana Andreea Nedu', role: 'Membru', functie: 'Asistent registrator principal', signaturePath: '', signaturePreview: '' },
  { name: 'Lavinia Marcu', role: 'Membru', functie: 'Asistent registrator principal', signaturePath: '', signaturePreview: '' },
  { name: 'Cristina Pașa', role: 'Membru', functie: 'Consilier Cadastru', signaturePath: '', signaturePreview: '' },
  { name: 'Alina Suciu', role: 'Membru', functie: 'Consilier Cadastru', signaturePath: '', signaturePreview: '' },
  { name: 'Silvia Ștefan', role: 'Membru', functie: 'Reprezentant al primăriei', signaturePath: '', signaturePreview: '' },
  { name: '', role: 'Membru', functie: 'Reprezentant al prestatorului', signaturePath: '', signaturePreview: '' }
];

function LocationPreselectionForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(() => {
    const defaults = {
      regiune: '',
      uat: '',
      sectorCadastral: '',
      adresaPrimarie: '',
      autorizat: '',
      numarContract: '',
      numarDecizieDirector: '',
      adresaAutorizat: ''
    };
    try {
      const saved = sessionStorage.getItem('locationFormData');
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch (e) { return defaults; }
  });
  const [commissionMembers, setCommissionMembers] = useState(() => {
    try {
      const saved = sessionStorage.getItem('commissionMembers');
      return saved ? JSON.parse(saved) : DEFAULT_MEMBERS;
    } catch (e) { return DEFAULT_MEMBERS; }
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Forțează resetare la noile defaults (o singură dată per versiune)
  useEffect(() => {
    const MEMBERS_VERSION = 'v3';
    if (sessionStorage.getItem('membersVersion') !== MEMBERS_VERSION) {
      sessionStorage.removeItem('commissionMembers');
      sessionStorage.setItem('membersVersion', MEMBERS_VERSION);
      setCommissionMembers([...DEFAULT_MEMBERS]);
    }
  }, []);

  // LISTĂ UAT-uri filtrate după județul selectat
  const availableUATs = useMemo(() => {
    console.log('🔍 useMemo triggered');
    console.log('📍 Județ selectat:', formData.regiune);

    if (!formData.regiune) {
      console.log('⚠️ NU există județ selectat');
      return [];
    }

    const uats = ROMANIAN_UATS[formData.regiune] || [];
    console.log(`✅ UAT-uri pentru ${formData.regiune}:`, uats.length);

    if (uats.length > 0) {
      console.log('📝 Primele 3 UAT-uri:', uats.slice(0, 3));
    }

    return uats;
  }, [formData.regiune]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    console.log(`📝 handleChange: ${name} = "${value}"`);

    // Dacă schimbi județul, resetează UAT-ul
    if (name === 'regiune') {
      setFormData(prev => {
        const updated = { ...prev, regiune: value, uat: '' };
        sessionStorage.setItem('locationFormData', JSON.stringify(updated));
        return updated;
      });
    } else {
      setFormData(prev => {
        const updated = { ...prev, [name]: value };
        sessionStorage.setItem('locationFormData', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleDecizieChange = (e) => {
    const input = e.target;
    const rawInput = e.target.value;

    // Extrage doar cifrele din input
    const digits = rawInput.replace(/[^0-9]/g, '');

    // Limitează la maxim 11 cifre (3 nr + 2 zi + 2 luna + 4 an)
    const limited = digits.slice(0, 11);

    // Construiește valoarea formatată
    let formatted = '';
    for (let i = 0; i < limited.length; i++) {
      if (i === 3) formatted += '/';
      if (i === 5) formatted += '.';
      if (i === 7) formatted += '.';
      formatted += limited[i];
    }

    // Calculează noua poziție a cursorului
    const oldCursor = input.selectionStart;
    const oldDigitsBeforeCursor = rawInput.slice(0, oldCursor).replace(/[^0-9]/g, '').length;

    // Găsește poziția în string-ul formatat care corespunde aceluiași număr de cifre
    let newCursor = formatted.length;
    let digitCount = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (digitCount === oldDigitsBeforeCursor) {
        newCursor = i;
        break;
      }
      if (/\d/.test(formatted[i])) {
        digitCount++;
      }
    }

    setFormData(prev => {
      const updated = { ...prev, numarDecizieDirector: formatted };
      sessionStorage.setItem('locationFormData', JSON.stringify(updated));
      return updated;
    });

    // Restaurează cursorul după ce React actualizează DOM-ul
    requestAnimationFrame(() => {
      input.setSelectionRange(newCursor, newCursor);
    });
  };

  const handleCommissionMemberChange = (index, field, value) => {
    setCommissionMembers(prev => {
      const updated = prev.map((m, i) => i === index ? { ...m, [field]: value } : m);
      sessionStorage.setItem('commissionMembers', JSON.stringify(updated));
      return updated;
    });
  };

  const addCommissionMember = () => setCommissionMembers(prev => {
    const updated = [...prev, { name: '', role: 'Membru', functie: '', signaturePath: '', signaturePreview: '' }];
    sessionStorage.setItem('commissionMembers', JSON.stringify(updated));
    return updated;
  });
  const removeCommissionMember = (index) => commissionMembers.length > 1 && setCommissionMembers(prev => {
    const updated = prev.filter((_, i) => i !== index);
    sessionStorage.setItem('commissionMembers', JSON.stringify(updated));
    return updated;
  });
  const handleResetMembers = () => {
    setCommissionMembers([...DEFAULT_MEMBERS]);
    sessionStorage.removeItem('commissionMembers');
  };

  const handleSignatureUpload = async (index, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setCommissionMembers(prev => prev.map((m, i) => i === index ? { ...m, signaturePreview: preview } : m));
    try {
      const formData = new FormData();
      formData.append('signature', file);
      const res = await axios.post('/upload-signature', formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCommissionMembers(prev => prev.map((m, i) => i === index ? { ...m, signaturePath: res.data.signaturePath } : m));
    } catch (err) {
      console.error('Eroare upload semnătură:', err);
      setCommissionMembers(prev => prev.map((m, i) => i === index ? { ...m, signaturePreview: '' } : m));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    const newFieldErrors = {};

    if (!formData.numarDecizieDirector || !formData.numarDecizieDirector.trim()) {
      newFieldErrors.numarDecizieDirector = 'Numărul deciziei directorului este obligatoriu';
    } else {
      const decizieRegex = /^\d{1,3}\/\d{2}\.\d{2}\.\d{4}$/;
      if (!decizieRegex.test(formData.numarDecizieDirector.trim())) {
        newFieldErrors.numarDecizieDirector = 'Completați formatul complet: NNN/ZZ.LL.AAAA (ex: 123/01.01.2000)';
      } else {
        const parts = formData.numarDecizieDirector.split('/');
        const dateParts = parts[1].split('.');
        const zi = parseInt(dateParts[0]);
        const luna = parseInt(dateParts[1]);
        const an = parseInt(dateParts[2]);
        if (zi < 1 || zi > 31) newFieldErrors.numarDecizieDirector = 'Ziua trebuie să fie între 01 și 31';
        else if (luna < 1 || luna > 12) newFieldErrors.numarDecizieDirector = 'Luna trebuie să fie între 01 și 12';
        else if (an < 1900 || an > 2099) newFieldErrors.numarDecizieDirector = 'Anul trebuie să fie între 1900 și 2099';
      }
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setLoading(false);
      return;
    }

    try {
      if (!formData.regiune || !formData.uat || !formData.adresaPrimarie || !formData.autorizat || !formData.numarContract || !formData.adresaAutorizat) {
        throw new Error('Toate câmpurile obligatorii trebuie completate');
      }

      const dataToSave = {
        ...formData,
        commissionMembers: commissionMembers
          .filter(m => m.name.trim())
          .map(({ signaturePreview, ...m }) => m)
      };

      console.log('📤 Date salvate:', dataToSave);

      sessionStorage.setItem('locationData', JSON.stringify(dataToSave));
      const response = await axios.post('/location-preselection', dataToSave);

      if (response.data.status === 'success') {
        navigate('/dashboard/contestatii-form', { state: { locationId: response.data.id } });
      } else {
        throw new Error('Eroare salvare');
      }
    } catch (err) {
      setError(err.message || 'Eroare la salvare');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-10">
      <div className="mb-4">
        <h1 className="page-title">Adaugă Contract</h1>
        <p className="page-subtitle" style={{ marginTop: 2 }}>Completați datele contractului pentru procesul-verbal</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ backgroundColor: 'var(--color-neutral-800)', padding: '12px 20px' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Formular Date Locație</p>
          <p style={{ fontSize: 12, color: 'var(--color-neutral-300)', marginTop: 2 }}>Preselecție informații pentru procesul-verbal</p>
        </div>

        <div style={{ padding: 20 }}>
          {error && (
            <div className="alert alert-danger mb-4">
              <ExclamationCircleIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="card" style={{ padding: '14px 16px' }}>
              <div className="flex items-center gap-1.5 mb-3">
                <MapPinIcon style={{ width: 14, height: 14, color: 'var(--color-primary-500)' }} />
                <p className="section-header" style={{ margin: 0 }}>Informații Locație</p>
              </div>
              {/* Row 1: Județ | UAT | Sector Cadastral */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
                <div className="lg:col-span-2">
                  <FormField
                    id="regiune" label="Județ" name="regiune"
                    value={formData.regiune} onChange={handleChange}
                    required options={ROMANIAN_COUNTIES}
                    placeholder="Selectați județul" tabIndex={1} autoFocus
                  />
                </div>
                <div className="lg:col-span-2">
                  <FormField
                    id="uat" label="UAT (Localitate)" name="uat"
                    value={formData.uat} onChange={handleChange}
                    required options={availableUATs}
                    placeholder={formData.regiune ? `Selectați UAT (${availableUATs.length} disponibile)` : 'Selectați mai întâi județul'}
                    tabIndex={2} disabled={!formData.regiune}
                  />
                </div>
                <FormField
                  id="sectorCadastral" label="Sector Cadastral" name="sectorCadastral"
                  type="number" value={formData.sectorCadastral} onChange={handleChange}
                  placeholder="Ex: 34" tabIndex={3}
                />
                <FormField
                  id="autorizat" label="Prestator" name="autorizat"
                  value={formData.autorizat} onChange={handleChange}
                  placeholder="Denumire prestator" tabIndex={4} required
                />
              </div>
              {/* Row 2: Nr Contract | Nr Decizie | Adresă Prestator | Adresă Primărie */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <FormField
                  id="numarContract" label="Număr Contract" name="numarContract"
                  value={formData.numarContract} onChange={handleChange}
                  placeholder="Ex: 12345" tabIndex={5} required
                />
                <div>
                  <label htmlFor="numarDecizieDirector" className="field-label">
                    Număr Decizie Director <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    id="numarDecizieDirector" name="numarDecizieDirector" type="text"
                    value={formData.numarDecizieDirector} onChange={handleDecizieChange}
                    placeholder="123/01.01.2000" maxLength={14} required
                    tabIndex={6} className={`field-input${fieldErrors.numarDecizieDirector ? ' error' : ''}`}
                  />
                  {fieldErrors.numarDecizieDirector && (
                    <p style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 3 }} role="alert">{fieldErrors.numarDecizieDirector}</p>
                  )}
                </div>
                <FormField
                  id="adresaAutorizat" label="Adresă Prestator" name="adresaAutorizat"
                  value={formData.adresaAutorizat} onChange={handleChange}
                  placeholder="Adresa prestatorului" tabIndex={7} required
                />
                <FormField
                  id="adresaPrimarie" label="Adresă Primărie" name="adresaPrimarie"
                  value={formData.adresaPrimarie} onChange={handleChange}
                  placeholder="Adresa completă a primăriei" tabIndex={8} required
                />
              </div>
            </div>

            <div className="card" style={{ padding: '12px 14px' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <UserGroupIcon style={{ width: 14, height: 14, color: 'var(--color-primary-500)' }} />
                  <p className="section-header" style={{ margin: 0 }}>Membrii Comisiei</p>
                  <span style={{ fontSize: 11, color: 'var(--color-neutral-400)' }}>({commissionMembers.length})</span>
                </div>
                <button type="button" onClick={handleResetMembers} className="btn btn-ghost btn-sm">
                  <ArrowPathIcon style={{ width: 12, height: 12 }} />
                  Resetează
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                {commissionMembers.map((member, i) => (
                  <CommissionMember
                    key={i}
                    index={i}
                    member={member}
                    onChange={handleCommissionMemberChange}
                    onRemove={removeCommissionMember}
                    canRemove={commissionMembers.length > 1}
                    onSignatureUpload={handleSignatureUpload}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between" style={{ paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 11, color: 'var(--color-neutral-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <InformationCircleIcon style={{ width: 12, height: 12, color: 'var(--color-neutral-300)' }} />
                  Membrii apar în procesul-verbal
                </p>
                <button type="button" onClick={addCommissionMember} className="btn btn-outline btn-sm">
                  <PlusIcon style={{ width: 12, height: 12 }} />
                  Adaugă
                </button>
              </div>
            </div>

            <div className="flex justify-end" style={{ paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? (
                  <>
                    <svg className="animate-spin" style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Se salvează...
                  </>
                ) : (
                  <>
                    Continuă la formular
                    <ArrowRightIcon style={{ width: 14, height: 14 }} />
                  </>
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