# 🇲🇽 El Impostor Mexicano

Juego multijugador del impostor con temática mexicana. Los jugadores deben descubrir quién es el impostor antes de que adivine la palabra secreta.

## 🎮 Características

- **Multijugador**: 3 o más jugadores
- **Temática Mexicana**: Palabras sobre comida, lugares, tradiciones, personajes y objetos típicos de México
- **Backend con PostgreSQL**: Almacenamiento persistente de partidas
- **Sistema de Rondas**: Los jugadores dan pistas en cada ronda
- **Votación**: Elimina jugadores sospechosos
- **Modo Impostor**: El impostor puede intentar adivinar la palabra

## 📋 Requisitos

- Node.js (v14 o superior)
- PostgreSQL (v12 o superior)
- Navegador web moderno

## 🚀 Instalación

### 1. Clonar o descargar el proyecto

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar PostgreSQL

#### Opción A: Usando pgAdmin 4 (recomendado para principiantes)
1. Abre pgAdmin 4
2. Conéctate a tu servidor PostgreSQL
3. Click derecho en "Databases" → "Create" → "Database"
4. Nombre: `impostor_db`
5. Click en "Save"

#### Opción B: Usando terminal/CMD
```bash
psql -U postgres
CREATE DATABASE impostor_db;
\q
```

### 4. Configurar credenciales
Edita el archivo `server.js` líneas 13-19:
```javascript
const pool = new Pool({
    user: 'postgres',          // Tu usuario de PostgreSQL
    host: 'localhost',
    database: 'impostor_db',
    password: 'TU_PASSWORD',   // ⚠️ CAMBIA ESTO
    port: 5432,
});
```

### 5. Iniciar el servidor
```bash
node server.js
```

Deberías ver:
```
Base de datos inicializada correctamente
Servidor corriendo en http://localhost:3000
```

### 6. Abrir el juego
Abre tu navegador en: `http://localhost:3000`

## 🎯 Cómo jugar

### Crear Partida
1. Click en "Crear Partida"
2. Selecciona una categoría
3. Comparte el código con tus amigos

### Unirse a Partida
1. Click en "Unirse a Partida"
2. Escribe tu nombre
3. Ingresa el código de 6 caracteres

### Durante el Juego
1. **Jugadores normales**: Reciben la palabra secreta
2. **Impostor**: No recibe la palabra (ve "¡ERES EL IMPOSTOR!")
3. Cada jugador da una pista relacionada a la palabra
4. Todos votan para eliminar al sospechoso
5. El impostor puede intentar adivinar la palabra

### Condiciones de Victoria
- **Jugadores ganan**: Si eliminan al impostor
- **Impostor gana**: Si adivina la palabra correcta o no es descubierto

## 🗂️ Estructura del Proyecto

```
impostor-mexicano/
│
├── server.js              # Backend con Express y PostgreSQL
├── package.json
├── DATABASE_SETUP.md      # Guía de configuración de BD
├── README.md
│
└── public/
    ├── index.html         # Interfaz del juego
    ├── styles.css         # Estilos con tema mexicano
    └── app.js             # Lógica del cliente
```

## 🎨 Categorías de Palabras

- **🌮 Comida Mexicana**: tacos, pozole, tamales, mole, quesadillas...
- **🏛️ Lugares de México**: zócalo, teotihuacán, chichén itzá...
- **🎊 Tradiciones**: día de muertos, quinceañera, mariachi...
- **👤 Personajes Famosos**: frida kahlo, diego rivera, cantinflas...
- **🎨 Objetos Típicos**: sarape, sombrero, molcajete, alebrije...

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Backend**: Node.js, Express
- **Base de Datos**: PostgreSQL
- **Estilo**: Colores de la bandera mexicana (verde, blanco, rojo)

## 📱 Características Técnicas

- **Auto-actualización**: Las pantallas se actualizan automáticamente cada 3 segundos
- **Responsive**: Funciona en móviles y tablets
- **Persistencia**: Las partidas se guardan en PostgreSQL
- **Sistema de Votos**: Cada jugador puede votar en cada ronda
- **Eliminación automática**: El jugador con más votos es eliminado

## 🔧 Solución de Problemas

### El servidor no inicia
- Verifica que PostgreSQL esté corriendo
- Revisa que las credenciales en `server.js` sean correctas
- Asegúrate de que el puerto 3000 esté libre

### Error de conexión a la base de datos
- Confirma que la base de datos `impostor_db` existe
- Verifica usuario y contraseña en `server.js`
- Revisa que PostgreSQL esté escuchando en el puerto 5432

### El juego no se actualiza
- Verifica la consola del navegador (F12) para errores
- Asegúrate de que el servidor esté corriendo
- Prueba refrescando la página (F5)

## 🎓 Para Desarrollo

### Ver tablas en pgAdmin
1. Abre pgAdmin 4
2. Navega a: Servers → PostgreSQL → Databases → impostor_db → Schemas → public → Tables

### Consultas útiles
```sql
-- Ver todas las partidas
SELECT * FROM partidas ORDER BY created_at DESC;

-- Ver jugadores de una partida
SELECT * FROM jugadores WHERE partida_id = 1;

-- Limpiar datos de prueba
DELETE FROM partidas;
```

## 📝 Notas

- Mínimo 3 jugadores para iniciar
- Solo el creador de la partida puede iniciarla
- Las partidas se guardan permanentemente hasta ser eliminadas manualmente
- El impostor puede ver las pistas de los demás jugadores para intentar adivinar

## 👨‍💻 Desarrollado por

Uzi - Estudiante de CBTis 258

---

¡Diviértete jugando El Impostor Mexicano! 🎉🇲🇽
