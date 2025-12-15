const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';


let gameState = {
    partidaId: null,
    codigo: null,
    categoria: null,
    palabra: null,
    numJugadores: 0,
    jugadores: [],
    jugadorTurno: 0,
    rondaActual: 1,
    impostorIndex: -1,
    jugadoresVivos: [],
    pistas: [],
    revelacionIndex: 0
};

//NAVEGACIÓN 
function mostrarPantalla(nombrePantalla) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
    document.getElementById(`pantalla-${nombrePantalla}`).classList.add('activa');
}

function volverInicio() {
    gameState = {
        partidaId: null,
        codigo: null,
        categoria: null,
        palabra: null,
        numJugadores: 0,
        jugadores: [],
        jugadorTurno: 0,
        rondaActual: 1,
        impostorIndex: -1,
        jugadoresVivos: [],
        pistas: [],
        revelacionIndex: 0
    };
    mostrarPantalla('inicio');
}

function iniciarNuevaPartida() {
    mostrarPantalla('config');
}

//CREAR PARTIDA
async function crearPartida() {
    const categoria = document.getElementById('categoria-select').value;
    const numJugadores = parseInt(document.getElementById('num-jugadores').value);

    if (numJugadores < 3) {
        alert('Se necesitan mínimo 3 jugadores');
        return;
    }

    gameState.categoria = categoria;
    gameState.numJugadores = numJugadores;

    try {
        const response = await fetch(`${API_URL}/partida/crear`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoria })
        });

        const data = await response.json();

        if (data.success) {
            gameState.partidaId = data.partida.id;
            gameState.codigo = data.codigo;
            gameState.palabra = data.partida.palabra;

            document.getElementById('total-jugadores').textContent = numJugadores;
            mostrarPantalla('registro');
            actualizarNumeroJugador();
        } else {
            alert('Error al crear la partida');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión con el servidor');
    }
}

//REGISTRO DE JUGADORES
function actualizarNumeroJugador() {
    document.getElementById('jugador-numero').textContent = gameState.jugadores.length + 1;
}

async function registrarJugador() {
    const nombreInput = document.getElementById('nombre-jugador');
    const nombre = nombreInput.value.trim();

    if (!nombre) {
        alert('Por favor escribe un nombre');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/partida/unirse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                codigo: gameState.codigo,
                nombre: nombre
            })
        });

        const data = await response.json();

        if (data.success) {
            gameState.jugadores.push({
                id: data.jugador.id,
                nombre: nombre,
                vivo: true,
                votos: 0
            });

           
            const lista = document.getElementById('lista-registrados');
            const li = document.createElement('li');
            li.textContent = nombre;
            lista.appendChild(li);

            nombreInput.value = '';

            
            if (gameState.jugadores.length >= gameState.numJugadores) {
                setTimeout(() => iniciarPartidaLocal(), 500);
            } else {
                actualizarNumeroJugador();
                nombreInput.focus();
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al registrar jugador');
    }
}

