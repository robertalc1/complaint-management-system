// backend/pdfGenerator.js - TEXTE HARDCODATE PER INDEX (NU PER NUME!)
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ==================== CONSTANTE GLOBALE ====================
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_LEFT = 56.7;
const MARGIN_RIGHT = 56.7;
const MARGIN_TOP = 42.5;
const MARGIN_BOTTOM = 22.7;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

const LOGO_HEIGHT = 65;
const LOGO_WIDTH = 141;
const CONTENT_START_Y = 130;
const FOOTER_HEIGHT = 45;
const PAGE_BOTTOM_LIMIT = PAGE_HEIGHT - MARGIN_BOTTOM - FOOTER_HEIGHT - 20;

const FONT_SIZE_BODY = 12;
const FONT_SIZE_TITLE = 13;
const FONT_SIZE_FOOTER = 8.5;
const FONT_SIZE_PAGE_NUMBER = 9;

const COLOR_BLACK = '#000000';
const COLOR_BLUE = '#0066CC';
const COLOR_BLUE_LINE = '#003087';

// ⭐⭐⭐ MAP FUNCȚII PREDEFINITE (folosit când membrul are câmpul `functie` setat) ⭐⭐⭐
const FUNCTII_MAP = {
  'Consilier Cadastru': {
    functie_lunga: 'consilier cadastru în cadrul OCPI Constanța, Serviciul Cadastru - Biroul de Înregistrare Sistematică',
    functie_scurta: 'consilier cadastru',
    dinamic: false
  },
  'Asistent registrator principal': {
    functie_lunga: 'asistent registrator principal în cadrul OCPI Constanța, Serviciul Cadastru – Biroul de Înregistrare Sistematică',
    functie_scurta: 'asistent registrator principal',
    dinamic: false
  },
  'Registrator de carte funciară': {
    functie_lunga: 'registrator de carte funciară în cadrul OCPI Constanța, Serviciul Cadastru - Biroul de Înregistrare Sistematică',
    functie_scurta: 'Registrator BIS',
    dinamic: false
  },
  'Șef serviciu SIS': {
    functie_lunga: 'Șef serviciu SIS în cadrul OCPI Constanța, Serviciul Cadastru - Biroul de Înregistrare Sistematică',
    functie_scurta: 'Șef serviciu SIS',
    dinamic: false
  },
  'Reprezentant al primăriei': {
    functie_lunga_template: 'reprezentant al Primăriei Comunei {UAT}',
    functie_scurta_template: 'reprezentant Primăria Comunei {UAT}',
    dinamic: true,
    campuri_dinamice: ['uat']
  },
  'Reprezentant al prestatorului': {
    functie_lunga_template: 'reprezentant al Prestatorului {AUTORIZAT}',
    functie_scurta_template: 'reprezentant al {AUTORIZAT}',
    dinamic: true,
    campuri_dinamice: ['autorizat']
  }
};

// ⭐⭐⭐ TEXTE HARDCODATE PER INDEX (FALLBACK când membrul NU are câmpul `functie`) ⭐⭐⭐
// Ordinea corespunde cu v3 din LocationPreselectionForm:
// 0: Luminița Pușchiază – Registrator de carte funciară
// 1: Diana Andreea Nedu – Asistent registrator principal
// 2: Lavinia Marcu – Asistent registrator principal
// 3: Cristina Pașa – Consilier Cadastru
// 4: Alina Suciu – Consilier Cadastru
// 5: Silvia Ștefan – Reprezentant al primăriei
// 6: (gol) – Reprezentant al prestatorului

