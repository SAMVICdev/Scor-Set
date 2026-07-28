// ============================================================
// CONSTANTES - Limites système et configurations
// ============================================================
const CONSTANTS = {
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
    phase: 'first-half',                // Phase du match
    theme: 'dark',                      // Thème d'affichage
    stats: {
        possession: '50-50',           // Possession de balle
        shots: [0, 0],                  // Tirs cadrés
        corners: [0, 0]                 // Corners
    },
    ticker: ['🏟️ Bienvenue au Stadium Live Régie v2.1', '⚽ Match en direct', '📺 Suivez le match en temps réel'],
    events: [],                         // Liste des événements
    media: {
        type: 'none',                   // Type de média
        source: '',                     // Source du média
        title: '',                      // Titre du média
        duration: 10                    // Durée d'affichage
    },
    scoreColor: '#e94560',               // Couleur unique des scores
    timerColor: '#ffffff'                // Couleur unique du chronomètre
};

// ============================================================
// CHARGEMENT DE L'ÉTAT - Récupération depuis localStorage
// ============================================================
let state = JSON.parse(localStorage.getItem('stadium_match_state')) || JSON.parse(JSON.stringify(defaultState));
let selectedTeam = 1;                   // Équipe sélectionnée (1 ou 2)
let timerInterval = null;               // Intervalle du chronomètre

// Test de disponibilité de localStorage
if (!testLocalStorage()) {
    alert('Attention: localStorage n\'est pas disponible. Certaines fonctionnalités ne marcheront pas.');
}

/**
 * Sauvegarde l'état dans localStorage avec gestion d'erreur
 * Affiche une alerte si l'espace est insuffisant
 */
function saveState() {
    try {
        localStorage.setItem('stadium_match_state', JSON.stringify(state));
    } catch (e) {
        alert('Erreur de sauvegarde : Espace insuffisant dans localStorage. Veuillez réduire la taille des données.');
    }
}

// ============================================================
// FONCTIONS DE VALIDATION - Vérification des entrées utilisateur
// ============================================================
/**
 * Valide le nom d'une équipe
 * @param {string} name - Nom de l'équipe à valider
 * @returns {boolean} True si valide (1-50 caractères)
 */
function validateTeamName(name) {
    return name && name.trim().length > 0 && name.trim().length <= 50;
}

/**
 * Valide le numéro d'un joueur
 * @param {number} number - Numéro du joueur à valider
 * @returns {boolean} True si valide (1-99)
 */
function validatePlayerNumber(number) {
    return number >= 1 && number <= 99;
}

/**
 * Valide le nom d'un joueur
 * @param {string} name - Nom du joueur à valider
 * @returns {boolean} True si valide (1-50 caractères)
 */
function validatePlayerName(name) {
    return name && name.trim().length > 0 && name.trim().length <= 50;
}

/**
 * Valide une couleur hexadécimale
 * @param {string} color - Couleur au format #RRGGBB
 * @returns {boolean} True si valide
 */
function validateColorHex(color) {
    return /^#[0-9A-F]{6}$/i.test(color);
}

// ============================================================
// INITIALISATION - Chargement des configurations
// ============================================================
/**
 * Initialise l'application en chargeant toutes les configurations
 */
function init() {
    loadTeamConfig();
    loadThemeConfig();
    loadPlayerList();
    updateTimerDisplay();
    updateScoreDisplay();
    updateStatsDisplay();
    loadTickerItems();
    updatePlayerSelects();
}

// ============================================================
// CONFIGURATION DU THÈME - Gestion des thèmes d'affichage
// ============================================================
function loadThemeConfig() {
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.value = state.theme || 'dark';
        updateThemePreview();
    }
}

function setTheme(theme) {
    state.theme = theme;
    saveState();
    updateThemePreview();
}

function updateThemePreview() {
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.classList.remove('active');
        if (option.classList.contains(state.theme || 'dark')) {
            option.classList.add('active');
        }
    });

    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.value = state.theme || 'dark';
    }
}

// Team Configuration
function loadTeamConfig() {
    document.getElementById('team1-name').value = state.team1.name;
    document.getElementById('team1-color').value = state.team1.color;
    document.getElementById('team2-name').value = state.team2.name;
    document.getElementById('team2-color').value = state.team2.color;

    // Synchroniser les color pickers avec l'état sauvegardé
    const scoreColor = state.scoreColor || '#e94560';
    const timerColor = state.timerColor || '#ffffff';
    document.getElementById('score-color').value = scoreColor;
    document.getElementById('timer-color').value = timerColor;
    document.getElementById('timer-display').style.color = timerColor;

    document.getElementById('score-team1-name').textContent = state.team1.name;
    document.getElementById('score-team1-name').style.color = state.team1.color;
    document.getElementById('score1-display').style.color = scoreColor;

    document.getElementById('score-team2-name').textContent = state.team2.name;
    document.getElementById('score-team2-name').style.color = state.team2.color;
    document.getElementById('score2-display').style.color = scoreColor;

    // Mettre à jour les aperçus des logos
    updateLogoPreview(1);
    updateLogoPreview(2);
}

/**
 * Sauvegarde la configuration des équipes avec validation
 * Valide les noms et couleurs avant sauvegarde
 */
function saveTeamConfig() {
    const team1Name = document.getElementById('team1-name').value;
    const team1Color = document.getElementById('team1-color').value;
    const team2Name = document.getElementById('team2-name').value;
    const team2Color = document.getElementById('team2-color').value;

    if (!validateTeamName(team1Name)) {
        alert('Nom de l\'équipe domicile invalide (1-50 caractères)');
        return;
    }
    if (!validateColorHex(team1Color)) {
        alert('Couleur de l\'équipe domicile invalide (format #RRGGBB)');
        return;
    }
    if (!validateTeamName(team2Name)) {
        alert('Nom de l\'équipe extérieur invalide (1-50 caractères)');
        return;
    }
    if (!validateColorHex(team2Color)) {
        alert('Couleur de l\'équipe extérieur invalide (format #RRGGBB)');
        return;
    }

    state.team1.name = team1Name;
    state.team1.color = team1Color;
    state.team2.name = team2Name;
    state.team2.color = team2Color;

    saveState();
    loadTeamConfig();
}

/**
 * Gère l'upload du logo d'une équipe
 * @param {number} team - 1 pour domicile, 2 pour extérieur
 */
async function handleTeamLogoUpload(team) {
    const fileInput = document.getElementById(`team${team}-logo`);
    const file = fileInput.files[0];

    if (!file) return;

    // Vérifier si c'est une image
    if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image valide.');
        fileInput.value = '';
        return;
    }

    console.log(`Upload logo pour équipe ${team}:`, file.name, file.size);

    try {
        // Convertir en base64 (synchrone, plus fiable pour l'affichage immédiat)
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            console.log(`Base64 length pour équipe ${team}:`, base64.length);

            // Stocker directement en base64
            if (team === 1) {
                state.team1.logo = base64;
            } else {
                state.team2.logo = base64;
            }

            console.log(`Logo sauvegardé en base64 pour équipe ${team}`);

            saveState();
            updateLogoPreview(team);
        };
        reader.readAsDataURL(file);
    } catch (error) {
        console.error('Erreur lors de l\'upload du logo:', error);
        alert('Erreur lors de l\'upload du logo: ' + error.message);
    }
}

/**
 * Met à jour l'aperçu du logo
 * @param {number} team - 1 pour domicile, 2 pour extérieur
 */
function updateLogoPreview(team) {
    const preview = document.getElementById(`team${team}-logo-preview`);
    const logo = team === 1 ? state.team1.logo : state.team2.logo;

    console.log(`updateLogoPreview pour équipe ${team}:`, logo ? 'Logo présent' : 'Pas de logo');

    if (logo) {
        preview.innerHTML = `<img src="${logo}" alt="Logo équipe" style="width: 100%; height: 100%; object-fit: contain;">`;
        preview.classList.remove('empty');
    } else {
        preview.innerHTML = '<span>Pas de logo</span>';
        preview.classList.add('empty');
    }
}

// ============================================================
// GESTION DES EFFECTIFS - Ajout et suppression de joueurs
// ============================================================
function selectTeam(team) {
    selectedTeam = team;
    document.getElementById('tab1').classList.toggle('active', team === 1);
    document.getElementById('tab2').classList.toggle('active', team === 2);
    loadPlayerList();
}

/**
 * Charge la liste des joueurs de l'équipe sélectionnée
/**
 * Charge la liste des joueurs groupée par rôle (Titulaires / Remplaçants)
 */
function loadPlayerList() {
    const players = selectedTeam === 1 ? state.team1.players : state.team2.players;
    const list = document.getElementById('player-list');

    const starters = players.filter(p => p.starter !== false);
    const bench = players.filter(p => p.starter === false);

    const renderGroup = (group, label, badgeClass) => {
        if (group.length === 0) return '';
        return `
            <div class="player-group-title">${label}</div>
            ${group.map((p) => {
            const index = players.indexOf(p);
            const isStarter = p.starter !== false;
            return `
                <div class="player-item">
                    <img class="player-photo-thumb" src="${p.photo || ''}" alt="">
                    <div class="player-info">
                        <div class="player-name">
                            ${p.name}
                            <span class="role-badge ${isStarter ? 'badge-starter' : 'badge-bench'}">
                                ${isStarter ? 'TIT' : 'REM'}
                            </span>
                        </div>
                        <div class="player-details">N°${p.number} · ${p.position}</div>
                    </div>
                    <div class="player-actions">
                        <button class="btn btn-sm role-toggle-btn ${isStarter ? 'btn-warning' : 'btn-success'}"
                            onclick="togglePlayerRole(${index})" title="${isStarter ? 'Mettre remplaçant' : 'Mettre titulaire'}">
                            ${isStarter ? '⬇ REM' : '⬆ TIT'}
                        </button>
                        <button class="btn btn-primary btn-sm photo-upload-btn">
                            📷
                            <input type="file" accept="image/*" onchange="uploadPhoto(${index}, this)">
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="removePlayer(${index})">✕</button>
                    </div>
                </div>`;
        }).join('')}
        `;
    };

    list.innerHTML =
        renderGroup(starters, '🟢 Titulaires', 'badge-starter') +
        renderGroup(bench, '🔵 Remplaçants', 'badge-bench');
}

/**
 * Bascule le rôle d'un joueur entre titulaire et remplaçant
 * @param {number} index - Index du joueur dans la liste
 */
function togglePlayerRole(index) {
    const players = selectedTeam === 1 ? state.team1.players : state.team2.players;
    players[index].starter = players[index].starter === false ? true : false;
    saveState();
    loadPlayerList();
    updatePlayerSelects();
}

/**
 * Supprime un joueur de l'équipe sélectionnée
 * @param {number} index - Index du joueur à supprimer
 */
function removePlayer(index) {
    const players = selectedTeam === 1 ? state.team1.players : state.team2.players;
    players.splice(index, 1);
    saveState();
    loadPlayerList();
    updatePlayerSelects();
}

/**
 * Ajoute un joueur à l'équipe sélectionnée avec validation
 */
function addPlayer() {
    const number = document.getElementById('player-number').value;
    const name = document.getElementById('player-name').value;
    const position = document.getElementById('player-position').value;
    const role = document.getElementById('player-role').value;

    if (!validatePlayerNumber(parseInt(number))) {
        alert('Numéro de joueur invalide (1-99)');
        return;
    }
    if (!validatePlayerName(name)) {
        alert('Nom de joueur invalide (1-50 caractères)');
        return;
    }

    const players = selectedTeam === 1 ? state.team1.players : state.team2.players;
    players.push({
        id: Date.now(),
        number: parseInt(number),
        name: name,
        position: position || 'N/A',
        photo: '',
        starter: role !== 'bench'   // true = titulaire, false = remplaçant
    });

    saveState();
    loadPlayerList();
    updatePlayerSelects();

    document.getElementById('player-number').value = '';
    document.getElementById('player-name').value = '';
    document.getElementById('player-position').value = '';
}

/**
 * Upload et sauvegarde la photo d'un joueur
 * Convertit l'image en base64 et la sauvegarde dans l'état
 * @param {number} index - Index du joueur dans la liste
 * @param {HTMLInputElement} input - Input file contenant l'image
 */
