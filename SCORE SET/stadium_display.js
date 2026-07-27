// ============================================================
// CONSTANTES - Durées d'affichage et limites système
// ============================================================
const CONSTANTS = {
    GOAL_OVERLAY_DURATION: 3000,        // Durée d'affichage de l'overlay de but (ms)
    PLAYER_CARD_DURATION: 5000,        // Durée d'affichage de la carte joueur (ms)
    YELLOW_CARD_DURATION: 4000,        // Durée d'affichage du carton jaune (ms)
    RED_CARD_DURATION: 5000,           // Durée d'affichage du carton rouge (ms)
    SUBSTITUTION_DURATION: 5000,       // Durée d'affichage du remplacement (ms)
    VAR_DURATION: 5000,                // Durée d'affichage du VAR (ms)
    GAME_PHASE_DURATION: 3000,         // Durée d'affichage de la phase de jeu (ms)
    DEFAULT_IMAGE_DURATION: 10,        // Durée par défaut pour les images (secondes)
    LOCAL_STORAGE_MAX_SIZE: 4000000   // Taille maximale localStorage (4MB)
};

// ============================================================
// MODE DÉVELOPPEMENT - Logs activés uniquement en dev
// ============================================================
const DEV_MODE = window.location.hostname === 'localhost' || window.location.protocol === 'file:';

/**
 * Fonction de log qui affiche uniquement en mode développement
 * @param {...any} args - Arguments à logger
 */
function log(...args) {
    if (DEV_MODE) {
        console.log(...args);
    }
}

/**
 * Test si localStorage est disponible et fonctionne
 * @returns {boolean} True si localStorage est disponible
 */
function testLocalStorage() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
    } catch (e) {
        log('localStorage non disponible:', e);
        return false;
    }
}

// ============================================================
// INDEXEDDB - Stockage de fichiers volumineux
// ============================================================
const DB_NAME = 'StadiumMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'media';

/**
 * Initialise IndexedDB pour stocker des fichiers volumineux
 * @returns {Promise<IDBDatabase>} Base de données IndexedDB
 */
function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

/**
 * Récupère un fichier depuis IndexedDB
 * @param {string} id - Identifiant du fichier
 * @returns {Promise<Blob|null>} Données du fichier ou null
 */
async function getMediaFromIndexedDB(id) {
    try {
        const db = await initIndexedDB();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result ? request.result.blob : null);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        log('Erreur IndexedDB:', e);
        return null;
    }
}

// ============================================================
// ÉTAT PAR DÉFAUT - Configuration initiale du match
// ============================================================
const defaultState = {
    team1: {
        name: 'HOME',
        color: '#e94560',
        logo: '',                       // Logo de l'équipe (base64 ou IndexedDB ID)
        players: []
    },
    team2: {
        name: 'AWAY',
        color: '#00ff88',
        logo: '',                       // Logo de l'équipe (base64 ou IndexedDB ID)
        players: []
    },
    score1: 0,                          // Score équipe domicile
    score2: 0,                          // Score équipe extérieur
    timer: 0,                           // Chronomètre en secondes
    addedTime: 0,                       // Temps additionnel en minutes
    isRunning: false,                   // État du chronomètre
    phase: 'first-half',                // Phase du match (first-half, ht, second-half, et, ft)
    theme: 'dark',                      // Thème d'affichage (dark, light, blue, green)
    stats: {
        possession: '50-50',           // Possession de balle
        shots: [0, 0],                  // Tirs cadrés [domicile, extérieur]
        corners: [0, 0]                 // Corners [domicile, extérieur]
    },
    ticker: ['🏟️ Bienvenue au Stadium Live Régie v2.1', '⚽ Match en direct', '📺 Suivez le match en temps réel'],
    events: [],                         // Liste des événements du match
    media: {
        type: 'none',                   // Type de média (none, image, video)
        source: '',                     // URL ou base64 du média
        title: '',                      // Titre du média
        duration: CONSTANTS.DEFAULT_IMAGE_DURATION // Durée d'affichage en secondes
    },
    scoreColor: '#e94560',               // Couleur unique des scores
    timerColor: '#ffffff'                // Couleur unique du chronomètre
};

// ============================================================
// CHARGEMENT DE L'ÉTAT - Récupération depuis localStorage
// ============================================================
let state = JSON.parse(localStorage.getItem('stadium_match_state')) || defaultState;
let mediaTimeout = null;  // Timeout pour l'auto-hide des médias

// Test de disponibilité de localStorage
if (!testLocalStorage()) {
    alert('Attention: localStorage n\'est pas disponible. Certaines fonctionnalités ne marcheront pas.');
}

// ============================================================
// ÉCOUTEUR DE CHANGEMENTS - Sync avec le panneau de contrôle
// ============================================================
window.addEventListener('storage', (e) => {
    if (e.key === 'stadium_match_state') {
        const oldState = state;
        state = JSON.parse(e.newValue);

        console.log('Storage event - team1.logo:', state.team1.logo ? 'présent' : 'vide');
        console.log('Storage event - team2.logo:', state.team2.logo ? 'présent' : 'vide');

        // Détecter si seule la valeur du timer a changé (mise à jour chronomètre)
        const onlyTimerChanged =
            oldState.timer !== state.timer &&
            oldState.score1 === state.score1 &&
            oldState.score2 === state.score2 &&
            oldState.team1.name === state.team1.name &&
            oldState.team2.name === state.team2.name &&
            oldState.team1.logo === state.team1.logo &&
            oldState.team2.logo === state.team2.logo &&
            JSON.stringify(oldState.media) === JSON.stringify(state.media) &&
            JSON.stringify(oldState.events) === JSON.stringify(state.events);

        // Si seul le timer a changé, sauter la mise à jour média pour ne pas interrompre les vidéos
        updateDisplay(onlyTimerChanged);
    }
});

/**
 * Met à jour tous les éléments de l'affichage en fonction de l'état actuel
 * Met à jour le thème, les noms d'équipe, le score, le timer, la composition,
 * les statistiques, le ticker, la phase de jeu, les médias et les événements
 */
