require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de PostgreSQL para que se conecte con pg admin
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
    // Si no hay DATABASE_URL (desarrollo local), usar configuración local
    ...((!process.env.DATABASE_URL) && {
        user: 'postgres',
        host: 'localhost',
        database: 'impostor_db',
        password: process.env.POSTGRES_PASSWORD || 'clave1212gg',
        port: 5432,
    })
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Palabras temáticas mexicanas por categorías se agrego de todo un poco para que haya una gran extensa variedad de cosas y temas
const palabrasMexicanas = {
    comida: ['tacos', 'pozole', 'tamales', 'mole', 'quesadillas', 'enchiladas', 'chilaquiles', 'torta ahogada', 'cochinita pibil', 'chiles en nogada'],
    lugares: ['zócalo', 'teotihuacán', 'chichén itzá', 'xochimilco', 'chapultepec', 'palenque', 'tulum', 'guanajuato', 'taxco', 'oaxaca'],
    tradiciones: ['día de muertos', 'quinceañera', 'mariachi', 'lucha libre', 'piñata', 'posadas', 'grito de independencia', 'charreada', 'jaripeo', 'danza de los voladores'],
    personajes: ['frida kahlo', 'diego rivera', 'cantinflas', 'chespirito', 'pedro infante', 'juan gabriel', 'chavela vargas', 'octavio paz', 'sor juana', 'emiliano zapata'],
    objetos: ['sarape', 'sombrero', 'molcajete', 'comal', 'metate', 'rebozo', 'huaraches', 'calavera', 'alebrije', 'papel picado']
};

// Crear tablas
// Se crean las tablas en pg para llevar un control del juego
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS partidas (
                id SERIAL PRIMARY KEY,
                codigo VARCHAR(6) UNIQUE NOT NULL,
                palabra VARCHAR(100) NOT NULL,
                categoria VARCHAR(50) NOT NULL,
                estado VARCHAR(20) DEFAULT 'esperando',
                impostor_id INTEGER,
                ganador VARCHAR(50),
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS jugadores (
                id SERIAL PRIMARY KEY,
                partida_id INTEGER REFERENCES partidas(id) ON DELETE CASCADE,
                nombre VARCHAR(50) NOT NULL,
                es_impostor BOOLEAN DEFAULT FALSE,
                vivo BOOLEAN DEFAULT TRUE,
                votos INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS pistas (
                id SERIAL PRIMARY KEY,
                partida_id INTEGER REFERENCES partidas(id) ON DELETE CASCADE,
                jugador_id INTEGER REFERENCES jugadores(id) ON DELETE CASCADE,
                pista TEXT NOT NULL,
                ronda INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        console.log('Base de datos inicializada correctamente');
    } catch (err) {
        console.error('Error al inicializar la base de datos:', err);
    }
}


function generarCodigo() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Crear nueva partida
app.post('/api/partida/crear', async (req, res) => {
    try {
        const { categoria } = req.body;
        const palabras = palabrasMexicanas[categoria] || palabrasMexicanas.comida;
        const palabra = palabras[Math.floor(Math.random() * palabras.length)];
        const codigo = generarCodigo();

        const result = await pool.query(
            'INSERT INTO partidas (codigo, palabra, categoria) VALUES ($1, $2, $3) RETURNING *',
            [codigo, palabra, categoria]
        );

        res.json({ 
            success: true, 
            partida: result.rows[0],
            codigo: codigo
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});


app.post('/api/partida/unirse', async (req, res) => {
    try {
        const { codigo, nombre } = req.body;

        const partida = await pool.query('SELECT * FROM partidas WHERE codigo = $1', [codigo]);
        
        if (partida.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Partida no encontrada' });
        }

        if (partida.rows[0].estado !== 'esperando') {
            return res.status(400).json({ success: false, error: 'La partida ya comenzó' });
        }

        const jugador = await pool.query(
            'INSERT INTO jugadores (partida_id, nombre) VALUES ($1, $2) RETURNING *',
            [partida.rows[0].id, nombre]
        );

        res.json({ 
            success: true, 
            jugador: jugador.rows[0],
            partida_id: partida.rows[0].id
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Iniciar partida
// Aqui se asigna quien sera el importar :-)
app.post('/api/partida/iniciar/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const jugadores = await pool.query('SELECT * FROM jugadores WHERE partida_id = $1', [id]);
        
        if (jugadores.rows.length < 3) {
            return res.status(400).json({ success: false, error: 'Se necesitan al menos 3 jugadores' });
        }

        // Seleccionar impostor ALEATORIO
        const impostorIndex = Math.floor(Math.random() * jugadores.rows.length);
        const impostor = jugadores.rows[impostorIndex];

        await pool.query('UPDATE jugadores SET es_impostor = TRUE WHERE id = $1', [impostor.id]);
        await pool.query('UPDATE partidas SET estado = $1, impostor_id = $2 WHERE id = $3', 
            ['jugando', impostor.id, id]);

        res.json({ success: true, mensaje: 'Partida iniciada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});


app.get('/api/partida/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;

        const partida = await pool.query('SELECT * FROM partidas WHERE codigo = $1', [codigo]);
        
        if (partida.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Partida no encontrada' });
        }

        const jugadores = await pool.query('SELECT id, nombre, vivo, votos FROM jugadores WHERE partida_id = $1', 
            [partida.rows[0].id]);

        const pistas = await pool.query(`
            SELECT p.pista, p.ronda, j.nombre 
            FROM pistas p 
            JOIN jugadores j ON p.jugador_id = j.id 
            WHERE p.partida_id = $1 
            ORDER BY p.ronda, p.created_at
        `, [partida.rows[0].id]);

        res.json({ 
            success: true, 
            partida: partida.rows[0],
            jugadores: jugadores.rows,
            pistas: pistas.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});


app.get('/api/jugador/:id/palabra', async (req, res) => {
    try {
        const { id } = req.params;

        const jugador = await pool.query('SELECT * FROM jugadores WHERE id = $1', [id]);
        
        if (jugador.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Jugador no encontrado' });
        }

        const partida = await pool.query('SELECT * FROM partidas WHERE id = $1', 
            [jugador.rows[0].partida_id]);

        const palabra = jugador.rows[0].es_impostor ? '¡ERES EL IMPOSTOR!' : partida.rows[0].palabra.toUpperCase();

        res.json({ 
            success: true, 
            palabra: palabra,
            es_impostor: jugador.rows[0].es_impostor
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});


app.post('/api/pista/enviar', async (req, res) => {
    try {
        const { jugador_id, pista, ronda } = req.body;

        await pool.query(
            'INSERT INTO pistas (jugador_id, partida_id, pista, ronda) VALUES ($1, (SELECT partida_id FROM jugadores WHERE id = $1), $2, $3)',
            [jugador_id, pista, ronda]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Votar jugador
// Una vez ya jugando cuando los jugarores lleguen a una conclusion se raealiza la votacion
app.post('/api/votar', async (req, res) => {
    try {
        const { jugador_id } = req.body;

        await pool.query('UPDATE jugadores SET votos = votos + 1 WHERE id = $1', [jugador_id]);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Eliminar jugador con más votos
app.post('/api/eliminar/:partida_id', async (req, res) => {
    try {
        const { partida_id } = req.params;

        const eliminado = await pool.query(
            'SELECT * FROM jugadores WHERE partida_id = $1 ORDER BY votos DESC LIMIT 1',
            [partida_id]
        );

        if (eliminado.rows.length > 0) {
            await pool.query('UPDATE jugadores SET vivo = FALSE WHERE id = $1', [eliminado.rows[0].id]);
            await pool.query('UPDATE jugadores SET votos = 0 WHERE partida_id = $1', [partida_id]);

            res.json({ 
                success: true, 
                eliminado: eliminado.rows[0],
                era_impostor: eliminado.rows[0].es_impostor
            });
        } else {
            res.json({ success: false, error: 'No hay jugadores para eliminar' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Impostor adivina palabra
app.post('/api/impostor/adivinar', async (req, res) => {
    try {
        const { partida_id, palabra_adivinada } = req.body;

        const partida = await pool.query('SELECT * FROM partidas WHERE id = $1', [partida_id]);
        
        const correcto = palabra_adivinada.toLowerCase().trim() === partida.rows[0].palabra.toLowerCase();

        if (correcto) {
            await pool.query('UPDATE partidas SET estado = $1, ganador = $2 WHERE id = $3', 
                ['finalizada', 'impostor', partida_id]);
        }

        res.json({ success: true, correcto: correcto });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Obtener categorías disponibles
app.get('/api/categorias', (req, res) => {
    res.json({ 
        success: true, 
        categorias: Object.keys(palabrasMexicanas) 
    });
});

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
});
