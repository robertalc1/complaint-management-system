const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8082;

app.use(cors({
    origin: function(origin, callback) {
        // Acceptă toate originile de pe localhost indiferent de port
        if (origin && origin.startsWith('http://localhost:')) {
            callback(null, true);
        } else {
            callback(new Error('Blocat de CORS'));
        }
    },
    methods: ["POST", "GET", "PUT", "DELETE"],
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ocpi',
});

// Aceasta este doar o notificare pentru terminal care indică dacă serverul a pornit cu succes
console.log(`Endpoint-ul membru-contestatie a fost adăugat cu succes. Serverul este pregătit pentru a gestiona membri aditionali.`);

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database');
});

// Verificăm și creăm tabelele necesare, dacă nu există
db.query(`SHOW TABLES LIKE 'contestatii'`, (err, results) => {
    if (err) {
        console.error('Error checking if tables exist:', err);
        return;
    }
    
    // Dacă tabelele nu există, le creăm
    if (results.length === 0) {
        console.log('Tables do not exist, creating them...');
        
        // Creăm tabelul contestatii
        db.query(`
            CREATE TABLE contestatii (
                id INT AUTO_INCREMENT PRIMARY KEY,
                numar_contestatie INT NOT NULL,
                
                -- Date documente (grupate logic)
                numar_proces_verbal VARCHAR(50),
                data_proces_verbal DATE,
                numar_cerere VARCHAR(50),
                data_cerere DATE,
                data_aleasa DATE,
                
                -- Informații documentare
                id_imobil VARCHAR(100),
                documente_atasate TEXT,
                observatii TEXT,
                
                -- Stare contestație
                verificat_teren TINYINT(1) DEFAULT 0,
                admis TINYINT(1) DEFAULT 0,
                respins TINYINT(1) DEFAULT 0,
                
                -- Referință utilizator
                user_id INT,
                
                -- Timestamp-uri la final
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `, (createErr) => {
            if (createErr) {
                console.error('Error creating contestatii table:', createErr);
            } else {
                console.log('Table contestatii created successfully');
                
                // Creăm tabelul person
                db.query(`
                    CREATE TABLE person (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        contestatie_id INT NOT NULL,
                        
                        -- Informații personale (grupate logic)
                        nume VARCHAR(100) NOT NULL,
                        prenume VARCHAR(100) NOT NULL,
                        cnp VARCHAR(13) NOT NULL,
                        adresa_personala TEXT,
                        
                        -- Timestamp-uri la final
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        
                        FOREIGN KEY (contestatie_id) REFERENCES contestatii(id) ON DELETE CASCADE
                    )
                `, (createErrPerson) => {
                    if (createErrPerson) {
                        console.error('Error creating person table:', createErrPerson);
                    } else {
                        console.log('Table person created successfully');
                        
                        // Creăm tabelul adresa
                        db.query(`
                            CREATE TABLE adresa (
                                id INT AUTO_INCREMENT PRIMARY KEY,
                                contestatie_id INT NOT NULL,
                                
                                -- Informații locație (grupate logic)
                                judet VARCHAR(50),
                                uat VARCHAR(100),
                                adresa_imobil TEXT,
                                
                                -- Informații instituționale
                                adresa_primarie TEXT,
                                autorizat VARCHAR(100),
                                adresa_autorizat TEXT,
                                
                                -- Timestamp-uri la final
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
    } else {
        console.log('Tables already exist');
        
        // Verificăm dacă coloana adresa_personala există în tabelul person
        db.query(`SHOW COLUMNS FROM person LIKE 'adresa_personala'`, (errCol, resultsCol) => {
            if (errCol) {
                console.error('Error checking for adresa_personala column:', errCol);
                return;
            }
            
            // Dacă coloana nu există, o adăugăm
            if (resultsCol.length === 0) {
                console.log('Adding adresa_personala column to person table...');
                db.query(`ALTER TABLE person ADD COLUMN adresa_personala TEXT AFTER cnp`, (errAdd) => {
                    if (errAdd) {
                        console.error('Error adding adresa_personala column:', errAdd);
                    } else {
                        console.log('adresa_personala column added successfully');
                    }
                });
            } else {
                console.log('adresa_personala column already exists');
            }
        });
    }
});

const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json({ Status: "Error", Error: "You are not authenticated" });
    }
    jwt.verify(token, "jwt-secret-key", (err, decoded) => {
        if (err) {
            return res.json({ Status: "Error", Error: "Token is not okay" });
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

// Register route
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        db.query(sql, [name, email, hashedPassword], (err, result) => {
            if (err) {
                res.status(500).json({ message: 'Error registering user' });
            } else {
                res.status(201).json({ message: 'User registered successfully' });
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error encrypting password' });
    }
});

// Login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err || results.length === 0) {
            res.status(401).json({ Error: 'Invalid email or password' });
        } else {
            const user = results[0];
            const isValid = await bcrypt.compare(password, user.password);
            if (isValid) {
                const token = jwt.sign({ user }, "jwt-secret-key", { expiresIn: '1d' });
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

// Funcția simplificată pentru obținerea următorului număr secvențial
const getNextContestationNumber = () => {
    return new Promise((resolve, reject) => {
        // Căutăm cel mai mare număr de contestație existent
        const sql = 'SELECT MAX(numar_contestatie) as max_num FROM contestatii';
        db.query(sql, (err, results) => {
            if (err) {
                console.error('Eroare la obținerea ultimului număr de contestație:', err);
                reject(err);
            } else {
                // Dacă nu există contestații sau valoarea maximă este null, începem de la 1
                const maxNum = results[0].max_num || 0;
                // Returnăm numărul următor ca număr simplu
                resolve(parseInt(maxNum) + 1);
            }
        });
    });
};

// Noul endpoint pentru salvarea datelor de preselecție locație
app.post('/location-preselection', verifyUser, (req, res) => {
    console.log('Received location preselection data:', req.body);
    
    const {
        regiune,
        uat,
        adresaPrimarie,
        autorizat,
        adresaAutorizat
    } = req.body;
    
    // Validăm datele primite
    if (!regiune) {
        return res.status(400).json({
            status: 'error',
            message: 'Județul este obligatoriu'
        });
    }
    
    // Opțional: putem salva aceste date în tabelul de preferințe al utilizatorului
    // În această implementare, doar returnăm datele validate pentru a fi stocate în sessionStorage
    res.status(200).json({
        status: 'success',
        message: 'Datele de locație au fost validate cu succes',
        data: {
            regiune,
            uat: uat || '',
            adresaPrimarie: adresaPrimarie || '',
            autorizat: autorizat || '',
            adresaAutorizat: adresaAutorizat || ''
        }
    });
});

// Endpoint NOU pentru adăugarea DOAR a contestației (fără persoană)
app.post('/contestatii-only', verifyUser, async (req, res) => {
    try {
        // Obținem următorul număr secvențial pentru contestație
        const numarContestatie = await getNextContestationNumber();
        
        const { 
            // Câmpuri pentru contestație
            numarProcesVerbal, dataProcesVerbal, 
            numarCerere, dataCerere, dataAleasa,
            idImobil, documenteAtasate, observatii,
            verificatTeren,
            
            // Câmpuri pentru adresă
            regiune, uat, adresaImobil,
            adresaPrimarie, autorizat, adresaAutorizat
        } = req.body;
        
        const userId = req.user.id;

        // Pasul 1: Adăugăm DOAR contestația (tabelul principal)
        const sqlContestatie = `
        INSERT INTO contestatii (
            numar_contestatie, 
            numar_proces_verbal, data_proces_verbal, 
            numar_cerere, data_cerere, data_aleasa,
            id_imobil, documente_atasate, observatii,
            verificat_teren, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        db.query(sqlContestatie, [
            numarContestatie, 
            numarProcesVerbal, dataProcesVerbal,
            numarCerere, dataCerere, dataAleasa,
            idImobil, documenteAtasate, observatii,
            verificatTeren ? 1 : 0, userId
        ], (err, result) => {
            if (err) {
                console.error('Eroare la inserarea contestației:', err);
                return res.status(500).json({ status: 'error', message: 'Nu s-a putut salva contestația' });
            } 
            
            const contestatieId = result.insertId;
            
            // Pasul 2: Adăugăm DOAR adresa în tabelul adresa cu referință la contestație
            const sqlAdresa = `
            INSERT INTO adresa (
                contestatie_id, judet, uat, adresa_imobil, 
                adresa_primarie, autorizat, adresa_autorizat
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                
            db.query(sqlAdresa, [
                contestatieId, regiune, uat, adresaImobil, 
                adresaPrimarie, autorizat, adresaAutorizat
            ], (errAdresa) => {
                if (errAdresa) {
                    console.error('Eroare la inserarea adresei:', errAdresa);
                    return res.status(500).json({ status: 'error', message: 'Nu s-a putut salva adresa' });
                }
                
                console.log(`Contestație cu numărul ${numarContestatie} creată cu succes, ID: ${contestatieId}`);
                res.status(201).json({ 
                    status: 'success', 
                    id: contestatieId,
                    message: 'Contestația a fost salvată cu succes' 
                });
            });
        });
    } catch (error) {
        console.error('Eroare la procesarea contestației:', error);
        res.status(500).json({ status: 'error', message: 'Nu s-a putut procesa cererea' });
    }
});

// Endpoint pentru adăugarea unei contestații complete
app.post('/contestatii', verifyUser, async (req, res) => {
    try {
        // Obținem următorul număr secvențial pentru contestație
        const numarContestatie = await getNextContestationNumber();
        
        const { 
            // Câmpuri pentru contestație
            numarProcesVerbal, dataProcesVerbal, 
            numarCerere, dataCerere, dataAleasa,
            idImobil, documenteAtasate, observatii,
            verificatTeren,
            
            // Câmpuri pentru persoană
            nume, prenume, cnp, adresaPersonala,
            
            // Câmpuri pentru adresă
            regiune, uat, adresaImobil,
            adresaPrimarie, autorizat, adresaAutorizat
        } = req.body;
        
        const userId = req.user.id;

        // Pasul 1: Adăugăm contestația (tabelul principal)
        const sqlContestatie = `
        INSERT INTO contestatii (
            numar_contestatie, 
            numar_proces_verbal, data_proces_verbal, 
            numar_cerere, data_cerere, data_aleasa,
            id_imobil, documente_atasate, observatii,
            verificat_teren, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        db.query(sqlContestatie, [
            numarContestatie, 
            numarProcesVerbal, dataProcesVerbal,
            numarCerere, dataCerere, dataAleasa,
            idImobil, documenteAtasate, observatii,
            verificatTeren ? 1 : 0, userId
        ], (err, result) => {
            if (err) {
                console.error('Eroare la inserarea contestației:', err);
                return res.status(500).json({ status: 'error', message: 'Nu s-a putut salva contestația' });
            } 
            
            const contestatieId = result.insertId;
            
            // Pasul 2: Adăugăm persoana în tabelul person cu referință la contestație
            const sqlPerson = `
            INSERT INTO person (
                contestatie_id, nume, prenume, cnp, adresa_personala
            ) VALUES (?, ?, ?, ?, ?)`;
            
            db.query(sqlPerson, [contestatieId, nume, prenume, cnp, adresaPersonala], (errPerson) => {
                if (errPerson) {
                    console.error('Eroare la inserarea persoanei:', errPerson);
                    return res.status(500).json({ status: 'error', message: 'Nu s-a putut salva persoana' });
                }
                
                // Pasul 3: Adăugăm adresa în tabelul adresa cu referință la contestație
                const sqlAdresa = `
                INSERT INTO adresa (
                    contestatie_id, judet, uat, adresa_imobil, 
                    adresa_primarie, autorizat, adresa_autorizat
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                    
                db.query(sqlAdresa, [
                    contestatieId, regiune, uat, adresaImobil, 
                    adresaPrimarie, autorizat, adresaAutorizat
                ], (errAdresa) => {
                    if (errAdresa) {
                        console.error('Eroare la inserarea adresei:', errAdresa);
                        return res.status(500).json({ status: 'error', message: 'Nu s-a putut salva adresa' });
                    }
                    
                    console.log(`Contestație cu numărul ${numarContestatie} creată cu succes, ID: ${contestatieId}`);
                    res.status(201).json({ 
                        status: 'success', 
                        id: contestatieId,
                        message: 'Contestația a fost salvată cu succes' 
                    });
                });
            });
        });
    } catch (error) {
        console.error('Eroare la procesarea contestației:', error);
        res.status(500).json({ status: 'error', message: 'Nu s-a putut procesa cererea' });
    }
});

// Endpoint pentru adăugarea membrilor la o contestație
app.post('/membri-contestatie', verifyUser, async (req, res) => {
  try {
    const { 
      contestatie_id,
      nume, 
      prenume, 
      cnp,
      adresaPersonala  // Asigurăm-ne că acest parametru este corect procesat
    } = req.body;
    
    // Validare date primite
    if (!contestatie_id || !nume || !prenume || !cnp) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Câmpurile contestatie_id, nume, prenume și cnp sunt obligatorii' 
      });
    }
    
    // Adăugăm persoana în tabelul person cu referință la contestație
    const sql = `
    INSERT INTO person (
      contestatie_id, nume, prenume, cnp, adresa_personala
    ) VALUES (?, ?, ?, ?, ?)`;
    
    db.query(sql, [contestatie_id, nume, prenume, cnp, adresaPersonala], (err, result) => {
      if (err) {
        console.error('Eroare la adăugarea membrului:', err);
        return res.status(500).json({ 
          status: 'error', 
          message: 'Nu s-a putut adăuga membrul contestației' 
        });
      }
      
      const membruId = result.insertId;
      res.status(201).json({ 
        status: 'success',
        id: membruId,
        message: 'Membrul a fost adăugat cu succes' 
      });
    });
  } catch (error) {
    console.error('Eroare la procesarea membrului:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Nu s-a putut procesa cererea' 
    });
  }
});

// Rută pentru filtrarea contestațiilor
app.post('/filter-contestatii', verifyUser, (req, res) => {
    console.log('Received filter request with data:', req.body);

    // Validare date primite
    if (typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Date invalide' });
    }

    const {
        nume,
        prenume,
        cnp,
        regiune,
        dataStart,
        dataEnd,
        numarContestatie,
        // Noi câmpuri pentru filtrare
        numarProcesVerbal,
        numarCerere,
        idImobil,
        verificatTeren,
        admis,
        respins
    } = req.body;

    // Construim un query JOIN pentru a combina datele din cele trei tabele
    let sql = `
    SELECT c.*, p.nume, p.prenume, p.cnp, p.adresa_personala, a.judet as regiune, a.uat, 
           a.adresa_imobil as adresa, a.adresa_primarie, a.autorizat, a.adresa_autorizat
    FROM contestatii c
    LEFT JOIN person p ON c.id = p.contestatie_id
    LEFT JOIN adresa a ON c.id = a.contestatie_id
    WHERE 1=1`;
    
    const params = [];

    if (numarContestatie) {
        sql += ' AND c.numar_contestatie = ?';
        params.push(numarContestatie);
    }

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

    if (numarProcesVerbal) {
        sql += ' AND c.numar_proces_verbal LIKE ?';
        params.push(`%${numarProcesVerbal}%`);
    }

    if (numarCerere) {
        sql += ' AND c.numar_cerere LIKE ?';
        params.push(`%${numarCerere}%`);
    }

    if (idImobil) {
        sql += ' AND c.id_imobil LIKE ?';
        params.push(`%${idImobil}%`);
    }

    if (verificatTeren !== undefined) {
        sql += ' AND c.verificat_teren = ?';
        params.push(verificatTeren ? 1 : 0);
    }

    if (admis !== undefined) {
        sql += ' AND c.admis = ?';
        params.push(admis ? 1 : 0);
    }

    if (respins !== undefined) {
        sql += ' AND c.respins = ?';
        params.push(respins ? 1 : 0);
    }

    if (dataStart) {
        sql += ' AND DATE(c.data_aleasa) >= DATE(?)';
        params.push(dataStart);
    }

    if (dataEnd) {
        sql += ' AND DATE(c.data_aleasa) <= DATE(?)';
        params.push(dataEnd);
    }

    // Sortare simplă după numărul de contestație (numeric)
    sql += ' ORDER BY c.numar_contestatie ASC';

    console.log('Executing SQL query:', sql);
    console.log('With parameters:', params);

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ 
                error: 'Eroare la filtrarea contestațiilor',
                details: err.message 
            });
        } else {
            console.log(`Found ${results.length} results`);
            res.json(results);
        }
    });
});

// Rută pentru obținerea unei singure contestații
app.get('/contestatii/:id', verifyUser, (req, res) => {
    const { id } = req.params;
    
    // Obținem contestația cu datele din toate tabelele
    const sql = `
    SELECT c.*, p.nume, p.prenume, p.cnp, p.adresa_personala, a.judet as regiune, a.uat, 
           a.adresa_imobil as adresa, a.adresa_primarie, a.autorizat, a.adresa_autorizat
    FROM contestatii c
    LEFT JOIN person p ON c.id = p.contestatie_id
    LEFT JOIN adresa a ON c.id = a.contestatie_id
    WHERE c.id = ?`;
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Eroare la obținerea contestației:', err);
            return res.status(500).json({ error: 'Eroare la obținerea contestației' });
        } 
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Contestația nu a fost găsită' });
        }
        
        const contestatie = results[0];
        res.json(contestatie);
    });
});

// Rută pentru actualizarea unei contestații
app.put('/contestatii/:id', verifyUser, (req, res) => {
    const { id } = req.params;
    const {
        // Câmpuri pentru contestație
        dataAleasa,
        numar_proces_verbal,
        data_proces_verbal,
        numar_cerere,
        data_cerere,
        id_imobil,
        documente_atasate,
        observatii,
        verificat_teren,
        admis,
        respins,
        
        // Câmpuri pentru persoană
        nume,
        prenume,
        cnp,
        adresa_personala,
        
        // Câmpuri pentru adresă
        regiune,
        uat,
        adresa,
        adresa_primarie,
        autorizat,
        adresa_autorizat
    } = req.body;

    // Actualizăm contestația
    const sqlContestatie = `
        UPDATE contestatii 
        SET 
            numar_proces_verbal = ?,
            data_proces_verbal = ?,
            numar_cerere = ?,
            data_cerere = ?,
            data_aleasa = ?,
            id_imobil = ?,
            documente_atasate = ?,
            observatii = ?,
            verificat_teren = ?,
            admis = ?,
            respins = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    db.query(sqlContestatie, [
        numar_proces_verbal, 
        data_proces_verbal, 
        numar_cerere, 
        data_cerere,
        dataAleasa,
        id_imobil, 
        documente_atasate, 
        observatii, 
        verificat_teren ? 1 : 0, 
        admis ? 1 : 0, 
        respins ? 1 : 0,
        id
    ], (errContestatie) => {
        if (errContestatie) {
            console.error('Eroare la actualizarea contestației:', errContestatie);
            return res.status(500).json({ error: 'Eroare la actualizarea contestației' });
        }
        
        // Actualizăm persoana
        const sqlPerson = `
            UPDATE person 
            SET nume = ?, prenume = ?, cnp = ?, adresa_personala = ?, updated_at = CURRENT_TIMESTAMP
            WHERE contestatie_id = ?
        `;

        db.query(sqlPerson, [nume, prenume, cnp, adresa_personala, id], (errPerson) => {
            if (errPerson) {
                console.error('Eroare la actualizarea persoanei:', errPerson);
                return res.status(500).json({ error: 'Eroare la actualizarea persoanei' });
            }

            // Actualizăm adresa
            const sqlAdresa = `
                UPDATE adresa 
                SET judet = ?, uat = ?, adresa_imobil = ?, 
                    adresa_primarie = ?, autorizat = ?, adresa_autorizat = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE contestatie_id = ?
            `;

            db.query(sqlAdresa, [
                regiune, uat, adresa, 
                adresa_primarie, autorizat, adresa_autorizat, 
                id
            ], (errAdresa) => {
                if (errAdresa) {
                    console.error('Eroare la actualizarea adresei:', errAdresa);
                    return res.status(500).json({ error: 'Eroare la actualizarea adresei' });
                }
                
                res.json({ message: 'Contestația a fost actualizată cu succes' });
            });
        });
    });
});

// Rută pentru ștergerea unei contestații
app.delete('/contestatii/:id', verifyUser, (req, res) => {
    const { id } = req.params;
    
    // Nu mai este nevoie să ștergem separat person și adresa
    // datorită relației foreign key cu ON DELETE CASCADE
    const sql = 'DELETE FROM contestatii WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Eroare la ștergerea contestației:', err);
            res.status(500).json({ error: 'Eroare la ștergerea contestației' });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Contestația nu a fost găsită' });
        } else {
            res.json({ message: 'Contestația a fost ștearsă cu succes' });
        }
    });
});

// Endpoint pentru a obține toți membrii unei contestații
app.get('/membri-contestatie/:contestatieId', verifyUser, (req, res) => {
    const { contestatieId } = req.params;
    
    const sql = `
    SELECT id, nume, prenume, cnp, adresa_personala
    FROM person 
    WHERE contestatie_id = ?
    ORDER BY id ASC`;
    
    db.query(sql, [contestatieId], (err, results) => {
        if (err) {
            console.error('Eroare la obținerea membrilor:', err);
            return res.status(500).json({ 
                status: 'error', 
                message: 'Nu s-au putut obține membrii contestației' 
            });
        }
        
        res.json(results);
    });
});

// Rută pentru obținerea statisticilor contestațiilor
app.get('/contestatii-stats', verifyUser, (req, res) => {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN admis = 1 THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN respins = 1 THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN admis = 0 AND respins = 0 THEN 1 ELSE 0 END) as pending
      FROM contestatii
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Eroare la obținerea statisticilor:', err);
            return res.status(500).json({ error: 'Eroare la obținerea statisticilor' });
        }
        
        // Returnăm statisticile
        const stats = results[0];
        res.json({
            total: parseInt(stats.total) || 0,
            approved: parseInt(stats.approved) || 0,
            rejected: parseInt(stats.rejected) || 0,
            pending: parseInt(stats.pending) || 0
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});