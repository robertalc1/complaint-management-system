import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { 
  DocumentArrowDownIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
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

// Membrii comisiei pentru raport
const COMMISSION_MEMBERS = [
  {
    name: 'Veronica Măndilă',
    role: 'Șef Birou Înregistrare Sistematică în cadrul OCPI Constanța, Serviciul Cadastru - Birou de Înregistrare Sistematică',
    position: 'Președinte'
  },
  {
    name: 'Daniel Drăgan',
    role: 'consilier cadastru în cadrul OCPI Constanța, Serviciul Cadastru Birou de Înregistrare Sistematică',
    position: 'membru'
  },
  // ... ceilalți membri
];

// Componentă reutilizabilă pentru câmpurile formularului
const FormField = ({ 
  id, 
  label, 
  name, 
  value, 
  onChange, 
  type = "text", 
  placeholder = "", 
  options = null, 
  rows = null 
}) => {
  const isSelect = options !== null;
  const isTextarea = rows !== null;
  
  return (
    <div className="form-field">
      <label htmlFor={id} className="block text-sm font-medium text-secondary-700 mb-1">
        {label}
      </label>
      
      {isSelect ? (
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className="input"
        >
          <option value="">{placeholder || "Toate opțiunile"}</option>
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
          className="input"
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="input"
          maxLength={type === "text" && name === "cnp" ? 13 : undefined}
        />
      )}
    </div>
  );
};

function ReportGenerator() {
  const [name] = useOutletContext();
  const [filterData, setFilterData] = useState({
    nume: '',
    prenume: '',
    cnp: '',
    regiune: '',
    adresa: '',
    observatii: '',
    dataStart: '',
    dataEnd: '',
    numarContestatie: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Funcția pentru generarea PDF-ului
  const generatePDF = async (contestatii) => {
    const doc = new jsPDF({
      format: 'a4',
      unit: 'mm',
      orientation: 'portrait'
    });

    // Adăugare font pentru caractere românești
    doc.addFont('times', 'Times', 'normal');
    doc.setFont('Times');

    const pageHeight = doc.internal.pageSize.height;

    // Funcții helper pentru formatarea documentului
    const addHeaderToPage = (pageNumber) => {
      try {
        // Logo-uri - poziții exacte
        doc.addImage('/guvernul-romaniei-logo.png', 'PNG', 20, 10, 25, 25);
        doc.addImage('/ocpi-logo.png', 'PNG', 165, 10, 25, 25);
      } catch (error) {
        console.error('Eroare la încărcarea logo-urilor:', error);
      }

      // Număr document
      doc.setFontSize(11);
      doc.text(`Nr. ${pageNumber}/26.04.2024`, 172, 20, { align: 'center' });

      // Text header
      doc.setFontSize(8);
      doc.text('OCPI CONSTANTA/Str. Mihai Viteazu, Nr. 2B, Cod poștal 900682, Constanta, Jud. Constanta, ROMÂNIA', 105, 40, { align: 'center' });
      doc.text('Certificat SR EN ISO 9001:2015', 165, 40);
      doc.text('Telefon:(0241) 48 86 25,(0241) 48 86 26; Fax:(0241) 48 82 48,(0241)61 78 48; e-mail: ct@ancpi.ro; www.ancpi.ro', 105, 44, { align: 'center' });
      doc.text('Nr. 27921/09/R', 165, 44);
    };

    const addFooterToPage = (pageNumber) => {
      doc.setFontSize(8);
      doc.text(`Pagina ${pageNumber}`, 105, 287, { align: 'center' });
      doc.text('OCPI CONSTANTA/Str. Mihai Viteazu, Nr. 2B, Cod poștal 900682, Constanta, Jud. Constanta, ROMÂNIA', 105, 291, { align: 'center' });
      doc.text('Certificat SR EN ISO 9001:2015', 165, 291);
      doc.text('Telefon:(0241) 48 86 25,(0241) 48 86 26; Fax:(0241) 48 82 48,(0241)61 78 48; e-mail: ct@ancpi.ro; www.ancpi.ro', 105, 295, { align: 'center' });
      doc.text('Extrase de carte funciară pentru informare online: ePay.ancpi.ro', 20, 299);
    };

    // Generarea paginilor pentru fiecare contestație
    for (let i = 0; i < contestatii.length; i++) {
      const contestatie = contestatii[i];
      
      if (i > 0) {
        doc.addPage();
      }

      let currentPage = i + 1;
      addHeaderToPage(currentPage);

      // Titlu
      doc.setFontSize(12);
      doc.text('PROCES-VERBAL SOLUȚIONARE CERERE DE RECTIFICARE', 105, 65, { align: 'center' });

      let yPos = 80;

      // Text introducere
      const introText = 'În aplicarea prevederilor art. 14 alin. (3) al Legii cadastrului și a publicității imobiliare nr. 7/1996, republicată, cu modificările și completările ulterioare, comisia de soluționare a cererilor de rectificare a documentelor tehnice ale cadastrului publicate pentru unitatea administrativ-teritorială ' + 
        (contestatie.regiune || 'MIHAI VITEAZU') + ', numită prin Decizia Directorului Oficiului de Cadastru și Publicitate Imobiliară CONSTANȚA nr. 466/25.09.2023, compusă din următorii membri:';

      const splitIntro = doc.splitTextToSize(introText, 170);
      doc.text(splitIntro, 20, yPos);
      yPos += splitIntro.length * 6;

      // Membrii comisiei
      for (let idx = 0; idx < COMMISSION_MEMBERS.length; idx++) {
        const member = COMMISSION_MEMBERS[idx];
        
        if (yPos + 10 > pageHeight - 20) {
          doc.addPage();
          currentPage++;
          addHeaderToPage(currentPage);
          yPos = 80;
        }
        
        const memberText = `${idx + 1}. ${member.name} – ${member.role} – ${member.position}`;
        const splitMember = doc.splitTextToSize(memberText, 165);
        doc.text(splitMember, 25, yPos);
        yPos += splitMember.length * 5;
      }

      yPos += 8;

      // Secțiunea cu detalii contestație
      if (yPos + 30 > pageHeight - 20) {
        doc.addPage();
        currentPage++;
        addHeaderToPage(currentPage);
        yPos = 80;
      }

      const complaintText = `Analizând cererea de rectificare nr.${contestatie.numarContestatie || 'N/A'}/02.10.2023 formulată de ${contestatie.nume || 'N/A'} ${contestatie.prenume || ''}, cu domiciliul în ${contestatie.adresa || 'N/A'}, cu privire la imobilul identificat în documentele tehnice cadastrale ale unității administrativ-teritoriale ${contestatie.regiune || 'MIHAI VITEAZU'} sector cadastral - cu ID nr. ${contestatie.id || '4298'}.`;

      const splitComplaint = doc.splitTextToSize(complaintText, 160);
      doc.text(splitComplaint, 20, yPos);
      yPos += splitComplaint.length * 6;

      yPos += 8;

      // Secțiunea cu documente
      if (yPos + 30 > pageHeight - 20) {
        doc.addPage();
        currentPage++;
        addHeaderToPage(currentPage);
        yPos = 80;
      }

      const docsText = 'În baza ' + (contestatie.documente || 'Copie CI, adeverința nr. 7037/09.11.2023 emisa de Primaria comunei Mihai Viteazu, adeverinta nr. 4843/04.04.2024 emisa de comuna Mihai Viteazu, certificat de nomenclatura stradala nr. 4845/04.04.2024');
      const splitDocs = doc.splitTextToSize(docsText, 160);
      doc.text(splitDocs, 20, yPos);
      yPos += splitDocs.length * 6;

      yPos += 8;

      // Secțiunea DECIDE
      if (yPos + 30 > pageHeight - 20) {
        doc.addPage();
        currentPage++;
        addHeaderToPage(currentPage);
        yPos = 80;
      }

      doc.setFontSize(11);
      doc.text('DECIDE:', 20, yPos);
      yPos += 8;

      // Decizia
      const decisionText = 'Admite cererea și dispune rectificarea imobilului cu ID 4298 sector cadastral, astfel: ' + 
        (contestatie.decizie || 'Urmare a verificarilor efectuate si a identificarii limitelor din teren indicate de catre petenti, se va rectifica geometia ID-urilor 4298 si 4297 in sensul crearii a 4 imobile distincte.');
      
      const splitDecision = doc.splitTextToSize(decisionText, 160);
      doc.text(splitDecision, 20, yPos);
      yPos += splitDecision.length * 6;

      yPos += 10;

      // Textele finale
      if (yPos + 50 > pageHeight - 20) {
        doc.addPage();
        currentPage++;
        addHeaderToPage(currentPage);
        yPos = 80;
      }

      const finalTexts = [
        'Comisia de soluționare a cererilor de rectificare a documentelor tehnice ale',
        'cadastrului publicate dispune rectificarea imobilului în fișierele .cgxml, precum și în',
        'cuprinsul Opisului alfabetic al proprietarilor și Registrului cadastral al imobilelor.',
        '',
        'Prezentul proces-verbal se comunică persoanelor care au formulat cererea de',
        'rectificare și altor persoane interesate potrivit documentelor tehnice ale cadastrului.',
        '',
        '- PRIMĂRIA COMUNEI MIHAI VITEAZU',
        '- S.C. CAR TOP S.R.L.',
        `- ${contestatie.nume || 'N/A'} ${contestatie.prenume || ''}`,
        '',
        'Procesul-verbal poate fi contestat cu plângere la judecătorie, în termen de 15 zile de',
        'la comunicare.'
      ];

      for (const text of finalTexts) {
        if (yPos + 5 > pageHeight - 20) {
          doc.addPage();
          currentPage++;
          addHeaderToPage(currentPage);
          yPos = 80;
        }
        if (text === '') {
          yPos += 5;
        } else {
          doc.text(text, 20, yPos);
          yPos += 5;
        }
      }

      // Semnături și note finale
      if (yPos + 40 > pageHeight - 20) {
        doc.addPage();
        currentPage++;
        addHeaderToPage(currentPage);
        yPos = 80;
      }

      yPos += 10;
      doc.text('Semnăturile membrilor desemnați cu soluționarea cererilor de rectificare:', 20, yPos);
      yPos += 10;

      for (const member of COMMISSION_MEMBERS) {
        if (yPos + 15 > pageHeight - 20) {
          doc.addPage();
          currentPage++;
          addHeaderToPage(currentPage);
          yPos = 80;
        }
        doc.text(`${member.name} - ${member.position};`, 20, yPos);
        yPos += 7;
      }

      // Note finale
      if (yPos + 40 > pageHeight - 20) {
        doc.addPage();
        currentPage++;
        addHeaderToPage(currentPage);
        yPos = 80;
      }

      // GDPR și note finale
      yPos += 10;
      doc.setFontSize(8);

      const gdprText = [
        'Prezentul document conține date cu caracter personal protejate de prevederile',
        'Regulamentului UE 2016/679 privind protecția persoanelor fizice în ceea ce privește',
        'prelucrarea datelor cu caracter personal și privind libera circulație a acestor date (GDPR-',
        'General Data Protection Regulation).'
      ];

      for (const line of gdprText) {
        if (yPos + 4 > pageHeight - 20) {
          doc.addPage();
          currentPage++;
          addHeaderToPage(currentPage);
          yPos = 80;
        }
        doc.text(line, 20, yPos);
        yPos += 4;
      }

      yPos += 8;
      
      const noteText = [
        'Notă:',
        'În situația în care cererea de rectificare afectează și alte imobile decât imobilul contestat,',
        'prin procesul verbal se dispune notarea cererii de rectificare în fișierele cgxml ale imobilelor',
        'afectate și rectificarea acestor imobilelor conform situației rezultate din acte, măsurători',
        'etc.'
      ];

      for (const line of noteText) {
        if (yPos + 4 > pageHeight - 20) {
          doc.addPage();
          currentPage++;
          addHeaderToPage(currentPage);
          yPos = 80;
        }
        doc.text(line, 20, yPos);
        yPos += 4;
      }

      addFooterToPage(currentPage);
    }

    doc.save(`proces-verbal-${new Date().toISOString().slice(0,10)}.pdf`);

    // Setăm mesaj de succes după generare
    setSuccess(`Raport generat cu succes pentru ${contestatii.length} contestație(i).`);
    setTimeout(() => {
      setSuccess('');
    }, 5000);
  };

  // Handler pentru modificarea câmpurilor
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler pentru trimiterea formularului
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const hasAtLeastOneFilter = Object.values(filterData).some(value => value.trim() !== '');
    
    if (!hasAtLeastOneFilter) {
      setError('Vă rugăm să completați cel puțin un câmp pentru filtrare');
      setLoading(false);
      return;
    }

    try {
      const filledFields = Object.entries(filterData).reduce((acc, [key, value]) => {
        if (value.trim() !== '') {
          acc[key] = value.trim();
        }
        return acc;
      }, {});

      const response = await axios.post('http://localhost:8082/filter-contestatii', filledFields, {
        withCredentials: true
      });

      if (response.data && response.data.length > 0) {
        await generatePDF(response.data);
      } else {
        setError('Nu s-au găsit contestații pentru filtrele selectate');
      }
    } catch (error) {
      console.error('Eroare la generarea raportului:', error);
      setError('A apărut o eroare la generarea raportului');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-secondary-900 mb-6">
        Generare Raport Contestații
      </h1>
      
      {/* Mesaj de succes */}
      {success && (
        <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-lg flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b border-secondary-200">
          <div className="flex items-center">
            <DocumentTextIcon className="h-6 w-6 text-primary-600 mr-3" />
            <h2 className="text-lg font-semibold text-secondary-900">
              Criterii de filtrare pentru raport
            </h2>
          </div>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Secțiunea Informații personale */}
            <div className="report-section p-5 bg-white border border-secondary-100 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-secondary-800 mb-4 pb-2 border-b border-secondary-200">
                Informații personale
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField 
                  id="nume" 
                  label="Nume" 
                  name="nume" 
                  value={filterData.nume} 
                  onChange={handleChange}
                  placeholder="Numele solicitantului"
                />
                
                <FormField 
                  id="prenume" 
                  label="Prenume" 
                  name="prenume" 
                  value={filterData.prenume} 
                  onChange={handleChange}
                  placeholder="Prenumele solicitantului"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField 
                  id="cnp" 
                  label="CNP" 
                  name="cnp" 
                  value={filterData.cnp} 
                  onChange={handleChange}
                  placeholder="13 cifre"
                />
                
                <FormField 
                  id="numarContestatie" 
                  label="Număr Contestație" 
                  name="numarContestatie" 
                  value={filterData.numarContestatie} 
                  onChange={handleChange}
                  placeholder="Numărul contestației"
                />
              </div>
            </div>
            
            {/* Secțiunea Informații locație */}
            <div className="report-section p-5 bg-white border border-secondary-100 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-secondary-800 mb-4 pb-2 border-b border-secondary-200">
                Informații locație
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <FormField 
                  id="regiune" 
                  label="Județ" 
                  name="regiune" 
                  value={filterData.regiune} 
                  onChange={handleChange}
                  options={ROMANIAN_COUNTIES}
                  placeholder="Toate județele"
                />
                
                <FormField 
                  id="adresa" 
                  label="Adresă" 
                  name="adresa" 
                  value={filterData.adresa} 
                  onChange={handleChange}
                  placeholder="Adresa completă"
                />
              </div>
            </div>
            
            {/* Secțiunea Interval de timp */}
            <div className="report-section p-5 bg-white border border-secondary-100 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-secondary-800 mb-4 pb-2 border-b border-secondary-200">
                Interval de timp
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField 
                  id="dataStart" 
                  label="Data început" 
                  name="dataStart" 
                  type="date" 
                  value={filterData.dataStart} 
                  onChange={handleChange}
                />
                
                <FormField 
                  id="dataEnd" 
                  label="Data sfârșit" 
                  name="dataEnd" 
                  type="date" 
                  value={filterData.dataEnd} 
                  onChange={handleChange}
                />
              </div>
            </div>
            
            {/* Secțiunea Observații */}
            <div className="report-section p-5 bg-white border border-secondary-100 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-secondary-800 mb-4 pb-2 border-b border-secondary-200">
                Observații
              </h3>
              
              <FormField 
                id="observatii" 
                label="Observații" 
                name="observatii" 
                value={filterData.observatii} 
                onChange={handleChange}
                rows={4}
                placeholder="Adăugați orice observații relevante"
              />
            </div>
          </form>
          
          {/* Buton generare raport */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="btn btn-primary w-full md:w-auto py-3 px-8"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Se generează...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  Generează Raport PDF
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportGenerator;