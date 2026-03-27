const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { generatePDF } = require('./pdfGenerator');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret-key';

// Helper: returnează NULL în loc de string gol sau '0000-00-00' pentru câmpuri DATE
const cleanDate = (val) => (val && val !== '' && val !== '0000-00-00') ? val : null;

// Multer config pentru semnături
const signaturesDir = path.join(__dirname, 'public', 'signatures');
if (!fs.existsSync(signaturesDir)) {
    fs.mkdirSync(signaturesDir, { recursive: true });
}
const signatureStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, signaturesDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.png';
        const uniqueName = `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
        cb(null, uniqueName);
    }
});
const uploadSignature = multer({
    storage: signatureStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Doar imagini acceptate'));
    }
});

const app = express();
const PORT = 8082;

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'same-site' }
}));

const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { Error: 'Prea multe încercări de autentificare. Încercați din nou peste un minut.' },
    standardHeaders: true,
    legacyHeaders: false
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: { message: 'Prea multe înregistrări de pe acest IP.' },
    standardHeaders: true,
    legacyHeaders: false
});

app.use(cors({
    origin: function (origin, callback) {
    if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://10.13.1.43:')) {
        callback(null, true);
    } else {
        callback(new Error('Blocat de CORS'));
    }
},
    methods: ["POST", "GET", "PUT", "DELETE"],
    credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use('/static', express.static(path.join(__dirname, 'public')));

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ocpi',
    connectionLimit: 10
});

db.query('SELECT 1', (err) => {
    if (err) {
        console.error('❌ Nu s-a putut conecta la MySQL:', err.message);
        process.exit(1);
    }
    console.log('Connected to MySQL database (pool)');

    // ⭐ Migrare: adaugă coloana deleted_at la contestatii (soft delete)
    db.query(`ALTER TABLE contestatii ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL`, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') {
            console.error('Eroare la adăugarea coloanei deleted_at:', err.message);
        } else if (!err) {
            console.log('✅ Coloana deleted_at adăugată la contestatii');
        }
    });

    // ⭐ Migrare: adaugă coloana sector_cadastral la commission_members
    db.query(`ALTER TABLE commission_members ADD COLUMN sector_cadastral VARCHAR(100)`, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') {
            console.error('Eroare la adăugarea coloanei sector_cadastral:', err.message);
        } else if (!err) {
            console.log('✅ Coloana sector_cadastral adăugată la commission_members');
        }
    });

    // ⭐ Migrare: adaugă coloana functie la commission_members
    db.query(`ALTER TABLE commission_members ADD COLUMN functie VARCHAR(100) DEFAULT NULL`, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') {
            console.error('Eroare la adăugarea coloanei functie:', err.message);
        } else if (!err) {
            console.log('✅ Coloana functie adăugată la commission_members');
        }
    });

    // ⭐ Migrare BUG #2: adaugă deleted_at la person (soft delete + GDPR)
    db.query(`ALTER TABLE person ADD COLUMN deleted_at DATETIME DEFAULT NULL`, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') {
            console.error('Eroare la adăugarea coloanei deleted_at la person:', err.message);
        } else if (!err) {
            console.log('✅ Coloana deleted_at adăugată la person');
        }
    });

    // ⭐ Migrare BUG #2: adaugă deleted_at la adresa (soft delete)
    db.query(`ALTER TABLE adresa ADD COLUMN deleted_at DATETIME DEFAULT NULL`, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') {
            console.error('Eroare la adăugarea coloanei deleted_at la adresa:', err.message);
        } else if (!err) {
            console.log('✅ Coloana deleted_at adăugată la adresa');
        }
    });

    // ⭐ Migrare BUG #3: adaugă sector_cadastral la adresa
    db.query(`ALTER TABLE adresa ADD COLUMN sector_cadastral VARCHAR(100) DEFAULT NULL`, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') {
            console.error('Eroare la adăugarea coloanei sector_cadastral la adresa:', err.message);
        } else if (!err) {
            console.log('✅ Coloana sector_cadastral adăugată la adresa');
        }
    });

    // ⭐ Migrare: adaugă numar_contract la adresa
    db.query(`ALTER TABLE adresa ADD COLUMN numar_contract VARCHAR(100) DEFAULT NULL`, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') {
            console.error('Eroare la adăugarea coloanei numar_contract la adresa:', err.message);
        } else if (!err) {
            console.log('✅ Coloana numar_contract adăugată la adresa');
        }
    });

    // ⭐ Migrare: adaugă numar_decizie_director la adresa
    db.query(`ALTER TABLE adresa ADD COLUMN numar_decizie_director VARCHAR(25) DEFAULT NULL AFTER numar_contract`, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') {
            console.error('Eroare la adăugarea coloanei numar_decizie_director la adresa:', err.message);
        } else if (!err) {
            console.log('✅ Coloana numar_decizie_director adăugată la adresa');
        }
    });

    // ⭐ Migrare: adaugă signature_path la commission_members
    db.query(`ALTER TABLE commission_members ADD COLUMN signature_path VARCHAR(255) DEFAULT NULL`, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') {
            console.error('Eroare la adăugarea coloanei signature_path:', err.message);
        } else if (!err) {
            console.log('✅ Coloana signature_path adăugată la commission_members');
        }
    });

    // ⭐ Migrare: adaugă coloanele admis și respins dacă lipsesc
    db.query(`ALTER TABLE contestatii ADD COLUMN admis TINYINT(1) DEFAULT 0`, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') {
            console.error('Eroare la adăugarea coloanei admis:', err.message);
        }
    });
    db.query(`ALTER TABLE contestatii ADD COLUMN respins TINYINT(1) DEFAULT 0`, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') {
            console.error('Eroare la adăugarea coloanei respins:', err.message);
        }
    });

    // ⭐ Migrare: adaugă coloana locked pentru blocarea contestațiilor
    db.query(`ALTER TABLE contestatii ADD COLUMN locked TINYINT(1) DEFAULT 0`, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') {
            console.error('Eroare la adăugarea coloanei locked:', err.message);
        } else if (!err) {
            console.log('✅ Coloana locked adăugată la contestatii');
        }
    });

    // ⭐ Cleanup: înlocuiește '0000-00-00' cu NULL în câmpurile DATE
    db.query(`UPDATE contestatii SET data_proces_verbal = NULL WHERE data_proces_verbal = '0000-00-00'`);
    db.query(`UPDATE contestatii SET data_cerere = NULL WHERE data_cerere = '0000-00-00'`);
    db.query(`UPDATE contestatii SET data_aleasa = NULL WHERE data_aleasa = '0000-00-00'`);

    // ⭐ Indecși pentru performanță
    db.query(`ALTER TABLE contestatii ADD INDEX idx_numar (numar_contestatie)`, (err) => { if (err && err.code !== 'ER_DUP_KEYNAME') {} });
    db.query(`ALTER TABLE person ADD INDEX idx_contestatie (contestatie_id)`, (err) => { if (err && err.code !== 'ER_DUP_KEYNAME') {} });
    db.query(`ALTER TABLE adresa ADD INDEX idx_contestatie (contestatie_id)`, (err) => { if (err && err.code !== 'ER_DUP_KEYNAME') {} });
    db.query(`ALTER TABLE contracts ADD INDEX idx_numar (numar_contract)`, (err) => { if (err && err.code !== 'ER_DUP_KEYNAME') {} });

    // ⭐ Creare tabel contracts (salvare date contract pentru refolosire)
    db.query(`CREATE TABLE IF NOT EXISTS contracts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numar_contract VARCHAR(100) NOT NULL,
        judet VARCHAR(50),
        uat VARCHAR(100),
        sector_cadastral VARCHAR(100),
        autorizat VARCHAR(200),
        adresa_autorizat TEXT,
        adresa_primarie TEXT,
        numar_decizie_director VARCHAR(25),
        commission_members_json TEXT,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_contract (numar_contract)
    )`, (err) => {
        if (err) console.error('Eroare creare tabel contracts:', err.message);
        else console.log('✅ Tabel contracts verificat/creat');
    });
});

// Verificare și creare tabele
db.query(`SHOW TABLES LIKE 'contestatii'`, (err, results) => {
    if (err) {
        console.error('Error checking if tables exist:', err);
        return;
    }

    if (results.length === 0) {
        console.log('Tables do not exist, creating them...');

        db.query(`
            CREATE TABLE contestatii (
                id INT AUTO_INCREMENT PRIMARY KEY,
                numar_contestatie INT NOT NULL,
                numar_proces_verbal VARCHAR(50),
                data_proces_verbal DATE,
                numar_cerere VARCHAR(50),
                data_cerere DATE,
                data_aleasa DATE,
                id_imobil VARCHAR(100),
                documente_atasate TEXT,
                observatii TEXT,
                verificat_teren TINYINT(1) DEFAULT 0,
                admis TINYINT(1) DEFAULT 0,
                respins TINYINT(1) DEFAULT 0,
                user_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `, (createErr) => {
            if (createErr) {
                console.error('Error creating contestatii table:', createErr);
            } else {
                console.log('Table contestatii created successfully');

                db.query(`
                    CREATE TABLE person (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        contestatie_id INT NOT NULL,
                        nume VARCHAR(100) NOT NULL,
                        prenume VARCHAR(100) NOT NULL,
                        cnp VARCHAR(13) NOT NULL,
                        adresa_personala TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (contestatie_id) REFERENCES contestatii(id) ON DELETE CASCADE
                    )
                `, (createErrPerson) => {
                    if (createErrPerson) {
                        console.error('Error creating person table:', createErrPerson);
                    } else {
                        console.log('Table person created successfully');

                        db.query(`
                            CREATE TABLE adresa (
                                id INT AUTO_INCREMENT PRIMARY KEY,
                                contestatie_id INT NOT NULL,
                                judet VARCHAR(50),
                                uat VARCHAR(100),
                                adresa_imobil TEXT,
                                adresa_primarie TEXT,
                                autorizat VARCHAR(100),
                                adresa_autorizat TEXT,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                FOREIGN KEY (contestatie_id) REFERENCES contestatii(id) ON DELETE CASCADE
                            )
                        `, (createErrAdresa) => {
                            if (createErrAdresa) {
                                console.error('Error creating adresa table:', createErrAdresa);
                            } else {
                                console.log('Table adresa created successfully');
                            }
                        });
                    }
                });
            }
        });
    }
});

const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ Status: "Error", Error: "You are not authenticated" });
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ Status: "Error", Error: "Token is not okay" });
        }
        req.user = decoded.user;
        next();
    });
}

app.get('/verify', verifyUser, (req, res) => {
    return res.json({ Status: "Success", name: req.user.name });
});

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    return res.json({ Status: "Success" });
});

app.post('/register', registerLimiter, async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Numele este obligatoriu' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Adresa de email nu este validă' });
    }
    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Parola trebuie să aibă cel puțin 6 caractere' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        db.query(sql, [name.trim(), email.toLowerCase().trim(), hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'Există deja un cont cu această adresă de email' });
                }
                return res.status(500).json({ message: 'Eroare la înregistrarea utilizatorului' });
            }
            res.status(201).json({ message: 'User registered successfully' });
        });
    } catch (error) {
        res.status(500).json({ message: 'Eroare la procesarea parolei' });
    }
});

app.post('/login', loginLimiter, (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ Error: 'Email și parola sunt obligatorii' });
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err || results.length === 0) {
            res.status(401).json({ Error: 'Invalid email or password' });
        } else {
            const user = results[0];
            const isValid = await bcrypt.compare(password, user.password);
            if (isValid) {
                const token = jwt.sign({ user }, JWT_SECRET, { expiresIn: '1d' });
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 24 * 60 * 60 * 1000
                });
                res.status(200).json({ Status: "Success" });
            } else {
                res.status(401).json({ Error: 'Invalid email or password' });
            }
        }
    });
});

// ⭐ Upload semnătură imagine pentru un membru al comisiei
app.post('/upload-signature', verifyUser, uploadSignature.single('signature'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Niciun fișier uploadat' });
    const signaturePath = `/static/signatures/${req.file.filename}`;
    res.json({ signaturePath });
});

// ⭐ NOU: Endpoint pentru salvarea datelor de locație cu comisia
app.post('/location-preselection', verifyUser, (req, res) => {
    try {
        const { regiune, uat, sectorCadastral, adresaPrimarie, autorizat, adresaAutorizat, numarContract, numarDecizieDirector, commissionMembers } = req.body;
        console.log('📍 Date locație primite:', { regiune, uat, sectorCadastral, numarContract, commissionMembers: commissionMembers?.length });

        if (!numarContract) {
            return res.json({ status: 'success' });
        }

        const sql = `INSERT INTO contracts (numar_contract, judet, uat, sector_cadastral, autorizat, adresa_autorizat, adresa_primarie, numar_decizie_director, commission_members_json, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            judet = VALUES(judet), uat = VALUES(uat), sector_cadastral = VALUES(sector_cadastral),
            autorizat = VALUES(autorizat), adresa_autorizat = VALUES(adresa_autorizat),
            adresa_primarie = VALUES(adresa_primarie), numar_decizie_director = VALUES(numar_decizie_director),
            commission_members_json = VALUES(commission_members_json)`;

        db.query(sql, [
            numarContract, regiune, uat, sectorCadastral || null,
            autorizat, adresaAutorizat, adresaPrimarie,
            numarDecizieDirector || null,
            JSON.stringify(commissionMembers || []),
            req.user.id
        ], (err, result) => {
            if (err) {
                console.error('Eroare salvare contract:', err);
                return res.status(500).json({ status: 'error', message: err.message });
            }
            res.json({ status: 'success', id: result.insertId || result.affectedRows });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ⭐ GET /contracts/search — căutare contracte salvate
app.get('/contracts/search', verifyUser, (req, res) => {
    const q = req.query.q;
    if (!q) return res.json([]);
    const sql = `SELECT * FROM contracts WHERE numar_contract LIKE ? ORDER BY created_at DESC LIMIT 10`;
    db.query(sql, [`%${q}%`], (err, results) => {
        if (err) return res.status(500).json({ error: 'Eroare căutare' });
        const parsed = results.map(r => ({
            ...r,
            commissionMembers: r.commission_members_json ? JSON.parse(r.commission_members_json) : []
        }));
        res.json(parsed);
    });
});



const getNextContestationNumber = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT MAX(numar_contestatie) as max_num FROM contestatii';
        db.query(sql, (err, results) => {
            if (err) {
                console.error('Eroare la obținerea ultimului număr de contestație:', err);
                reject(err);
            } else {
                const maxNum = results[0].max_num || 0;
                resolve(parseInt(maxNum) + 1);
            }
        });
    });
};






// ⭐ ACTUALIZAT: Endpoint pentru adăugare contestație cu membri comisie
app.post('/contestatii', verifyUser, async (req, res) => {
    try {
        const {
            numarProcesVerbal, dataProcesVerbal,
            numarCerere, dataCerere, dataAleasa,
            idImobil, documenteAtasate, observatii,
            verificatTeren, admis, respins,
            nume, prenume, cnp, adresaPersonala,
            regiune, uat, sectorCadastral, numarContract, numarDecizieDirector, adresaImobil,
            adresaPrimarie, autorizat, adresaAutorizat,
            commissionMembers, // Membrii comisiei
            additionalMembers // ⭐ Membrii adiționale
        } = req.body;

        if (!nume || !nume.trim()) {
            return res.status(400).json({ status: 'error', message: 'Numele este obligatoriu' });
        }
        if (!prenume || !prenume.trim()) {
            return res.status(400).json({ status: 'error', message: 'Prenumele este obligatoriu' });
        }
        if (!cnp || !/^\d{13}$/.test(cnp)) {
            return res.status(400).json({ status: 'error', message: 'CNP-ul trebuie să conțină exact 13 cifre' });
        }

        const numarContestatie = await getNextContestationNumber();
        const userId = req.user.id;

        const sqlContestatie = `
        INSERT INTO contestatii (
            numar_contestatie,
            numar_proces_verbal, data_proces_verbal,
            numar_cerere, data_cerere, data_aleasa,
            id_imobil, documente_atasate, observatii,
            verificat_teren, admis, respins, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(sqlContestatie, [
            numarContestatie,
            numarProcesVerbal, cleanDate(dataProcesVerbal),
            numarCerere, cleanDate(dataCerere), cleanDate(dataAleasa),
            idImobil, documenteAtasate, observatii,
            verificatTeren ? 1 : 0, admis ? 1 : 0, respins ? 1 : 0, userId
        ], (err, result) => {
            if (err) {
                console.error('Eroare la inserarea contestației:', err);
                return res.status(500).json({ status: 'error', message: 'Nu s-a putut salva contestația' });
            }

            const contestatieId = result.insertId;

            const sqlPerson = `
            INSERT INTO person (
                contestatie_id, nume, prenume, cnp, adresa_personala
            ) VALUES (?, ?, ?, ?, ?)`;

            db.query(sqlPerson, [contestatieId, nume, prenume, cnp, adresaPersonala], (errPerson) => {
                if (errPerson) {
                    console.error('Eroare la inserarea persoanei:', errPerson);
                    return res.status(500).json({ status: 'error', message: 'Nu s-a putut salva persoana' });
                }

                const sqlAdresa = `
                INSERT INTO adresa (
                    contestatie_id, judet, uat, sector_cadastral, numar_contract, numar_decizie_director, adresa_imobil,
                    adresa_primarie, autorizat, adresa_autorizat
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                db.query(sqlAdresa, [
                    contestatieId, regiune, uat, sectorCadastral, numarContract || null, numarDecizieDirector || null, adresaImobil,
                    adresaPrimarie, autorizat, adresaAutorizat
                ], (errAdresa) => {
                    if (errAdresa) {
                        console.error('Eroare la inserarea adresei:', errAdresa);
                        return res.status(500).json({ status: 'error', message: 'Nu s-a putut salva adresa' });
                    }

                    // ⭐⭐⭐ NOU: Salvează membrii comisiei SECVENȚIAL (BUG 4: păstrează ordinea) ⭐⭐⭐
                    const validMembers = commissionMembers && commissionMembers.length > 0
                        ? commissionMembers.filter(m => m.name && m.name.trim() !== '')
                        : [];

                    function saveCommissionMembersSeq(index) {
                        if (index >= validMembers.length) {
                            console.log(`✅ Contestație ${numarContestatie} + ${validMembers.length} membri comisie, ID: ${contestatieId}`);
                            saveAdditionalMembers();
                            return;
                        }
                        const member = validMembers[index];
                        const sqlMember = `
                            INSERT INTO commission_members (contestatie_id, name, \`role\`, sector_cadastral, functie, signature_path)
                            VALUES (?, ?, ?, ?, ?, ?)`;
                        db.query(sqlMember, [contestatieId, member.name, member.role || '', sectorCadastral || null, member.functie || null, member.signaturePath || null], (errMember) => {
                            if (errMember) {
                                console.error('Eroare la salvarea membrului comisiei:', errMember);
                            }
                            saveCommissionMembersSeq(index + 1);
                        });
                    }

                    saveCommissionMembersSeq(0);

                    function saveAdditionalMembers() {
                        // BUG 1: Filtrăm membrii adiționale cu același CNP ca persoana principală (evităm dubluri)
                        const filteredAdditional = (additionalMembers || []).filter(m => m.cnp !== cnp);

                        if (filteredAdditional.length > 0) {
                            function saveAdditionalSeq(index) {
                                if (index >= filteredAdditional.length) {
                                    console.log(`✅ Contestație ${numarContestatie}, ID: ${contestatieId}, Membri adiționale: ${filteredAdditional.length}`);
                                    res.status(201).json({
                                        status: 'success',
                                        id: contestatieId,
                                        message: 'Contestația a fost salvată cu succes'
                                    });
                                    return;
                                }
                                const member = filteredAdditional[index];
                                const sqlAdditional = `
        INSERT INTO person (contestatie_id, nume, prenume, cnp, adresa_personala)
        VALUES (?, ?, ?, ?, ?)`;
                                db.query(sqlAdditional, [
                                    contestatieId,
                                    member.nume,
                                    member.prenume,
                                    member.cnp,
                                    member.adresaPersonala
                                ], (errAdditional) => {
                                    if (errAdditional) {
                                        console.error('Eroare la salvarea membrului adițional:', errAdditional);
                                    }
                                    saveAdditionalSeq(index + 1);
                                });
                            }
                            saveAdditionalSeq(0);
                        } else {
                            console.log(`Contestație ${numarContestatie} creată, ID: ${contestatieId}`);
                            res.status(201).json({
                                status: 'success',
                                id: contestatieId,
                                message: 'Contestația a fost salvată cu succes'
                            });
                        }
                    }

                });
            });
        });
    } catch (error) {
        console.error('Eroare la procesarea contestației:', error);
        res.status(500).json({ status: 'error', message: 'Nu s-a putut procesa cererea' });
    }
});