function updateDisplay(skipMediaUpdate = false) {
    console.log('=== UPDATE DISPLAY APPELÉ ===');
    console.log('State complet:', JSON.stringify(state));

    // Mise à jour du thème
    updateTheme();

    // Noms et couleurs des équipes
    document.getElementById('team1-name').textContent = state.team1.name;
    document.getElementById('team1-name').style.color = state.team1.color;

    // Logo ou première lettre pour équipe 1
    console.log('updateDisplay - team1.logo:', state.team1.logo ? 'présent' : 'vide');
    console.log('updateDisplay - team1.logo value:', state.team1.logo);
    updateTeamLogo('team1-logo', state.team1.logo, state.team1.name, state.team1.color);

    document.getElementById('team2-name').textContent = state.team2.name;
    document.getElementById('team2-name').style.color = state.team2.color;

    // Logo ou première lettre pour équipe 2
    console.log('updateDisplay - team2.logo:', state.team2.logo ? 'présent' : 'vide');
    console.log('updateDisplay - team2.logo value:', state.team2.logo);
    updateTeamLogo('team2-logo', state.team2.logo, state.team2.name, state.team2.color);

    // Score
    document.getElementById('score1').textContent = state.score1;
    document.getElementById('score2').textContent = state.score2;

    // Couleur unique des scores personnalisée
    const scoreColor = state.scoreColor || '#e94560';
    document.getElementById('score1').style.color = scoreColor;
    document.getElementById('score2').style.color = scoreColor;

    // Chronomètre
    const minutes = Math.floor(state.timer / 60);
    const seconds = state.timer % 60;
    document.getElementById('timer').textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Couleur du chronomètre personnalisée
    const timerColor = state.timerColor || '#ffffff';
    document.getElementById('timer').style.color = timerColor;

    // Temps additionnel
    const addedTimeEl = document.getElementById('added-time');
    if (state.addedTime && state.addedTime > 0) {
        addedTimeEl.textContent = `+${state.addedTime}`;
    } else {
        addedTimeEl.textContent = '';
    }

    // Statistiques
    document.getElementById('stats-team1-name').textContent = state.team1.name;
    document.getElementById('stats-team2-name').textContent = state.team2.name;
    document.getElementById('stats-team1-name').style.color = state.team1.color;
    document.getElementById('stats-team2-name').style.color = state.team2.color;

    const possession = state.stats.possession.replace('%', '').split('-');
    if (possession.length === 2) {
        document.getElementById('stats-possession1').textContent = possession[0] + '%';
        document.getElementById('stats-possession2').textContent = possession[1] + '%';
    } else {
        document.getElementById('stats-possession1').textContent = '50%';
        document.getElementById('stats-possession2').textContent = '50%';
    }

    document.getElementById('stats-shots1').textContent = state.stats.shots[0];
    document.getElementById('stats-shots2').textContent = state.stats.shots[1];
    document.getElementById('stats-corners1').textContent = state.stats.corners[0];
    document.getElementById('stats-corners2').textContent = state.stats.corners[1];

    // Cartons par équipe
    const team1Cards = getTeamCards(1);
    const team2Cards = getTeamCards(2);
    document.getElementById('stats-cards1').textContent = `🟨${team1Cards.yellow} 🟥${team1Cards.red}`;
    document.getElementById('stats-cards2').textContent = `🟨${team2Cards.yellow} 🟥${team2Cards.red}`;

    // Compositions d'équipe
    updateLineup('lineup1', 'bench1', state.team1.players, state.team1.color, 1);
    updateLineup('lineup2', 'bench2', state.team2.players, state.team2.color, 2);

    // Bandeau défilant
    updateTicker();

    // Historique des cartons
    updateCardsHistory();

    // Phase de jeu
    updateGamePhase();

    // Affichage média (optionnel pour éviter les interruptions pendant le chronomètre)
    if (!skipMediaUpdate) {
        updateMediaDisplay();
    }

    // Gestion des événements
    handleEvents();
}

/**
 * Met à jour le thème d'affichage
 */
function updateTheme() {
    const body = document.body;
    body.className = '';

    if (state.theme) {
        body.classList.add(`theme-${state.theme}`);
    } else {
        body.classList.add('theme-dark');
    }
}

/**
 * Met à jour l'affichage du logo d'une équipe
 * Affiche le logo si disponible, sinon affiche la première lettre du nom
 * @param {string} elementId - ID de l'élément logo
 * @param {string} logo - URL ou base64 du logo
 * @param {string} teamName - Nom de l'équipe
 * @param {string} teamColor - Couleur de l'équipe
 */
function updateTeamLogo(elementId, logo, teamName, teamColor) {
    const logoElement = document.getElementById(elementId);

    console.log(`=== UPDATE TEAM LOGO ===`);
    console.log(`Element ID: ${elementId}`);
    console.log(`Logo: ${logo ? 'présent' : 'vide'}`);
    console.log(`Logo value: ${logo ? logo.substring(0, 50) + '...' : 'vide'}`);
    console.log(`Team name: ${teamName}`);
    console.log(`Team color: ${teamColor}`);
    console.log(`Logo element exists: ${logoElement ? 'oui' : 'NON'}`);

    if (!logoElement) {
        console.error(`Élément ${elementId} NON TROUVÉ - C'est le problème!`);
        return;
    }

    if (logo && logo !== '') {
        console.log(`Logo trouvé - APPROCHE RADICALE: remplacement complet de l'élément`);

        // Créer un nouvel élément img
        const newImg = document.createElement('img');
        newImg.src = logo;
        newImg.alt = `Logo ${teamName}`;
        newImg.style.width = '100%';
        newImg.style.height = '100%';
        newImg.style.objectFit = 'contain';
        newImg.style.display = 'block';
        newImg.style.borderRadius = '50%';

        // Remplacer l'ancien élément par le nouveau
        const parent = logoElement.parentNode;
        parent.replaceChild(newImg, logoElement);

        // Mettre à jour l'ID pour que les prochaines mises à jour trouvent l'élément
        newImg.id = elementId;

        console.log(`Élément remplacé par nouvel élément img`);
    } else {
        console.log(`Pas de logo - affichage de la lettre`);

        // Si l'élément actuel est une img, le remplacer par un div
        if (logoElement.tagName === 'IMG') {
            const newDiv = document.createElement('div');
            newDiv.id = elementId;
            newDiv.className = 'team-logo';
            newDiv.style.background = teamColor;
            newDiv.textContent = teamName.charAt(0);

            const parent = logoElement.parentNode;
            parent.replaceChild(newDiv, logoElement);
        } else {
            // Sinon, juste mettre à jour le contenu
            logoElement.innerHTML = '';
            logoElement.style.backgroundImage = 'none';
            logoElement.style.background = teamColor;
            logoElement.textContent = teamName.charAt(0);
        }
    }
}