//INICIAR PARTIDA
async function iniciarPartidaLocal() {
    try {
        const response = await fetch(`${API_URL}/partida/iniciar/${gameState.partidaId}`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
            
            const infoResponse = await fetch(`${API_URL}/partida/${gameState.codigo}`);
            const infoData = await infoResponse.json();

            
            gameState.impostorIndex = gameState.jugadores.findIndex(
                j => j.id === infoData.partida.impostor_id
            );

            gameState.jugadoresVivos = [...gameState.jugadores];
            gameState.revelacionIndex = 0;

            mostrarRevelacionJugador();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al iniciar partida');
    }
}

//REVELACIÓN DE PALABRAS
function mostrarRevelacionJugador() {
    const jugador = gameState.jugadores[gameState.revelacionIndex];
    document.getElementById('nombre-turno').textContent = jugador.nombre;
    mostrarPantalla('revelacion');
}

async function revelarPalabra() {
    const jugadorActual = gameState.jugadores[gameState.revelacionIndex];
    const esImpostor = gameState.revelacionIndex === gameState.impostorIndex;

    document.getElementById('nombre-jugador-palabra').textContent = jugadorActual.nombre;

    if (esImpostor) {
        document.getElementById('palabra-mostrar').textContent = '¡ERES EL IMPOSTOR!';
        document.getElementById('instruccion-rol').textContent = 
            '¡Debes descubrir la palabra sin que te descubran!';
        document.getElementById('instruccion-rol').style.color = '#CE1126';
    } else {
        document.getElementById('palabra-mostrar').textContent = gameState.palabra.toUpperCase();
        document.getElementById('instruccion-rol').textContent = 
            'Da pistas sin ser muy obvio. ¡Encuentra al impostor!';
        document.getElementById('instruccion-rol').style.color = '#006847';
    }

    mostrarPantalla('palabra');
    iniciarCuentaRegresiva();
}

function iniciarCuentaRegresiva() {
    let tiempo = 5;
    const countdownEl = document.getElementById('countdown');
    
    const interval = setInterval(() => {
        tiempo--;
        countdownEl.textContent = tiempo;
        
        if (tiempo <= 0) {
            clearInterval(interval);
        }
    }, 1000);
}

function siguienteJugadorRevelacion() {
    gameState.revelacionIndex++;

    if (gameState.revelacionIndex < gameState.jugadores.length) {
        mostrarRevelacionJugador();
    } else {
        
        iniciarJuego();
    }
}

//JUEGO
function iniciarJuego() {
    gameState.jugadorTurno = 0;
    gameState.pistas = [];
    
    document.getElementById('categoria-juego').textContent = 
        gameState.categoria.charAt(0).toUpperCase() + gameState.categoria.slice(1);
    document.getElementById('ronda-actual').textContent = gameState.rondaActual;
    document.getElementById('jugadores-vivos').textContent = gameState.jugadoresVivos.length;
    
    mostrarPantalla('juego');
    mostrarTurnoPista();
}

function mostrarTurnoPista() {
    const jugador = gameState.jugadoresVivos[gameState.jugadorTurno];
    document.getElementById('jugador-turno').textContent = jugador.nombre;
    document.getElementById('seccion-turno').style.display = 'block';
    document.getElementById('seccion-votacion').style.display = 'none';
    document.getElementById('seccion-adivinar').style.display = 'none';
    document.getElementById('pista-input').value = '';
    document.getElementById('pista-input').focus();
}

async function darPista() {
    const pistaInput = document.getElementById('pista-input');
    const pista = pistaInput.value.trim();

    if (!pista) {
        alert('Escribe una pista');
        return;
    }

    const jugador = gameState.jugadoresVivos[gameState.jugadorTurno];

    try {
        await fetch(`${API_URL}/pista/enviar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jugador_id: jugador.id,
                pista: pista,
                ronda: gameState.rondaActual
            })
        });

        gameState.pistas.push({
            nombre: jugador.nombre,
            pista: pista
        });

        actualizarPistas();
        pistaInput.value = '';

      
        gameState.jugadorTurno++;

        if (gameState.jugadorTurno < gameState.jugadoresVivos.length) {
            mostrarTurnoPista();
        } else {
            
            mostrarVotacion();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al enviar pista');
    }
}

function actualizarPistas() {
    const listaPistas = document.getElementById('lista-pistas');
    listaPistas.innerHTML = '';

    if (gameState.pistas.length === 0) {
        listaPistas.innerHTML = '<p style="color: #999;">Aún no hay pistas</p>';
    } else {
        gameState.pistas.forEach(pista => {
            const div = document.createElement('div');
            div.className = 'pista-item';
            div.innerHTML = `<strong>${pista.nombre}:</strong> ${pista.pista}`;
            listaPistas.appendChild(div);
        });
    }
}

//VOTACIÓN
function mostrarVotacion() {
    document.getElementById('seccion-turno').style.display = 'none';
    document.getElementById('seccion-votacion').style.display = 'block';

    const opcionesVoto = document.getElementById('opciones-voto');
    opcionesVoto.innerHTML = '';

    gameState.jugadoresVivos.forEach(jugador => {
        const btn = document.createElement('button');
        btn.className = 'voto-btn';
        btn.textContent = `${jugador.nombre} (${jugador.votos || 0} votos)`;
        btn.onclick = () => votarJugador(jugador, btn);
        opcionesVoto.appendChild(btn);
    });

    
    const impostorVivo = gameState.jugadoresVivos.some(
        (j, idx) => gameState.jugadores.indexOf(j) === gameState.impostorIndex
    );

    if (impostorVivo) {
        document.getElementById('seccion-adivinar').style.display = 'block';
    }
}

async function votarJugador(jugador, btnElement) {
    document.querySelectorAll('.voto-btn').forEach(b => b.classList.remove('selected'));
    btnElement.classList.add('selected');

    try {
        await fetch(`${API_URL}/votar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jugador_id: jugador.id })
        });

        jugador.votos = (jugador.votos || 0) + 1;
        btnElement.textContent = `${jugador.nombre} (${jugador.votos} votos)`;
    } catch (error) {
        console.error('Error:', error);
    }
}