app.get('/contestatii', verifyUser, (req, res) => {
    const sql = `
    SELECT c.*, p.nume, p.prenume, p.cnp, p.adresa_personala,
           a.judet as regiune, a.uat, a.sector_cadastral, a.numar_contract, a.numar_decizie_director, a.adresa_imobil as adresa,
           a.adresa_primarie, a.autorizat, a.adresa_autorizat
    FROM contestatii c
    LEFT JOIN person p ON c.id = p.contestatie_id AND p.id = (
        SELECT MIN(p2.id) FROM person p2 WHERE p2.contestatie_id = c.id AND p2.deleted_at IS NULL
    )
    LEFT JOIN adresa a ON c.id = a.contestatie_id
    WHERE c.deleted_at IS NULL
    ORDER BY c.numar_contestatie DESC`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Eroare la obținerea contestațiilor:', err);
            return res.status(500).json({ error: 'Eroare la obținerea contestațiilor' });
        }
        res.json(results);
    });
});

app.post('/filter-contestatii', verifyUser, (req, res) => {
    const { nume, prenume, cnp, regiune, adresa, observatii, dataStart, dataEnd, numarContestatie, uat, sectorCadastral, numarContract, idImobil, statusDecizie, verificatTeren } = req.body;

    let sql = `
    SELECT c.*, p.nume, p.prenume, p.cnp, p.adresa_personala,
           a.judet as regiune, a.uat, a.sector_cadastral, a.numar_contract, a.numar_decizie_director, a.adresa_imobil as adresa,
           a.adresa_primarie, a.autorizat, a.adresa_autorizat
    FROM contestatii c
    LEFT JOIN person p ON c.id = p.contestatie_id AND p.id = (
        SELECT MIN(p2.id) FROM person p2 WHERE p2.contestatie_id = c.id AND p2.deleted_at IS NULL
    )
    LEFT JOIN adresa a ON c.id = a.contestatie_id
    WHERE c.deleted_at IS NULL`;

    const params = [];

    if (nume) {
        sql += ' AND p.nume LIKE ?';
        params.push(`%${nume}%`);
    }
    if (prenume) {
        sql += ' AND p.prenume LIKE ?';
        params.push(`%${prenume}%`);
    }
    if (cnp) {
        sql += ' AND p.cnp LIKE ?';
        params.push(`%${cnp}%`);
    }
    if (regiune) {
        sql += ' AND a.judet = ?';
        params.push(regiune);
    }
    if (adresa) {
        sql += ' AND a.adresa_imobil LIKE ?';
        params.push(`%${adresa}%`);
    }
    if (observatii) {
        sql += ' AND c.observatii LIKE ?';
        params.push(`%${observatii}%`);
    }
    if (numarContestatie) {
        sql += ' AND c.numar_contestatie = ?';
        params.push(numarContestatie);
    }
    if (dataStart) {
        sql += ' AND DATE(c.data_aleasa) >= DATE(?)';
        params.push(dataStart);
    }
    if (dataEnd) {
        sql += ' AND DATE(c.data_aleasa) <= DATE(?)';
        params.push(dataEnd);
    }
    if (uat) {
        sql += ' AND a.uat LIKE ?';
        params.push(`%${uat}%`);
    }
    if (sectorCadastral) {
        sql += ' AND a.sector_cadastral LIKE ?';
        params.push(`%${sectorCadastral}%`);
    }
    if (numarContract) {
        sql += ' AND a.numar_contract LIKE ?';
        params.push(`%${numarContract}%`);
    }
    if (idImobil) {
        sql += ' AND c.id_imobil LIKE ?';
        params.push(`%${idImobil}%`);
    }
    if (statusDecizie === 'admis') {
        sql += ' AND c.admis = 1';
    } else if (statusDecizie === 'respins') {
        sql += ' AND c.respins = 1';
    } else if (statusDecizie === 'pending') {
        sql += ' AND c.admis = 0 AND c.respins = 0';
    }
    if (verificatTeren === '1') {
        sql += ' AND c.verificat_teren = 1';
    } else if (verificatTeren === '0') {
        sql += ' AND c.verificat_teren = 0';
    }

    sql += ' ORDER BY c.numar_contestatie ASC';

    db.query(sql, params, (err, contestatii) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Eroare la filtrarea contestațiilor' });
        }

        if (contestatii.length === 0) {
            return res.json([]);
        }

        let processedCount = 0;
        const contestatiiWithMembers = [];

        contestatii.forEach((contestatie) => {
            // Fetch commission members
            const sqlMembers = `
                SELECT name, \`role\`, functie, signature_path
                FROM commission_members
                WHERE contestatie_id = ?
                ORDER BY id ASC`;

            // Fetch ALL additional persons for this contestatie
            const sqlAdditionalPersons = `
                SELECT nume, prenume, cnp, adresa_personala
                FROM person
                WHERE contestatie_id = ? AND deleted_at IS NULL AND id != (
                    SELECT MIN(id) FROM person WHERE contestatie_id = ? AND deleted_at IS NULL
                )
                ORDER BY id ASC`;

            db.query(sqlMembers, [contestatie.id], (errMembers, members) => {
                if (errMembers) {
                    console.error('Eroare membri:', errMembers);
                    contestatie.commissionMembers = [];
                } else {
                    contestatie.commissionMembers = members;
                    console.log(`📋 Contestație ID ${contestatie.id}: ${members.length} membri comisie`);
                }

                db.query(sqlAdditionalPersons, [contestatie.id, contestatie.id], (errAdditional, additionalPersons) => {
                    if (errAdditional) {
                        console.error('Eroare persoane adiționale:', errAdditional);
                        contestatie.additionalMembers = [];
                    } else {
                        contestatie.additionalMembers = additionalPersons;
                        console.log(`📋 Contestație ID ${contestatie.id}: ${additionalPersons.length} persoane adiționale`);
                    }

                    contestatiiWithMembers.push(contestatie);
                    processedCount++;

                    if (processedCount === contestatii.length) {
                        console.log(`✅ Trimis ${contestatiiWithMembers.length} contestații CU membri la PDF`);
                        res.json(contestatiiWithMembers);
                    }
                });
            });
        });
    });
});