const TEXTE_PER_INDEX = {
  // INDEX 0 - Luminița Pușchiază → Președinte
  0: {
    functie_lunga: 'registrator de carte funciară în cadrul OCPI Constanța, Serviciul Cadastru - Biroul de Înregistrare Sistematică',
    functie_scurta: 'Registrator BIS',
    dinamic: false
  },

  // INDEX 1 - Diana Andreea Nedu → Membru
  1: {
    functie_lunga: 'asistent registrator principal în cadrul OCPI Constanța, Serviciul Cadastru – Biroul de Înregistrare Sistematică',
    functie_scurta: 'asistent registrator principal',
    dinamic: false
  },

  // INDEX 2 - Lavinia Marcu → Membru
  2: {
    functie_lunga: 'asistent registrator principal în cadrul OCPI Constanța, Serviciul Cadastru – Biroul de Înregistrare Sistematică',
    functie_scurta: 'asistent registrator principal',
    dinamic: false
  },

  // INDEX 3 - Cristina Pașa → Membru
  3: {
    functie_lunga: 'consilier cadastru în cadrul OCPI Constanța, Serviciul Cadastru - Biroul de Înregistrare Sistematică',
    functie_scurta: 'consilier cadastru',
    dinamic: false
  },

  // INDEX 4 - Alina Suciu → Membru
  4: {
    functie_lunga: 'consilier cadastru în cadrul OCPI Constanța, Serviciul Cadastru - Biroul de Înregistrare Sistematică',
    functie_scurta: 'consilier cadastru',
    dinamic: false
  },

  // INDEX 5 - Silvia Ștefan → Reprezentant Primărie (UAT DINAMIC)
  5: {
    functie_lunga_template: 'reprezentant al Primăriei Comunei {UAT}',
    functie_scurta_template: 'reprezentant Primăria Comunei {UAT}',
    dinamic: true,
    campuri_dinamice: ['uat']
  },

  // INDEX 6 - Reprezentant Prestator (AUTORIZAT DINAMIC)
  6: {
    functie_lunga_template: 'reprezentant al Prestatorului {AUTORIZAT}',
    functie_scurta_template: 'reprezentant al {AUTORIZAT}',
    dinamic: true,
    campuri_dinamice: ['autorizat']
  }
};

// ⭐ TEXT DEFAULT pentru membri EXTRA (peste index 6)
// Dacă adaugi al 8-lea, 9-lea membru, etc. → folosesc acest text
const TEXT_DEFAULT = {
  functie_lunga: 'registrator de carte funciară în cadrul OCPI Constanța, Serviciul Cadastru - Biroul de Înregistrare Sistematică',
  functie_scurta: 'Registrator BIS'
};

// Membri DEFAULT (fallback când nu există date în DB) — v3 (sincronizat cu LocationPreselectionForm)
const DEFAULT_MEMBERS = [
  { name: 'Luminița Pușchiază', role: 'Președinte', functie: 'Registrator de carte funciară' },
  { name: 'Diana Andreea Nedu', role: 'Membru', functie: 'Asistent registrator principal' },
  { name: 'Lavinia Marcu', role: 'Membru', functie: 'Asistent registrator principal' },
  { name: 'Cristina Pașa', role: 'Membru', functie: 'Consilier Cadastru' },
  { name: 'Alina Suciu', role: 'Membru', functie: 'Consilier Cadastru' },
  { name: 'Silvia Ștefan', role: 'Membru', functie: 'Reprezentant al primăriei' },
  { name: '', role: 'Membru', functie: 'Reprezentant al prestatorului' }
];

// ==================== FUNCȚII HELPER ====================

function addHeader(doc, pageNumber) {
  const logoPath = path.join(__dirname, 'public', 'ocpi-header-logo.png');

  try {
    doc.image(logoPath, MARGIN_LEFT, MARGIN_TOP, {
      width: LOGO_WIDTH,
      height: LOGO_HEIGHT,
      fit: [LOGO_WIDTH, LOGO_HEIGHT],
      align: 'left',
      valign: 'top'
    });
  } catch (e) {
    console.warn('⚠️ Logo OCPI nu a putut fi încărcat:', e.message);
  }
}

