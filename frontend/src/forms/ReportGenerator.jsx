import React, { useState, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ArchiveBoxArrowDownIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { ROMANIAN_COUNTIES } from '../constants/romanianCounties';
import { ROMANIAN_UATS } from '../constants/romanianUATs';

const API = '';

// Spinner inline
const Spinner = () => (
  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// Format date DD.MM.YYYY
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
  return d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Status badge
const StatusBadge = ({ admis, respins }) => {
  if (admis) return (
    <span className="badge badge-success">
      <CheckCircleIcon style={{ width: 10, height: 10 }} /> Admis
    </span>
  );
  if (respins) return (
    <span className="badge badge-danger">
      <XCircleIcon style={{ width: 10, height: 10 }} /> Respins
    </span>
  );
  return (
    <span className="badge badge-warning">
      ⏳ În așteptare
    </span>
  );
};

// Sort icon
const SortIcon = ({ col, sortBy, sortOrder }) => {
  if (sortBy !== col) return <span style={{ marginLeft: 4, color: 'var(--color-neutral-300)' }}>↕</span>;
  return <span style={{ marginLeft: 4, color: 'var(--color-primary-600)' }}>{sortOrder === 'ASC' ? '↑' : '↓'}</span>;
};

const LIMITS = [10, 25, 50];

// Shared input class for filter fields
const filterInputClass = "field-input";
const filterLabelClass = "field-label";

function ReportGenerator() {
  const [name] = useOutletContext();

  // ── Filters ────────────────────────────────────────────────────
  const [primary, setPrimary] = useState({
    numar_contestatie: '',
    nume: '',
    prenume: '',
    cnp: '',
    judet: '',
    uat: '',
    numar_contract: '',
    id_imobil: '',
    status: '',
    verificat_teren: '',
    data_inceput: '',
    data_sfarsit: '',
  });

  // ── Results ────────────────────────────────────────────────────
  const [results, setResults] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [summary, setSummary] = useState({ total: 0, admis: 0, respins: 0 });
  const [sortBy, setSortBy] = useState('numar_contestatie');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [limitPer, setLimitPer] = useState(10);

  // ── Selection ──────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Loading / errors ───────────────────────────────────────────
  const [filterLoading, setFilterLoading] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);
  const [downloadAllLoading, setDownloadAllLoading] = useState(false);
  const [downloadSelLoading, setDownloadSelLoading] = useState(false);
  const [downloadUnsignedLoading, setDownloadUnsignedLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [fullExcelLoading, setFullExcelLoading] = useState(false);
  const [codTrimitere, setCodTrimitere] = useState('');
  const [greutate, setGreutate] = useState('0.1');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ── Helpers ────────────────────────────────────────────────────
  const buildFilters = () => ({ ...primary });

  const availableUATs = useMemo(() => {
    if (!primary.judet) return [];
    return ROMANIAN_UATS[primary.judet] || [];
  }, [primary.judet]);

  const handlePrimaryChange = (e) => {
    const { name, value } = e.target;
    if (name === 'judet') {
      setPrimary(p => ({ ...p, judet: value, uat: '' }));
    } else {
      setPrimary(p => ({ ...p, [name]: value }));
    }
  };

  // ── Filter / fetch ─────────────────────────────────────────────
  const doFilter = useCallback(async (pageNum = 1, newSortBy = sortBy, newSortOrder = sortOrder, newLimit = limitPer) => { // eslint-disable-line
    setFilterLoading(true);
    setError('');
    setSelectedIds(new Set());

    try {
      const res = await axios.post(`${API}/reports/filter`, {
        ...buildFilters(),
        page: pageNum,
        limit: newLimit,
        sort_by: newSortBy,
        sort_order: newSortOrder,
      }, { withCredentials: true });

      setResults(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, page: 1, limit: newLimit, totalPages: 1 });
      setSummary(res.data.summary || { total: 0, admis: 0, respins: 0 });
    } catch (err) {
      setError('Eroare la filtrarea contestațiilor. Verificați conexiunea la server.');
      setResults([]);
    } finally {
      setFilterLoading(false);
    }
  }, [primary, sortBy, sortOrder, limitPer]); // eslint-disable-line

  const handleFilter = (e) => {
    e && e.preventDefault();
    doFilter(1, sortBy, sortOrder, limitPer);
  };

  const handleReset = () => {
    setPrimary({ numar_contestatie: '', nume: '', prenume: '', cnp: '', judet: '', uat: '', numar_contract: '', id_imobil: '', status: '', verificat_teren: '', data_inceput: '', data_sfarsit: '' });
    setResults(null);
    setSummary({ total: 0, admis: 0, respins: 0 });
    setSelectedIds(new Set());
    setError('');
    setSuccessMsg('');
    setSortBy('numar_contestatie');
    setSortOrder('ASC');
    setLimitPer(10);
  };

  // ── Sorting ────────────────────────────────────────────────────
  const handleSort = (col) => {
    const newOrder = sortBy === col && sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setSortBy(col);
    setSortOrder(newOrder);
    doFilter(pagination.page, col, newOrder, limitPer);
  };

  // ── Pagination ─────────────────────────────────────────────────
  const handlePageChange = (newPage) => {
    doFilter(newPage, sortBy, sortOrder, limitPer);
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value) || 10;
    setLimitPer(newLimit);
    doFilter(1, sortBy, sortOrder, newLimit);
  };

  // ── Checkbox selection ─────────────────────────────────────────
  const allOnPageSelected = results && results.length > 0 && results.every(r => selectedIds.has(r.id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      const newSet = new Set(selectedIds);
      results.forEach(r => newSet.delete(r.id));
      setSelectedIds(newSet);
    } else {
      const newSet = new Set(selectedIds);
      results.forEach(r => newSet.add(r.id));
      setSelectedIds(newSet);
    }
  };

  const toggleRow = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Download helpers ───────────────────────────────────────────
  const triggerZipDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadAll = async () => {
    setDownloadAllLoading(true);
    setError('');
    try {
      const today = new Date().toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
      const judetLabel = primary.judet ? `_${primary.judet}` : '';
      const filename = `Raport${judetLabel}_${today}.zip`;

      const res = await axios.post(`${API}/reports/batch`, buildFilters(), {
        responseType: 'blob',
        withCredentials: true,
      });
      triggerZipDownload(new Blob([res.data], { type: 'application/zip' }), filename);
      setSuccessMsg(`ZIP generat cu succes: ${filename}`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Nu s-au găsit contestații pentru filtrele selectate.');
      } else {
        setError('Eroare la generarea ZIP.');
      }
    } finally {
      setDownloadAllLoading(false);
    }
  };

  const handleDownloadUnsigned = async () => {
    setDownloadUnsignedLoading(true);
    setError('');
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await axios.post(`${API}/reports/batch-unsigned`, buildFilters(), {
        responseType: 'blob',
        withCredentials: true,
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PV_Raport_${today}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessMsg('PDF fără semnături generat cu succes!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Nu s-au găsit contestații pentru filtrele selectate.');
      } else {
        setError('Eroare la generarea PDF-ului fără semnături.');
      }
    } finally {
      setDownloadUnsignedLoading(false);
    }
  };

  const handleExportFullExcel = async () => {
    setFullExcelLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/reports/export-full-excel`, buildFilters(), {
        responseType: 'blob',
        withCredentials: true,
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      const today = new Date();
      const dateStr = today.getDate().toString().padStart(2, '0') + '_' + (today.getMonth() + 1).toString().padStart(2, '0') + '_' + today.getFullYear();
      link.href = url;
      link.setAttribute('download', `Raport_Contestatii_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessMsg('Excel exportat cu succes!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Nu s-au găsit contestații pentru filtrele selectate.');
      } else {
        setError('Eroare la exportul Excel.');
      }
    } finally {
      setFullExcelLoading(false);
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedIds.size === 0) return;
    setDownloadSelLoading(true);
    setError('');
    try {
      const today = new Date().toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
      const filename = `Selectate_${today}.zip`;

      const res = await axios.post(`${API}/reports/batch`, { ids: Array.from(selectedIds) }, {
        responseType: 'blob',
        withCredentials: true,
      });
      triggerZipDownload(new Blob([res.data], { type: 'application/zip' }), filename);
      setSuccessMsg(`ZIP generat cu succes: ${filename}`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setError('Eroare la generarea ZIP pentru selectate.');
    } finally {
      setDownloadSelLoading(false);
    }
  };

  // ── Individual PDF ─────────────────────────────────────────────
  const handleSinglePdf = async (contestatieId) => {
    try {
      const res = await axios.post(`${API}/reports/batch`, { ids: [contestatieId] }, {
        responseType: 'blob',
        withCredentials: true,
      });
      triggerZipDownload(new Blob([res.data], { type: 'application/zip' }), `Contestatie_${contestatieId}.zip`);
    } catch {
      setError('Eroare la generarea PDF-ului individual.');
    }
  };

  // ── Toggle lock single row ────────────────────────────────────
  const handleToggleLock = async (id, currentlyLocked) => {
    const action = currentlyLocked ? 'debloca' : 'bloca';
    const confirmed = window.confirm(`Sunteți sigur că vreți să ${action}ți această contestație?`);
    if (!confirmed) return;
    try {
      const endpoint = currentlyLocked ? '/contestatii/unlock' : '/contestatii/lock';
      const res = await axios.post(endpoint, { ids: [id] });
      if (res.data.status === 'success') {
        setSuccessMsg(`Contestația a fost ${currentlyLocked ? 'deblocată' : 'blocată'} cu succes.`);
        setTimeout(() => setSuccessMsg(''), 4000);
        doFilter(pagination.page);
      }
    } catch (err) {
      setError(`Eroare la ${action}rea contestației.`);
    }
  };

  // ── Lock selected ──────────────────────────────────────────────
  const handleLockSelected = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(
      `Sunteți sigur că vreți să blocați ${selectedIds.size} contestații?\n\nContestațiile blocate NU vor mai putea fi editate sau șterse.`
    );
    if (!confirmed) return;
    setLockLoading(true);
    try {
      const res = await axios.post('/contestatii/lock', { ids: Array.from(selectedIds) });
      if (res.data.status === 'success') {
        setSuccessMsg(`${res.data.locked} contestații au fost blocate cu succes.`);
        setTimeout(() => setSuccessMsg(''), 5000);
        setSelectedIds(new Set());
        doFilter(pagination.page);
      }
    } catch (err) {
      setError('Eroare la blocarea contestațiilor.');
    } finally {
      setLockLoading(false);
    }
  };

  const handleUnlockSelected = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(`Sunteți sigur că vreți să deblocați ${selectedIds.size} contestații?`);
    if (!confirmed) return;
    setLockLoading(true);
    try {
      const res = await axios.post('/contestatii/unlock', { ids: Array.from(selectedIds) });
      if (res.data.status === 'success') {
        setSuccessMsg(`${res.data.unlocked} contestații au fost deblocate cu succes.`);
        setTimeout(() => setSuccessMsg(''), 5000);
        setSelectedIds(new Set());
        doFilter(pagination.page);
      }
    } catch (err) {
      setError('Eroare la deblocarea contestațiilor.');
    } finally {
      setLockLoading(false);
    }
  };

  // ── Excel export (all filtered) ────────────────────────────────
  const handleExportExcel = async () => {
    // VALIDATION: CodTrimitere is MANDATORY for Poșta Română
    if (!codTrimitere || codTrimitere.trim() === '') {
      alert('⚠️ Completați câmpul "Cod Trimitere" înainte de export!\n\nGăsiți codul în contul AWB Poșta Română:\nCreare AWB → Tip trimitere → codul din paranteze (ex: 3,1,2)');
      return;
    }

    setExcelLoading(true);
    setError('');
    try {
      const response = await fetch(`${API}/reports/export-excel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...buildFilters(),
          codTrimitere: codTrimitere,
          greutate: greutate
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || err.error || 'Eroare la export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AWB_Posta_Romana_${new Date().toLocaleDateString('ro-RO').replace(/\//g, '_')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setSuccessMsg('AWB Excel generat cu succes!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      if (err.message && err.message.includes('Nu s-au')) {
        setError('Nu s-au găsit contestații pentru filtrele selectate.');
      } else {
        setError('Eroare la generarea Excel: ' + err.message);
      }
    } finally {
      setExcelLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  const hasResults = results !== null;
  const noResults = hasResults && results.length === 0;

  return (
    <div className="w-full max-w-7xl mx-auto pb-10">
      {/* ── Page header ── */}
      <div className="mb-4">
        <h1 className="page-title">Generare Raport Contestații</h1>
        <p className="page-subtitle" style={{ marginTop: 2 }}>Filtrați contestațiile și descărcați rapoarte PDF</p>
      </div>

      {/* ── Success / Error banners ── */}
      {successMsg && (
        <div className="alert alert-success mb-3">
          <CheckCircleIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="alert alert-danger mb-3">
          <ExclamationTriangleIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* ── Filters ── */}
      <form onSubmit={handleFilter}>
        <div className="card" style={{ padding: '14px 16px', marginBottom: 12 }}>
          <div className="flex items-center gap-1.5 mb-3">
            <FunnelIcon style={{ width: 14, height: 14, color: 'var(--color-primary-500)' }} />
            <p className="section-header" style={{ margin: 0 }}>Filtre contestații</p>
          </div>

          {/* Row 1: Nr. Contestație | Nume | Prenume | CNP | Județ | UAT */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
            <div>
              <label className={filterLabelClass}>Nr. Contestație</label>
              <input type="text" name="numar_contestatie" value={primary.numar_contestatie}
                onChange={handlePrimaryChange} placeholder="ex: 123" className={filterInputClass} />
            </div>
            <div>
              <label className={filterLabelClass}>Nume</label>
              <input type="text" name="nume" value={primary.nume}
                onChange={handlePrimaryChange} placeholder="Nume" className={filterInputClass} />
            </div>
            <div>
              <label className={filterLabelClass}>Prenume</label>
              <input type="text" name="prenume" value={primary.prenume}
                onChange={handlePrimaryChange} placeholder="Prenume" className={filterInputClass} />
            </div>
            <div>
              <label className={filterLabelClass}>CNP</label>
              <input type="text" name="cnp" value={primary.cnp}
                onChange={handlePrimaryChange} placeholder="13 cifre" maxLength={13} className={filterInputClass} />
            </div>
            <div>
              <label className={filterLabelClass}>Județ</label>
              <select name="judet" value={primary.judet} onChange={handlePrimaryChange} className={filterInputClass}>
                <option value="">Toate județele</option>
                {ROMANIAN_COUNTIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={filterLabelClass}>UAT</label>
              <select name="uat" value={primary.uat} onChange={handlePrimaryChange} className={filterInputClass}>
                <option value="">{primary.judet ? 'Toate localitățile' : 'Selectați mai întâi județul'}</option>
                {availableUATs.map((uat, i) => (
                  <option key={uat.id || i} value={uat.name || uat}>{uat.name || uat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Contract | ID Imobil | Status Decizie | Verificat Teren | De la | Până la */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className={filterLabelClass}>Contract</label>
              <input type="text" name="numar_contract" value={primary.numar_contract}
                onChange={handlePrimaryChange} placeholder="Nr. contract" className={filterInputClass} />
            </div>
            <div>
              <label className={filterLabelClass}>ID Imobil</label>
              <input type="text" name="id_imobil" value={primary.id_imobil}
                onChange={handlePrimaryChange} placeholder="ID imobil" className={filterInputClass} />
            </div>
            <div>
              <label className={filterLabelClass}>Status Decizie</label>
              <select name="status" value={primary.status} onChange={handlePrimaryChange} className={filterInputClass}>
                <option value="">Toate</option>
                <option value="admis">✅ Admis</option>
                <option value="respins">❌ Respins</option>
                <option value="pending">⏳ În așteptare</option>
              </select>
            </div>
            <div>
              <label className={filterLabelClass}>Verificat Teren</label>
              <select name="verificat_teren" value={primary.verificat_teren} onChange={handlePrimaryChange} className={filterInputClass}>
                <option value="">Toate</option>
                <option value="1">Da</option>
                <option value="0">Nu</option>
              </select>
            </div>
            <div>
              <label className={filterLabelClass}>De la</label>
              <input type="date" name="data_inceput" value={primary.data_inceput}
                onChange={handlePrimaryChange} className={filterInputClass} />
            </div>
            <div>
              <label className={filterLabelClass}>Până la</label>
              <input type="date" name="data_sfarsit" value={primary.data_sfarsit}
                onChange={handlePrimaryChange} className={filterInputClass} />
            </div>
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <button type="submit" disabled={filterLoading} className="btn btn-primary">
            {filterLoading ? <Spinner /> : <MagnifyingGlassIcon style={{ width: 14, height: 14 }} />}
            Filtrează
          </button>
          <button type="button" onClick={handleReset} className="btn btn-outline">
            <ArrowPathIcon style={{ width: 14, height: 14 }} />
            Resetează filtrele
          </button>
        </div>
      </form>

      {/* ══════════════════════════════════════════════════════════
          SECTION 3 — RESULTS (only after filter)
      ══════════════════════════════════════════════════════════ */}

      {!hasResults && !filterLoading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-neutral-400)' }}>
          <FunnelIcon style={{ width: 36, height: 36, margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: 13 }}>Selectați filtrele și apăsați <strong style={{ color: 'var(--color-neutral-600)' }}>Filtrează</strong> pentru a vedea rezultatele.</p>
        </div>
      )}

      {filterLoading && (
        <div className="flex items-center justify-center" style={{ padding: '40px 0', gap: 8, color: 'var(--color-primary-600)' }}>
          <Spinner />
          <span style={{ fontSize: 13, fontWeight: 500 }}>Se caută contestații...</span>
        </div>
      )}

      {hasResults && !filterLoading && (
        <>
          {/* ── Summary bar ── */}
          {noResults ? (
            <div className="alert alert-warning mb-3">
              <ExclamationTriangleIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
              Niciun rezultat găsit. Încercați cu alte filtre.
            </div>
          ) : (
            <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1" style={{ backgroundColor: 'var(--color-neutral-800)', color: 'white', padding: '10px 16px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500 }}>
              <span>Rezultate: <strong>{summary.total}</strong> contestații</span>
              <span className="flex items-center gap-1">
                <CheckCircleIcon style={{ width: 14, height: 14, color: 'var(--color-success)' }} />
                <strong>{summary.admis}</strong> Admise
              </span>
              <span className="flex items-center gap-1">
                <XCircleIcon style={{ width: 14, height: 14, color: 'var(--color-danger)' }} />
                <strong>{summary.respins}</strong> Respinse
              </span>
              {selectedIds.size > 0 && (
                <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 'var(--radius-sm)', padding: '2px 8px', fontSize: 12 }}>
                  {selectedIds.size} selectate
                </span>
              )}
            </div>
          )}

          {!noResults && (
            <>
              {/* ── Table controls ── */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2" style={{ fontSize: 12, color: 'var(--color-neutral-500)' }}>
                  <span>Rânduri per pagină:</span>
                  <select value={limitPer} onChange={handleLimitChange} className="field-input" style={{ width: 'auto', padding: '2px 8px' }}>
                    {LIMITS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <span style={{ fontSize: 12, color: 'var(--color-neutral-400)' }}>
                  Pagina {pagination.page} din {pagination.totalPages} ({pagination.total} total)
                </span>
              </div>

              {/* ── Table ── */}
              <div className="card mb-3" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>
                          <input
                            type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAll}
                            style={{ width: 13, height: 13, cursor: 'pointer' }}
                          />
                        </th>
                        {[
                          { label: 'Nr.', col: 'numar_contestatie' },
                          { label: 'Județ', col: 'judet' },
                          { label: 'UAT', col: 'uat' },
                          { label: 'Contract', col: 'numar_contract' },
                          { label: 'Sector', col: 'sector_cadastral' },
                          { label: 'ID Imobil', col: null },
                          { label: 'Persoană principală', col: 'nume' },
                          { label: 'Membri', col: null },
                          { label: 'Status', col: null },
                          { label: 'Data', col: 'data_aleasa' },
                          { label: 'Blocare', col: null },
                          { label: '', col: null },
                        ].map(({ label, col }) => (
                          <th
                            key={label || 'actiuni'}
                            style={{ cursor: col ? 'pointer' : 'default' }}
                            onClick={col ? () => handleSort(col) : undefined}
                          >
                            {label}
                            {col && <SortIcon col={col} sortBy={sortBy} sortOrder={sortOrder} />}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((row) => (
                        <tr key={row.id}
                          style={{ backgroundColor: row.locked ? '#fee2e2' : '' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = row.locked ? '#fecaca' : 'var(--color-primary-50)'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = row.locked ? '#fee2e2' : ''; }}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(row.id)}
                              onChange={() => toggleRow(row.id)}
                              style={{ width: 13, height: 13, cursor: 'pointer' }}
                            />
                          </td>
                          <td className="font-mono" style={{ fontWeight: 600, color: row.locked ? '#b91c1c' : '' }}>{row.numar_contestatie}</td>
                          <td style={{ color: row.locked ? '#b91c1c' : '' }}>{row.judet || '—'}</td>
                          <td style={{ color: row.locked ? '#b91c1c' : '' }}>{row.uat || '—'}</td>
                          <td className="font-mono" style={{ color: row.locked ? '#b91c1c' : '' }}>{row.numar_contract || '—'}</td>
                          <td style={{ color: row.locked ? '#b91c1c' : '' }}>{row.sector_cadastral || '—'}</td>
                          <td className="font-mono" style={{ color: row.locked ? '#b91c1c' : '' }}>{row.id_imobil || '—'}</td>
                          <td style={{ fontWeight: 500, color: row.locked ? '#b91c1c' : '' }}>
                            {row.nume || row.prenume ? `${row.nume || ''} ${row.prenume || ''}`.trim() : '—'}
                          </td>
                          <td>
                            {row.membri_count > 0
                              ? <span className="badge badge-info">+{row.membri_count} membri</span>
                              : '—'}
                          </td>
                          <td>
                            {row.locked
                              ? <span className="badge" style={{ backgroundColor: '#fca5a5', color: '#7f1d1d', border: '1px solid #f87171' }}>🔒 Blocat</span>
                              : <StatusBadge admis={row.admis} respins={row.respins} />}
                          </td>
                          <td style={{ whiteSpace: 'nowrap', color: row.locked ? '#b91c1c' : '' }}>{formatDate(row.data_aleasa)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleLock(row.id, row.locked)}
                              title={row.locked ? 'Deblocare contestație' : 'Blocare contestație'}
                              style={{
                                padding: '4px 6px', borderRadius: 4, border: 'none', cursor: 'pointer',
                                backgroundColor: row.locked ? '#fca5a5' : '#f3f4f6',
                                color: row.locked ? '#7f1d1d' : '#6b7280',
                              }}
                            >
                              {row.locked ? (
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
                          <td>
                            <button
                              type="button"
                              onClick={() => handleSinglePdf(row.id)}
                              title="Descarcă PDF"
                              className="btn btn-ghost btn-sm"
                            >
                              <DocumentArrowDownIcon style={{ width: 12, height: 12 }} />
                              PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── Pagination ── */}
                <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-neutral-400)' }}>
                    Afișate {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} din {pagination.total}
                  </span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page <= 1}
                      style={{ padding: 4, borderRadius: 'var(--radius-sm)', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', opacity: pagination.page <= 1 ? 0.4 : 1 }}>
                      <ChevronLeftIcon style={{ width: 14, height: 14 }} />
                    </button>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter(p => {
                        const cur = pagination.page;
                        return p === 1 || p === pagination.totalPages || Math.abs(p - cur) <= 2;
                      })
                      .reduce((acc, p, i, arr) => {
                        if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === '...'
                          ? <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--color-neutral-400)', fontSize: 12 }}>…</span>
                          : <button key={p} type="button" onClick={() => handlePageChange(p)}
                              style={{ width: 26, height: 26, borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', backgroundColor: pagination.page === p ? 'var(--color-primary-600)' : 'transparent', color: pagination.page === p ? 'white' : 'var(--color-neutral-600)' }}>
                              {p}
                            </button>
                      )}
                    <button type="button" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
                      style={{ padding: 4, borderRadius: 'var(--radius-sm)', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', opacity: pagination.page >= pagination.totalPages ? 0.4 : 1 }}>
                      <ChevronRightIcon style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════════════════════════════
                  AWB SETTINGS PANEL — CodTrimitere & Greutate
              ══════════════════════════════════════════════════════════ */}
              <div className="card mb-3" style={{ padding: '12px 14px', backgroundColor: 'var(--surface-secondary)' }}>
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <label className="field-label">Cod Trimitere (AWB) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input
                      type="text"
                      placeholder="ex: 3,1,2"
                      value={codTrimitere}
                      onChange={(e) => setCodTrimitere(e.target.value)}
                      required
                      className={`field-input${!codTrimitere.trim() ? ' error' : ''}`}
                      style={{ width: 140 }}
                    />
                    <small style={{ display: 'block', marginTop: 2, fontSize: 10, color: 'var(--color-neutral-400)' }}>
                      AWB Poșta Română → Creare AWB → Tip trimitere → cod din paranteze
                    </small>
                  </div>
                  <div>
                    <label className="field-label">Greutate (g)</label>
                    <input
                      type="number"
                      placeholder="0.1"
                      value={greutate}
                      onChange={(e) => setGreutate(e.target.value)}
                      step="0.1"
                      className="field-input"
                      style={{ width: 100 }}
                    />
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════════════════════════════
                  SECTION 4 — DOWNLOAD BUTTONS
              ══════════════════════════════════════════════════════════ */}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleDownloadAll}
                  disabled={downloadAllLoading || downloadSelLoading || excelLoading || downloadUnsignedLoading}
                  className="btn btn-primary"
                  style={{ backgroundColor: 'var(--color-success)' }}
                >
                  {downloadAllLoading ? <Spinner /> : <ArchiveBoxArrowDownIcon style={{ width: 14, height: 14 }} />}
                  Generează PV-uri semnate ({summary.total})
                </button>

                <button type="button" onClick={handleDownloadUnsigned}
                  disabled={downloadUnsignedLoading || downloadAllLoading || downloadSelLoading || excelLoading}
                  className="btn btn-outline"
                >
                  {downloadUnsignedLoading ? <Spinner /> : <DocumentTextIcon style={{ width: 14, height: 14 }} />}
                  Generează PV (fără semnături)
                </button>

                <button type="button" onClick={handleExportFullExcel}
                  disabled={fullExcelLoading || downloadAllLoading || downloadSelLoading || excelLoading}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#0d9488' }}
                >
                  {fullExcelLoading ? <Spinner /> : <TableCellsIcon style={{ width: 14, height: 14 }} />}
                  Export Excel Complet ({summary.total})
                </button>

                <button type="button" onClick={handleExportExcel}
                  disabled={downloadAllLoading || downloadSelLoading || excelLoading || !codTrimitere.trim()}
                  title={!codTrimitere.trim() ? 'Completați Cod Trimitere mai întâi' : ''}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#065f46' }}
                >
                  {excelLoading ? <Spinner /> : <ChartBarIcon style={{ width: 14, height: 14 }} />}
                  Export AWB Excel ({summary.total})
                </button>

                {selectedIds.size > 0 && (
                  <button type="button" onClick={handleDownloadSelected}
                    disabled={downloadAllLoading || downloadSelLoading || excelLoading}
                    className="btn btn-primary"
                    style={{ backgroundColor: 'var(--color-neutral-700)' }}
                  >
                    {downloadSelLoading ? <Spinner /> : <ArchiveBoxArrowDownIcon style={{ width: 14, height: 14 }} />}
                    Descarcă Selectate ({selectedIds.size})
                  </button>
                )}

                {selectedIds.size > 0 && (
                  <button type="button" onClick={handleLockSelected}
                    disabled={lockLoading}
                    className="btn btn-primary"
                    style={{ backgroundColor: '#dc2626' }}
                    title="Contestațiile blocate nu mai pot fi editate sau șterse"
                  >
                    {lockLoading ? <Spinner /> : (
                      <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                    Blochează Selectate ({selectedIds.size})
                  </button>
                )}

                {selectedIds.size > 0 && (
                  <button type="button" onClick={handleUnlockSelected}
                    disabled={lockLoading}
                    className="btn btn-primary"
                    style={{ backgroundColor: '#16a34a' }}
                    title="Deblochează contestațiile selectate"
                  >
                    {lockLoading ? <Spinner /> : (
                      <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    )}
                    Deblochează Selectate ({selectedIds.size})
                  </button>
                )}
              </div>

              {/* Nomenclator warning */}
              <p style={{ marginTop: 8, fontSize: 11, color: 'var(--color-warning)' }}>
                ⚠️ Verificați ca localitățile să fie scrise exact conform nomenclatorului Poșta Română
                (descărcabil din contul AWB → Upload date → Nomenclator localități)
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default ReportGenerator;