app.get('/contestatii/:id', verifyUser, (req, res) => {
    const { id } = req.params;

    const sql = `
    SELECT c.*, p.nume, p.prenume, p.cnp, p.adresa_personala,
           a.judet as regiune, a.uat, a.sector_cadastral, a.numar_contract, a.numar_decizie_director, a.adresa_imobil as adresa,
           a.adresa_primarie, a.autorizat, a.adresa_autorizat
    FROM contestatii c
    LEFT JOIN person p ON c.id = p.contestatie_id AND p.id = (
        SELECT MIN(p2.id) FROM person p2 WHERE p2.contestatie_id = c.id AND p2.deleted_at IS NULL
    )
    LEFT JOIN adresa a ON c.id = a.contestatie_id
    WHERE c.id = ? AND c.deleted_at IS NULL`;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Eroare la obținerea contestației:', err);
            return res.status(500).json({ error: 'Eroare la obținerea contestației' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Contestația nu a fost găsită' });
        }

        res.json(results[0]);
    });
});

app.get('/contestatii/:id/members', verifyUser, (req, res) => {
    const { id } = req.params;
    const sql = `SELECT id, nume, prenume, cnp, adresa_personala as adresaPersonala
                 FROM person
                 WHERE contestatie_id = ? AND deleted_at IS NULL
                 ORDER BY id ASC`;
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Eroare la obținerea membrilor' });
        res.json(results.slice(1)); // skip first (persoana principală)
    });
});

// ⭐ POST /contestatii/lock — blochează contestații (nu mai pot fi editate/șterse)
app.post('/contestatii/lock', verifyUser, (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Selectați cel puțin o contestație' });
    }
    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE contestatii SET locked = 1 WHERE id IN (${placeholders}) AND deleted_at IS NULL`;
    db.query(sql, ids.map(id => parseInt(id)), (err, result) => {
        if (err) return res.status(500).json({ error: 'Eroare la blocarea contestațiilor' });
        res.json({ status: 'success', locked: result.affectedRows });
    });
});

// ⭐ POST /contestatii/unlock — deblochează contestații
app.post('/contestatii/unlock', verifyUser, (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Selectați cel puțin o contestație' });
    }
    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE contestatii SET locked = 0 WHERE id IN (${placeholders}) AND deleted_at IS NULL`;
    db.query(sql, ids.map(id => parseInt(id)), (err, result) => {
        if (err) return res.status(500).json({ error: 'Eroare la deblocarea contestațiilor' });
        res.json({ status: 'success', unlocked: result.affectedRows });
    });
});

