# 🏟️ Scor-Set - Système d'Affichage de Scores pour Stade

**Version:** 2.1  
**Développeur:** Kossi Victoire Azonoutsou (SamvicDev)  
**Licence:** Open Source

---

## 📋 Table des Matières

- [Description](#description)
- [Fonctionnalités](#fonctionnalités)
- [Captures d'écran](#captures-d'écran)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Guide de Démarrage](#guide-de-démarrage)
- [Fonctionnalités Online vs Offline](#fonctionnalités-online-vs-offline)
- [Support et Contact](#support-et-contact)
- [Contribution](#contribution)
- [Licence](#licence)

---

## 🎯 Description

**Scor-Set** est un système d'affichage de scores pour stade qui permet de gérer en temps réel les matchs de football. Il se compose de deux interfaces principales :

- **Panneau de Contrôle** : Interface pour gérer le match, les équipes, les joueurs et les événements
- **Affichage Stade** : Interface grand écran pour afficher les informations du match aux spectateurs

L'application fonctionne principalement hors ligne, ce qui la rend idéale pour les stades avec connexion internet limitée.

---

## ✨ Fonctionnalités

### ⚽ Gestion du Match
- **Score en temps réel** : Ajout et retrait de buts pour chaque équipe
- **Chronomètre avancé** : Gestion du temps avec phases (1ère période, mi-temps, 2ème période, prolongations, fin de match)
- **Temps additionnel** : Configuration du temps additionnel
- **Phases de jeu** : Transition automatique entre les périodes

### 👥 Gestion des Équipes
- **Configuration des équipes** : Noms, couleurs, logos
- **Effectifs complets** : Gestion des joueurs avec numéros, postes, photos
- **Titulaires et remplaçants** : Séparation automatique
- **Photos des joueurs** : Upload et affichage des photos

### 🟨🟥 Discipline
- **Cartons jaunes** : Enregistrement avec détails du joueur et du temps
- **Cartons rouges** : Enregistrement avec détails du joueur et du temps
- **Historique** : Affichage des cartons par joueur et par équipe

### 🔄 Remplacements
- **Gestion des entrées/sorties** : Interface intuitive pour les remplacements
- **Historique** : Suivi de tous les remplacements du match

### 📺 VAR (Video Assistant Referee)
- **Affichage VAR** : Modal de vérification en cours
- **Résultats VAR** : 
  - ⚽ But validé
  - ❌ But refusé
  - 🥅 Pénalty
  - ↩️ Pas de changement

### 🎨 Personnalisation
- **Thèmes multiples** : Dark, Light, Blue, Green
- **Couleurs personnalisées** : Score, chronomètre, équipes
- **Logos d'équipes** : Upload et affichage des logos

### 📋 Rapports
- **Génération automatique** : Rapports complets du match
- **Formats multiples** : PDF, Word, TXT
- **Historique** : Sauvegarde des rapports précédents
- **Envoi au serveur** : Option pour envoyer les rapports à un serveur distant

### 🎬 Multimédia
- **Recherche YouTube** : Intégration de vidéos
- **Affichage sur stade** : Diffusion des vidéos sur l'écran stade
- **Partage d'écran** : Diffusion en temps réel

### 📡 Partage
- **QR Code** : Génération de QR codes pour partager l'affichage
- **Lien direct** : Copie du lien de l'affichage stade

### ❓ Aide et Support
- **Guide de démarrage** : Modal d'aide au premier lancement
- **Aide multilingue** : Français, Anglais, Espagnol, Allemand, Portugais
- **Contact** : Liens vers les réseaux sociaux du développeur
- **Partenaires** : Informations sur les partenaires de formation

---

## 📸 Captures d'écran

*(Ajoutez des captures d'écran ici pour montrer l'interface)*

---

## 🔧 Prérequis

### Logiciels requis
- **Python 3.x** : Pour le serveur local
- **Navigateur web moderne** : Chrome, Firefox, Edge, Safari

### Configuration système
- **OS** : Windows, macOS, Linux
- **RAM** : 4 GB minimum recommandé
- **Espace disque** : 100 MB pour l'application complète

---

## 🚀 Installation

### Étape 1 : Téléchargement
1. Téléchargez le dossier `SCORE SET`
2. Extrayez-le dans un dossier de votre choix

### Étape 2 : Installation de Python
1. Téléchargez Python depuis [python.org](https://www.python.org/downloads/)
2. **Important** : Cochez la case "Add Python to PATH" pendant l'installation
3. Vérifiez l'installation en ouvrant un terminal et tapant :
   ```bash
   python --version
   ```

### Étape 3 : Lancement
1. Double-cliquez sur `START_SERVER.bat`
2. Le serveur démarrera automatiquement sur le port 8181
3. Le panneau de contrôle s'ouvrira dans votre navigateur
4. L'affichage stade sera disponible dans un nouvel onglet

### Lancement manuel (alternative)
```bash
cd "C:\Users\ADN\Desktop\MAN\SCORE SET"
python server.py
```

---

## 💻 Utilisation

### Première utilisation
1. Au premier lancement, un **guide de démarrage** s'affichera
2. Lisez attentivement les informations sur les fonctionnalités online/offline
3. Cochez "Ne plus afficher ce guide" si vous ne voulez plus le voir

### Configuration initiale
1. **Configurez les équipes** :
   - Nom des équipes (Domicile/Extérieur)
   - Couleurs des équipes
   - Logos des équipes (optionnel)

2. **Ajoutez les joueurs** :
   - Sélectionnez l'équipe (Domicile ou Extérieur)
   - Ajoutez les joueurs avec : Numéro, Nom, Poste
   - Choisissez s'ils sont titulaires ou remplaçants
   - Ajoutez leurs photos (optionnel)

3. **Sauvegardez la configuration** :
   - Cliquez sur "💾 Sauvegarder"

### Gestion d'un match
1. **Démarrez le chronomètre** : Cliquez sur "▶️ Start"
2. **Gérez le score** : Utilisez les boutons "+1" ou "-1" pour chaque équipe
3. **Enregistrez les événements** :
   - **Buts** : Sélectionnez l'équipe et le buteur
   - **Cartons** : Sélectionnez l'équipe et le joueur
   - **Remplacements** : Sélectionnez le joueur sortant et entrant
   - **VAR** : Cliquez sur "📺 VAR Review" puis sur le résultat

4. **Changez de phase** :
   - 1ère Période → Mi-Temps → 2ème Période → Prolongations → Fin Match

### Options avancées
Cliquez sur "⚙️ Options Avancées" pour accéder à :
- **Recherche YouTube** : Trouvez et affichez des vidéos
- **Rapports de match** : Générez et téléchargez des rapports
- **Diffusion d'écran** : Partagez l'affichage
- **Aide & Contact** : Accédez à l'aide complète et aux contacts

---

## 📖 Guide de Démarrage

### Fonctionnalités nécessitant INTERNET 🌐
- 🎬 **Recherche YouTube** : Pour rechercher et afficher des vidéos
- 🔗 **Réseaux sociaux** : Liens vers LinkedIn, Facebook, TikTok
- 📡 **Partage d'écran** : Pour diffuser en temps réel
- ☁️ **Envoi au serveur** : Pour sauvegarder les rapports sur un serveur distant
- 📱 **QR Code** : Pour générer des codes QR de partage

### Fonctionnalités HORS LIGNE 📴
- ⚽ **Gestion du score** : Ajout/retrait de buts
- ⏱️ **Chronomètre** : Gestion du temps du match
- 👥 **Effectifs** : Gestion des joueurs, numéros, postes
- 🟨🟥 **Discipline** : Cartons jaunes et rouges
- 🔄 **Remplacements** : Gestion des entrées/sorties
- 📺 **VAR** : Affichage des vérifications VAR
- 🎨 **Thèmes** : Personnalisation de l'affichage
- 🖼️ **Logos** : Ajout des logos des équipes (stockage local)
- 📋 **Rapports** : Génération de rapports PDF, Word, TXT
- 💾 **Sauvegarde** : Stockage automatique dans localStorage

### 💡 Conseils d'utilisation
- Configurez les équipes avant de commencer le match
- Sauvegardez régulièrement votre configuration
- Utilisez le bouton "Réinitialiser le Match" entre deux matchs
- Ouvrez l'affichage stade dans un nouvel onglet pour un meilleur contrôle
- Pour l'aide complète, allez dans "Options Avancées" → "Aide & Contact"

---

## 🌐 Fonctionnalités Online vs Offline

### Architecture de l'application
Scor-Set est conçu pour fonctionner principalement hors ligne, ce qui le rend idéal pour les environnements stade où la connexion internet peut être limitée.

### Stockage local
- **localStorage** : Toutes les données sont sauvegardées localement dans le navigateur
- **IndexedDB** : Pour les fichiers volumineux (logos, photos)
- **Pas de dépendance cloud** : L'application fonctionne entièrement sans serveur externe

### Quand internet est nécessaire
Seules les fonctionnalités suivantes nécessitent une connexion internet :
- Recherche et affichage de vidéos YouTube
- Accès aux liens de réseaux sociaux
- Partage d'écran en temps réel
- Envoi de rapports à un serveur distant
- Génération de QR codes (API externe)

### Mode hors ligne complet
Pour une utilisation 100% hors ligne :
- Évitez d'utiliser les fonctionnalités YouTube
- N'utilisez pas le partage d'écran
- Sauvegardez les rapports localement (PDF, Word, TXT)

---

## 📞 Support et Contact

### Développeur
- **Nom** : Kossi Victoire Azonoutsou
- **Pseudo** : SamvicDev
- **LinkedIn** : [www.linkedin.com/in/kossi-victoire-azonoutsou](https://www.linkedin.com/in/kossi-victoire-azonoutsou)
- **Facebook** : [www.facebook.com/kossi.victoire.azonoutsou](https://www.facebook.com/kossi.victoire.azonoutsou)
- **TikTok** : [@samvicdev](https://www.tiktok.com/@samvicdev)

### Partenaires de formation
- **Koffi Brice Aly** : [LinkedIn](https://www.linkedin.com/in/koffi-brice-aly-933bab353/)
- **Simplon.co** : [LinkedIn](https://www.linkedin.com/search/results/all/?keywords=Simplon.co&origin=RICH_QUERY_TYPEAHEAD_HISTORY&heroEntityKey=urn%3Ali%3Aorganization%3A3148332&position=0)
- **ADN Golfe** : [LinkedIn](https://www.linkedin.com/company/adn-golfe1/posts/?feedView=all)
- **Abdou Akim Gbadamassi** : [LinkedIn](https://www.linkedin.com/in/abdou-akim-gbadamassi-70373a183/)

### Rejoindre l'équipe
Nous sommes toujours à la recherche de talents passionnés par la technologie et le développement web. Contactez-nous via LinkedIn pour les opportunités de collaboration et de recrutement.

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Si vous souhaitez améliorer Scor-Set :

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Idées d'amélioration
- [ ] Ajouter plus de langues pour l'aide
- [ ] Intégrer plus de sports (basketball, handball, etc.)
- [ ] Ajouter des statistiques avancées
- [ ] Créer une application mobile
- [ ] Système de sauvegarde cloud

---

## 📄 Licence

Ce projet est sous licence Open Source. Vous êtes libre de l'utiliser, de le modifier et de le distribuer.

---

## 🙏 Remerciements

Un grand merci à :
- **Simplon.co** pour la formation
- **ADN Golfe** pour le soutien
- **Koffi Brice Aly** et **Abdou Akim Gbadamassi** pour leur collaboration

---

## 📝 Notes de Version

### Version 2.1 (Actuelle)
- ✅ Ajout des résultats VAR
- ✅ Guide de démarrage au premier lancement
- ✅ Section Aide & Contact multilingue
- ✅ Section Rejoindre l'équipe
- ✅ Amélioration de l'interface utilisateur

### Version 2.0
- ✅ Refonte complète de l'interface
- ✅ Ajout des thèmes
- ✅ Système de rapports
- ✅ Intégration YouTube

### Version 1.0
- ✅ Version initiale
- ✅ Gestion basique des scores
- ✅ Chronomètre
- ✅ Gestion des équipes

---

**Développé avec ❤️ par SamvicDev**