function addFooter(doc, pageNumber) {
  const footerY = PAGE_HEIGHT - MARGIN_BOTTOM - FOOTER_HEIGHT;

  doc.font('Regular')
    .fontSize(FONT_SIZE_PAGE_NUMBER)
    .fillColor(COLOR_BLACK)
    .text(String(pageNumber), PAGE_WIDTH - MARGIN_RIGHT - 20, footerY - 15, {
      width: 20,
      align: 'right'
    });

  doc.strokeColor(COLOR_BLUE_LINE)
    .lineWidth(2)
    .moveTo(MARGIN_LEFT, footerY)
    .lineTo(PAGE_WIDTH - MARGIN_RIGHT, footerY)
    .stroke();

  doc.strokeColor(COLOR_BLUE_LINE)
    .lineWidth(1)
    .moveTo(MARGIN_LEFT, footerY + 3)
    .lineTo(PAGE_WIDTH - MARGIN_RIGHT, footerY + 3)
    .stroke();

  let currentY = footerY + 6;

  doc.font('Regular')
    .fontSize(FONT_SIZE_FOOTER)
    .fillColor(COLOR_BLACK)
    .text('OCPI CONSTANȚA/Str. Mihai Viteazu, Nr. 2B, Cod poștal 900682, Constanța, Jud. Constanța, ROMÂNIA',
      MARGIN_LEFT, currentY, {
      width: CONTENT_WIDTH - 80,
      align: 'left'
    });

  doc.text('Nr.27921/09/R', PAGE_WIDTH - MARGIN_RIGHT - 75, currentY, {
    width: 75,
    align: 'right'
  });

  currentY += 10;

  doc.text('Certificat SR EN ISO 9001:2015', MARGIN_LEFT, currentY);
  currentY += 10;

  doc.fillColor(COLOR_BLACK)
    .text('Telefon:(0241) 48 86 25,(0241) 48 86 26 ; Fax:(0241) 48 82 48,(0241)61 78 48; e-mail: ',
      MARGIN_LEFT, currentY, { continued: true })
    .fillColor(COLOR_BLUE)
    .text('ct@ancpi.ro', { continued: true, underline: true })
    .fillColor(COLOR_BLACK)
    .text('; ', { continued: true })
    .fillColor(COLOR_BLUE)
    .text('www.ancpi.ro', { underline: true });

  currentY += 10;

  doc.fillColor(COLOR_BLUE)
    .text('Extrase de carte funciară pentru informare online: ePay.ancpi.ro',
      MARGIN_LEFT, currentY);

  doc.font('Regular')
    .fontSize(FONT_SIZE_BODY)
    .fillColor(COLOR_BLACK);
}

// ⭐ FUNCȚIE PENTRU PROCESARE MEMBRU
// roleLong = text COMPLET cu "în cadrul OCPI..." pentru PAGINA 1
// roleShort = exact ce a selectat utilizatorul din dropdown pentru PAGINA 3 (semnături)
function procesareMembruPerIndex(membru, index, dateDinamice) {
  const position = (membru.role && String(membru.role).trim()) ? String(membru.role).trim() : 'Membru';
  const signaturePath = membru.signature_path || null;
  const functieKey = (membru.functie && String(membru.functie).trim()) ? String(membru.functie).trim() : '';

  const LONG_TEMPLATES = {
    'Consilier Cadastru': 'consilier cadastru în cadrul OCPI Constanța, Serviciul Cadastru - Biroul de Înregistrare Sistematică',
    'Asistent registrator principal': 'asistent registrator principal în cadrul OCPI Constanța, Serviciul Cadastru – Biroul de Înregistrare Sistematică',
    'Registrator de carte funciară': 'registrator de carte funciară în cadrul OCPI Constanța, Serviciul Cadastru - Biroul de Înregistrare Sistematică',
    'Șef serviciu SIS': 'Șef Birou în cadrul OCPI Constanța, Serviciul Cadastru - Biroul de Înregistrare Sistematică'
  };

  let roleLong = '';
  let roleShort = functieKey;

  if (LONG_TEMPLATES[functieKey]) {
    roleLong = LONG_TEMPLATES[functieKey];
    roleShort = functieKey;
    console.log(`   ✅ "${membru.name}" → LONG_TEMPLATES["${functieKey}"]`);
  } else if (functieKey === 'Reprezentant al primăriei') {
    const uat = dateDinamice.uat || '';
    roleLong = `reprezentant al Primăriei Comunei ${uat}`;
    roleShort = `reprezentant Primăria Comunei ${uat}`;
    console.log(`   ✅ "${membru.name}" → primărie cu UAT="${uat}"`);
  } else if (functieKey === 'Reprezentant al prestatorului') {
    const autorizat = dateDinamice.autorizat || '';
    roleLong = `reprezentant al Prestatorului ${autorizat}`;
    roleShort = `reprezentant al ${autorizat}`;
    console.log(`   ✅ "${membru.name}" → prestator cu autorizat="${autorizat}"`);
  } else {
    roleLong = functieKey;
    roleShort = functieKey;
    console.log(`   ✅ "${membru.name}" → functie directă="${functieKey}"`);
  }

  return { name: membru.name, roleLong, roleShort, position, signaturePath };
}