app.put('/contestatii/:id', verifyUser, (req, res) => {
    const { id } = req.params;
    const {
        dataAleasa, numar_proces_verbal, data_proces_verbal,
        numar_cerere, data_cerere, id_imobil, documente_atasate,
        observatii, verificat_teren, admis, respins,
        nume, prenume, cnp, adresa_personala,
        regiune, uat, adresa, adresa_primarie, autorizat, adresa_autorizat,
        sector_cadastral, numar_contract, numar_decizie_director,
        additionalMembers
    } = req.body;

    // Verifică dacă contestația este blocată
    db.query(`SELECT locked FROM contestatii WHERE id = ? AND deleted_at IS NULL`, [id], (errCheck, rows) => {
        if (errCheck || !rows || rows.length === 0) {
            return res.status(404).json({ error: 'Contestația nu a fost găsită' });
        }
        if (rows[0].locked === 1) {
            return res.status(403).json({ error: 'Contestația este blocată și nu poate fi editată' });
        }

        if (cnp && !/^\d{13}$/.test(cnp)) {
            return res.status(400).json({ error: 'CNP-ul trebuie să conțină exact 13 cifre' });
        }

        const sqlContestatie = `
            UPDATE contestatii
            SET numar_proces_verbal = ?, data_proces_verbal = ?,
                numar_cerere = ?, data_cerere = ?, data_aleasa = ?,
                id_imobil = ?, documente_atasate = ?, observatii = ?,
                verificat_teren = ?, admis = ?, respins = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`;

        db.query(sqlContestatie, [
            numar_proces_verbal, cleanDate(data_proces_verbal),
            numar_cerere, cleanDate(data_cerere), cleanDate(dataAleasa),
            id_imobil, documente_atasate, observatii,
            verificat_teren ? 1 : 0, admis ? 1 : 0, respins ? 1 : 0, id
        ], (errContestatie) => {
            if (errContestatie) {
                console.error('Eroare la actualizarea contestației:', errContestatie);
                return res.status(500).json({ error: 'Eroare la actualizarea contestației' });
            }

            const sqlPerson = `
                UPDATE person
                SET nume = ?, prenume = ?, cnp = ?, adresa_personala = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE contestatie_id = ?`;

            db.query(sqlPerson, [nume, prenume, cnp, adresa_personala, id], (errPerson) => {
                if (errPerson) {
                    console.error('Eroare la actualizarea persoanei:', errPerson);
                    return res.status(500).json({ error: 'Eroare la actualizarea persoanei' });
                }

                const sqlAdresa = `
                    UPDATE adresa
                    SET judet = ?, uat = ?, sector_cadastral = ?, numar_contract = ?, numar_decizie_director = ?, adresa_imobil = ?,
                        adresa_primarie = ?, autorizat = ?, adresa_autorizat = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE contestatie_id = ?`;

                db.query(sqlAdresa, [
                    regiune, uat, sector_cadastral || null, numar_contract || null, numar_decizie_director || null, adresa, adresa_primarie, autorizat, adresa_autorizat, id
                ], (errAdresa) => {
                    if (errAdresa) {
                        console.error('Eroare la actualizarea adresei:', errAdresa);
                        return res.status(500).json({ error: 'Eroare la actualizarea adresei' });
                    }

                    if (additionalMembers && Array.isArray(additionalMembers)) {
                        const sqlDeleteOld = `UPDATE person SET deleted_at = NOW()
                                              WHERE contestatie_id = ? AND deleted_at IS NULL
                                              AND id != (SELECT min_id FROM (SELECT MIN(id) as min_id FROM person WHERE contestatie_id = ? AND deleted_at IS NULL) as t)`;
                        db.query(sqlDeleteOld, [id, id], (errDel) => {
                            if (errDel) console.error('Eroare la ștergerea membrilor vechi:', errDel);
                            additionalMembers.forEach((member) => {
                                if (member.nume && member.prenume && member.cnp) {
                                    db.query(
                                        `INSERT INTO person (contestatie_id, nume, prenume, cnp, adresa_personala) VALUES (?, ?, ?, ?, ?)`,
                                        [id, member.nume, member.prenume, member.cnp, member.adresaPersonala || ''],
                                        (errIns) => { if (errIns) console.error('Eroare la inserarea membrului:', errIns); }
                                    );
                                }
                            });
                            res.json({ message: 'Contestația a fost actualizată cu succes' });
                        });
                    } else {
                        res.json({ message: 'Contestația a fost actualizată cu succes' });
                    }
                });
            });
        });
    });
});

app.delete('/contestatii/:id', verifyUser, (req, res) => {
    const { id } = req.params;

    // Verifică dacă contestația este blocată
    db.query(`SELECT locked FROM contestatii WHERE id = ? AND deleted_at IS NULL`, [id], (errCheck, rows) => {
        if (errCheck || !rows || rows.length === 0) {
            return res.status(404).json({ error: 'Contestația nu a fost găsită' });
        }
        if (rows[0].locked === 1) {
            return res.status(403).json({ error: 'Contestația este blocată și nu poate fi ștearsă' });
        }

        // Step 1: Anonymize personal data + soft-delete persons (GDPR)
        const sqlPerson = `UPDATE person
            SET nume = NULL, prenume = NULL, cnp = NULL, adresa_personala = NULL, deleted_at = NOW()
            WHERE contestatie_id = ? AND deleted_at IS NULL`;

        db.query(sqlPerson, [id], (errPerson) => {
            if (errPerson) {
                console.error('Eroare la anonimizarea persoanelor:', errPerson);
                return res.status(500).json({ error: 'Eroare la ștergerea contestației' });
            }

            // Step 2: Soft-delete adresa
            const sqlAdresa = `UPDATE adresa SET deleted_at = NOW() WHERE contestatie_id = ? AND deleted_at IS NULL`;

            db.query(sqlAdresa, [id], (errAdresa) => {
                if (errAdresa) {
                    console.error('Eroare la ștergerea adresei:', errAdresa);
                    return res.status(500).json({ error: 'Eroare la ștergerea contestației' });
                }

                // Step 3: Soft-delete contestatia
                const sqlContestatie = `UPDATE contestatii SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`;

                db.query(sqlContestatie, [id], (err, result) => {
                    if (err) {
                        console.error('Eroare la ștergerea contestației:', err);
                        return res.status(500).json({ error: 'Eroare la ștergerea contestației' });
                    }
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ error: 'Contestația nu a fost găsită' });
                    }
                    console.log(`✅ Contestație ID ${id} ștearsă (soft delete + anonymizare)`);
                    res.json({ message: 'Contestația a fost ștearsă cu succes' });
                });
            });
        });
    });
});