/**
 * Récupère les cartons d'un joueur depuis les événements
 * @param {string} playerId - ID du joueur
 * @param {number} team - Numéro de l'équipe (1 ou 2)
 * @returns {Array} Liste des cartons avec type et temps
 */
function getPlayerCards(playerId, team) {
    if (!state.events || state.events.length === 0) return [];

    return state.events
        .filter(event =>
            (event.type === 'yellow' || event.type === 'red') &&
            event.player === playerId &&
            event.team === team
        )
        .map(event => ({
            type: event.type,
            time: event.time || 0
        }));
}

/**
 * Compte les cartons par équipe
 * @param {number} team - Numéro de l'équipe (1 ou 2)
 * @returns {Object} Compte des cartons { yellow: number, red: number }
 */
function getTeamCards(team) {
    if (!state.events || state.events.length === 0) {
        return { yellow: 0, red: 0 };
    }

    const yellowCards = state.events.filter(event => event.type === 'yellow' && event.team === team).length;
    const redCards = state.events.filter(event => event.type === 'red' && event.team === team).length;

    return { yellow: yellowCards, red: redCards };
}

/**
 * Formate le temps en minutes:secondes
 * @param {number} seconds - Temps en secondes
 * @returns {string} Temps formaté (ex: "12:34")
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Met à jour la composition d'une équipe
 * Affiche les cartons reçus par chaque joueur avec l'heure
 * @param {string} elementId - ID de l'élément à mettre à jour
 * @param {Array} players - Liste des joueurs
 * @param {string} color - Couleur de l'équipe
 * @param {number} team - Numéro de l'équipe (1 ou 2)
 */
/**
 * Met à jour la composition d'une équipe en séparant titulaires et remplaçants
 * @param {string} starterId - ID de l'élément titulaires (ex: 'lineup1')
 * @param {string} benchId - ID de l'élément remplaçants (ex: 'bench1')
 * @param {Array} players - Liste complète des joueurs
 * @param {string} color - Couleur de l'équipe
 * @param {number} team - Numéro de l'équipe (1 ou 2)
 */
function updateLineup(starterId, benchId, players, color, team) {
    const starterEl = document.getElementById(starterId);
    const benchEl = document.getElementById(benchId);

    const starters = players.filter(p => p.starter !== false);
    const bench = players.filter(p => p.starter === false);

    const renderPlayer = (p, isBench) => {
        const cards = getPlayerCards(p.id, team);
        const cardIcons = cards.map(card => {
            const emoji = card.type === 'yellow' ? '🟨' : '🟥';
            const timeStr = formatTime(card.time);
            return `<span class="card-icon" title="${card.type === 'yellow' ? 'Carton jaune' : 'Carton rouge'} à ${timeStr}">${emoji}${timeStr}</span>`;
        }).join(' ');

        const photo = p.photo
            ? `<img class="lineup-player-photo" src="${p.photo}" alt="">`
            : `<span class="lineup-player-avatar" style="background:${color}">${p.number}</span>`;

        return `
            <div class="lineup-player ${isBench ? 'lineup-bench-player' : ''}" style="border-color:${color}${isBench ? '66' : ''}">
                ${photo}
                <span class="lineup-player-info">
                    <span class="lineup-player-name">${p.name}</span>
                    <span class="lineup-player-pos">${p.position || ''}</span>
                </span>
                <span class="lineup-player-num" style="color:${color}">${p.number}</span>
                ${cardIcons ? `<span class="player-cards">${cardIcons}</span>` : ''}
            </div>`;
    };

    if (starterEl) {
        starterEl.innerHTML = starters.length > 0
            ? starters.map(p => renderPlayer(p, false)).join('')
            : `<div class="lineup-empty">Aucun titulaire</div>`;
    }

    if (benchEl) {
        benchEl.innerHTML = bench.length > 0
            ? bench.map(p => renderPlayer(p, true)).join('')
            : `<div class="lineup-empty bench-empty">Aucun remplaçant</div>`;
    }
}

/**
 * Met à jour le bandeau défilant
 * Calcule la durée de l'animation en fonction de la longueur du contenu
 * Supporte les couleurs personnalisées pour chaque message
 */
function updateTicker() {
    const ticker = document.getElementById('ticker-content');
    if (state.ticker && state.ticker.length > 0) {
        const content = state.ticker.map(item => {
            const text = typeof item === 'object' ? item.text : item;
            const color = typeof item === 'object' ? item.color : '#00ff88';
            return `<span class="ticker-item" style="color: ${color}">${text}</span>`;
        }).join('');

        ticker.innerHTML = content;

        // Calculer la durée de l'animation en fonction de la longueur du contenu
        const textLength = content.length;
        // Base: 30 secondes pour 100 caractères, + 0.2 seconde par caractère supplémentaire
        const animationDuration = Math.max(30, 30 + (textLength - 100) * 0.2);

        // Appliquer la durée dynamique
        ticker.style.animationDuration = `${animationDuration}s`;
    }
}

/**
 * Met à jour l'historique des cartons
 * Affiche tous les cartons avec le joueur, le type et l'heure
 */