// ==================== HELPER DATE ====================

function formatDateRO(val) {
  if (!val || val === '0000-00-00') return null;
  let d;
  if (val instanceof Date) {
    d = val;
  } else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [y, m, day] = val.split('-').map(Number);
    if (m === 0 || day === 0) return null;
    d = new Date(y, m - 1, day);
  } else {
    d = new Date(val);
  }
  if (isNaN(d.getTime())) return null;
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

// ==================== GENERARE PDF ====================

function generatePDF(contestatii, options = {}) {
  const { skipSignatures = false } = options;
  return new Promise((resolve, reject) => {
    try {
      // ⭐ Asigurăm că avem un array de contestații
      const allContestatii = Array.isArray(contestatii) ? contestatii : [contestatii];

      console.log(`📄 Generare PDF pentru ${allContestatii.length} contestații`);

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        bufferPages: true,
        autoFirstPage: false
      });

      const fontsDir = path.join(__dirname, 'fonts');
      try {
        doc.registerFont('Regular', path.join(fontsDir, 'Roboto-Regular.ttf'));
        doc.registerFont('Bold', path.join(fontsDir, 'Roboto-Bold.ttf'));
      } catch (e) {
        console.warn('⚠️ Fonturile custom nu sunt disponibile');
        doc.registerFont('Regular', 'Helvetica');
        doc.registerFont('Bold', 'Helvetica-Bold');
      }

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      let currentPage = 0;

      // ⭐⭐⭐ ITERĂM PRIN TOATE CONTESTAȚIILE ⭐⭐⭐
      allContestatii.forEach((data, contestatieIndex) => {
        console.log(`\n📋 Procesare contestație ${contestatieIndex + 1}/${allContestatii.length}`);

        const numarPV = data.numar_proces_verbal || data.numarProcesVerbal || data.numar_contestatie || '165';
        const dataPV = data.data_proces_verbal || data.dataProcesVerbal || data.data_creare;
        const dataPVFormatata = formatDateRO(dataPV) || '25.04.2024';

        const numarCerere = data.numar_cerere || data.numarCerere || data.numar_contestatie || '1';
        const dataCerere = data.data_cerere || data.dataCerere || data.data_creare;
        const dataCerereFormatata = formatDateRO(dataCerere) || '19.02.2024';

        const numarDecizie = data.numar_decizie_director || data.numarDecizieDirector || '___/__.__.____';

        // ⭐ Date DINAMICE pentru înlocuiri
        const dateDinamice = {
          uat: data.uat || data.regiune || data.judet || 'UAT',
          autorizat: data.autorizat || 'S.C. AUTORIZAT SRL'
        };

        // ⭐⭐⭐ PROCESARE MEMBRI PER INDEX ⭐⭐⭐
        const membriFormular = data.commissionMembers && data.commissionMembers.length > 0
          ? data.commissionMembers
          : DEFAULT_MEMBERS;

        console.log(`  ✅ Procesare ${membriFormular.length} membri PER INDEX:`);

        const commissionMembers = membriFormular.map((m, index) => {
          return procesareMembruPerIndex(m, index, dateDinamice);
        });

        const membriAditionali = data.additionalMembers && data.additionalMembers.length > 0
          ? data.additionalMembers.filter(p => p.nume && p.prenume).map(p => `${p.nume} ${p.prenume}`)
          : [];

        const numeComplet = `${data.nume || ''} ${data.prenume || ''}`.trim() || 'Todirica Ion';
        const domiciliu = data.adresa_personala || data.adresaPersonala || data.adresa || 'Pestera, Str. Florilor nr.55';

        const uat = dateDinamice.uat.toUpperCase();
        const autorizat = dateDinamice.autorizat;
        const sector = data.sectorCadastral || data.sector_cadastral || data.sector || '34';
        const idImobil = data.id_imobil || data.idImobil || '8137';

        const documente = data.documente_atasate || data.documenteAtasate ||
          `Copie C.I. ${numeComplet}, Contract de vanzare aut. sub nr.1462/28.10.1984 de BNP Puia Radu, Cadgen ID ${idImobil}`;

        const decizie = data.observatii ||
          `Admite cererea și dispune rectificarea imobilului cu ID ${idImobil} sector cadastral ${sector}, astfel:`;

        // ==================== PAGINA 1 (per contestație) ====================
        currentPage++;
        doc.addPage();
        addHeader(doc, currentPage);
        addFooter(doc, currentPage);

        let currentY = CONTENT_START_Y;

        doc.font('Regular')
          .fontSize(FONT_SIZE_BODY)
          .fillColor(COLOR_BLACK)
          .text(`Nr. ${numarPV}/${dataPVFormatata}`,
            PAGE_WIDTH - MARGIN_RIGHT - 150, currentY, {
            width: 150,
            align: 'right'
          });

        currentY += 35;

        doc.font('Bold')
          .fontSize(FONT_SIZE_TITLE)
          .fillColor(COLOR_BLACK);

        const titleText = 'PROCES-VERBAL SOLUȚIONARE CERERE DE RECTIFICARE';
        const titleWidth = doc.widthOfString(titleText);
        const titleX = (PAGE_WIDTH - titleWidth) / 2;

        doc.text('PROCES-VERBAL ', titleX, currentY, { continued: true })
          .font('Regular')
          .text('SOLUȚIONARE CERERE DE RECTIFICARE');

        currentY += 30;

        doc.font('Regular')
          .fontSize(FONT_SIZE_BODY)
          .text(
            `În aplicarea prevederilor art. 14 alin. (3) al Legii cadastrului și a publicității imobiliare nr. 7/1996, republicată, cu modificările și completările ulterioare, comisia de soluționare a cererilor de rectificare a documentelor tehnice ale cadastrului publicate pentru unitatea administrativ-teritorială ${uat}, numită prin Decizia Directorului Oficiului de Cadastru și Publicitate Imobiliară CONSTANȚA nr. ${numarDecizie}, compusă din următorii membri:`,
            MARGIN_LEFT, currentY, {
            width: CONTENT_WIDTH,
            align: 'justify',
            lineGap: 2
          }
          );

        currentY = doc.y + 12;

        // ⭐ PAGINA 1 - Membrii
        commissionMembers.forEach((member, idx) => {
          doc.text(
            `${idx + 1}. ${member.name} – ${member.roleLong} – ${member.position.toLowerCase()};`,
            MARGIN_LEFT, currentY, {
            width: CONTENT_WIDTH,
            align: 'left',
            lineGap: 1
          }
          );
          currentY = doc.y + 3;
        });

        currentY += 10;

        doc.text(
          `Analizând cererea de rectificare nr.${numarCerere}/${dataCerereFormatata} formulată de ${numeComplet}, cu domiciliul în ${domiciliu}, cu privire la imobilul identificat în documentele tehnice cadastrale ale unității administrativ-teritoriale ${uat}, sector cadastral ${sector} - cu ID nr. ${idImobil}.`,
          MARGIN_LEFT, currentY, {
          width: CONTENT_WIDTH,
          align: 'justify',
          lineGap: 2
        }
        );

        currentY = doc.y + 12;

        doc.text(`În baza ${documente}.`, MARGIN_LEFT, currentY, {
          width: CONTENT_WIDTH,
          align: 'justify',
          lineGap: 2
        });

        currentY = doc.y + 18;

        doc.font('Bold')
          .fontSize(FONT_SIZE_BODY)
          .text('DECIDE:', MARGIN_LEFT, currentY);

        currentY = doc.y + 12;

        const decizieLines = decizie.split('\n');
        doc.font('Regular')
          .text(decizieLines[0], MARGIN_LEFT, currentY, {
            width: CONTENT_WIDTH,
            align: 'justify',
            lineGap: 2
          });

        // ==================== PAGINA 2 (per contestație) ====================
        currentPage++;
        doc.addPage();
        addHeader(doc, currentPage);
        addFooter(doc, currentPage);

        currentY = CONTENT_START_Y;

        if (decizieLines.length > 1) {
          for (let i = 1; i < decizieLines.length; i++) {
            doc.text(decizieLines[i], MARGIN_LEFT, currentY, {
              width: CONTENT_WIDTH,
              align: 'justify',
              lineGap: 2
            });
            currentY = doc.y + 12;
          }
        }

        doc.font('Regular')
          .fontSize(FONT_SIZE_BODY)
          .fillColor(COLOR_BLACK)
          .text(
            'Comisia de soluționare a cererilor de rectificare a documentelor tehnice ale cadastrului publicate dispune rectificarea imobilului în fișierele .cgxml, precum și în cuprinsul Opisului alfabetic al proprietarilor și Registrului cadastral al imobilelor.',
            MARGIN_LEFT, currentY, {
            width: CONTENT_WIDTH,
            align: 'justify',
            lineGap: 2
          }
          );

        currentY = doc.y + 12;

        doc.text(
          'Prezentul proces-verbal se comunică persoanelor care au formulat cererea de rectificare și altor persoane interesate potrivit documentelor tehnice ale cadastrului.',
          MARGIN_LEFT, currentY, {
          width: CONTENT_WIDTH,
          align: 'justify',
          lineGap: 2
        }
        );

        currentY = doc.y + 12;

        // Page break guard before recipients list
        if (currentY + 80 > PAGE_BOTTOM_LIMIT) {
          doc.addPage();
          addHeader(doc, ++currentPage);
          addFooter(doc, currentPage);
          currentY = CONTENT_START_Y;
        }

        doc.text(`- PRIMĂRIA COMUNEI ${uat}`, MARGIN_LEFT, currentY, { width: CONTENT_WIDTH });
        currentY = doc.y + 2;

        doc.text(`- ${autorizat}`, MARGIN_LEFT, currentY, { width: CONTENT_WIDTH });
        currentY = doc.y + 2;

        doc.text(`- ${numeComplet}`, MARGIN_LEFT, currentY, { width: CONTENT_WIDTH });
        currentY = doc.y + 2;

        membriAditionali.forEach(m => {
          doc.text(`- ${m}`, MARGIN_LEFT, currentY, { width: CONTENT_WIDTH });
          currentY = doc.y + 2;
        });

        // ==================== PAGINA 3 (per contestație) ====================
        currentPage++;
        doc.addPage();
        addHeader(doc, currentPage);
        addFooter(doc, currentPage);

        currentY = CONTENT_START_Y;

        doc.font('Regular')
          .fontSize(FONT_SIZE_BODY)
          .fillColor(COLOR_BLACK)
          .text(
            'Procesul-verbal poate fi contestat cu plângere la judecătorie, în termen de 15 zile de la comunicare.',
            MARGIN_LEFT, currentY, {
            width: CONTENT_WIDTH,
            align: 'justify',
            lineGap: 2
          }
          );

        currentY = doc.y + 18;

        // Page break guard before signatures section
        if (currentY + 60 > PAGE_BOTTOM_LIMIT) {
          doc.addPage();
          addHeader(doc, ++currentPage);
          addFooter(doc, currentPage);
          currentY = CONTENT_START_Y;
        }

        doc.font('Bold')
          .fontSize(FONT_SIZE_BODY)
          .text('Semnăturile membrilor desemnați cu soluționarea cererilor de rectificare:',
            MARGIN_LEFT, currentY, {
            width: CONTENT_WIDTH
          });

        currentY = doc.y + 8;

        // ⭐ PAGINA 3 - Semnături
        doc.font('Regular');
        const SIG_W = 90;
        const SIG_H = 36;
        const SIG_X = PAGE_WIDTH - MARGIN_RIGHT - SIG_W;
        commissionMembers.forEach(member => {
          // Page break guard for each member signature row
          if (currentY + SIG_H + 10 > PAGE_BOTTOM_LIMIT) {
            doc.addPage();
            addHeader(doc, ++currentPage);
            addFooter(doc, currentPage);
            currentY = CONTENT_START_Y;
          }
          const lineY = currentY;
          doc.text(`${member.name} - ${member.roleShort} - ${member.position.toLowerCase()};`, MARGIN_LEFT, lineY, {
            width: CONTENT_WIDTH - SIG_W - 8,
            lineGap: 2
          });
          const boxY = lineY - 4;
          if (!skipSignatures && member.signaturePath) {
            const absPath = path.join(__dirname, 'public', member.signaturePath.replace('/static/', ''));
            if (fs.existsSync(absPath)) {
              try {
                doc.image(absPath, SIG_X, boxY, { width: SIG_W, height: SIG_H, fit: [SIG_W, SIG_H] });
              } catch (e) {
                // Fără semnătură — nu desenăm nimic
              }
            }
          }
          currentY = Math.max(doc.y, boxY + SIG_H) + 4;
        });

        currentY = doc.y + 18;

        // Page break guard before GDPR + Notă block (~150px needed)
        if (currentY + 150 > PAGE_BOTTOM_LIMIT) {
          doc.addPage();
          addHeader(doc, ++currentPage);
          addFooter(doc, currentPage);
          currentY = CONTENT_START_Y;
        }

        doc.font('Bold')
          .fontSize(10)
          .text(
            'Prezentul document conține date cu caracter personal protejate de prevederile Regulamentului UE 2016/679 privind protecția persoanelor fizice în ceea ce privește prelucrarea datelor cu caracter personal și privind libera circulație a acestor date (GDPR - General Data Protection Regulation).',
            MARGIN_LEFT, currentY, {
            width: CONTENT_WIDTH,
            align: 'justify',
            lineGap: 1.5
          }
          );

        currentY = doc.y + 12;

        // Page break guard before Notă
        if (currentY + 80 > PAGE_BOTTOM_LIMIT) {
          doc.addPage();
          addHeader(doc, ++currentPage);
          addFooter(doc, currentPage);
          currentY = CONTENT_START_Y;
        }

        doc.text('Notă:', MARGIN_LEFT, currentY);
        currentY = doc.y + 4;

        doc.font('Regular')
          .text(
            'În situația în care cererea de rectificare afectează și alte imobile decât imobilul contestat, prin procesul verbal se dispune notarea cererii de rectificare în fișierele cgxml ale imobilelor afectate și rectificarea acestor imobilelor conform situației rezultate din acte, măsurători etc.',
            MARGIN_LEFT, currentY, {
            width: CONTENT_WIDTH,
            align: 'justify',
            lineGap: 1.5
          }
          );

        console.log(`  ✅ Contestație ${contestatieIndex + 1} - ${numeComplet} - procesată (pagini ${currentPage - 1}-${currentPage})`);
      });

      doc.end();

      console.log(`\n✅ PDF generat cu succes - ${allContestatii.length} contestații, ${currentPage} pagini total`);

    } catch (error) {
      console.error('❌ Eroare la generarea PDF:', error);
      reject(error);
    }
  });
}

module.exports = { generatePDF };