app.get('/contestatii-stats', verifyUser, (req, res) => {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN admis = 1 THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN respins = 1 THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN admis = 0 AND respins = 0 THEN 1 ELSE 0 END) as pending
      FROM contestatii
      WHERE deleted_at IS NULL`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Eroare la obținerea statisticilor:', err);
            return res.status(500).json({ error: 'Eroare la obținerea statisticilor' });
        }

        const stats = results[0];
        res.json({
            total: parseInt(stats.total) || 0,
            approved: parseInt(stats.approved) || 0,
            rejected: parseInt(stats.rejected) || 0,
            pending: parseInt(stats.pending) || 0
        });
    });
});


// ⭐ Endpoint NOU pentru adăugarea membrilor adiționale
app.post('/membri-contestatie', verifyUser, (req, res) => {
    try {
        const { contestatie_id, nume, prenume, cnp, adresaPersonala } = req.body;

        // Validare
        if (!contestatie_id || !nume || !prenume || !cnp || !adresaPersonala) {
            return res.status(400).json({
                status: 'error',
                message: 'Toate câmpurile sunt obligatorii'
            });
        }

        // Validare CNP (13 cifre)
        if (!/^\d{13}$/.test(cnp)) {
            return res.status(400).json({
                status: 'error',
                message: 'CNP-ul trebuie să conțină exact 13 cifre'
            });
        }

        const sqlPerson = `
            INSERT INTO person (contestatie_id, nume, prenume, cnp, adresa_personala) 
            VALUES (?, ?, ?, ?, ?)`;

        db.query(sqlPerson, [contestatie_id, nume, prenume, cnp, adresaPersonala], (err, result) => {
            if (err) {
                console.error('❌ Eroare la adăugarea membrului:', err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Nu s-a putut adăuga membrul la contestație'
                });
            }

            console.log(`✅ Membru adițional adăugat: ${nume} ${prenume} (CNP: ${cnp}) la contestația ID: ${contestatie_id}`);
            res.status(201).json({
                status: 'success',
                id: result.insertId,
                message: 'Membrul a fost adăugat cu succes'
            });
        });
    } catch (error) {
        console.error('❌ Eroare la procesarea cererii:', error);
        res.status(500).json({
            status: 'error',
            message: 'Eroare la procesarea cererii'
        });
    }
});

// ⭐ Helper: sanitizare nume fișier
function sanitizeFilename(str) {
    if (!str) return 'NECUNOSCUT';
    return str.replace(/[^a-zA-Z0-9_\-\s]/g, '').replace(/\s+/g, '_').toUpperCase();
}

// ⭐ Endpoint pentru generare PDF — returnează ZIP cu câte o copie identică per destinatar
app.post('/generate-pdf', verifyUser, async (req, res) => {
    try {
        const inputContestatii = req.body;
        console.log('📄 Generare PDF pentru', inputContestatii.length, 'contestații');

        // Enrichment: fetch persons și commission members din DB
        const enrichedContestatii = await Promise.all(inputContestatii.map(contestatie => {
            return new Promise((resolveOne) => {
                const contestatieId = contestatie.id;
                if (!contestatieId) return resolveOne(contestatie);

                const sqlPersons = `SELECT nume, prenume, cnp, adresa_personala FROM person WHERE contestatie_id = ? ORDER BY id ASC`;
                const sqlMembers = `SELECT name, \`role\`, functie, signature_path FROM commission_members WHERE contestatie_id = ? ORDER BY id ASC`;
                const sqlAdresa = `SELECT judet, uat, sector_cadastral, numar_contract, numar_decizie_director, adresa_imobil, adresa_primarie, autorizat, adresa_autorizat FROM adresa WHERE contestatie_id = ? LIMIT 1`;

                db.query(sqlPersons, [contestatieId], (errP, persons) => {
                    if (errP || !persons) persons = [];

                    db.query(sqlMembers, [contestatieId], (errM, members) => {
                        if (errM || !members) members = [];

                        db.query(sqlAdresa, [contestatieId], (errA, adresaRows) => {
                            if (errA || !adresaRows) adresaRows = [];

                            if (persons.length > 0) {
                                contestatie.nume = persons[0].nume;
                                contestatie.prenume = persons[0].prenume;
                                contestatie.cnp = persons[0].cnp;
                                contestatie.adresa_personala = persons[0].adresa_personala;
                            }
                            contestatie.additionalMembers = persons.slice(1);
                            contestatie.commissionMembers = members;

                            if (adresaRows.length > 0) {
                                const a = adresaRows[0];
                                if (!contestatie.regiune) contestatie.regiune = a.judet;
                                if (!contestatie.uat) contestatie.uat = a.uat;
                                if (!contestatie.sector_cadastral) contestatie.sector_cadastral = a.sector_cadastral;
                                if (!contestatie.numar_contract) contestatie.numar_contract = a.numar_contract;
                                if (!contestatie.numar_decizie_director) contestatie.numar_decizie_director = a.numar_decizie_director;
                                if (!contestatie.adresa) contestatie.adresa = a.adresa_imobil;
                                if (!contestatie.adresa_primarie) contestatie.adresa_primarie = a.adresa_primarie;
                                if (!contestatie.autorizat) contestatie.autorizat = a.autorizat;
                                if (!contestatie.adresa_autorizat) contestatie.adresa_autorizat = a.adresa_autorizat;
                            }

                            console.log(`📋 Contestație ID ${contestatieId}: ${persons.length} persoane, ${members.length} membri comisie`);
                            resolveOne(contestatie);
                        });
                    });
                });
            });
        }));

        if (enrichedContestatii.length === 0) {
            return res.status(400).json({ error: 'Nu există date pentru generarea PDF' });
        }

        const today = new Date().toISOString().slice(0, 10);

        // Generăm UN singur PDF (conținutul e identic pentru toate copiile)
        let pdfBuffer = await generatePDF(enrichedContestatii);
        if (!(pdfBuffer instanceof Buffer)) pdfBuffer = Buffer.from(pdfBuffer);

        // Construim lista de destinatari pentru copii
        const item = enrichedContestatii[0];
        const nr = item.numar_contestatie || '1';
        const uat = item.uat || item.regiune || 'UAT';
        const autorizat = item.autorizat || 'AUTORIZAT';
        const numePrimary = `${item.nume || ''}_${item.prenume || ''}`.trim();
        const additionalMembers = item.additionalMembers || [];

        const recipients = [
            { filename: `PV_${nr}_${sanitizeFilename(numePrimary)}.pdf` }
        ];

        additionalMembers.forEach(member => {
            const memName = `${member.nume || ''}_${member.prenume || ''}`.trim();
            if (memName && memName !== numePrimary) {
                recipients.push({ filename: `PV_${nr}_${sanitizeFilename(memName)}.pdf` });
            }
        });

        // Dacă e o singură contestație cu doar 1 destinatar simplu, trimitem PDF direct
        // Altfel, trimitem ZIP cu copii
        const archiver = require('archiver');
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.on('error', (err) => {
            console.error('❌ Eroare archiver:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Eroare la crearea arhivei ZIP', details: err.message });
            }
        });

        // Dacă sunt mai multe contestații, fiecare într-un folder
        if (enrichedContestatii.length > 1) {
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename=PV_${today}.zip`);
            archive.pipe(res);

            for (let i = 0; i < enrichedContestatii.length; i++) {
                const c = enrichedContestatii[i];
                let cPdfBuffer = await generatePDF([c]);
                if (!(cPdfBuffer instanceof Buffer)) cPdfBuffer = Buffer.from(cPdfBuffer);

                const cNr = c.numar_contestatie || (i + 1);
                const cUat = c.uat || c.regiune || 'UAT';
                const cAutorizat = c.autorizat || 'AUTORIZAT';
                const cNumePrimary = `${c.nume || ''}_${c.prenume || ''}`.trim();
                const cAdditional = c.additionalMembers || [];
                const folder = `Contestatie_${cNr}`;

                archive.append(cPdfBuffer, { name: `${folder}/PV_${cNr}_${sanitizeFilename(cNumePrimary)}.pdf` });

                cAdditional.forEach(member => {
                    const mName = `${member.nume || ''}_${member.prenume || ''}`.trim();
                    if (mName && mName !== cNumePrimary) {
                        archive.append(cPdfBuffer, { name: `${folder}/PV_${cNr}_${sanitizeFilename(mName)}.pdf` });
                    }
                });
            }

            await archive.finalize();
        } else {
            // O singură contestație — ZIP cu copii per destinatar
            const zipFilename = `PV_${nr}_${today}.zip`;
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`);
            archive.pipe(res);

            recipients.forEach(r => {
                archive.append(pdfBuffer, { name: r.filename });
            });

            await archive.finalize();
        }

        console.log(`✅ ZIP generat: ${recipients.length} copii per destinatar`);
    } catch (error) {
        console.error('❌ Eroare la generarea PDF:', error);
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Eroare la generarea PDF',
                details: error.message
            });
        }
    }
});

// ⭐ GET /filters/judete — județe distincte din DB
app.get('/filters/judete', verifyUser, (req, res) => {
    db.query(
        'SELECT DISTINCT judet FROM adresa WHERE deleted_at IS NULL AND judet IS NOT NULL ORDER BY judet',
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Eroare la obținerea județelor' });
            res.json(rows.map(r => r.judet));
        }
    );
});

// ⭐ GET /filters/uat/:judet — UAT-uri pentru un județ
app.get('/filters/uat/:judet', verifyUser, (req, res) => {
    db.query(
        'SELECT DISTINCT uat FROM adresa WHERE judet = ? AND deleted_at IS NULL AND uat IS NOT NULL ORDER BY uat',
        [req.params.judet],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Eroare la obținerea UAT-urilor' });
            res.json(rows.map(r => r.uat));
        }
    );
});

// ⭐ POST /reports/filter — filtrare paginată cu sumar (admis/respins)
app.post('/reports/filter', verifyUser, (req, res) => {
    const {
        judet, uat, status, sector_cadastral, data_inceput, data_sfarsit,
        numar_contestatie, numar_cerere, nume, prenume, cnp, adresa,
        numar_contract, id_imobil, verificat_teren,
        page, limit, sort_by, sort_order
    } = req.body;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    const offset = (pageNum - 1) * limitNum;

    const allowedSortCols = {
        'numar_contestatie': 'c.numar_contestatie',
        'data_aleasa': 'c.data_aleasa',
        'judet': 'a.judet',
        'uat': 'a.uat',
        'numar_contract': 'a.numar_contract',
        'sector_cadastral': 'a.sector_cadastral',
        'nume': 'p.nume'
    };
    const sortColSQL = allowedSortCols[sort_by] || 'c.numar_contestatie';
    const sortOrd = sort_order === 'DESC' ? 'DESC' : 'ASC';

    let whereClause = 'WHERE c.deleted_at IS NULL';
    const params = [];

    if (judet) { whereClause += ' AND a.judet = ?'; params.push(judet); }
    if (uat) { whereClause += ' AND a.uat = ?'; params.push(uat); }
    if (status === 'admis') { whereClause += ' AND c.admis = 1'; }
    else if (status === 'respins') { whereClause += ' AND c.respins = 1'; }
    else if (status === 'pending') { whereClause += ' AND c.admis = 0 AND c.respins = 0'; }
    if (sector_cadastral) { whereClause += ' AND a.sector_cadastral LIKE ?'; params.push(`%${sector_cadastral}%`); }
    if (data_inceput) { whereClause += ' AND DATE(c.data_aleasa) >= DATE(?)'; params.push(data_inceput); }
    if (data_sfarsit) { whereClause += ' AND DATE(c.data_aleasa) <= DATE(?)'; params.push(data_sfarsit); }
    if (numar_contestatie) { whereClause += ' AND c.numar_contestatie = ?'; params.push(parseInt(numar_contestatie) || 0); }
    if (numar_cerere) { whereClause += ' AND c.numar_cerere LIKE ?'; params.push(`%${numar_cerere}%`); }
    if (nume) { whereClause += ' AND p.nume LIKE ?'; params.push(`%${nume}%`); }
    if (prenume) { whereClause += ' AND p.prenume LIKE ?'; params.push(`%${prenume}%`); }
    if (cnp) { whereClause += ' AND p.cnp LIKE ?'; params.push(`%${cnp}%`); }
    if (adresa) { whereClause += ' AND a.adresa_imobil LIKE ?'; params.push(`%${adresa}%`); }
    if (numar_contract) { whereClause += ' AND a.numar_contract LIKE ?'; params.push(`%${numar_contract}%`); }
    if (id_imobil) { whereClause += ' AND c.id_imobil LIKE ?'; params.push(`%${id_imobil}%`); }
    if (verificat_teren === '1') { whereClause += ' AND c.verificat_teren = 1'; }
    else if (verificat_teren === '0') { whereClause += ' AND c.verificat_teren = 0'; }

    const joinClause = `
        FROM contestatii c
        LEFT JOIN person p ON c.id = p.contestatie_id AND p.id = (
            SELECT MIN(p2.id) FROM person p2 WHERE p2.contestatie_id = c.id AND p2.deleted_at IS NULL
        )
        LEFT JOIN adresa a ON c.id = a.contestatie_id`;

    const summarySQL = `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN c.admis = 1 THEN 1 ELSE 0 END) as admis,
        SUM(CASE WHEN c.respins = 1 THEN 1 ELSE 0 END) as respins
        ${joinClause} ${whereClause}`;

    const dataSQL = `SELECT c.id, c.numar_contestatie, c.data_aleasa, c.admis, c.respins, c.locked, c.id_imobil,
        p.nume, p.prenume,
        a.judet, a.uat, a.sector_cadastral, a.numar_contract,
        (SELECT GREATEST(COUNT(*) - 1, 0) FROM person p3 WHERE p3.contestatie_id = c.id) as membri_count
        ${joinClause} ${whereClause}
        ORDER BY ${sortColSQL} ${sortOrd}
        LIMIT ? OFFSET ?`;

    db.query(summarySQL, params, (errS, summaryRows) => {
        if (errS) {
            console.error('Eroare summary:', errS);
            return res.status(500).json({ error: 'Eroare la filtrare' });
        }
        const summary = summaryRows[0] || { total: 0, admis: 0, respins: 0 };

        db.query(dataSQL, [...params, limitNum, offset], (errD, dataRows) => {
            if (errD) {
                console.error('Eroare data:', errD);
                return res.status(500).json({ error: 'Eroare la filtrare' });
            }
            res.json({
                data: dataRows || [],
                pagination: {
                    total: parseInt(summary.total) || 0,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil((parseInt(summary.total) || 0) / limitNum)
                },
                summary: {
                    total: parseInt(summary.total) || 0,
                    admis: parseInt(summary.admis) || 0,
                    respins: parseInt(summary.respins) || 0
                }
            });
        });
    });
});