function uploadPhoto(index, input) {
    const file = input.files[0];
    if (!file) return;

    try {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const players = selectedTeam === 1 ? state.team1.players : state.team2.players;
                players[index].photo = e.target.result;
                saveState();
                loadPlayerList();
            } catch (e) {
                alert('Erreur lors de la sauvegarde de la photo : ' + e.message);
            }
        };
        reader.onerror = function () {
            alert('Erreur lors de la lecture du fichier');
        };
        reader.readAsDataURL(file);
    } catch (e) {
        alert('Erreur lors de l\'upload de la photo : ' + e.message);
    }
}

// ============================================================
// CHRONOMÈTRE - Gestion du temps de match
// ============================================================
function updateTimerDisplay() {
    const minutes = Math.floor(state.timer / 60);
    const seconds = state.timer % 60;
    document.getElementById('timer-display').textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('added-time').value = state.addedTime;

    // Appliquer la couleur du chronomètre
    const timerColor = state.timerColor || '#ffffff';
    document.getElementById('timer-display').style.color = timerColor;
}

/**
 * Démarre le chronomètre
 */
function startTimer() {
    if (state.isRunning) return;
    state.isRunning = true;
    saveState();

    timerInterval = setInterval(() => {
        state.timer++;
        saveState();
        updateTimerDisplay();
    }, 1000);
}

/**
 * Met en pause le chronomètre
 */
function pauseTimer() {
    state.isRunning = false;
    saveState();
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/**
 * Réinitialise le chronomètre à 0
 */
function resetTimer() {
    pauseTimer();
    state.timer = 0;
    state.addedTime = 0;
    saveState();
    updateTimerDisplay();
}

/**
 * Ajuste le chronomètre d'un certain nombre de minutes
 * @param {number} minutes - Minutes à ajouter (positif ou négatif)
 */
function adjustTime(minutes) {
    state.timer += minutes * 60;
    if (state.timer < 0) state.timer = 0;
    saveState();
    updateTimerDisplay();
}

/**
 * Sauvegarde le temps additionnel et met à jour l'affichage
 */
function saveAddedTime() {
    state.addedTime = parseInt(document.getElementById('added-time').value) || 0;
    saveState();
    updateTimerDisplay();
}

/**
 * Change la phase du match et gère le timer automatiquement
 * @param {string} phase - 'first-half', 'ht', 'second-half', 'et', 'ft'
 */
function setPhase(phase) {
    state.phase = phase;

    // Arrêter le timer automatiquement à mi-temps et fin de match
    if (phase === 'ht' || phase === 'ft') {
        pauseTimer();
    }

    // Réinitialiser le timer pour la 2ème période
    if (phase === 'second-half') {
        state.timer = 0;
        state.addedTime = 0;
        updateTimerDisplay();
    }

    // Réinitialiser le timer pour les prolongations
    if (phase === 'et') {
        state.timer = 0;
        state.addedTime = 0;
        updateTimerDisplay();
    }

    saveState();
}

// ============================================================
// SCORE - Gestion du score du match
// ============================================================
function updateScoreDisplay() {
    document.getElementById('score1-display').textContent = state.score1;
    document.getElementById('score2-display').textContent = state.score2;

    // Appliquer la couleur des scores
    const scoreColor = state.scoreColor || '#e94560';
    document.getElementById('score1-display').style.color = scoreColor;
    document.getElementById('score2-display').style.color = scoreColor;
}

/**
 * Ajoute un but à l'équipe spécifiée
 * Bloque l'ajout si le match est terminé (phase 'ft')
 * @param {number} team - 1 pour domicile, 2 pour extérieur
 */
function addGoal(team) {
    if (state.phase === 'ft') {
        alert('Le match est terminé. Impossible d\'ajouter un but.');
        return;
    }
    if (team === 1) state.score1++;
    else state.score2++;
    saveState();
    updateScoreDisplay();
}

/**
 * Retire un but à l'équipe spécifiée
 * Bloque la suppression si le match est terminé (phase 'ft')
 * @param {number} team - 1 pour domicile, 2 pour extérieur
 */
function removeGoal(team) {
    if (state.phase === 'ft') {
        alert('Le match est terminé. Impossible de modifier le score.');
        return;
    }
    if (team === 1 && state.score1 > 0) state.score1--;
    else if (team === 2 && state.score2 > 0) state.score2--;
    saveState();
    updateScoreDisplay();
}

// ============================================================
// ENREGISTREMENT DES BUTS - Gestion détaillée des buts
// ============================================================
function recordGoal() {
    const team = parseInt(document.getElementById('goal-team').value);
    const scorerId = document.getElementById('goal-scorer').value;
    const assistId = document.getElementById('goal-assist').value;

    if (!scorerId) {
        alert('Veuillez sélectionner un buteur');
        return;
    }

    if (team === 1) state.score1++;
    else state.score2++;

    state.events.push({
        type: 'goal',
        team: team,
        scorer: scorerId,
        assist: assistId || null,
        handled: false
    });

    computePossession();
    saveState();
    updateScoreDisplay();
}

// ============================================================
// SÉLECTEURS DE JOUEURS - Mise à jour des listes déroulantes
// ============================================================
/**
 * Met à jour les sélecteurs de joueurs pour l'enregistrement des buts
/**
 * Met à jour les sélecteurs de joueurs pour l'enregistrement des buts
 * sub-out → uniquement les titulaires (sur le terrain)
 * sub-in  → uniquement les remplaçants (sur le banc)
 */
function updatePlayerSelects() {
    const selects = ['goal-scorer', 'goal-assist', 'yellow-player', 'red-player', 'sub-out', 'sub-in'];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        const teamSelect = selectId === 'goal-scorer' || selectId === 'goal-assist'
            ? document.getElementById('goal-team')
            : selectId === 'yellow-player'
                ? document.getElementById('yellow-team')
                : selectId === 'red-player'
                    ? document.getElementById('red-team')
                    : document.getElementById('sub-team');

        const team = parseInt(teamSelect.value);
        const allPlayers = team === 1 ? state.team1.players : state.team2.players;

        // Filtrer selon le sélecteur
        let players;
        if (selectId === 'sub-out') {
            // Uniquement les titulaires (starter !== false)
            players = allPlayers.filter(p => p.starter !== false);
        } else if (selectId === 'sub-in') {
            // Uniquement les remplaçants (starter === false)
            players = allPlayers.filter(p => p.starter === false);
        } else {
            // Tous les joueurs pour les autres sélecteurs
            players = allPlayers;
        }

        const placeholder = selectId === 'sub-out' ? '-- Titulaire sort --'
            : selectId === 'sub-in' ? '-- Remplaçant entre --'
                : '-- Joueur --';

        select.innerHTML = `<option value="">${placeholder}</option>` +
            players.map(p => `<option value="${p.id}">${p.number} - ${p.name}</option>`).join('');
    });
}

// Discipline
function showYellowCard() {
    const team = parseInt(document.getElementById('yellow-team').value);
    const playerId = document.getElementById('yellow-player').value;

    if (!playerId) {
        alert('Veuillez sélectionner un joueur');
        return;
    }

    state.events.push({
        type: 'yellow',
        team: team,
        player: parseInt(playerId),
        time: state.timer,
        handled: false
    });

    computePossession();
    saveState();
}

function showRedCard() {
    const team = parseInt(document.getElementById('red-team').value);
    const playerId = document.getElementById('red-player').value;

    if (!playerId) {
        alert('Veuillez sélectionner un joueur');
        return;
    }

    state.events.push({
        type: 'red',
        team: team,
        player: parseInt(playerId),
        time: state.timer,
        handled: false
    });

    computePossession();
    saveState();
}

function showSubstitution() {
    const team = parseInt(document.getElementById('sub-team').value);
    const outId = parseInt(document.getElementById('sub-out').value);
    const inId = parseInt(document.getElementById('sub-in').value);

    if (!outId || !inId) {
        alert('Veuillez sélectionner les deux joueurs');
        return;
    }

    // Inverser les rôles : le sortant devient remplaçant, l'entrant devient titulaire
    const players = team === 1 ? state.team1.players : state.team2.players;
    const playerOut = players.find(p => p.id == outId);
    const playerIn = players.find(p => p.id == inId);
    if (playerOut) playerOut.starter = false;
    if (playerIn) playerIn.starter = true;

    state.events.push({
        type: 'sub',
        team: team,
        out: outId,
        in: inId,
        handled: false
    });

    computePossession();
    saveState();
    loadPlayerList();
    updatePlayerSelects();
}

function showVAR() {
    state.events.push({
        type: 'var',
        handled: false
    });

    saveState();
}

function showVARResult(result) {
    state.events.push({
        type: 'var-result',
        result: result,
        handled: false
    });

    saveState();
}

// ============================================================
// STATISTIQUES - Gestion des stats du match
// ============================================================
function updateStatsDisplay() {
    const possession = state.stats.possession.replace('%', '').split('-');
    const p1 = possession.length === 2 ? possession[0] : '50';
    const p2 = possession.length === 2 ? possession[1] : '50';

    // Affichage possession automatique (lecture seule)
    const displayEl = document.getElementById('possession-display');
    if (displayEl) {
        displayEl.textContent = `${p1}% — ${p2}%`;
    }
    document.getElementById('shots1').value = state.stats.shots[0];
    document.getElementById('shots2').value = state.stats.shots[1];
    document.getElementById('corners1').value = state.stats.corners[0];
    document.getElementById('corners2').value = state.stats.corners[1];
}

/**
 * Remet la possession à 50-50 et efface les poids d'événements
 */
function resetPossession() {
    state.stats.possession = '50-50';
    const displayEl = document.getElementById('possession-display');
    if (displayEl) displayEl.textContent = '50% — 50%';
    saveState();
}

/**
 * Calcule automatiquement la possession en fonction des événements et statistiques
 * Poids : But=6, Tir=3, Corner=2, Carton jaune/rouge=1 (équipe adverse), Remplacement=1
 * Résultat sauvegardé dans state.stats.possession et affiché dans le panneau
 */
function computePossession() {
    // Poids de base 10-10 pour éviter 0/0 en début de match
    let w1 = 10;
    let w2 = 10;

    // Tirs (poids 3 chacun)
    w1 += (state.stats.shots[0] || 0) * 3;
    w2 += (state.stats.shots[1] || 0) * 3;

    // Corners (poids 2 chacun)
    w1 += (state.stats.corners[0] || 0) * 2;
    w2 += (state.stats.corners[1] || 0) * 2;

    // Événements (buts, cartons, remplacements)
    (state.events || []).forEach(ev => {
        switch (ev.type) {
            case 'goal':
                // Celui qui marque avait la balle
                if (ev.team === 1) w1 += 6;
                else w2 += 6;
                break;
            case 'yellow':
            case 'red':
                // La faute est commise sur l'équipe adverse → c'est l'adversaire qui avait la balle
                if (ev.team === 1) w2 += 1; // Faute de l'équipe 1 → balle équipe 2
                else w1 += 1;
                break;
            case 'substitution':
                // Remplacement = équipe active sur le match
                if (ev.team === 1) w1 += 1;
                else w2 += 1;
                break;
        }
    });

    const total = w1 + w2;
    let p1 = Math.round((w1 / total) * 100);
    let p2 = 100 - p1;

    // Minimum 5% par équipe
    if (p1 < 5) { p1 = 5; p2 = 95; }
    if (p2 < 5) { p2 = 5; p1 = 95; }

    state.stats.possession = `${p1}-${p2}`;

    // Mettre à jour l'affichage dans le panneau
    const displayEl = document.getElementById('possession-display');
    if (displayEl) {
        displayEl.textContent = `${p1}% — ${p2}%`;
    }
}

/**
 * Sauvegarde les statistiques du match
 */
function saveStats() {
    // Possession calculée automatiquement — ne pas écraser
    state.stats.shots = [
        parseInt(document.getElementById('shots1').value) || 0,
        parseInt(document.getElementById('shots2').value) || 0
    ];
    state.stats.corners = [
        parseInt(document.getElementById('corners1').value) || 0,
        parseInt(document.getElementById('corners2').value) || 0
    ];
    // Recalculer la possession avec les nouvelles stats
    computePossession();
    saveState();
}

// Media Functions
function updateMediaType() {
    const type = document.getElementById('media-type').value;
    const durationInput = document.getElementById('media-duration');

    if (type === 'video') {
        durationInput.disabled = true;
        durationInput.value = 0;
    } else {
        durationInput.disabled = false;
        durationInput.value = 10;
    }
}