function updateCardsHistory() {
    const cardsHistory = document.getElementById('cards-history');

    if (!state.events || state.events.length === 0) {
        cardsHistory.innerHTML = '<div class="no-cards">Aucun carton pour le moment</div>';
        return;
    }

    // Filtrer uniquement les événements de cartons
    const cardEvents = state.events.filter(event => event.type === 'yellow' || event.type === 'red');

    if (cardEvents.length === 0) {
        cardsHistory.innerHTML = '<div class="no-cards">Aucun carton pour le moment</div>';
        return;
    }

    // Trier par temps
    cardEvents.sort((a, b) => (a.time || 0) - (b.time || 0));

    // Générer l'affichage
    cardsHistory.innerHTML = cardEvents.map(event => {
        const player = findPlayer(event.team, event.player);
        const playerName = player ? player.name : 'Joueur inconnu';
        const playerNumber = player ? player.number : '?';
        const teamName = event.team === 1 ? state.team1.name : state.team2.name;
        const teamColor = event.team === 1 ? state.team1.color : state.team2.color;
        const cardEmoji = event.type === 'yellow' ? '🟨' : '🟥';
        const cardType = event.type === 'yellow' ? 'Carton Jaune' : 'Carton Rouge';
        const timeStr = formatTime(event.time || 0);

        return `
            <div class="card-history-item" style="border-left: 3px solid ${teamColor}">
                <span class="card-history-emoji">${cardEmoji}</span>
                <span class="card-history-time">${timeStr}</span>
                <span class="card-history-player">${playerNumber} ${playerName}</span>
                <span class="card-history-team">${teamName}</span>
            </div>
        `;
    }).join('');
}

/**
 * Met à jour l'affichage de la phase de jeu
 * Affiche la phase actuelle (1ère période, mi-temps, 2ème période, prolongations, fin match)
 */
function updateGamePhase() {
    const phaseEl = document.getElementById('game-phase');
    phaseEl.className = 'game-phase';

    const phaseTexts = {
        'first-half': '1ère Période',
        'ht': 'Mi-Temps',
        'second-half': '2ème Période',
        'et': 'Prolongations',
        'ft': 'Fin de Match'
    };

    if (state.phase && phaseTexts[state.phase]) {
        phaseEl.textContent = phaseTexts[state.phase];
        phaseEl.classList.add(state.phase);
        phaseEl.classList.add('active');

        setTimeout(() => {
            phaseEl.classList.remove('active');
        }, CONSTANTS.GAME_PHASE_DURATION);
    }
}

/**
 * Affiche un média (image ou vidéo) sur l'écran
 * Gère l'auto-hide pour les images après la durée spécifiée
 * Gère la lecture automatique des vidéos avec muted pour contourner les restrictions navigateur
 * Gère les erreurs de chargement et de lecture vidéo avec retry automatique
 * Supporte IndexedDB pour les fichiers volumineux (> 50MB)
 */