// ⭐ Endpoint batch: generare ZIP cu foldere per contestație, copii per destinatar
app.post('/reports/batch', verifyUser, async (req, res) => {
    try {
        const { ids, judet, uat, status, sector_cadastral, data_inceput, data_sfarsit,
            numar_contestatie, numar_cerere, nume, prenume, cnp, adresa,
            numar_contract, id_imobil, verificat_teren } = req.body;

        let sql = `
        SELECT c.*, p.nume, p.prenume, p.cnp, p.adresa_personala,
               a.judet as regiune, a.uat, a.sector_cadastral, a.numar_contract, a.numar_decizie_director, a.adresa_imobil as adresa,
               a.adresa_primarie, a.autorizat, a.adresa_autorizat
        FROM contestatii c
        LEFT JOIN person p ON c.id = p.contestatie_id AND p.id = (
            SELECT MIN(p2.id) FROM person p2 WHERE p2.contestatie_id = c.id
        )
        LEFT JOIN adresa a ON c.id = a.contestatie_id
        WHERE c.deleted_at IS NULL`;

        const params = [];

        // Support downloading by specific IDs (selected rows) OR by filters
        if (ids && Array.isArray(ids) && ids.length > 0) {
            const placeholders = ids.map(() => '?').join(',');
            sql += ` AND c.id IN (${placeholders})`;
            ids.forEach(id => params.push(parseInt(id)));
        } else {
            if (judet) { sql += ' AND a.judet = ?'; params.push(judet); }
            if (uat) { sql += ' AND a.uat = ?'; params.push(uat); }
            if (status === 'admis') { sql += ' AND c.admis = 1'; }
            else if (status === 'respins') { sql += ' AND c.respins = 1'; }
            else if (status === 'pending') { sql += ' AND c.admis = 0 AND c.respins = 0'; }
            if (sector_cadastral) { sql += ' AND a.sector_cadastral LIKE ?'; params.push(`%${sector_cadastral}%`); }
            if (data_inceput) { sql += ' AND DATE(c.data_aleasa) >= DATE(?)'; params.push(data_inceput); }
            if (data_sfarsit) { sql += ' AND DATE(c.data_aleasa) <= DATE(?)'; params.push(data_sfarsit); }
            if (numar_contestatie) { sql += ' AND c.numar_contestatie = ?'; params.push(parseInt(numar_contestatie) || 0); }
            if (numar_cerere) { sql += ' AND c.numar_cerere LIKE ?'; params.push(`%${numar_cerere}%`); }
            if (nume) { sql += ' AND p.nume LIKE ?'; params.push(`%${nume}%`); }
            if (prenume) { sql += ' AND p.prenume LIKE ?'; params.push(`%${prenume}%`); }
            if (cnp) { sql += ' AND p.cnp LIKE ?'; params.push(`%${cnp}%`); }
            if (adresa) { sql += ' AND a.adresa_imobil LIKE ?'; params.push(`%${adresa}%`); }
            if (numar_contract) { sql += ' AND a.numar_contract LIKE ?'; params.push(`%${numar_contract}%`); }
            if (id_imobil) { sql += ' AND c.id_imobil LIKE ?'; params.push(`%${id_imobil}%`); }
            if (verificat_teren === '1') { sql += ' AND c.verificat_teren = 1'; }
            else if (verificat_teren === '0') { sql += ' AND c.verificat_teren = 0'; }
        }

        sql += ' ORDER BY c.numar_contestatie ASC';

        const contestatii = await new Promise((resolve, reject) => {
            db.query(sql, params, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        if (!contestatii || contestatii.length === 0) {
            return res.status(404).json({ error: 'Nu s-au găsit contestații pentru filtrele selectate' });
        }

        console.log(`📦 Batch PDF: ${contestatii.length} contestații găsite`);

        // Enrich: fetch persons și commission members pentru fiecare contestație
        const enrichedContestatii = await Promise.all(contestatii.map(contestatie => {
            return new Promise((resolveOne) => {
                const contestatieId = contestatie.id;
                const sqlPersons = `SELECT nume, prenume, cnp, adresa_personala FROM person WHERE contestatie_id = ? ORDER BY id ASC`;
                const sqlMembers = `SELECT name, \`role\`, functie, signature_path FROM commission_members WHERE contestatie_id = ? ORDER BY id ASC`;

                db.query(sqlPersons, [contestatieId], (errP, persons) => {
                    if (errP || !persons) persons = [];

                    db.query(sqlMembers, [contestatieId], (errM, members) => {
                        if (errM || !members) members = [];

                        if (persons.length > 0) {
                            contestatie.nume = persons[0].nume;
                            contestatie.prenume = persons[0].prenume;
                            contestatie.cnp = persons[0].cnp;
                            contestatie.adresa_personala = persons[0].adresa_personala;
                        }
                        contestatie.additionalMembers = persons.slice(1);
                        contestatie.commissionMembers = members;
                        resolveOne(contestatie);
                    });
                });
            });
        }));

        console.log(`📦 Batch: generare ZIP cu foldere per contestație`);

        const archiver = require('archiver');
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.on('error', (err) => {
            console.error('❌ Eroare archiver batch:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Eroare la crearea arhivei ZIP', details: err.message });
            }
        });

        const today = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=Raport_Contestatii_${today}.zip`);
        archive.pipe(res);

        for (let i = 0; i < enrichedContestatii.length; i++) {
            const item = enrichedContestatii[i];
            let pdfBuffer = await generatePDF([item]);
            if (!(pdfBuffer instanceof Buffer)) pdfBuffer = Buffer.from(pdfBuffer);

            const nr = item.numar_contestatie || (i + 1);
            const cUat = item.uat || item.regiune || 'UAT';
            const cAutorizat = item.autorizat || 'AUTORIZAT';
            const cNumePrimary = `${item.nume || ''}_${item.prenume || ''}`.trim();
            const cAdditional = item.additionalMembers || [];
            const folder = `Contestatie_${nr}`;

            // Copie pentru Persoana Principală
            archive.append(pdfBuffer, { name: `${folder}/PV_${nr}_${sanitizeFilename(cNumePrimary)}.pdf` });

            // Copie pentru fiecare membru adițional
            cAdditional.forEach(member => {
                const mName = `${member.nume || ''}_${member.prenume || ''}`.trim();
                if (mName && mName !== cNumePrimary) {
                    archive.append(pdfBuffer, { name: `${folder}/PV_${nr}_${sanitizeFilename(mName)}.pdf` });
                }
            });
        }

        await archive.finalize();
        console.log(`✅ Batch ZIP generat cu ${enrichedContestatii.length} contestații, foldere cu copii per destinatar`);
    } catch (error) {
        console.error('❌ Eroare la generarea batch PDF:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Eroare la generarea batch PDF', details: error.message });
        }
    }
});

app.post('/reports/batch-unsigned', verifyUser, async (req, res) => {
    try {
        const { ids, judet, uat, status, sector_cadastral, data_inceput, data_sfarsit,
            numar_contestatie, numar_cerere, nume, prenume, cnp, adresa,
            numar_contract, id_imobil, verificat_teren } = req.body;

        let sql = `
        SELECT c.*, p.nume, p.prenume, p.cnp, p.adresa_personala,
               a.judet as regiune, a.uat, a.sector_cadastral, a.numar_contract, a.numar_decizie_director, a.adresa_imobil as adresa,
               a.adresa_primarie, a.autorizat, a.adresa_autorizat
        FROM contestatii c
        LEFT JOIN person p ON c.id = p.contestatie_id AND p.id = (
            SELECT MIN(p2.id) FROM person p2 WHERE p2.contestatie_id = c.id
        )
        LEFT JOIN adresa a ON c.id = a.contestatie_id
        WHERE c.deleted_at IS NULL`;

        const params = [];

        if (ids && Array.isArray(ids) && ids.length > 0) {
            const placeholders = ids.map(() => '?').join(',');
            sql += ` AND c.id IN (${placeholders})`;
            ids.forEach(id => params.push(parseInt(id)));
        } else {
            if (judet) { sql += ' AND a.judet = ?'; params.push(judet); }
            if (uat) { sql += ' AND a.uat = ?'; params.push(uat); }
            if (status === 'admis') { sql += ' AND c.admis = 1'; }
            else if (status === 'respins') { sql += ' AND c.respins = 1'; }
            else if (status === 'pending') { sql += ' AND c.admis = 0 AND c.respins = 0'; }
            if (sector_cadastral) { sql += ' AND a.sector_cadastral LIKE ?'; params.push(`%${sector_cadastral}%`); }
            if (data_inceput) { sql += ' AND DATE(c.data_aleasa) >= DATE(?)'; params.push(data_inceput); }
            if (data_sfarsit) { sql += ' AND DATE(c.data_aleasa) <= DATE(?)'; params.push(data_sfarsit); }
            if (numar_contestatie) { sql += ' AND c.numar_contestatie = ?'; params.push(parseInt(numar_contestatie) || 0); }
            if (numar_cerere) { sql += ' AND c.numar_cerere LIKE ?'; params.push(`%${numar_cerere}%`); }
            if (nume) { sql += ' AND p.nume LIKE ?'; params.push(`%${nume}%`); }
            if (prenume) { sql += ' AND p.prenume LIKE ?'; params.push(`%${prenume}%`); }
            if (cnp) { sql += ' AND p.cnp LIKE ?'; params.push(`%${cnp}%`); }
            if (adresa) { sql += ' AND a.adresa_imobil LIKE ?'; params.push(`%${adresa}%`); }
            if (numar_contract) { sql += ' AND a.numar_contract LIKE ?'; params.push(`%${numar_contract}%`); }
            if (id_imobil) { sql += ' AND c.id_imobil LIKE ?'; params.push(`%${id_imobil}%`); }
            if (verificat_teren === '1') { sql += ' AND c.verificat_teren = 1'; }
            else if (verificat_teren === '0') { sql += ' AND c.verificat_teren = 0'; }
        }

        sql += ' ORDER BY c.numar_contestatie ASC';

        const contestatii = await new Promise((resolve, reject) => {
            db.query(sql, params, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        if (!contestatii || contestatii.length === 0) {
            return res.status(404).json({ error: 'Nu s-au găsit contestații pentru filtrele selectate' });
        }

        console.log(`📦 Batch unsigned PDF: ${contestatii.length} contestații găsite`);

        const enrichedContestatii = await Promise.all(contestatii.map(contestatie => {
            return new Promise((resolveOne) => {
                const contestatieId = contestatie.id;
                const sqlPersons = `SELECT nume, prenume, cnp, adresa_personala FROM person WHERE contestatie_id = ? ORDER BY id ASC`;
                const sqlMembers = `SELECT name, \`role\`, functie, signature_path FROM commission_members WHERE contestatie_id = ? ORDER BY id ASC`;

                db.query(sqlPersons, [contestatieId], (errP, persons) => {
                    if (errP || !persons) persons = [];

                    db.query(sqlMembers, [contestatieId], (errM, members) => {
                        if (errM || !members) members = [];

                        if (persons.length > 0) {
                            contestatie.nume = persons[0].nume;
                            contestatie.prenume = persons[0].prenume;
                            contestatie.cnp = persons[0].cnp;
                            contestatie.adresa_personala = persons[0].adresa_personala;
                        }
                        contestatie.additionalMembers = persons.slice(1);
                        contestatie.commissionMembers = members;
                        resolveOne(contestatie);
                    });
                });
            });
        }));

        // Generează UN SINGUR PDF cu toate contestațiile, fără semnături
        let pdfBuffer = await generatePDF(enrichedContestatii, { skipSignatures: true });
        if (!(pdfBuffer instanceof Buffer)) pdfBuffer = Buffer.from(pdfBuffer);

        const today = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=PV_Raport_${today}.pdf`);
        res.send(pdfBuffer);

        console.log(`✅ PDF fără semnături generat cu ${enrichedContestatii.length} contestații`);
    } catch (error) {
        console.error('❌ Eroare la generarea PDF fără semnături:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Eroare la generarea PDF', details: error.message });
        }
    }
});

app.post('/reports/export-full-excel', verifyUser, async (req, res) => {
    try {
        const { whereClause, params } = buildFilterWhereClause(req.body);

        const sql = `
        SELECT c.id, c.numar_contestatie, c.numar_proces_verbal, c.data_proces_verbal,
               c.numar_cerere, c.data_cerere, c.data_aleasa, c.id_imobil,
               c.documente_atasate, c.observatii, c.verificat_teren, c.admis, c.respins,
               a.judet, a.uat, a.sector_cadastral, a.adresa_imobil,
               a.adresa_primarie, a.autorizat, a.adresa_autorizat,
               a.numar_contract, a.numar_decizie_director
        FROM contestatii c
        LEFT JOIN person p ON c.id = p.contestatie_id AND p.id = (
            SELECT MIN(p2.id) FROM person p2 WHERE p2.contestatie_id = c.id AND p2.deleted_at IS NULL
        )
        LEFT JOIN adresa a ON c.id = a.contestatie_id
        ${whereClause}
        ORDER BY c.numar_contestatie ASC`;

        const contestatii = await new Promise((resolve, reject) => {
            db.query(sql, params, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        if (!contestatii || contestatii.length === 0) {
            return res.status(404).json({ error: 'Nu s-au găsit contestații' });
        }

        const enriched = await Promise.all(contestatii.map(c => new Promise((resolveOne) => {
            const sqlPersons = `SELECT nume, prenume, cnp, adresa_personala FROM person WHERE contestatie_id = ? AND deleted_at IS NULL ORDER BY id ASC`;
            const sqlMembers = `SELECT name, \`role\`, functie, signature_path FROM commission_members WHERE contestatie_id = ? ORDER BY id ASC`;

            db.query(sqlPersons, [c.id], (errP, persons) => {
                if (errP || !persons) persons = [];
                db.query(sqlMembers, [c.id], (errM, members) => {
                    if (errM || !members) members = [];
                    const validPersons = persons.filter(p => p.nume && p.nume.trim() !== '');
                    c.primaryPerson = validPersons[0] || null;
                    c.additionalPersons = validPersons.slice(1);
                    c.commissionMembers = members;
                    resolveOne(c);
                });
            });
        })));

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'OCPI';
        const sheet = workbook.addWorksheet('Contestații');

        const HEADERS = [
            'Nr. Contestație', 'Nume', 'Prenume', 'CNP', 'Adresă Personală',
            'Membri Adiționale', 'Județ', 'UAT', 'Sector Cadastral',
            'Adresă Imobil', 'ID Imobil', 'Nr. Contract', 'Nr. Decizie Director',
            'Adresă Primărie', 'Prestator', 'Adresă Prestator',
            'Nr. Proces Verbal', 'Data Proces Verbal', 'Nr. Cerere', 'Data Cerere',
            'Data Aleasă', 'Documente Atașate', 'Observații',
            'Status', 'Verificat Teren', 'Membri Comisie'
        ];
        const widths = [15, 15, 15, 15, 25, 40, 12, 20, 15, 25, 15, 15, 20, 25, 20, 25, 15, 15, 15, 15, 15, 30, 30, 12, 12, 50];

        sheet.columns = HEADERS.map((header, i) => ({ header, key: header, width: widths[i] || 15 }));

        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center' };

        const fmtDate = (val) => {
            if (!val || val === '0000-00-00') return '';
            const d = new Date(val);
            if (isNaN(d.getTime())) return '';
            d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
            return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
        };

        enriched.forEach(c => {
            const pp = c.primaryPerson;
            const membriStr = c.additionalPersons.map(m => `${m.nume} ${m.prenume} (${m.cnp})`).join(', ');
            const comisieStr = c.commissionMembers.map(m => `${m.name} - ${m.functie || ''} - ${m.role || ''}`).join(', ');
            const status = c.admis ? 'Admis' : (c.respins ? 'Respins' : 'În așteptare');

            sheet.addRow({
                'Nr. Contestație': c.numar_contestatie,
                'Nume': pp ? pp.nume : '',
                'Prenume': pp ? pp.prenume : '',
                'CNP': pp ? pp.cnp : '',
                'Adresă Personală': pp ? pp.adresa_personala : '',
                'Membri Adiționale': membriStr || '',
                'Județ': c.judet || '',
                'UAT': c.uat || '',
                'Sector Cadastral': c.sector_cadastral || '',
                'Adresă Imobil': c.adresa_imobil || '',
                'ID Imobil': c.id_imobil || '',
                'Nr. Contract': c.numar_contract || '',
                'Nr. Decizie Director': c.numar_decizie_director || '',
                'Adresă Primărie': c.adresa_primarie || '',
                'Prestator': c.autorizat || '',
                'Adresă Prestator': c.adresa_autorizat || '',
                'Nr. Proces Verbal': c.numar_proces_verbal || '',
                'Data Proces Verbal': fmtDate(c.data_proces_verbal),
                'Nr. Cerere': c.numar_cerere || '',
                'Data Cerere': fmtDate(c.data_cerere),
                'Data Aleasă': fmtDate(c.data_aleasa),
                'Documente Atașate': c.documente_atasate || '',
                'Observații': c.observatii || '',
                'Status': status,
                'Verificat Teren': c.verificat_teren ? 'Da' : 'Nu',
                'Membri Comisie': comisieStr || ''
            });
        });

        const today = new Date();
        const dateStr = `${today.getDate().toString().padStart(2,'0')}_${(today.getMonth()+1).toString().padStart(2,'0')}_${today.getFullYear()}`;
        const fileName = `Raport_Contestatii_${dateStr}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        await workbook.xlsx.write(res);
        res.end();
        console.log(`✅ Excel complet exportat: ${enriched.length} contestații`);
    } catch (error) {
        console.error('❌ Eroare export Excel complet:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Eroare la export', details: error.message });
        }
    }
});

// ⭐ Helper: construiește clauza WHERE + params pentru filtre (refolosit în endpoints Excel)
function buildFilterWhereClause(body, tablePrefix) {
    const { ids, judet, uat, status, sector_cadastral, data_inceput, data_sfarsit,
        numar_contestatie, numar_cerere, nume, prenume, cnp, adresa } = body;
    let whereClause = 'WHERE c.deleted_at IS NULL';
    const params = [];

    if (ids && Array.isArray(ids) && ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',');
        whereClause += ` AND c.id IN (${placeholders})`;
        ids.forEach(id => params.push(parseInt(id)));
    } else {
        if (judet) { whereClause += ' AND a.judet = ?'; params.push(judet); }
        if (uat) { whereClause += ' AND a.uat = ?'; params.push(uat); }
        if (status === 'admis') { whereClause += ' AND c.admis = 1'; }
        else if (status === 'respins') { whereClause += ' AND c.respins = 1'; }
        else if (status === 'pending') { whereClause += ' AND c.admis = 0 AND c.respins = 0'; }
        if (sector_cadastral) { whereClause += ' AND a.sector_cadastral LIKE ?'; params.push(`%${sector_cadastral}%`); }
        if (data_inceput) { whereClause += ' AND DATE(c.data_aleasa) >= DATE(?)'; params.push(data_inceput); }
        if (data_sfarsit) { whereClause += ' AND DATE(c.data_aleasa) <= DATE(?)'; params.push(data_sfarsit); }
        if (numar_contestatie) { whereClause += ' AND c.numar_contestatie = ?'; params.push(parseInt(numar_contestatie) || 0); }
        if (numar_cerere) { whereClause += ' AND c.numar_cerere LIKE ?'; params.push(`%${numar_cerere}%`); }
        if (nume) { whereClause += ' AND p.nume LIKE ?'; params.push(`%${nume}%`); }
        if (prenume) { whereClause += ' AND p.prenume LIKE ?'; params.push(`%${prenume}%`); }
        if (cnp) { whereClause += ' AND p.cnp LIKE ?'; params.push(`%${cnp}%`); }
        if (adresa) { whereClause += ' AND a.adresa_imobil LIKE ?'; params.push(`%${adresa}%`); }
    }
    return { whereClause, params };
}

// ⭐ Helper: fetch & enrich contestatii with persons for Excel
async function fetchEnrichedContestatii(sql, params) {
    const contestatii = await new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
    if (!contestatii || contestatii.length === 0) return [];

    return Promise.all(contestatii.map(contestatie => new Promise((resolveOne) => {
        const sqlPersons = `SELECT id, nume, prenume, adresa_personala FROM person WHERE contestatie_id = ? AND deleted_at IS NULL ORDER BY id ASC`;
        db.query(sqlPersons, [contestatie.id], (errP, persons) => {
            if (errP || !persons) persons = [];
            // Filter out persons with empty names (e.g., rows 1-10 in the DB)
            const validPersons = persons.filter(p => p.nume && p.nume.trim() !== '');
            contestatie.primaryPerson = validPersons[0] || null;
            contestatie.additionalMembers = validPersons.slice(1);
            resolveOne(contestatie);
        });
    })));
}

// ⭐ Helper: build Excel workbook in EXACT Poșta Română AWB format (16 columns)
async function buildExcelWorkbook(enriched, codTrimitere, greutate) {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'OCPI';
    workbook.created = new Date();

    // Sheet name MUST be "Sample sheet" to match Posta Romana template
    const sheet = workbook.addWorksheet('Sample sheet');

    // EXACT 16 columns from Poșta Română AWB template
    const HEADERS = [
        'NumeDestinatar',
        'AdresaDestinatar',
        'JudetDestinatar',
        'LocalitateDestinatar',
        'TelefonDestinatar',
        'CodPostalDestinatar',
        'EmailDestinatar',
        'CodTrimitere',
        'GreutateTrimitere',
        'Valoare',
        'Ramburs',
        'TipMandat',
        'Voluminos',
        'Fragil',
        'PrezentareSambata',
        'Continut'
    ];

    const widths = [30, 40, 15, 25, 20, 15, 20, 12, 15, 10, 10, 12, 10, 10, 15, 40];
    sheet.columns = HEADERS.map((header, index) => ({
        header: header,
        key: header,
        width: widths[index] || 15
    }));

    // Style header row (Row 1) — bold
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };

    const defaultCodTrimitere = codTrimitere || '';
    const defaultGreutate = greutate || '0.1';

    // Helper: add one recipient row
    const addRecipientRow = (numeDest, adresaDest, judetDest, localitateDest, continut) => {
        sheet.addRow({
            NumeDestinatar: numeDest || null,
            AdresaDestinatar: adresaDest || null,
            JudetDestinatar: judetDest || null,
            LocalitateDestinatar: localitateDest || null,
            TelefonDestinatar: null,
            CodPostalDestinatar: null,
            EmailDestinatar: null,
            CodTrimitere: defaultCodTrimitere,
            GreutateTrimitere: defaultGreutate,
            Valoare: null,
            Ramburs: null,
            TipMandat: null,
            Voluminos: null,
            Fragil: null,
            PrezentareSambata: 'Nu',
            Continut: continut
        });
    };

    // Data rows — one row per recipient
    enriched.forEach((c) => {
        const nr = c.numar_contestatie;
        const continut = `Proces-verbal contestatie nr.${nr}`;
        const judetDest = c.judet || '';
        const localitateDest = c.uat || '';

        // ROW: Primăria
        addRecipientRow(
            `PRIMARIA ${(c.uat || '').toUpperCase()}`,
            c.adresa_primarie || '',
            judetDest,
            localitateDest,
            continut
        );

        // ROW: Autorizat
        addRecipientRow(
            (c.autorizat || '').toUpperCase(),
            c.adresa_autorizat || '',
            judetDest,
            localitateDest,
            continut
        );

        // ROW: Primary Person
        const pp = c.primaryPerson;
        if (pp) {
            addRecipientRow(
                `${pp.nume} ${pp.prenume}`.toUpperCase(),
                pp.adresa_personala || '',
                judetDest,
                localitateDest,
                continut
            );
        }

        // ROW: Each Member
        for (const member of (c.additionalMembers || [])) {
            addRecipientRow(
                `${member.nume} ${member.prenume}`.toUpperCase(),
                member.adresa_personala || '',
                judetDest,
                localitateDest,
                continut
            );
        }
    });

    return workbook;
}

// ⭐ POST /reports/export-excel — Export Excel format EXACT Poșta Română AWB (16 coloane)
app.post('/reports/export-excel', verifyUser, async (req, res) => {
    try {
        const { codTrimitere, greutate } = req.body;
        const { whereClause, params } = buildFilterWhereClause(req.body);

        const sql = `
        SELECT c.id, c.numar_contestatie, c.numar_proces_verbal, c.data_proces_verbal,
               c.admis, c.respins,
               a.judet, a.uat, a.sector_cadastral,
               a.adresa_primarie, a.autorizat, a.adresa_autorizat
        FROM contestatii c
        LEFT JOIN person p ON c.id = p.contestatie_id AND p.id = (
            SELECT MIN(p2.id) FROM person p2 WHERE p2.contestatie_id = c.id AND p2.deleted_at IS NULL
        )
        LEFT JOIN adresa a ON c.id = a.contestatie_id
        ${whereClause}
        ORDER BY c.numar_contestatie ASC`;

        const enriched = await fetchEnrichedContestatii(sql, params);
        if (enriched.length === 0) {
            return res.status(404).json({ error: 'Nu s-au găsit contestații pentru filtrele selectate' });
        }

        const workbook = await buildExcelWorkbook(enriched, codTrimitere, greutate);

        const today = new Date();
        const dateStr = `${today.getDate().toString().padStart(2, '0')}_${(today.getMonth() + 1).toString().padStart(2, '0')}_${today.getFullYear()}`;
        const fileName = `AWB_Posta_Romana_${dateStr}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        await workbook.xlsx.write(res);
        res.end();
        console.log(`✅ AWB Excel export generat: ${enriched.length} contestații`);
    } catch (error) {
        console.error('❌ Eroare la exportul Excel AWB:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Eroare la generarea Excel', details: error.message });
        }
    }
});