function uploadMediaFile() {
    document.getElementById('media-file-input').click();
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
 * Sauvegarde un fichier dans IndexedDB
 * @param {string} id - Identifiant unique du fichier
 * @param {Blob} blob - Données du fichier
 * @param {string} type - Type MIME du fichier
 * @returns {Promise<void>}
 */
async function saveMediaToIndexedDB(id, blob, type) {
    try {
        const db = await initIndexedDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const mediaItem = {
            id: id,
            blob: blob,
            type: type,
            timestamp: Date.now()
        };

        store.put(mediaItem);

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (e) {
        log('Erreur IndexedDB:', e);
        throw e;
    }
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

/**
 * Supprime un fichier de IndexedDB
 * @param {string} id - Identifiant du fichier
 * @returns {Promise<void>}
 */
async function deleteMediaFromIndexedDB(id) {
    try {
        const db = await initIndexedDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(id);

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (e) {
        log('Erreur IndexedDB:', e);
    }
}

/**
 * Gère l'upload d'un fichier média (image ou vidéo)
 * Stocke les fichiers volumineux dans IndexedDB
 * Valide le type du fichier avant traitement
 * @param {HTMLInputElement} input - Input file contenant le média
 */
async function handleMediaUpload(input) {
    const file = input.files[0];
    if (!file) return;

    // Validation du type de fichier
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];

    if (!validImageTypes.includes(file.type) && !validVideoTypes.includes(file.type)) {
        alert(`⚠️ Type de fichier non supporté: ${file.type}\n\nTypes supportés:\nImages: JPEG, PNG, GIF, WebP, BMP, SVG\nVidéos: MP4, WebM, Ogg, MOV, AVI`);
        input.value = ''; // Reset input
        return;
    }

    // Afficher la taille du fichier
    const fileSizeMB = file.size / (1024 * 1024);
    log(`Upload fichier: ${file.name} (${fileSizeMB.toFixed(2)}MB)`);

    try {
        // Générer un ID unique pour le fichier
        const mediaId = 'media_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        // Sauvegarder dans IndexedDB
        await saveMediaToIndexedDB(mediaId, file, file.type);

        // Stocker l'ID IndexedDB dans le champ source
        document.getElementById('media-source').value = `indexeddb:${mediaId}`;

        // Update preview
        const preview = document.getElementById('media-preview');
        const type = file.type.startsWith('video') ? 'video' : 'image';

        // Créer une URL temporaire pour l'aperçu (streaming optimisé)
        const tempUrl = URL.createObjectURL(file);

        if (type === 'image') {
            preview.innerHTML = `<img src="${tempUrl}" alt="Preview" style="max-width: 100%; max-height: 200px; object-fit: contain;">`;
            document.getElementById('media-type').value = 'image';
        } else {
            // Pour les vidéos, ajouter des attributs de streaming optimisé
            preview.innerHTML = `
                <video src="${tempUrl}" controls 
                       preload="metadata" 
                       style="max-width: 100%; max-height: 200px;"
                       onloadedmetadata="this.currentTime=0">
                    Votre navigateur ne supporte pas la lecture vidéo.
                </video>`;
            document.getElementById('media-type').value = 'video';
        }

        updateMediaType();

        log('Fichier sauvegardé dans IndexedDB avec succès');
        log('Taille du fichier:', fileSizeMB.toFixed(2), 'MB');
    } catch (e) {
        alert('Erreur lors du traitement du média : ' + e.message);
        log('Erreur upload:', e);
    }
}

/**
 * Affiche un média sur l'écran stadium display
 * Supporte IndexedDB pour les fichiers volumineux
 * Pour les vidéos, préfère les URLs externes aux uploads
 */
function showMedia() {
    const type = document.getElementById('media-type').value;
    const source = document.getElementById('media-source').value;
    const title = document.getElementById('media-title-input').value;
    const duration = parseInt(document.getElementById('media-duration').value) || 10;
    const animationIn = document.getElementById('media-animation-in').value;
    const animationOut = document.getElementById('media-animation-out').value;
    const repeat = document.getElementById('media-repeat').value === 'true';
    const scroll = document.getElementById('media-scroll').value;
    const videoMode = document.querySelector('input[name="video-mode"]:checked')?.value || 'auto';

    if (type === 'none' || !source) {
        alert('Veuillez sélectionner un type de média et une source');
        return;
    }

    // Pour YouTube, convertir en URL embed si nécessaire
    let finalSource = source;
    if (type === 'video' && (source.includes('youtube.com') || source.includes('youtu.be'))) {
        let youtubeId = '';
        if (source.includes('youtu.be/')) {
            youtubeId = source.split('youtu.be/')[1].split('?')[0];
        } else if (source.includes('youtube.com/watch')) {
            youtubeId = source.split('v=')[1].split('&')[0];
        } else if (source.includes('youtube.com/embed/')) {
            youtubeId = source.split('youtube.com/embed/')[1];
        }

        if (youtubeId) {
            const confirmEmbed = confirm('URL YouTube détectée. Convertir en format embed pour meilleure compatibilité?');
            if (confirmEmbed) {
                finalSource = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}`;
            }
        }
    }

    // Vérifier si c'est un fichier IndexedDB
    const isIndexedDB = finalSource.startsWith('indexeddb:');

    if (isIndexedDB) {
        // Pour IndexedDB, on stocke seulement l'ID dans localStorage
        // Les données sont stockées dans IndexedDB
        log('Utilisation de IndexedDB pour le média');
    } else if (source.startsWith('data:')) {
        // Pour base64, vérifier la taille
        const base64Size = Math.ceil((source.length * 3) / 4) / (1024 * 1024);
        if (base64Size > 2) {
            alert(`⚠️ Données base64 volumineuses (${base64Size.toFixed(2)}MB)\n\nRecommandation: Utilisez IndexedDB (upload de fichier) ou une URL externe.`);
            if (!confirm('Continuer quand même?')) {
                return;
            }
        }
    }

    state.media = {
        type: type,
        source: finalSource,
        title: title,
        duration: type === 'image' ? duration : 0,
        animationIn: animationIn,
        animationOut: animationOut,
        repeat: repeat,
        scroll: scroll,
        videoMode: videoMode
    };

    saveState();

    // Afficher le bouton son si c'est une vidéo
    const btnUnmute = document.getElementById('btn-unmute');
    if (type === 'video') {
        btnUnmute.style.display = 'inline-block';
        btnUnmute.textContent = '🔇 Son coupé';
        btnUnmute.classList.remove('btn-success');
        btnUnmute.classList.add('btn-warning');
        // Réinitialiser l'état mute côté display
        localStorage.setItem('stadium_video_cmd', JSON.stringify({ cmd: 'mute', ts: Date.now() }));
    } else {
        btnUnmute.style.display = 'none';
    }
}

function hideMedia() {
    state.media = {
        type: 'none',
        source: '',
        title: '',
        duration: 10
    };
    saveState();
    // Cacher le bouton son
    document.getElementById('btn-unmute').style.display = 'none';
}

// ============================================================
// BANDEAU DÉFILANT - Gestion des messages ticker
// ============================================================
function loadTickerItems() {
    const container = document.getElementById('ticker-items');
    container.innerHTML = state.ticker.map((item, index) => {
        const text = typeof item === 'object' ? item.text : item;
        const color = typeof item === 'object' ? item.color : '#00ff88';
        return `
        <div class="ticker-item">
            <span style="color: ${color}">${text}</span>
            <button class="btn btn-danger btn-sm" onclick="removeTickerItem(${index})">✕</button>
        </div>
    `;
    }).join('');
}

/**
 * Ajoute un message au bandeau défilant
 */
function addTickerItem() {
    const input = document.getElementById('ticker-input');
    const colorInput = document.getElementById('ticker-color');
    const text = input.value.trim();
    const color = colorInput.value;

    if (!text) return;

    state.ticker.push({ text: text, color: color });
    saveState();
    loadTickerItems();
    input.value = '';
}

/**
 * Supprime un message du bandeau défilant
 * @param {number} index - Index du message à supprimer
 */
function removeTickerItem(index) {
    state.ticker.splice(index, 1);
    saveState();
    loadTickerItems();
}

// ============================================================
// RÉINITIALISATION - Remise à zéro du match
// ============================================================
function resetMatch() {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser le match ?')) return;

    state = JSON.parse(JSON.stringify(defaultState));
    state.team1.name = document.getElementById('team1-name').value;
    state.team1.color = document.getElementById('team1-color').value;
    state.team2.name = document.getElementById('team2-name').value;
    state.team2.color = document.getElementById('team2-color').value;
    state.theme = document.getElementById('theme-select') ? document.getElementById('theme-select').value : 'dark';

    saveState();
    init();
}

// ============================================================
// CONTRÔLE VIDÉO MANUEL - Commandes envoyées au stadium display
// ============================================================

/**
 * Affiche ou cache la section de contrôle manuel selon le mode choisi
 */
function onVideoModeChange() {
    const mode = document.querySelector('input[name="video-mode"]:checked').value;
    const controls = document.getElementById('video-manual-controls');
    controls.style.display = mode === 'manual' ? 'block' : 'none';
}

/**
 * Envoie une commande vidéo au stadium_display via localStorage
 * @param {string} cmd - La commande ('seek-back-10', 'seek-fwd-10', 'seek-back-30', 'seek-fwd-30', 'play', 'pause', 'seek-to')
 * @param {number|null} value - Valeur optionnelle (ex: position seek)
 */
function sendVideoCmd(cmd, value = null) {
    const command = { cmd, value, ts: Date.now() };
    localStorage.setItem('stadium_video_cmd', JSON.stringify(command));
}

/**
 * Bascule play/pause de la vidéo
 */
function toggleVideoPlayPause() {
    const btn = document.getElementById('vc-playpause');
    const isPlaying = btn.textContent.includes('Pause');
    if (isPlaying) {
        sendVideoCmd('pause');
        btn.textContent = '▶ Play';
        btn.classList.remove('btn-warning');
        btn.classList.add('btn-success');
    } else {
        sendVideoCmd('play');
        btn.textContent = '⏸ Pause';
        btn.classList.remove('btn-success');
        btn.classList.add('btn-warning');
    }
}

/**
 * Active ou coupe le son de la vidéo en cours
 */
function toggleMute() {
    const btn = document.getElementById('btn-unmute');
    const isMuted = btn.textContent.includes('coupé');
    if (isMuted) {
        sendVideoCmd('unmute');
        btn.textContent = '🔊 Son activé';
        btn.classList.remove('btn-warning');
        btn.classList.add('btn-success');
    } else {
        sendVideoCmd('mute');
        btn.textContent = '🔇 Son coupé';
        btn.classList.remove('btn-success');
        btn.classList.add('btn-warning');
    }
}

/**
 * Envoie une commande de seek à une position précise (en %)
 * @param {number} percent - Position en pourcentage (0-100)
 */
function seekVideo(percent) {
    sendVideoCmd('seek-to', parseFloat(percent));
}

/**
 * Met à jour l'affichage du temps vidéo (reçu depuis stadium_display)
 * @param {number} current - Temps actuel en secondes
 * @param {number} duration - Durée totale en secondes
 */
function updateVideoTimeDisplay(current, duration) {
    const fmt = (s) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };
    document.getElementById('vc-current').textContent = fmt(current);
    document.getElementById('vc-duration').textContent = fmt(duration);
    const bar = document.getElementById('vc-seek');
    if (duration > 0 && document.activeElement !== bar) {
        bar.value = (current / duration) * 100;
    }
}

// Écouter les mises à jour de temps depuis le stadium_display
window.addEventListener('storage', (e) => {
    if (e.key === 'stadium_video_time' && e.newValue) {
        const data = JSON.parse(e.newValue);
        updateVideoTimeDisplay(data.current, data.duration);

        // Sync bouton play/pause
        const btn = document.getElementById('vc-playpause');
        if (btn) {
            if (data.paused) {
                btn.textContent = '▶ Play';
                btn.classList.remove('btn-warning');
                btn.classList.add('btn-success');
            } else {
                btn.textContent = '⏸ Pause';
                btn.classList.remove('btn-success');
                btn.classList.add('btn-warning');
            }
        }
    }
});

// Listen for storage changes (sync with other tabs)
window.addEventListener('storage', (e) => {
    if (e.key === 'stadium_match_state') {
        state = JSON.parse(e.newValue);
        init();
    }
});

// Écouteur pour le changement de couleur des scores
document.getElementById('score-color').addEventListener('input', (e) => {
    state.scoreColor = e.target.value;
    document.getElementById('score1-display').style.color = e.target.value;
    document.getElementById('score2-display').style.color = e.target.value;
    saveState();
});

// Écouteur pour le changement de couleur du chronomètre
document.getElementById('timer-color').addEventListener('input', (e) => {
    state.timerColor = e.target.value;
    document.getElementById('timer-display').style.color = e.target.value;
    saveState();
});

// Initialize on load
init();

// Resume timer if running
if (state.isRunning) {
    startTimer();
}

// ============================================================
// BOÎTE D'OPTIONS - Ouverture / Fermeture
// ============================================================

/**
 * Ouvre la boîte d'options
 */
function openOptionsBox() {
    document.getElementById('options-overlay').classList.add('active');
    document.getElementById('options-box').classList.add('active');
    // Charger la clé API sauvegardée si présente
    const savedKey = localStorage.getItem('yt_api_key') || '';
    document.getElementById('yt-api-key').value = savedKey;
}

/**
 * Ferme la boîte d'options
 */
function closeOptionsBox() {
    document.getElementById('options-overlay').classList.remove('active');
    document.getElementById('options-box').classList.remove('active');
}

// Fermer avec Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeOptionsBox();
});

// Charger l'historique des rapports au démarrage
document.addEventListener('DOMContentLoaded', () => {
    loadReportHistory();
    initDisplayUrl();
    changeHelpLanguage(); // Charger le contenu d'aide par défaut
});

/**
 * Change la langue de la section Aide & Contact
 */
function changeHelpLanguage() {
    const language = document.getElementById('help-language').value;
    const helpContent = document.getElementById('help-content-text');
    const contactContent = document.getElementById('contact-content-text');
    const joinTeamContent = document.getElementById('join-team-content-text');

    const helpTexts = {
        fr: `
            <h4>📋 Présentation de l'application</h4>
            <p><strong>Scor-Set</strong> est un système d'affichage de scores pour stade qui permet de gérer en temps réel les matchs de football avec un panneau de contrôle et un affichage stade.</p>
            
            <h4>🎯 Fonctionnalités principales</h4>
            <ul>
                <li><strong>Gestion du score:</strong> Ajoutez ou retirez des buts pour chaque équipe</li>
                <li><strong>Chronomètre:</strong> Gérez le temps du match avec phases (1ère période, mi-temps, 2ème période, prolongations, fin de match)</li>
                <li><strong>Effectifs:</strong> Gérez les joueurs, leurs numéros, postes et photos</li>
                <li><strong>Discipline:</strong> Enregistrez les cartons jaunes et rouges</li>
                <li><strong>Remplacements:</strong> Gérez les entrées et sorties de joueurs</li>
                <li><strong>VAR:</strong> Affichez les vérifications VAR et leurs résultats</li>
                <li><strong>Thèmes:</strong> Personnalisez l'apparence de l'affichage</li>
                <li><strong>Logos:</strong> Ajoutez les logos des équipes</li>
            </ul>
            
            <h4>⚠️ Ce qu'il faut éviter</h4>
            <ul>
                <li>Ne fermez pas le serveur Python pendant l'utilisation</li>
                <li>Évitez d'utiliser des images trop volumineuses pour les logos/photos</li>
                <li>Ne modifiez pas les fichiers du système pendant le fonctionnement</li>
                <li>Évitez de changer de langue pendant un match en cours</li>
            </ul>
            
            <h4>✅ Ce qu'il faut faire</h4>
            <ul>
                <li>Configurez les équipes avant de commencer le match</li>
                <li>Sauvegardez régulièrement la configuration</li>
                <li>Utilisez le bouton "Réinitialiser le Match" entre deux matchs</li>
                <li>Ouvrez l'affichage stade dans un nouvel onglet pour un meilleur contrôle</li>
                <li>Testez les fonctionnalités avant un match officiel</li>
            </ul>
            
            <h4>🔧 Dépannage</h4>
            <ul>
                <li><strong>L'affichage ne se met pas à jour:</strong> Vérifiez que le serveur Python est en cours d'exécution</li>
                <li><strong>Les logos ne s'affichent pas:</strong> Vérifiez le format et la taille de l'image</li>
                <li><strong>Le chronomètre ne fonctionne pas:</strong> Vérifiez que la phase du match est correctement définie</li>
            </ul>
        `,
        en: `
            <h4>📋 Application Overview</h4>
            <p><strong>Scor-Set</strong> is a stadium score display system that allows real-time football match management with a control panel and stadium display.</p>
            
            <h4>🎯 Main Features</h4>
            <ul>
                <li><strong>Score Management:</strong> Add or remove goals for each team</li>
                <li><strong>Timer:</strong> Manage match time with phases (1st half, halftime, 2nd half, extra time, full time)</li>
                <li><strong>Roster:</strong> Manage players, their numbers, positions and photos</li>
                <li><strong>Discipline:</strong> Record yellow and red cards</li>
                <li><strong>Substitutions:</strong> Manage player entries and exits</li>
                <li><strong>VAR:</strong> Display VAR reviews and their results</li>
                <li><strong>Themes:</strong> Customize the display appearance</li>
                <li><strong>Logos:</strong> Add team logos</li>
            </ul>
            
            <h4>⚠️ What to Avoid</h4>
            <ul>
                <li>Do not close the Python server during use</li>
                <li>Avoid using too large images for logos/photos</li>
                <li>Do not modify system files during operation</li>
                <li>Avoid changing language during an ongoing match</li>
            </ul>
            
            <h4>✅ What to Do</h4>
            <ul>
                <li>Configure teams before starting the match</li>
                <li>Save configuration regularly</li>
                <li>Use "Reset Match" button between two matches</li>
                <li>Open stadium display in a new tab for better control</li>
                <li>Test features before an official match</li>
            </ul>
            
            <h4>🔧 Troubleshooting</h4>
            <ul>
                <li><strong>Display not updating:</strong> Check that Python server is running</li>
                <li><strong>Logos not displaying:</strong> Check image format and size</li>
                <li><strong>Timer not working:</strong> Check that match phase is correctly set</li>
            </ul>
        `,
        es: `
            <h4>📋 Resumen de la Aplicación</h4>
            <p><strong>Scor-Set</strong> es un sistema de visualización de marcadores para estadios que permite la gestión en tiempo real de partidos de fútbol con un panel de control y visualización en el estadio.</p>
            
            <h4>🎯 Características Principales</h4>
            <ul>
                <li><strong>Gestión de Marcador:</strong> Añade o elimina goles para cada equipo</li>
                <li><strong>Cronómetro:</strong> Gestiona el tiempo del partido con fases (1er tiempo, medio tiempo, 2do tiempo, tiempo extra, fin del partido)</li>
                <li><strong>Plantilla:</strong> Gestiona jugadores, sus números, posiciones y fotos</li>
                <li><strong>Disciplina:</strong> Registra tarjetas amarillas y rojas</li>
                <li><strong>Sustituciones:</strong> Gestiona entradas y salidas de jugadores</li>
                <li><strong>VAR:</strong> Muestra revisiones VAR y sus resultados</li>
                <li><strong>Temas:</strong> Personaliza la apariencia de la visualización</li>
                <li><strong>Logos:</strong> Añade logos de equipos</li>
            </ul>
            
            <h4>⚠️ Qué Evitar</h4>
            <ul>
                <li>No cierres el servidor Python durante el uso</li>
                <li>Evita usar imágenes demasiado grandes para logos/fotos</li>
                <li>No modifiques archivos del sistema durante la operación</li>
                <li>Evita cambiar de idioma durante un partido en curso</li>
            </ul>
            
            <h4>✅ Qué Hacer</h4>
            <ul>
                <li>Configura equipos antes de iniciar el partido</li>
                <li>Guarda la configuración regularmente</li>
                <li>Usa el botón "Reiniciar Partido" entre dos partidos</li>
                <li>Abre la visualización del estadio en una nueva pestaña para mejor control</li>
                <li>Prueba las funciones antes de un partido oficial</li>
            </ul>
            
            <h4>🔧 Solución de Problemas</h4>
            <ul>
                <li><strong>Visualización no se actualiza:</strong> Verifica que el servidor Python esté ejecutándose</li>
                <li><strong>Logos no se muestran:</strong> Verifica el formato y tamaño de la imagen</li>
                <li><strong>Cronómetro no funciona:</strong> Verifica que la fase del partido esté correctamente configurada</li>
            </ul>
        `,
        de: `
            <h4>📋 Anwendung Übersicht</h4>
            <p><strong>Scor-Set</strong> ist ein Stadion-Anzeigesystem für Fußballergebnisse, das die Echtzeitverwaltung von Fußballspielen mit einem Bedienfeld und Stadionanzeige ermöglicht.</p>
            
            <h4>🎯 Hauptfunktionen</h4>
            <ul>
                <li><strong>Tore verwalten:</strong> Tore für jedes Team hinzufügen oder entfernen</li>
                <li><strong>Timer:</strong> Spielzeit mit Phasen verwalten (1. Halbzeit, Halbzeitpause, 2. Halbzeit, Verlängerung, Spielende)</li>
                <li><strong>Kader:</strong> Spieler, ihre Nummern, Positionen und Fotos verwalten</li>
                <li><strong>Disziplin:</strong> Gelbe und rote Karten aufzeichnen</li>
                <li><strong>Einwechselungen:</strong> Ein- und Auswechselungen von Spielern verwalten</li>
                <li><strong>VAR:</strong> VAR-Überprüfungen und deren Ergebnisse anzeigen</li>
                <li><strong>Designs:</strong> Erscheinungsbild der Anzeige anpassen</li>
                <li><strong>Logos:</strong> Team-Logos hinzufügen</li>
            </ul>
            
            <h4>⚠¹ Was zu Vermeiden</h4>
            <ul>
                <li>Python-Server während der Nutzung nicht schließen</li>
                <li>Zu große Bilder für Logos/Fotos vermeiden</li>
                <li>Systemdateien während des Betriebs nicht ändern</li>
                <li>Sprachwechsel während eines laufenden Spiels vermeiden</li>
            </ul>
            
            <h4>✅ Was zu Tun</h4>
            <ul>
                <li>Teams vor Spielbeginn konfigurieren</li>
                <li>Konfiguration regelmäßig speichern</li>
                <li>"Spiel zurücksetzen"-Button zwischen zwei Spielen verwenden</li>
                <li>Stadionanzeige in neuem Tab für bessere Kontrolle öffnen</li>
                <li>Funktionen vor einem offiziellen Spiel testen</li>
            </ul>
            
            <h4>🔧 Fehlerbehebung</h4>
            <ul>
                <li><strong>Anzeige wird nicht aktualisiert:</strong> Prüfen, ob Python-Server läuft</li>
                <li><strong>Logos werden nicht angezeigt:</strong> Bildformat und -größe prüfen</li>
                <li><strong>Timer funktioniert nicht:</strong> Prüfen, ob Spielphase korrekt eingestellt ist</li>
            </ul>
        `,
        pt: `
            <h4>📋 Visão Geral da Aplicação</h4>
            <p><strong>Scor-Set</strong> é um sistema de exibição de placares para estádios que permite o gerenciamento em tempo real de partidas de futebol com um painel de controle e exibição no estádio.</p>
            
            <h4>🎯 Principais Funcionalidades</h4>
            <ul>
                <li><strong>Gestão de Placar:</strong> Adicione ou remova gols para cada equipe</li>
                <li><strong>Cronômetro:</strong> Gerencie o tempo da partida com fases (1º tempo, intervalo, 2º tempo, prorrogação, fim de partida)</li>
                <li><strong>Elenco:</strong> Gerencie jogadores, seus números, posições e fotos</li>
                <li><strong>Disciplina:</strong> Registre cartões amarelos e vermelhos</li>
                <li><strong>Substituições:</strong> Gerencie entradas e saídas de jogadores</li>
                <li><strong>VAR:</strong> Exiba revisões VAR e seus resultados</li>
                <li><strong>Temas:</strong> Personalize a aparência da exibição</li>
                <li><strong>Logos:</strong> Adicione logos das equipes</li>
            </ul>
            
            <h4>⚠️ O Que Evitar</h4>
            <ul>
                <li>Não feche o servidor Python durante o uso</li>
                <li>Evite usar imagens muito grandes para logos/fotos</li>
                <li>Não modifique arquivos do sistema durante a operação</li>
                <li>Evite mudar de idioma durante uma partida em andamento</li>
            </ul>
            
            <h4>✅ O Que Fazer</h4>
            <ul>
                <li>Configure as equipes antes de iniciar a partida</li>
                <li>Salve a configuração regularmente</li>
                <li>Use o botão "Reiniciar Partida" entre duas partidas</li>
                <li>Abra a exibição do estádio em uma nova aba para melhor controle</li>
                <li>Teste as funcionalidades antes de uma partida oficial</li>
            </ul>
            
            <h4>🔧 Solução de Problemas</h4>
            <ul>
                <li><strong>Exibição não atualiza:</strong> Verifique se o servidor Python está em execução</li>
                <li><strong>Logos não exibem:</strong> Verifique o formato e tamanho da imagem</li>
                <li><strong>Cronômetro não funciona:</strong> Verifique se a fase da partida está corretamente definida</li>
            </ul>
        `
    };

    const contactTexts = {
        fr: `
            <p>Pour toute question, problème ou suggestion, n'hésitez pas à nous contacter via nos réseaux sociaux ou directement via les liens ci-dessous.</p>
            <p><strong>Équipe de développement:</strong> Notre équipe est disponible pour vous aider avec toute question technique ou fonctionnelle.</p>
            <p><strong>Support:</strong> Pour un support rapide, préférez les réseaux sociaux. Pour les questions plus complexes, contactez-nous via LinkedIn.</p>
        `,
        en: `
            <p>For any questions, issues or suggestions, please don't hesitate to contact us via our social networks or directly through the links below.</p>
            <p><strong>Development Team:</strong> Our team is available to help you with any technical or functional questions.</p>
            <p><strong>Support:</strong> For quick support, prefer social networks. For more complex questions, contact us via LinkedIn.</p>
        `,
        es: `
            <p>Para cualquier pregunta, problema o sugerencia, no dude en contactarnos a través de nuestras redes sociales o directamente a través de los enlaces a continuación.</p>
            <p><strong>Equipo de Desarrollo:</strong> Nuestro equipo está disponible para ayudarle con cualquier pregunta técnica o funcional.</p>
            <p><strong>Soporte:</strong> Para soporte rápido, prefiera las redes sociales. Para preguntas más complejas, contáctenos a través de LinkedIn.</p>
        `,
        de: `
            <p>Für Fragen, Probleme oder Vorschläge zögern Sie bitte nicht, uns über unsere sozialen Netzwerke oder direkt über die untenstehenden Links zu kontaktieren.</p>
            <p><strong>Entwicklungsteam:</strong> Unser Team steht Ihnen für technische oder funktionale Fragen zur Verfügung.</p>
            <p><strong>Support:</strong> Für schnellen Support bevorzugen Sie soziale Netzwerke. Für komplexere Fragen kontaktieren Sie uns über LinkedIn.</p>
        `,
        pt: `
            <p>Para qualquer dúvida, problema ou sugestão, não hesite em nos contactar através das nossas redes sociais ou diretamente através dos links abaixo.</p>
            <p><strong>Equipa de Desenvolvimento:</strong> A nossa equipa está disponível para ajudar com qualquer questão técnica ou funcional.</p>
            <p><strong>Suporte:</strong> Para suporte rápido, prefira as redes sociais. Para questões mais complexas, contacte-nos através do LinkedIn.</p>
        `
    };

    helpContent.innerHTML = helpTexts[language] || helpTexts['fr'];
    contactContent.innerHTML = contactTexts[language] || contactTexts['fr'];
    
    const joinTeamTexts = {
        fr: `
            <p><strong>Rejoignez notre équipe !</strong> Nous sommes toujours à la recherche de talents passionnés par la technologie et le développement web.</p>
            <p>Suivez-nous sur nos différentes plateformes pour:</p>
            <ul>
                <li>🔹 Découvrir nos projets en cours</li>
                <li>🔹 Participer à nos formations et ateliers</li>
                <li>🔹 Rejoindre notre communauté de développeurs</li>
                <li>🔹 Collaborer sur des projets innovants</li>
            </ul>
            <p><em>Contactez-nous via LinkedIn pour les opportunités de collaboration et de recrutement.</em></p>
        `,
        en: `
            <p><strong>Join our team!</strong> We are always looking for talented people passionate about technology and web development.</p>
            <p>Follow us on our different platforms to:</p>
            <ul>
                <li>🔹 Discover our current projects</li>
                <li>🔹 Participate in our training and workshops</li>
                <li>🔹 Join our developer community</li>
                <li>🔹 Collaborate on innovative projects</li>
            </ul>
            <p><em>Contact us via LinkedIn for collaboration and recruitment opportunities.</em></p>
        `,
        es: `
            <p><strong>¡Únete a nuestro equipo!</strong> Siempre buscamos talentos apasionados por la tecnología y el desarrollo web.</p>
            <p>Síguenos en nuestras diferentes plataformas para:</p>
            <ul>
                <li>🔹 Descubrir nuestros proyectos en curso</li>
                <li>🔹 Participar en nuestros entrenamientos y talleres</li>
                <li>🔹 Unirte a nuestra comunidad de desarrolladores</li>
                <li>🔹 Colaborar en proyectos innovadores</li>
            </ul>
            <p><em>Contáctanos vía LinkedIn para oportunidades de colaboración y reclutamiento.</em></p>
        `,
        de: `
            <p><strong>Treten Sie unserem Team bei!</strong> Wir suchen immer nach talentierten Menschen, die Leidenschaft für Technologie und Webentwicklung haben.</p>
            <p>Folgen Sie uns auf unseren verschiedenen Plattformen, um:</p>
            <ul>
                <li>🔹 Unsere aktuellen Projekte zu entdecken</li>
                <li>🔹 An unseren Schulungen und Workshops teilzunehmen</li>
                <li>🔹 unserer Entwickler-Community beizutreten</li>
                <li>🔹 An innovativen Projekten zu arbeiten</li>
            </ul>
            <p><em>Kontaktieren Sie uns über LinkedIn für Kooperations- und Rekrutierungsmöglichkeiten.</em></p>
        `,
        pt: `
            <p><strong>Junte-se à nossa equipa!</strong> Estamos sempre à procura de talentos apaixonados por tecnologia e desenvolvimento web.</p>
            <p>Siga-nos nas nossas diferentes plataformas para:</p>
            <ul>
                <li>🔹 Descobrir os nossos projetos em curso</li>
                <li>🔹 Participar nas nossas formações e workshops</li>
                <li>🔹 Juntar-se à nossa comunidade de programadores</li>
                <li>🔹 Colaborar em projetos inovadores</li>
            </ul>
            <p><em>Contacte-nos via LinkedIn para oportunidades de colaboração e recrutamento.</em></p>
        `
    };
    
    joinTeamContent.innerHTML = joinTeamTexts[language] || joinTeamTexts['fr'];
}

/**
 * Ouvre/ferme un accordéon dans la boîte d'options
 * @param {string} contentId - ID de l'élément de contenu à toggle
 */
function toggleOptionCard(contentId) {
    const content = document.getElementById(contentId);
    const arrowId = 'arrow-' + contentId;
    const arrow = document.getElementById(arrowId);

    if (!content) return;

    const isOpen = content.classList.contains('open');
    content.classList.toggle('open', !isOpen);
    if (arrow) arrow.classList.toggle('open', !isOpen);
}

// ============================================================
// RECHERCHE YOUTUBE - Logique principale
// ============================================================

let ytSelectedVideo = null; // Vidéo YouTube actuellement sélectionnée

/**
 * Sauvegarde la clé API YouTube dans localStorage
 */
function saveYtApiKey() {
    const key = document.getElementById('yt-api-key').value.trim();
    localStorage.setItem('yt_api_key', key);
    if (key) {
        showYtFeedback('✅ Clé API sauvegardée !', 'success');
    } else {
        localStorage.removeItem('yt_api_key');
        showYtFeedback('🗑️ Clé API supprimée.', 'info');
    }
}

/**
 * Affiche un message de feedback temporaire dans la zone résultats
 * @param {string} msg - Message à afficher
 * @param {string} type - 'success' | 'error' | 'info'
 */
function showYtFeedback(msg, type = 'info') {
    const results = document.getElementById('yt-results');
    const color = type === 'success' ? '#00ff88' : type === 'error' ? '#ff6b6b' : '#c39bd3';
    results.innerHTML = `<div style="text-align:center;padding:20px;color:${color};font-size:14px;">${msg}</div>`;
}

/**
 * Lance une recherche YouTube.
 * - Avec clé API : appel YouTube Data v3, affiche miniatures + titres + chaînes
 * - Sans clé API  : affiche un champ URL manuel + lien de recherche YouTube
 */
async function searchYoutube() {
    const query = document.getElementById('yt-search-input').value.trim();
    if (!query) {
        showYtFeedback('⚠️ Entrez un terme de recherche.', 'error');
        return;
    }

    const apiKey = localStorage.getItem('yt_api_key') || '';
    const results = document.getElementById('yt-results');

    // Cacher la preview si ouverte
    closeYtPreview();

    if (apiKey) {
        // --- Mode avec clé API ---
        results.innerHTML = '<div class="yt-loading">🔍 Recherche en cours...</div>';

        try {
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${apiKey}`;
            const res = await fetch(url);

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                const errMsg = errData?.error?.message || `Erreur HTTP ${res.status}`;
                results.innerHTML = `<div class="yt-error">❌ ${errMsg}<br><small>Vérifiez votre clé API et les quotas Google Cloud.</small></div>`;
                return;
            }

            const data = await res.json();

            if (!data.items || data.items.length === 0) {
                showYtFeedback('😕 Aucun résultat trouvé.', 'info');
                return;
            }

            renderYtResults(data.items);

        } catch (e) {
            results.innerHTML = `<div class="yt-error">❌ Erreur réseau : ${e.message}<br><small>L'API YouTube nécessite une connexion internet.</small></div>`;
        }

    } else {
        // --- Mode sans clé API : URL manuelle + lien YouTube ---
        const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        results.innerHTML = `
            <div class="yt-no-key-wrap">
                <p style="color:#888;font-size:13px;text-align:center;">
                    Sans clé API, collez l'URL YouTube de la vidéo choisie ci-dessous.<br>
                    <a href="${ytSearchUrl}" target="_blank" rel="noopener" style="color:#c39bd3;">
                        🔗 Ouvrir la recherche YouTube dans un nouvel onglet ↗
                    </a>
                </p>
                <div class="yt-manual-url-row">
                    <input type="text" id="yt-manual-url" placeholder="Collez l'URL YouTube ici...">
                    <button class="btn btn-success btn-sm" onclick="previewYtManualUrl()">👁️ Prévisualiser</button>
                </div>
            </div>
        `;
    }
}

/**
 * Affiche les résultats de recherche YouTube API
 * @param {Array} items - Tableau d'items retournés par l'API YouTube
 */
function renderYtResults(items) {
    const results = document.getElementById('yt-results');
    results.innerHTML = items.map((item) => {
        const videoId = item.id.videoId;
        const title = item.snippet.title;
        const channel = item.snippet.channelTitle;
        const thumb = item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '';
        const publishedAt = item.snippet.publishedAt
            ? new Date(item.snippet.publishedAt).getFullYear()
            : '';

        return `
            <div class="yt-result-item" id="yt-item-${videoId}" data-videoid="${videoId}" data-title="${title.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}">
                <img class="yt-result-thumb" src="${thumb}" alt="" loading="lazy" onerror="this.style.background='#222'">
                <div class="yt-result-info">
                    <div class="yt-result-title">${title}</div>
                    <div class="yt-result-channel">${channel}${publishedAt ? ' · ' + publishedAt : ''}</div>
                </div>
                <button class="yt-result-play-btn" data-videoid="${videoId}" data-title="${title.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}">▶</button>
            </div>
        `;
    }).join('');

    // Attacher les événements via JS — évite les bugs de guillemets dans onclick
    results.querySelectorAll('.yt-result-item').forEach(el => {
        const videoId = el.dataset.videoid;
        const title = el.dataset.title;
        el.addEventListener('click', () => selectYtVideo(videoId, title));
        el.querySelector('.yt-result-play-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            selectYtVideo(videoId, title);
        });
    });
}

/**
 * Sélectionne une vidéo YouTube et ouvre la prévisualisation
 * @param {string} videoId - ID YouTube de la vidéo
 * @param {string} title - Titre de la vidéo
 */
function selectYtVideo(videoId, title) {
    // Mettre en surbrillance l'item sélectionné
    document.querySelectorAll('.yt-result-item').forEach(el => el.classList.remove('selected'));
    const item = document.getElementById(`yt-item-${videoId}`);
    if (item) item.classList.add('selected');

    ytSelectedVideo = {
        videoId,
        title,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
    };

    // Afficher la prévisualisation
    const previewWrap = document.getElementById('yt-preview-wrap');
    const previewFrame = document.getElementById('yt-preview-frame');
    const previewTitle = document.getElementById('yt-preview-title');

    previewTitle.textContent = title;
    previewFrame.src = ytSelectedVideo.embedUrl;
    previewWrap.style.display = 'flex';

    // Scroll vers la preview
    previewWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Gère la prévisualisation depuis une URL manuelle (mode sans clé API)
 */
function previewYtManualUrl() {
    const input = document.getElementById('yt-manual-url');
    if (!input) return;
    const url = input.value.trim();
    if (!url) {
        showYtFeedback('⚠️ Collez une URL YouTube valide.', 'error');
        return;
    }

    // Extraire l'ID YouTube
    const videoId = extractYoutubeId(url);
    if (!videoId) {
        showYtFeedback('❌ URL YouTube invalide. Exemple : https://www.youtube.com/watch?v=XXXX', 'error');
        return;
    }

    const title = url; // Pas de titre dispo sans API
    selectYtVideo(videoId, title);
}

/**
 * Extrait l'ID d'une URL YouTube (formats watch, youtu.be, embed)
 * @param {string} url
 * @returns {string|null} L'ID vidéo ou null
 */
function extractYoutubeId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

/**
 * Ferme la prévisualisation YouTube et stoppe la vidéo
 */
function closeYtPreview() {
    const previewWrap = document.getElementById('yt-preview-wrap');
    const previewFrame = document.getElementById('yt-preview-frame');
    if (previewWrap) previewWrap.style.display = 'none';
    if (previewFrame) previewFrame.src = ''; // Stopper la lecture
    ytSelectedVideo = null;
    document.querySelectorAll('.yt-result-item').forEach(el => el.classList.remove('selected'));
}

/**
 * Envoie la vidéo YouTube sélectionnée vers le stadium display
 * Utilise le même mécanisme que showMedia() avec le mode auto
 */
function sendYoutubeToDisplay() {
    if (!ytSelectedVideo) {
        alert('Aucune vidéo sélectionnée.');
        return;
    }

    // Construire l'URL embed optimisée pour le stadium display
    const embedUrl = `https://www.youtube.com/embed/${ytSelectedVideo.videoId}?autoplay=1&mute=0&rel=0&modestbranding=1`;

    // Récupérer les paramètres d'animation actuels du panneau
    const animationIn = document.getElementById('media-animation-in')?.value || 'fade';
    const animationOut = document.getElementById('media-animation-out')?.value || 'fade';
    const videoMode = document.querySelector('input[name="video-mode"]:checked')?.value || 'auto';

    state.media = {
        type: 'video',
        source: embedUrl,
        title: ytSelectedVideo.title,
        duration: 0,
        animationIn,
        animationOut,
        repeat: false,
        scroll: 'none',
        videoMode
    };

    saveState();

    // Afficher le bouton son dans le panneau
    const btnUnmute = document.getElementById('btn-unmute');
    if (btnUnmute) {
        btnUnmute.style.display = 'inline-block';
        btnUnmute.textContent = '🔇 Son coupé';
        btnUnmute.classList.remove('btn-success');
        btnUnmute.classList.add('btn-warning');
    }

    // Fermer la boîte d'options
    closeOptionsBox();

    log('Vidéo YouTube envoyée au stadium display:', ytSelectedVideo.title);
}

// ============================================================
// RAPPORT DE MATCH - Génération, prévisualisation, téléchargement
// ============================================================

/**
 * Formate un temps en secondes en MM:SS
 * @param {number} seconds
 * @returns {string}
 */
function formatMatchTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Construit le HTML du rapport de match depuis state
 * @returns {string} HTML complet du rapport
 */
function buildReportHTML() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // Phase lisible
    const phaseLabels = {
        'first-half': '1ère Mi-Temps',
        'ht': 'Mi-Temps',
        'second-half': '2ème Mi-Temps',
        'et': 'Prolongations',
        'ft': 'Fin du Match'
    };
    const phase = phaseLabels[state.phase] || state.phase;

    // Possession
    const poss = (state.stats.possession || '50-50').split('-');
    const poss1 = poss[0] || '50';
    const poss2 = poss[1] || '50';

    // Événements triés par temps
    const events = [...(state.events || [])].sort((a, b) => (a.time || 0) - (b.time || 0));

    const getPlayer = (team, id) => {
        const players = team === 1 ? state.team1.players : state.team2.players;
        return players.find(p => p.id == id) || null;
    };

    // Construire les lignes d'événements
    const eventRows = events.map(ev => {
        const timeLabel = ev.time !== undefined ? formatMatchTime(ev.time) : '--:--';
        let icon = '', desc = '', teamName = '';

        switch (ev.type) {
            case 'goal': {
                const scorer = getPlayer(ev.team, ev.scorer);
                const assist = ev.assist ? getPlayer(ev.team, ev.assist) : null;
                teamName = ev.team === 1 ? state.team1.name : state.team2.name;
                icon = '⚽';
                desc = scorer
                    ? `But — ${scorer.name} (N°${scorer.number})${assist ? ` <small>Passe décisive : ${assist.name}</small>` : ''}`
                    : 'But';
                break;
            }
            case 'yellow': {
                const p = getPlayer(ev.team, ev.player);
                teamName = ev.team === 1 ? state.team1.name : state.team2.name;
                icon = '🟨';
                desc = p ? `Carton Jaune — ${p.name} (N°${p.number})` : 'Carton Jaune';
                break;
            }
            case 'red': {
                const p = getPlayer(ev.team, ev.player);
                teamName = ev.team === 1 ? state.team1.name : state.team2.name;
                icon = '🟥';
                desc = p ? `Carton Rouge — ${p.name} (N°${p.number})` : 'Carton Rouge';
                break;
            }
            case 'sub': {
                const out = getPlayer(ev.team, ev.out);
                const inp = getPlayer(ev.team, ev.in);
                teamName = ev.team === 1 ? state.team1.name : state.team2.name;
                icon = '🔄';
                desc = `Remplacement — <span class="rep-out">↑ ${out ? out.name : '?'}</span> / <span class="rep-in">↓ ${inp ? inp.name : '?'}</span>`;
                break;
            }
            case 'var':
                icon = '📺';
                desc = 'VAR Review';
                teamName = '';
                break;
            case 'var-result': {
                const resultMessages = {
                    'goal-confirmed': 'But validé',
                    'goal-disallowed': 'But refusé',
                    'penalty': 'Pénalty',
                    'no-change': 'Pas de changement'
                };
                icon = '📺';
                desc = `VAR — ${resultMessages[ev.result] || 'Résultat'}`;
                teamName = '';
                break;
            }
            default:
                icon = '•';
                desc = ev.type;
        }

        return `
            <tr class="event-row event-${ev.type}">
                <td class="ev-time">${timeLabel}</td>
                <td class="ev-icon">${icon}</td>
                <td class="ev-team">${teamName}</td>
                <td class="ev-desc">${desc}</td>
            </tr>`;
    }).join('') || `<tr><td colspan="4" class="no-events">Aucun événement enregistré</td></tr>`;

    // Titulaires et remplaçants
    const renderRoster = (players) => {
        const starters = players.filter(p => p.starter !== false);
        const bench = players.filter(p => p.starter === false);
        const rows = [
            ...starters.map(p => `<tr><td>${p.number}</td><td>${p.name}</td><td>${p.position || ''}</td><td class="role-tit">Titulaire</td></tr>`),
            ...bench.map(p => `<tr><td>${p.number}</td><td>${p.name}</td><td>${p.position || ''}</td><td class="role-rem">Remplaçant</td></tr>`)
        ];
        return rows.length > 0
            ? `<table class="roster-table"><tr><th>N°</th><th>Nom</th><th>Poste</th><th>Rôle</th></tr>${rows.join('')}</table>`
            : '<p class="no-data">Aucun joueur enregistré</p>';
    };

    return `
        <div class="report-doc">
            <div class="report-header">
                <div class="report-logo">🏟️</div>
                <div class="report-title-block">
                    <h1 class="report-title">RAPPORT DE MATCH</h1>
                    <p class="report-date">${dateStr} — ${timeStr}</p>
                    <p class="report-phase">${phase}</p>
                </div>
            </div>

            <!-- Résultat -->
            <div class="report-score-block">
                <div class="report-team" style="color:${state.team1.color}">
                    <span class="report-team-name">${state.team1.name}</span>
                </div>
                <div class="report-score-center">
                    <span class="report-score-num">${state.score1}</span>
                    <span class="report-score-sep">—</span>
                    <span class="report-score-num">${state.score2}</span>
                </div>
                <div class="report-team" style="color:${state.team2.color}">
                    <span class="report-team-name">${state.team2.name}</span>
                </div>
            </div>

            <!-- Statistiques -->
            <div class="report-section">
                <h2 class="report-section-title">📊 Statistiques</h2>
                <table class="stats-table">
                    <tr>
                        <td class="stat-val t1">${poss1}%</td>
                        <td class="stat-label">Possession</td>
                        <td class="stat-val t2">${poss2}%</td>
                    </tr>
                    <tr>
                        <td class="stat-val t1">${state.stats.shots[0]}</td>
                        <td class="stat-label">Tirs</td>
                        <td class="stat-val t2">${state.stats.shots[1]}</td>
                    </tr>
                    <tr>
                        <td class="stat-val t1">${state.stats.corners[0]}</td>
                        <td class="stat-label">Corners</td>
                        <td class="stat-val t2">${state.stats.corners[1]}</td>
                    </tr>
                </table>
            </div>

            <!-- Événements -->
            <div class="report-section">
                <h2 class="report-section-title">⚡ Événements du Match</h2>
                <table class="events-table">
                    <thead>
                        <tr><th>Temps</th><th></th><th>Équipe</th><th>Événement</th></tr>
                    </thead>
                    <tbody>${eventRows}</tbody>
                </table>
            </div>

            <!-- Compositions -->
            <div class="report-section report-rosters">
                <div class="roster-col">
                    <h2 class="report-section-title" style="color:${state.team1.color}">👥 ${state.team1.name}</h2>
                    ${renderRoster(state.team1.players)}
                </div>
                <div class="roster-col">
                    <h2 class="report-section-title" style="color:${state.team2.color}">👥 ${state.team2.name}</h2>
                    ${renderRoster(state.team2.players)}
                </div>
            </div>

            <div class="report-footer">
                Généré par Stadium Live Régie v2.1 — ${dateStr}
            </div>
        </div>
    `;
}

/**
 * Génère et affiche le rapport dans la prévisualisation
 */
function generateMatchReport() {
    const preview = document.getElementById('report-preview');
    const btnPDF = document.getElementById('btn-download-pdf');
    const btnWord = document.getElementById('btn-download-word');
    const btnDisplay = document.getElementById('btn-display-report');
    const btnTXT = document.getElementById('btn-download-txt');

    preview.innerHTML = buildReportHTML();
    preview.style.display = 'block';
    btnPDF.style.display = 'inline-block';
    btnWord.style.display = 'inline-block';
    btnDisplay.style.display = 'inline-block';
    btnTXT.style.display = 'inline-block';

    preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Sauvegarder automatiquement dans l'historique
    saveReportToHistory();
}

/**
 * Télécharge le rapport en PDF via une fenêtre d'impression
 */
function downloadReportPDF() {
    const reportHTML = buildReportHTML();
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport de Match — ${state.team1.name} vs ${state.team2.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #111; padding: 20px; }
        .report-doc { max-width: 800px; margin: 0 auto; }
        .report-header { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #1a1a2e; padding-bottom: 16px; margin-bottom: 20px; }
        .report-logo { font-size: 40px; }
        .report-title { font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; color: #1a1a2e; }
        .report-date, .report-phase { font-size: 13px; color: #555; margin-top: 4px; }
        .report-score-block { display: flex; align-items: center; justify-content: center; gap: 24px; background: #1a1a2e; color: white; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .report-team { flex: 1; text-align: center; }
        .report-team-name { font-size: 20px; font-weight: 800; text-transform: uppercase; }
        .report-score-center { display: flex; align-items: center; gap: 12px; }
        .report-score-num { font-size: 48px; font-weight: 900; }
        .report-score-sep { font-size: 32px; color: #aaa; }
        .report-section { margin-bottom: 24px; }
        .report-section-title { font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; border-bottom: 2px solid #eee; padding-bottom: 6px; margin-bottom: 12px; }
        .stats-table { width: 100%; border-collapse: collapse; }
        .stats-table td { padding: 8px 12px; border-bottom: 1px solid #eee; }
        .stat-label { text-align: center; font-weight: 600; color: #555; }
        .stat-val { text-align: center; font-weight: 800; font-size: 18px; width: 25%; }
        .events-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .events-table th { background: #1a1a2e; color: white; padding: 8px 10px; text-align: left; }
        .events-table td { padding: 7px 10px; border-bottom: 1px solid #eee; }
        .event-goal { background: #fffde7; }
        .event-yellow td:first-child { border-left: 4px solid #ffd700; }
        .event-red td:first-child { border-left: 4px solid #ff4444; }
        .event-sub td:first-child { border-left: 4px solid #00cc77; }
        .ev-time { font-weight: 700; font-size: 12px; color: #555; white-space: nowrap; }
        .ev-icon { font-size: 16px; width: 30px; }
        .rep-out { color: #ff4444; font-weight: 700; }
        .rep-in  { color: #00aa55; font-weight: 700; }
        .no-events { text-align: center; color: #aaa; font-style: italic; padding: 16px; }
        .report-rosters { display: flex; gap: 24px; }
        .roster-col { flex: 1; }
        .roster-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .roster-table th { background: #f5f5f5; padding: 6px 8px; text-align: left; font-size: 11px; text-transform: uppercase; }
        .roster-table td { padding: 5px 8px; border-bottom: 1px solid #eee; }
        .role-tit { color: #00aa55; font-weight: 700; }
        .role-rem { color: #6495ed; font-weight: 700; }
        .no-data { color: #aaa; font-style: italic; font-size: 12px; }
        .report-footer { margin-top: 32px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 12px; }
        @media print {
            body { padding: 10px; }
            .report-score-block { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>${reportHTML}</body>
</html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
}

/**
 * Affiche le rapport sur l'écran stadium display
 */
function displayReportOnScreen() {
    const reportHTML = buildReportHTML();
    const formattedHTML = formatReportForDisplay(reportHTML);
    
    // Stocker le rapport dans localStorage pour stadium_display
    state.report = {
        html: formattedHTML,
        timestamp: Date.now()
    };
    localStorage.setItem('stadium_match_state', JSON.stringify(state));
    
    // Envoyer un événement pour déclencher l'affichage
    const event = new Event('storage');
    event.key = 'stadium_match_state';
    event.newValue = JSON.stringify(state);
    window.dispatchEvent(event);
    
    log('Rapport envoyé à l\'écran stadium display');
}

/**
 * Ferme le rapport sur l'écran stadium display depuis control_panel
 */
function hideReportFromControl() {
    // Supprimer le rapport du state
    state.report = null;
    localStorage.setItem('stadium_match_state', JSON.stringify(state));
    
    // Envoyer un événement pour déclencher la fermeture
    const event = new Event('storage');
    event.key = 'stadium_match_state';
    event.newValue = JSON.stringify(state);
    window.dispatchEvent(event);
    
    log('Rapport fermé sur l\'écran stadium display');
}

/**
 * Télécharge le rapport en fichier texte (.txt)
 */
function downloadReportTXT() {
    const reportText = buildReportText();
    const now = new Date();
    const dateFile = now.toISOString().slice(0, 10);
    const filename = `rapport_${state.team1.name}_vs_${state.team2.name}_${dateFile}.txt`.replace(/\s+/g, '_');
    
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Sauvegarde le rapport dans IndexedDB (historique persistant)
 */
function saveReportToHistory() {
    const reportData = {
        id: Date.now(),
        timestamp: Date.now(),
        date: new Date().toISOString(),
        team1: state.team1.name,
        team2: state.team2.name,
        score1: state.team1.score,
        score2: state.team2.score,
        phase: state.gamePhase,
        stats: state.stats,
        events: state.events,
        html: buildReportHTML(),
        text: buildReportText()
    };
    
    const request = indexedDB.open('StadiumMatchDB', 1);
    
    request.onerror = () => {
        console.error('Erreur lors de l\'ouverture de IndexedDB');
    };
    
    request.onsuccess = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('reports')) {
            const objectStore = db.createObjectStore('reports', { keyPath: 'id' });
            objectStore.createIndex('date', 'date', { unique: false });
        }
        
        const transaction = db.transaction(['reports'], 'readwrite');
        const objectStore = transaction.objectStore('reports');
        
        const addRequest = objectStore.add(reportData);
        
        addRequest.onsuccess = () => {
            console.log('Rapport sauvegardé dans l\'historique');
            loadReportHistory();
        };
        
        addRequest.onerror = () => {
            console.error('Erreur lors de la sauvegarde');
        };
    };
    
    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('reports')) {
            const objectStore = db.createObjectStore('reports', { keyPath: 'id' });
            objectStore.createIndex('date', 'date', { unique: false });
        }
    };
}

/**
 * Charge l'historique des rapports depuis IndexedDB
 */
function loadReportHistory() {
    const request = indexedDB.open('StadiumMatchDB', 1);
    
    request.onsuccess = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('reports')) {
            displayReportHistory([]);
            return;
        }
        
        const transaction = db.transaction(['reports'], 'readonly');
        const objectStore = transaction.objectStore('reports');
        const getAllRequest = objectStore.getAll();
        
        getAllRequest.onsuccess = () => {
            const reports = getAllRequest.result.sort((a, b) => b.timestamp - a.timestamp);
            displayReportHistory(reports);
        };
    };
    
    request.onerror = () => {
        console.error('Erreur lors du chargement de l\'historique');
        displayReportHistory([]);
    };
}

/**
 * Affiche l'historique des rapports dans l'interface
 */
function displayReportHistory(reports) {
    const historyContainer = document.getElementById('report-history');
    if (!historyContainer) return;
    
    if (reports.length === 0) {
        historyContainer.innerHTML = '<p class="no-events">Aucun rapport dans l\'historique</p>';
        return;
    }
    
    let html = '<div class="report-history-list">';
    
    reports.forEach(report => {
        const date = new Date(report.date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        html += `
            <div class="report-history-item">
                <div class="report-history-info">
                    <strong>${report.team1} ${report.score1} - ${report.score2} ${report.team2}</strong>
                    <span class="report-history-date">${date}</span>
                </div>
                <div class="report-history-actions">
                    <button class="btn btn-sm btn-info" onclick="viewReport(${report.id})">👁️ Voir</button>
                    <button class="btn btn-sm btn-success" onclick="downloadReportFromHistory(${report.id}, 'pdf')">📄 PDF</button>
                    <button class="btn btn-sm btn-primary" onclick="downloadReportFromHistory(${report.id}, 'word')">📝 Word</button>
                    <button class="btn btn-sm btn-secondary" onclick="downloadReportFromHistory(${report.id}, 'txt')">📃 TXT</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteReport(${report.id})">🗑️</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    historyContainer.innerHTML = html;
}

/**
 * Affiche un rapport depuis l'historique
 */
function viewReport(reportId) {
    const request = indexedDB.open('StadiumMatchDB', 1);
    
    request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['reports'], 'readonly');
        const objectStore = transaction.objectStore('reports');
        const getRequest = objectStore.get(reportId);
        
        getRequest.onsuccess = () => {
            const report = getRequest.result;
            if (report) {
                const preview = document.getElementById('report-preview');
                preview.innerHTML = report.html;
                preview.style.display = 'block';
                preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        };
    };
}

/**
 * Télécharge un rapport depuis l'historique
 */
function downloadReportFromHistory(reportId, format) {
    const request = indexedDB.open('StadiumMatchDB', 1);
    
    request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['reports'], 'readonly');
        const objectStore = transaction.objectStore('reports');
        const getRequest = objectStore.get(reportId);
        
        getRequest.onsuccess = () => {
            const report = getRequest.result;
            if (report) {
                if (format === 'pdf') {
                    const win = window.open('', '_blank');
                    win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport de Match — ${report.team1} vs ${report.team2}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #111; padding: 20px; }
        .report-doc { max-width: 800px; margin: 0 auto; }
        .report-header { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #1a1a2e; padding-bottom: 16px; margin-bottom: 20px; }
        .report-logo { font-size: 40px; }
        .report-title { font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; color: #1a1a2e; }
        .report-date { font-size: 13px; color: #555; margin-top: 4px; }
        .report-score-block { display: flex; align-items: center; justify-content: center; gap: 24px; background: #1a1a2e; color: white; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .report-team { flex: 1; text-align: center; }
        .report-team-name { font-size: 20px; font-weight: 800; text-transform: uppercase; }
        .report-score-center { display: flex; align-items: center; gap: 12px; }
        .report-score-num { font-size: 48px; font-weight: 900; }
        .report-score-sep { font-size: 32px; color: #aaa; }
        .report-section { margin-bottom: 24px; }
        .report-section-title { font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; border-bottom: 2px solid #eee; padding-bottom: 6px; margin-bottom: 12px; }
        .stats-table { width: 100%; border-collapse: collapse; }
        .stats-table td { padding: 8px 12px; border-bottom: 1px solid #eee; }
        .stat-label { text-align: center; font-weight: 600; color: #555; }
        .stat-val { text-align: center; font-weight: 800; font-size: 18px; width: 25%; }
        .events-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .events-table th { background: #1a1a2e; color: white; padding: 8px 10px; text-align: left; }
        .events-table td { padding: 7px 10px; border-bottom: 1px solid #eee; }
        .event-goal { background: #fffde7; }
        .event-yellow td:first-child { border-left: 4px solid #ffd700; }
        .event-red td:first-child { border-left: 4px solid #ff4444; }
        .event-sub td:first-child { border-left: 4px solid #00cc77; }
        .ev-time { font-weight: 700; font-size: 12px; color: #555; white-space: nowrap; }
        .ev-icon { font-size: 16px; width: 30px; }
        .no-events { text-align: center; color: #aaa; font-style: italic; padding: 16px; }
        .report-footer { margin-top: 32px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 12px; }
        @media print {
            body { padding: 10px; }
            .report-score-block { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>${report.html}</body>
</html>`);
                    win.document.close();
                    setTimeout(() => { win.print(); }, 500);
                } else if (format === 'word') {
                    const wordHTML = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="UTF-8">
    <title>Rapport de Match</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; }
        .report-doc { max-width: 800px; margin: 0 auto; }
        .report-header { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #1a1a2e; padding-bottom: 16px; margin-bottom: 20px; }
        .report-logo { font-size: 40px; }
        .report-title { font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; color: #1a1a2e; }
        .report-score-block { display: flex; align-items: center; justify-content: center; gap: 24px; background: #1a1a2e; color: white; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .report-team { flex: 1; text-align: center; }
        .report-team-name { font-size: 20px; font-weight: 800; text-transform: uppercase; }
        .report-score-center { display: flex; align-items: center; gap: 12px; }
        .report-score-num { font-size: 48px; font-weight: 900; }
        .report-section { margin-bottom: 24px; }
        .report-section-title { font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; border-bottom: 2px solid #eee; padding-bottom: 6px; margin-bottom: 12px; }
        .stats-table { width: 100%; border-collapse: collapse; }
        .stats-table td { padding: 8px 12px; border-bottom: 1px solid #eee; }
        .stat-label { text-align: center; font-weight: 600; color: #555; }
        .stat-val { text-align: center; font-weight: 800; font-size: 18px; width: 25%; }
        .events-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .events-table th { background: #1a1a2e; color: white; padding: 8px 10px; text-align: left; }
        .events-table td { padding: 7px 10px; border-bottom: 1px solid #eee; }
        .event-goal { background: #fffde7; }
        .event-yellow td:first-child { border-left: 4px solid #ffd700; }
        .event-red td:first-child { border-left: 4px solid #ff4444; }
        .event-sub td:first-child { border-left: 4px solid #00cc77; }
        .ev-time { font-weight: 700; font-size: 12px; color: #555; white-space: nowrap; }
        .ev-icon { font-size: 16px; width: 30px; }
        .no-events { text-align: center; color: #aaa; font-style: italic; padding: 16px; }
        .report-footer { margin-top: 32px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 12px; }
    </style>
</head>
<body>${report.html}</body>
</html>`;
                    
                    const dateFile = new Date(report.date).toISOString().slice(0, 10);
                    const filename = `rapport_${report.team1}_vs_${report.team2}_${dateFile}.doc`.replace(/\s+/g, '_');
                    
                    const blob = new Blob(['\ufeff', wordHTML], { type: 'application/msword' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } else if (format === 'txt') {
                    const dateFile = new Date(report.date).toISOString().slice(0, 10);
                    const filename = `rapport_${report.team1}_vs_${report.team2}_${dateFile}.txt`.replace(/\s+/g, '_');
                    
                    const blob = new Blob([report.text], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            }
        };
    };
}

/**
 * Supprime un rapport de l'historique
 */
function deleteReport(reportId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rapport?')) return;
    
    const request = indexedDB.open('StadiumMatchDB', 1);
    
    request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['reports'], 'readwrite');
        const objectStore = transaction.objectStore('reports');
        
        const deleteRequest = objectStore.delete(reportId);
        
        deleteRequest.onsuccess = () => {
            console.log('Rapport supprimé');
            loadReportHistory();
        };
    };
}

/**
 * Envoie le rapport au serveur
 */
function sendReportToServer() {
    const serverUrl = document.getElementById('server-url').value;

    if (!serverUrl) {
        alert('Veuillez entrer l\'URL du serveur');
        return;
    }

    const reportData = {
        timestamp: Date.now(),
        date: new Date().toISOString(),
        team1: state.team1.name,
        team2: state.team2.name,
        score1: state.team1.score,
        score2: state.team2.score,
        phase: state.gamePhase,
        stats: state.stats,
        events: state.events,
        html: buildReportHTML()
    };

    fetch(serverUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
    })
    .then(response => {
        if (response.ok) {
            alert('Rapport envoyé au serveur avec succès!');
        } else {
            alert('Erreur lors de l\'envoi au serveur');
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    });
}

// ============================================================
// DIFFUSION D'ÉCRAN - Partage par lien et WebRTC
// ============================================================
let screenShareStream = null;
let screenShareConnection = null;

/**
 * Initialise l'URL de stadium_display
 */
function initDisplayUrl() {
    const urlInput = document.getElementById('stadium-display-url');
    if (urlInput) {
        const currentUrl = window.location.href;
        const displayUrl = currentUrl.replace('control_panel.html', 'stadium_display.html');
        urlInput.value = displayUrl;
    }
}

/**
 * Copie l'URL de stadium_display dans le presse-papier
 */
function copyDisplayUrl() {
    const urlInput = document.getElementById('stadium-display-url');
    if (urlInput && urlInput.value) {
        urlInput.select();
        urlInput.setSelectionRange(0, 99999);
        
        try {
            navigator.clipboard.writeText(urlInput.value).then(() => {
                alert('Lien copié dans le presse-papier!');
            }).catch(err => {
                // Fallback pour les navigateurs plus anciens
                document.execCommand('copy');
                alert('Lien copié dans le presse-papier!');
            });
        } catch (err) {
            console.error('Erreur lors de la copie:', err);
            alert('Erreur lors de la copie du lien');
        }
    }
}

/**
 * Génère un QR code pour l'URL de stadium_display
 */
function generateQRCode() {
    const urlInput = document.getElementById('stadium-display-url');
    const qrContainer = document.getElementById('qr-code-container');
    const qrCodeDiv = document.getElementById('qr-code');
    
    if (!urlInput || !urlInput.value) {
        alert('URL non disponible');
        return;
    }
    
    // Nettoyer le QR code existant
    qrCodeDiv.innerHTML = '';
    
    // Utiliser une API de service QR Code externe (plus fiable)
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlInput.value)}`;
    
    const img = document.createElement('img');
    img.src = apiUrl;
    img.alt = 'QR Code';
    img.style.width = '200px';
    img.style.height = '200px';
    img.style.borderRadius = '8px';
    
    img.onload = () => {
        qrCodeDiv.appendChild(img);
        qrContainer.style.display = 'block';
    };
    
    img.onerror = () => {
        console.error('Erreur lors du chargement de l\'image QR Code');
        alert('Erreur lors de la génération du QR code');
    };
}

/**
 * Démarre le partage d'écran via WebRTC
 */
function startScreenShare() {
    const statusDiv = document.getElementById('share-status');
    const startBtn = document.getElementById('btn-start-share');
    const stopBtn = document.getElementById('btn-stop-share');
    
    // Vérifier si le navigateur supporte le partage d'écran
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        statusDiv.textContent = '❌ Votre navigateur ne supporte pas le partage d\'écran';
        statusDiv.style.color = '#ff4444';
        return;
    }
    
    statusDiv.textContent = '⏳ Sélectionnez l\'écran à partager...';
    statusDiv.style.color = '#00ff88';
    
    // Demander à l'utilisateur de sélectionner l'écran
    navigator.mediaDevices.getDisplayMedia({
        video: {
            cursor: 'always'
        },
        audio: false
    })
    .then(stream => {
        screenShareStream = stream;
        
        // Afficher le flux dans une vidéo cachée pour le traitement
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.style.display = 'none';
        document.body.appendChild(video);
        
        statusDiv.textContent = '✅ Partage d\'écran actif - Les autres peuvent voir votre écran';
        statusDiv.style.color = '#00ff88';
        
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';
        
        // Gérer l'arrêt du partage par l'utilisateur
        stream.getVideoTracks()[0].onended = () => {
            stopScreenShare();
        };
        
        log('Partage d\'écran démarré');
    })
    .catch(err => {
        console.error('Erreur lors du partage d\'écran:', err);
        if (err.name === 'NotAllowedError') {
            statusDiv.textContent = '❌ Partage d\'écran annulé par l\'utilisateur';
        } else {
            statusDiv.textContent = '❌ Erreur lors du partage d\'écran: ' + err.message;
        }
        statusDiv.style.color = '#ff4444';
    });
}

/**
 * Arrête le partage d'écran
 */
function stopScreenShare() {
    const statusDiv = document.getElementById('share-status');
    const startBtn = document.getElementById('btn-start-share');
    const stopBtn = document.getElementById('btn-stop-share');
    
    if (screenShareStream) {
        // Arrêter toutes les pistes
        screenShareStream.getTracks().forEach(track => {
            track.stop();
        });
        
        screenShareStream = null;
    }
    
    statusDiv.textContent = '⏹️ Partage d\'écran arrêté';
    statusDiv.style.color = 'rgba(255,255,255,0.7)';
    
    startBtn.style.display = 'inline-block';
    stopBtn.style.display = 'none';
    
    log('Partage d\'écran arrêté');
}

/**
 * Construit le rapport en format texte brut
 */
function buildReportText() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    let text = `═══════════════════════════════════════════════════════════════\n`;
    text += `                    RAPPORT DE MATCH\n`;
    text += `═══════════════════════════════════════════════════════════════\n\n`;
    text += `Date: ${dateStr} à ${timeStr}\n`;
    text += `Phase: ${state.gamePhase || 'Non définie'}\n\n`;
    
    text += `═══════════════════════════════════════════════════════════════\n`;
    text += `                        SCORE FINAL\n`;
    text += `═══════════════════════════════════════════════════════════════\n\n`;
    text += `${state.team1.name.toUpperCase()}  ${state.team1.score}  -  ${state.team2.score}  ${state.team2.name.toUpperCase()}\n\n`;
    
    text += `═══════════════════════════════════════════════════════════════\n`;
    text += `                      STATISTIQUES\n`;
    text += `═══════════════════════════════════════════════════════════════\n\n`;
    text += `Possession: ${state.stats.possession1}% - ${state.stats.possession2}%\n`;
    text += `Tirs: ${state.stats.shots1} - ${state.stats.shots2}\n`;
    text += `Corners: ${state.stats.corners1} - ${state.stats.corners2}\n\n`;
    
    text += `═══════════════════════════════════════════════════════════════\n`;
    text += `                      ÉVÉNEMENTS\n`;
    text += `═══════════════════════════════════════════════════════════════\n\n`;
    
    if (state.events && state.events.length > 0) {
        state.events.forEach(event => {
            const teamName = event.team === 1 ? state.team1.name : state.team2.name;
            text += `[${event.minute}'] ${teamName} - ${event.type}\n`;
            if (event.scorer) text += `  Joueur: ${event.scorer}\n`;
            if (event.assister) text += `  Passe: ${event.assister}\n`;
            text += `\n`;
        });
    } else {
        text += `Aucun événement enregistré\n\n`;
    }
    
    text += `═══════════════════════════════════════════════════════════════\n`;
    text += `                    Généré par Stadium Live Régie v2.1\n`;
    text += `═══════════════════════════════════════════════════════════════\n`;
    
    return text;
}

/**
 * Formate le rapport HTML pour l'affichage sur stadium display
 */
function formatReportForDisplay(html) {
    // Convertir le rapport en sections pour l'affichage
    let formatted = '';
    
    // En-tête
    formatted += '<div class="report-section">';
    formatted += '<h3>📊 Score Final</h3>';
    formatted += `<p><strong>${state.team1.name}</strong> ${state.team1.score} - ${state.team2.score} <strong>${state.team2.name}</strong></p>`;
    formatted += '</div>';
    
    // Statistiques
    formatted += '<div class="report-section">';
    formatted += '<h3>📈 Statistiques</h3>';
    formatted += `<p>Possession: ${state.stats.possession1}% - ${state.stats.possession2}%</p>`;
    formatted += `<p>Tirs: ${state.stats.shots1} - ${state.stats.shots2}</p>`;
    formatted += `<p>Corners: ${state.stats.corners1} - ${state.stats.corners2}</p>`;
    formatted += '</div>';
    
    // Événements
    formatted += '<div class="report-section">';
    formatted += '<h3>⚽ Événements</h3>';
    if (state.events && state.events.length > 0) {
        state.events.forEach(event => {
            const teamName = event.team === 1 ? state.team1.name : state.team2.name;
            const icon = getEventIcon(event.type);
            formatted += `<p>${icon} [${event.minute}'] ${teamName} - ${event.type}`;
            if (event.scorer) formatted += ` (${event.scorer})`;
            formatted += '</p>';
        });
    } else {
        formatted += '<p>Aucun événement enregistré</p>';
    }
    formatted += '</div>';
    
    return formatted;
}

/**
 * Retourne l'icône correspondant au type d'événement
 */
function getEventIcon(type) {
    const icons = {
        'goal': '⚽',
        'yellow-card': '🟨',
        'red-card': '🟥',
        'substitution': '🔄'
    };
    return icons[type] || '📋';
}

/**
 * Télécharge le rapport en fichier Word (.doc)
 */
function downloadReportWord() {
    const reportHTML = buildReportHTML();
    const now = new Date();
    const dateFile = now.toISOString().slice(0, 10);
    const filename = `rapport_${state.team1.name}_vs_${state.team2.name}_${dateFile}.doc`.replace(/\s+/g, '_');

    const wordHTML = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="UTF-8">
    <title>Rapport de Match</title>
    <!--[if gte mso 9]>
    <xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml>
    <![endif]-->
    <style>
        body { font-family: 'Calibri', Arial, sans-serif; margin: 40px; color: #111; }
        h1 { font-size: 24pt; text-transform: uppercase; letter-spacing: 3px; color: #1a1a2e; }
        h2 { font-size: 14pt; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; border-bottom: 2px solid #ccc; padding-bottom: 4px; margin: 20px 0 10px; }
        .report-score-block { background: #1a1a2e; color: white; padding: 20px; margin: 20px 0; text-align: center; }
        .report-score-num { font-size: 36pt; font-weight: bold; }
        .report-team-name { font-size: 18pt; font-weight: bold; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11pt; }
        th { background: #1a1a2e; color: white; padding: 8px; text-align: left; }
        td { padding: 6px 8px; border-bottom: 1px solid #ddd; }
        .role-tit { color: #007744; font-weight: bold; }
        .role-rem { color: #4455aa; font-weight: bold; }
        .rep-out { color: #cc0000; font-weight: bold; }
        .rep-in  { color: #007744; font-weight: bold; }
        .ev-time { font-weight: bold; color: #555; }
        .report-footer { margin-top: 40px; text-align: center; font-size: 9pt; color: #aaa; border-top: 1px solid #eee; padding-top: 10px; }
    </style>
</head>
<body>${reportHTML}</body>
</html>`;

    const blob = new Blob(['\ufeff', wordHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