async function revelarResultadoVotacion() {
    try {
        const response = await fetch(`${API_URL}/eliminar/${gameState.partidaId}`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
            const eliminado = gameState.jugadoresVivos.find(j => j.id === data.eliminado.id);
            const eraImpostor = data.era_impostor;

            gameState.jugadoresVivos = gameState.jugadoresVivos.filter(j => j.id !== eliminado.id);

            
            gameState.jugadoresVivos.forEach(j => j.votos = 0);

            if (eraImpostor) {
                mostrarResultado('jugadores', `¡${eliminado.nombre} era el IMPOSTOR!`);
            } else {
                alert(`${eliminado.nombre} NO era el impostor. El juego continúa...`);
                
                if (gameState.jugadoresVivos.length <= 2) {
                    mostrarResultado('impostor', '¡El impostor sobrevivió!');
                } else {
                    siguienteRonda();
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

//ADIVINANZA DEL IMPOSTOR
async function intentarAdivinar() {
    const adivinanza = document.getElementById('adivinanza-input').value.trim();

    if (!adivinanza) {
        alert('Escribe tu respuesta');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/impostor/adivinar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                partida_id: gameState.partidaId,
                palabra_adivinada: adivinanza
            })
        });

        const data = await response.json();

        if (data.correcto) {
            mostrarResultado('impostor', '¡El impostor adivinó la palabra!');
        } else {
            alert('❌ Incorrecto. El juego continúa...');
            document.getElementById('adivinanza-input').value = '';
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function saltarAdivinanza() {
    
    document.getElementById('seccion-adivinar').style.display = 'none';
}

//SIGUIENTE RONDA
function siguienteRonda() {
    gameState.rondaActual++;
    gameState.jugadorTurno = 0;
    gameState.pistas = [];

    document.getElementById('ronda-actual').textContent = gameState.rondaActual;
    document.getElementById('jugadores-vivos').textContent = gameState.jugadoresVivos.length;

    actualizarPistas();
    mostrarTurnoPista();
}

//RESULTADO
function mostrarResultado(ganador, mensaje) {
    const titulo = document.getElementById('resultado-titulo');
    const mensajeEl = document.getElementById('resultado-mensaje');
    const icono = document.getElementById('resultado-icono');

    document.getElementById('palabra-final').textContent = gameState.palabra.toUpperCase();

    if (ganador === 'impostor') {
        titulo.textContent = '🎭 ¡EL IMPOSTOR GANÓ!';
        titulo.style.color = '#CE1126';
        mensajeEl.textContent = mensaje;
        icono.textContent = '🎭';
    } else {
        titulo.textContent = '🏆 ¡GANARON LOS JUGADORES!';
        titulo.style.color = '#006847';
        mensajeEl.textContent = mensaje;
        icono.textContent = '🏆';
    }

    mostrarPantalla('resultado');
}