// ⭐ GET /contestatii/:id/export-excel — Export Excel AWB pentru o singură contestație
app.get('/contestatii/:id/export-excel', verifyUser, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID invalid' });

        const sql = `
        SELECT c.id, c.numar_contestatie, c.numar_proces_verbal, c.data_proces_verbal,
               c.admis, c.respins,
               a.judet, a.uat, a.sector_cadastral,
               a.adresa_primarie, a.autorizat, a.adresa_autorizat
        FROM contestatii c
        LEFT JOIN adresa a ON c.id = a.contestatie_id
        WHERE c.id = ? AND c.deleted_at IS NULL`;

        const enriched = await fetchEnrichedContestatii(sql, [id]);
        if (enriched.length === 0) {
            return res.status(404).json({ error: 'Contestația nu a fost găsită' });
        }

        const workbook = await buildExcelWorkbook(enriched, '', '0.1');
        const nr = enriched[0].numar_contestatie;

        const today = new Date();
        const dateStr = `${today.getDate().toString().padStart(2, '0')}_${(today.getMonth() + 1).toString().padStart(2, '0')}_${today.getFullYear()}`;
        const fileName = `AWB_Posta_Romana_Nr${nr}_${dateStr}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        await workbook.xlsx.write(res);
        res.end();
        console.log(`✅ AWB Excel export generat: contestație #${nr}`);
    } catch (error) {
        console.error('❌ Eroare la exportul Excel single:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Eroare la generarea Excel', details: error.message });
        }
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('✅ Endpoint-uri active:');
    console.log('   - POST /location-preselection (cu membrii comisiei)');
    console.log('   - POST /contestatii (salvează și membri comisie)');
    console.log('   - POST /membri-contestatie (adaugă membri adiționale)');
    console.log('   - POST /generate-pdf (ZIP cu copii per destinatar)');
    console.log('   - POST /reports/batch (batch ZIP cu foldere per contestație)');
});