async function updateMediaDisplay() {
    const mediaDisplay = document.getElementById('media-display');
    const mediaImage = document.getElementById('media-image');
    const mediaVideo = document.getElementById('media-video');
    const mediaIframe = document.getElementById('media-iframe');
    const mediaTitle = document.getElementById('media-title');

    const isYoutube = state.media.source &&
        (state.media.source.includes('youtube.com') || state.media.source.includes('youtu.be'));

    // Vérifier si le média est déjà en cours de lecture avec la même source
    const isSameMedia = !isYoutube && mediaVideo.src &&
        state.media.source &&
        mediaVideo.src === state.media.source &&
        state.media.type === 'video' &&
        !mediaVideo.paused &&
        mediaDisplay.classList.contains('active');

    // Si c'est le même média en cours de lecture, ne pas interrompre
    if (isSameMedia) {
        return;
    }

    // Clear any existing timeout
    if (mediaTimeout) {
        clearTimeout(mediaTimeout);
        mediaTimeout = null;
    }

    // Stop video/iframe si en cours
    mediaVideo.pause();
    mediaVideo.onended = null;
    mediaVideo.onerror = null;
    mediaVideo.oncanplay = null;
    mediaVideo.onloadeddata = null;
    mediaVideo.onstalled = null;
    mediaVideo.onsuspend = null;
    mediaVideo.onwaiting = null;
    // Stopper l'iframe proprement
    if (mediaIframe) mediaIframe.src = '';

    if (!state.media || state.media.type === 'none' || !state.media.source) {
        // Animation de sortie avant de cacher
        if (mediaDisplay.classList.contains('active')) {
            const animationOut = state.media.animationOut || 'slide';
            mediaDisplay.classList.add('exiting', `animation-${animationOut}-out`);

            setTimeout(() => {
                mediaDisplay.classList.remove('active', 'exiting', `animation-${animationOut}-out`);
                mediaImage.style.display = 'none';
                mediaVideo.style.display = 'none';
                if (mediaIframe) mediaIframe.style.display = 'none';

                // Cacher les boutons de contrôle vidéo
                const videoControls = document.getElementById('media-video-controls');
                if (videoControls) {
                    videoControls.style.display = 'none';
                }
            }, 800);
        } else {
            mediaImage.style.display = 'none';
            mediaVideo.style.display = 'none';
            if (mediaIframe) mediaIframe.style.display = 'none';

            // Cacher les boutons de contrôle vidéo
            const videoControls = document.getElementById('media-video-controls');
            if (videoControls) {
                videoControls.style.display = 'none';
            }
        }
        return;
    }

    mediaTitle.textContent = state.media.title || '';

    // Vérifier si la source vient de IndexedDB
    const isIndexedDB = state.media.source.startsWith('indexeddb:');
    let actualSource = state.media.source;

    if (isIndexedDB) {
        // Extraire l'ID IndexedDB
        const mediaId = state.media.source.replace('indexeddb:', '');
        log('Chargement depuis IndexedDB:', mediaId);

        try {
            const blob = await getMediaFromIndexedDB(mediaId);
            if (!blob) {
                log('Fichier non trouvé dans IndexedDB');
                mediaTitle.textContent = 'Erreur: Fichier non trouvé';
                return;
            }

            // Créer une URL temporaire pour le blob
            actualSource = URL.createObjectURL(blob);
            log('URL blob créée:', actualSource);
        } catch (e) {
            log('Erreur IndexedDB:', e);
            mediaTitle.textContent = 'Erreur de chargement IndexedDB';
            return;
        }
    }

    if (state.media.type === 'image') {
        mediaImage.src = actualSource;
        mediaImage.style.display = 'block';
        mediaVideo.style.display = 'none';

        // Appliquer l'animation d'entrée choisie
        const animationIn = state.media.animationIn || 'slide';
        mediaDisplay.classList.add('active', `animation-${animationIn}-in`);

        // Appliquer l'effet de défilement
        const scroll = state.media.scroll || 'none';
        mediaImage.className = 'media-content';
        if (scroll !== 'none') {
            mediaImage.classList.add(`scroll-${scroll}`);
        }

        // Auto-hide after duration (sauf si répétition activée)
        if (!state.media.repeat) {
            const duration = parseInt(state.media.duration) || CONSTANTS.DEFAULT_IMAGE_DURATION;

            mediaTimeout = setTimeout(() => {
                // Animation de sortie avec l'animation choisie
                const animationOut = state.media.animationOut || 'slide';
                mediaDisplay.classList.add('exiting', `animation-${animationOut}-out`);

                setTimeout(() => {
                    mediaDisplay.classList.remove('active', 'exiting', `animation-${animationOut}-out`);
                    mediaImage.style.display = 'none';
                    mediaImage.className = 'media-content';
                    state.media.type = 'none';
                    state.media.source = '';
                    state.media.title = '';
                    localStorage.setItem('stadium_match_state', JSON.stringify(state));

                    // Libérer l'URL blob si c'était IndexedDB
                    if (isIndexedDB) {
                        URL.revokeObjectURL(actualSource);
                    }
                }, 800);
            }, duration * 1000);
        }
    } else if (state.media.type === 'video') {

        // ---- YouTube → iframe ----
        if (isYoutube) {
            mediaVideo.style.display = 'none';
            mediaImage.style.display = 'none';
            mediaIframe.style.display = 'block';

            // Construire l'URL embed avec autoplay
            const videoId = extractYoutubeIdDisplay(state.media.source);
            const videoMode = state.media.videoMode || 'auto';
            const autoplay = videoMode === 'auto' ? 1 : 0;
            mediaIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay}&rel=0&modestbranding=1`;

            // Animation d'entrée
            const animationIn = state.media.animationIn || 'fade';
            mediaDisplay.classList.add('active', `animation-${animationIn}-in`);

            // Cacher les contrôles vidéo (pas applicables pour YouTube)
            const videoControls = document.getElementById('media-video-controls');
            if (videoControls) videoControls.style.display = 'none';

            return; // Pas de logique de retry pour iframe
        }

        // ---- Vidéo locale / URL directe ----
        // Configuration optimisée pour le streaming de fichiers volumineux (> 500MB)
        mediaVideo.src = actualSource;
        mediaVideo.style.display = 'block';
        mediaImage.style.display = 'none';
        if (mediaIframe) mediaIframe.style.display = 'none';

        // Appliquer l'animation d'entrée choisie
        const animationIn = state.media.animationIn || 'slide';
        mediaDisplay.classList.add('active', `animation-${animationIn}-in`);

        // Appliquer l'effet de défilement
        const scroll = state.media.scroll || 'none';
        mediaVideo.className = 'media-content';
        if (scroll !== 'none') {
            mediaVideo.classList.add(`scroll-${scroll}`);
        }

        // Attributs de streaming optimisé pour fichiers volumineux
        mediaVideo.preload = 'auto'; // Charger les métadonnées et commencer le buffering
        mediaVideo.playsInline = true; // Lecture inline sur mobile
        mediaVideo.muted = true; // Autoplay avec muted
        mediaVideo.loop = state.media.repeat || false; // Boucler si répétition activée
        mediaVideo.crossOrigin = 'anonymous'; // Pour éviter les problèmes CORS

        // Mode manuel : démarrer en pause, activer contrôle externe
        const isManualMode = state.media.videoMode === 'manual';

        // Afficher les boutons de contrôle vidéo (seulement en mode auto)
        const videoControls = document.getElementById('media-video-controls');
        if (videoControls) {
            videoControls.style.display = isManualMode ? 'none' : 'flex';
        }

        // Démarrer la diffusion de temps si mode manuel
        startVideoTimeBroadcast(mediaVideo);
        // Démarrer l'écouteur de commandes si mode manuel
        startVideoCommandListener(mediaVideo);

        // Variables pour le retry automatique et surveillance santé
        let retryCount = 0;
        const maxRetries = 10; // Augmenté pour fichiers très volumineux
        let loadingTimeout = null;
        let healthCheckInterval = null;
        let stallCount = 0;
        let lastCurrentTime = 0;
        let stallStartTime = null;
        const STALL_THRESHOLD = 5000; // 5 secondes de blocage avant reprise
        const MAX_STALLS = 3; // Nombre maximum de blocages avant erreur

        // Fonction pour tenter de jouer la vidéo
        const attemptPlay = () => {
            // En mode manuel, on charge mais on ne joue pas automatiquement
            if (isManualMode) {
                log('Mode manuel : vidéo chargée, en attente de commande play');
                if (loadingTimeout) {
                    clearTimeout(loadingTimeout);
                    loadingTimeout = null;
                }
                return;
            }
            log('Tentative de lecture vidéo...');
            mediaVideo.play().then(() => {
                log('Vidéo démarrée avec succès');
                // Annuler le timeout de chargement
                if (loadingTimeout) {
                    clearTimeout(loadingTimeout);
                    loadingTimeout = null;
                }
                // Démarrer la surveillance de santé
                startHealthCheck();
            }).catch(e => {
                log('Erreur de lecture vidéo:', e);
                if (retryCount < maxRetries) {
                    retryCount++;
                    log(`Tentative de retry ${retryCount}/${maxRetries}`);
                    setTimeout(attemptPlay, 3000); // Délai augmenté pour les fichiers volumineux
                } else {
                    log('Échec après plusieurs tentatives de lecture vidéo');
                    mediaTitle.textContent = 'Erreur: Impossible de lire la vidéo après plusieurs tentatives';
                }
            });
        };

        // Surveillance de la santé de la lecture vidéo
        const startHealthCheck = () => {
            if (healthCheckInterval) clearInterval(healthCheckInterval);

            healthCheckInterval = setInterval(() => {
                const currentTime = mediaVideo.currentTime;
                const isPlaying = !mediaVideo.paused;
                const bufferedEnd = mediaVideo.buffered.length > 0
                    ? mediaVideo.buffered.end(mediaVideo.buffered.length - 1)
                    : 0;

                // Détection de blocage
                if (isPlaying && currentTime === lastCurrentTime && currentTime < mediaVideo.duration - 1) {
                    if (!stallStartTime) {
                        stallStartTime = Date.now();
                        log('Détection de blocage possible...');
                    } else if (Date.now() - stallStartTime > STALL_THRESHOLD) {
                        stallCount++;
                        log(`Blocage détecté (${stallCount}/${MAX_STALLS}) - tentative de reprise`);

                        if (stallCount >= MAX_STALLS) {
                            log('Trop de blocages - erreur critique');
                            mediaTitle.textContent = 'Erreur: Vidéo bloquée trop de fois';
                            clearInterval(healthCheckInterval);
                            return;
                        }

                        // Tentative de reprise
                        const savedTime = currentTime;
                        mediaVideo.pause();
                        setTimeout(() => {
                            mediaVideo.currentTime = savedTime + 0.1; // Avancer légèrement
                            mediaVideo.play().catch(e => {
                                log('Erreur lors de la reprise:', e);
                            });
                        }, 1000);

                        stallStartTime = null;
                    }
                } else {
                    // Réinitialiser si la lecture progresse
                    stallStartTime = null;
                }

                lastCurrentTime = currentTime;

                // Logs de santé
                log(`Santé vidéo - Playing: ${isPlaying}, Time: ${currentTime.toFixed(1)}s, Buffer: ${bufferedEnd.toFixed(1)}s, Stalls: ${stallCount}`);

            }, 2000); // Vérification toutes les 2 secondes
        };

        // Timeout de chargement pour les fichiers volumineux
        loadingTimeout = setTimeout(() => {
            if (mediaVideo.readyState < 3) { // HAVE_FUTURE_DATA
                log('Timeout de chargement - tentative de lecture forcée');
                attemptPlay();
            }
        }, 60000); // 60 secondes pour les fichiers très volumineux

        // Événement: Progression du chargement
        mediaVideo.onprogress = () => {
            if (mediaVideo.buffered.length > 0) {
                const bufferedEnd = mediaVideo.buffered.end(mediaVideo.buffered.length - 1);
                const duration = mediaVideo.duration || 1;
                const bufferedPercent = (bufferedEnd / duration) * 100;
                log(`Buffering: ${bufferedPercent.toFixed(1)}%`);
            }
        };

        // Événement: Données chargées - vidéo prête à être lue
        mediaVideo.onloadeddata = () => {
            log('Vidéo chargée, durée:', mediaVideo.duration);
            log('ReadyState:', mediaVideo.readyState);
            if (mediaVideo.readyState >= 2) { // HAVE_CURRENT_DATA
                attemptPlay();
            }
        };

        // Événement: Métadonnées chargées
        mediaVideo.onloadedmetadata = () => {
            log('Métadonnées chargées, durée:', mediaVideo.duration);
            log('Dimensions:', mediaVideo.videoWidth, 'x', mediaVideo.videoHeight);
            log('Taille estimée:', (mediaVideo.duration * 2).toFixed(1), 'MB (approx)');
        };

        // Événement: Vidéo peut être lue
        mediaVideo.oncanplay = () => {
            log('Vidéo prête à être lue (canplay)');
            if (mediaVideo.paused) {
                attemptPlay();
            }
        };

        // Événement: Vidéo peut être lue sans interruption
        mediaVideo.oncanplaythrough = () => {
            log('Vidéo prête pour lecture continue (canplaythrough)');
            if (mediaVideo.paused) {
                attemptPlay();
            }
        };

        // Événement: Erreur de chargement
        mediaVideo.onerror = (e) => {
            log('Erreur de chargement vidéo:', e);
            log('Code d erreur vidéo:', mediaVideo.error ? mediaVideo.error.code : 'inconnu');

            // Codes d'erreur vidéo courants:
            // 1: MEDIA_ERR_ABORTED - Abandonné par l'utilisateur
            // 2: MEDIA_ERR_NETWORK - Erreur réseau
            // 3: MEDIA_ERR_DECODE - Erreur de décodage
            // 4: MEDIA_ERR_SRC_NOT_SUPPORTED - Format non supporté

            let errorMessage = 'Erreur de chargement vidéo';
            if (mediaVideo.error) {
                switch (mediaVideo.error.code) {
                    case 1:
                        errorMessage = 'Chargement vidéo annulé';
                        break;
                    case 2:
                        errorMessage = 'Erreur réseau - vérifiez la connexion';
                        break;
                    case 3:
                        errorMessage = 'Erreur de décodage vidéo';
                        break;
                    case 4:
                        errorMessage = 'Format vidéo non supporté';
                        break;
                }
            }

            mediaTitle.textContent = errorMessage;

            // Nettoyer les intervalles
            if (healthCheckInterval) clearInterval(healthCheckInterval);
            if (loadingTimeout) clearTimeout(loadingTimeout);

            // Masquer après 5 secondes en cas d'erreur
            setTimeout(() => {
                // Animation de sortie avec l'animation choisie
                const animationOut = state.media.animationOut || 'slide';
                mediaDisplay.classList.add('exiting', `animation-${animationOut}-out`);

                setTimeout(() => {
                    mediaDisplay.classList.remove('active', 'exiting', `animation-${animationOut}-out`);
                    mediaVideo.style.display = 'none';
                    mediaVideo.className = 'media-content';
                    state.media.type = 'none';
                    state.media.source = '';
                    state.media.title = '';
                    localStorage.setItem('stadium_match_state', JSON.stringify(state));

                    // Libérer l'URL blob si c'était IndexedDB
                    if (isIndexedDB) {
                        URL.revokeObjectURL(actualSource);
                    }
                }, 800);
            }, 5000);
        };

        // Événement: Vidéo bloquée en attente de données
        mediaVideo.onstalled = () => {
            log('Vidéo bloquée - attente de données');
        };

        // Événement: Vidéo suspendue
        mediaVideo.onsuspend = () => {
            log('Vidéo suspendue par le navigateur');
        };

        // Événement: Vidéo en attente
        mediaVideo.onwaiting = () => {
            log('Vidéo en attente de données...');
        };

        // Événement: Vidéo terminée
        mediaVideo.onended = () => {
            log('Vidéo terminée avec succès');

            // Si répétition activée, ne rien faire (la vidéo boucle automatiquement)
            if (state.media.repeat) {
                log('Répétition activée - la vidéo continue en boucle');
                return;
            }

            // Nettoyer les intervalles
            if (healthCheckInterval) clearInterval(healthCheckInterval);
            if (loadingTimeout) clearTimeout(loadingTimeout);

            // Animation de sortie avec l'animation choisie
            const animationOut = state.media.animationOut || 'slide';
            mediaDisplay.classList.add('exiting', `animation-${animationOut}-out`);

            setTimeout(() => {
                mediaDisplay.classList.remove('active', 'exiting', `animation-${animationOut}-out`);
                mediaVideo.style.display = 'none';
                mediaVideo.className = 'media-content';
                state.media.type = 'none';
                state.media.source = '';
                state.media.title = '';
                localStorage.setItem('stadium_match_state', JSON.stringify(state));

                // Libérer l'URL blob si c'était IndexedDB
                if (isIndexedDB) {
                    URL.revokeObjectURL(actualSource);
                }
            }, 800);
        };

        // Charger la vidéo
        mediaVideo.load();
    }
}

// ============================================================
// GESTION DU CLIC - Fermeture rapide du média
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const mediaDisplay = document.getElementById('media-display');
    if (mediaDisplay) {
        mediaDisplay.addEventListener('click', (e) => {
            // Ignorer les clics sur les boutons enfants (unmute, contrôles vidéo)
            if (e.target.closest('button')) return;

            if (mediaDisplay.classList.contains('active')) {
                // Animation de sortie avec l'animation choisie
                const animationOut = state.media.animationOut || 'slide';
                mediaDisplay.classList.add('exiting', `animation-${animationOut}-out`);

                setTimeout(() => {
                    mediaDisplay.classList.remove('active', 'exiting', `animation-${animationOut}-out`);
                    const mediaImage = document.getElementById('media-image');
                    const mediaVideo = document.getElementById('media-video');
                    const mediaIframe = document.getElementById('media-iframe');
                    mediaImage.style.display = 'none';
                    mediaVideo.style.display = 'none';
                    if (mediaIframe) { mediaIframe.src = ''; mediaIframe.style.display = 'none'; }
                    state.media.type = 'none';
                    state.media.source = '';
                    state.media.title = '';
                    localStorage.setItem('stadium_match_state', JSON.stringify(state));
                }, 800);
            }
        });
    }
});

// ============================================================
// CONTRÔLE VIDÉO - Avancer et reculer
// ============================================================
function videoRewind(e) {
    if (e) e.stopPropagation();
    const mediaVideo = document.getElementById('media-video');
    if (mediaVideo) {
        mediaVideo.currentTime = Math.max(0, mediaVideo.currentTime - 10);
        log('Vidéo reculée de 10 secondes');
    }
}

function videoForward(e) {
    if (e) e.stopPropagation();
    const mediaVideo = document.getElementById('media-video');
    if (mediaVideo) {
        mediaVideo.currentTime = Math.min(mediaVideo.duration, mediaVideo.currentTime + 10);
        log('Vidéo avancée de 10 secondes');
    }
}

// ============================================================
// GESTION DES ÉVÉNEMENTS - Affichage des actions de match
// ============================================================
/**
 * Gère l'affichage des événements de match (buts, cartons, remplacements, VAR)
 * Affiche uniquement le dernier événement non traité
 */
function handleEvents() {
    if (!state.events || state.events.length === 0) return;

    const lastEvent = state.events[state.events.length - 1];
    if (lastEvent.handled) return;

    switch (lastEvent.type) {
        case 'goal':
            showGoal(lastEvent);
            break;
        case 'yellow':
            showYellowCard(lastEvent);
            break;
        case 'red':
            showRedCard(lastEvent);
            break;
        case 'sub':
            showSubstitution(lastEvent);
            break;
        case 'var':
            showVAR(lastEvent);
            break;
    }

    // Mark as handled
    lastEvent.handled = true;
    localStorage.setItem('stadium_match_state', JSON.stringify(state));
}

// ============================================================
// FONCTIONS D'AFFICHAGE DES ÉVÉNEMENTS
// ============================================================
/**
 * Trouve un joueur par son ID dans l'équipe spécifiée
 * @param {number} team - 1 pour équipe domicile, 2 pour équipe extérieur
 * @param {number} playerId - ID du joueur à rechercher
 * @returns {Object|null} Le joueur trouvé ou null
 */
function findPlayer(team, playerId) {
    const players = team === 1 ? state.team1.players : state.team2.players;
    // Comparaison souple : int ou string selon la source
    return players.find(p => p.id == playerId);
}

/**
 * Affiche l'overlay de but et la carte du buteur
 * @param {Object} event - Événement de but contenant team et scorer
 */
function showGoal(event) {
    const overlay = document.getElementById('goal-overlay');
    const card = document.getElementById('player-card');

    overlay.classList.add('active');

    setTimeout(() => {
        overlay.classList.remove('active');

        const scorer = findPlayer(event.team, event.scorer);
        if (scorer) {
            document.getElementById('card-photo').src = scorer.photo || '';
            document.getElementById('card-number').textContent = scorer.number;
            document.getElementById('card-name').textContent = scorer.name;
            document.getElementById('card-position').textContent = scorer.position;
            document.getElementById('card-type').textContent = '⚽ BUT!';
            card.classList.add('active');

            setTimeout(() => {
                card.classList.remove('active');
            }, CONSTANTS.PLAYER_CARD_DURATION);
        }
    }, CONSTANTS.GOAL_OVERLAY_DURATION);
}

/**
 * Affiche la modale de carton jaune
 * @param {Object} event - Événement de carton contenant team et player
 */
function showYellowCard(event) {
    const modal = document.getElementById('yellow-modal');
    const player = findPlayer(event.team, event.player);

    if (player) {
        document.getElementById('yellow-photo').src = player.photo || '';
        document.getElementById('yellow-name').textContent = player.name;
        document.getElementById('yellow-number').textContent = player.number;
        modal.classList.add('active');

        setTimeout(() => {
            modal.classList.remove('active');
        }, CONSTANTS.YELLOW_CARD_DURATION);
    }
}

/**
 * Affiche la modale de carton rouge
 * @param {Object} event - Événement de carton contenant team et player
 */
function showRedCard(event) {
    const modal = document.getElementById('red-modal');
    const player = findPlayer(event.team, event.player);

    if (player) {
        document.getElementById('red-photo').src = player.photo || '';
        document.getElementById('red-name').textContent = player.name;
        document.getElementById('red-number').textContent = player.number;
        modal.classList.add('active');

        setTimeout(() => {
            modal.classList.remove('active');
        }, CONSTANTS.RED_CARD_DURATION);
    }
}

/**
 * Affiche la modale de remplacement
 * @param {Object} event - Événement de remplacement contenant team, out et in
 */
function showSubstitution(event) {
    const modal = document.getElementById('sub-modal');
    const playerOut = findPlayer(event.team, event.out);
    const playerIn = findPlayer(event.team, event.in);

    if (playerOut && playerIn) {
        // Nom de l'équipe
        const teamName = event.team === 1 ? state.team1.name : state.team2.name;
        const teamEl = document.getElementById('sub-modal-team');
        if (teamEl) teamEl.textContent = teamName;

        // Joueur sortant (rouge)
        const outPhoto = document.getElementById('sub-out-photo');
        if (outPhoto) {
            outPhoto.src = playerOut.photo || '';
            outPhoto.style.display = playerOut.photo ? 'block' : 'none';
        }
        document.getElementById('sub-out-name').textContent = playerOut.name.toUpperCase();
        document.getElementById('sub-out-number').textContent = playerOut.number;

        // Joueur entrant (vert)
        const inPhoto = document.getElementById('sub-in-photo');
        if (inPhoto) {
            inPhoto.src = playerIn.photo || '';
            inPhoto.style.display = playerIn.photo ? 'block' : 'none';
        }
        document.getElementById('sub-in-name').textContent = playerIn.name.toUpperCase();
        document.getElementById('sub-in-number').textContent = playerIn.number;

        // Afficher avec animation
        modal.classList.remove('hiding');
        modal.classList.add('active');

        // Masquer avec animation de sortie
        setTimeout(() => {
            modal.classList.add('hiding');
            setTimeout(() => {
                modal.classList.remove('active', 'hiding');
            }, 350);
        }, CONSTANTS.SUBSTITUTION_DURATION);
    }
}

/**
 * Affiche la modale VAR (Video Assistant Referee)
 * @param {Object} event - Événement VAR
 */
function showVAR(event) {
    const modal = document.getElementById('var-modal');
    modal.classList.add('active');

    setTimeout(() => {
        modal.classList.remove('active');
    }, CONSTANTS.VAR_DURATION);
}

/**
 * Bascule le mode plein écran
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

/**
 * Active le son de la vidéo en cours de lecture
 * Masque le bouton unmute après activation
 */
/**
 * Active le son de la vidéo — appelé via commande depuis le panneau de contrôle
 */
function unmuteVideo(e) {
    if (e) e.stopPropagation();
    const mediaVideo = document.getElementById('media-video');
    if (mediaVideo) {
        mediaVideo.muted = false;
    }
}

// ============================================================
// UTILITAIRE - Extraire l'ID YouTube depuis une URL ou embed URL
// ============================================================
function extractYoutubeIdDisplay(url) {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// ============================================================
// CONTRÔLE VIDÉO MANUEL - Réception des commandes depuis le panneau
// ============================================================

let _videoCmdListener = null;   // Référence à l'écouteur actif
let _videoTimerInterval = null; // Intervalle de diffusion du temps

/**
 * Démarre la diffusion du temps vidéo vers le panneau de contrôle
 * @param {HTMLVideoElement} video
 */
function startVideoTimeBroadcast(video) {
    if (_videoTimerInterval) {
        clearInterval(_videoTimerInterval);
        _videoTimerInterval = null;
    }
    _videoTimerInterval = setInterval(() => {
        if (!video || video.readyState < 1) return;
        localStorage.setItem('stadium_video_time', JSON.stringify({
            current: video.currentTime,
            duration: video.duration || 0,
            paused: video.paused,
            ts: Date.now()
        }));
    }, 500);
}

/**
 * Démarre l'écouteur de commandes vidéo depuis le panneau de contrôle
 * @param {HTMLVideoElement} video
 */
function startVideoCommandListener(video) {
    // Supprimer l'ancien écouteur s'il existe
    if (_videoCmdListener) {
        window.removeEventListener('storage', _videoCmdListener);
        _videoCmdListener = null;
    }

    _videoCmdListener = (e) => {
        if (e.key !== 'stadium_video_cmd' || !e.newValue) return;
        const { cmd, value } = JSON.parse(e.newValue);

        switch (cmd) {
            case 'play':
                video.play().catch(() => { });
                break;
            case 'pause':
                video.pause();
                break;
            case 'seek-back-10':
                video.currentTime = Math.max(0, video.currentTime - 10);
                break;
            case 'seek-fwd-10':
                video.currentTime = Math.min(video.duration, video.currentTime + 10);
                break;
            case 'seek-back-30':
                video.currentTime = Math.max(0, video.currentTime - 30);
                break;
            case 'seek-fwd-30':
                video.currentTime = Math.min(video.duration, video.currentTime + 30);
                break;
            case 'seek-to':
                // value = pourcentage (0-100)
                if (video.duration) {
                    video.currentTime = (value / 100) * video.duration;
                }
                break;
            case 'unmute':
                video.muted = false;
                break;
            case 'mute':
                video.muted = true;
                break;
        }
    };

    window.addEventListener('storage', _videoCmdListener);
}

// ============================================================
// INITIALISATION - Mise à jour initiale de l'affichage
// ============================================================
updateDisplay();
