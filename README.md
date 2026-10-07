# Arrera Top Bar

Extension GNOME Shell moderne pour personnaliser et contrôler la barre supérieure (Panel).  
Conçue pour la distribution **Arrera Blue** et compatible avec GNOME Shell 45 à 50+ (architecture ESM moderne).

---

## 📁 Structure du projet

```
top-bar@linux.arrera-software.fr/
├── metadata.json          # Métadonnées GNOME Shell (UUID, versions compatibles, schéma)
├── extension.js           # Point d'entrée de l'extension (cycle de vie enable / disable)
├── topBar.js              # Contrôleur principal et gestionnaire des éléments de la barre
├── stylesheet.css         # Styles CSS personnalisés pour le panel et les widgets
├── icone/                 # Ressources graphiques et icônes (logo Arrera Blue)
├── schemas/               # Définitions GSettings
│   └── org.gnome.shell.extensions.top-bar.gschema.xml
├── compile_schemas.sh     # Script de compilation des schémas GSettings
├── settings.sh            # Utilitaire CLI interactif pour configurer l'extension
├── lauch_dev.sh           # Script pour tester l'extension dans une session GNOME Shell imbriquée
├── .gitignore             # Fichiers et dossiers ignorés par git
└── README.md              # Documentation du projet
```

---

## 🚀 Démarrage rapide

### 1. Compiler les schémas GSettings
Avant d'activer l'extension, compilez les schémas locaux et enregistrez-les pour votre utilisateur :
```bash
./compile_schemas.sh
```

### 2. Tester en mode développement
Pour lancer une session GNOME Shell isolée (nested / devkit) sans redémarrer votre session principale :
```bash
./lauch_dev.sh
```

### 3. Configurer l'extension
Configurez les options directement dans le terminal avec le script interactif :
```bash
./settings.sh
```

---

- **Thèmes de la barre supérieure (`theme`)** :
  - `vanilla` *(par défaut)* : Conserve le style et l'apparence native de GNOME Shell.
  - `invisible` : Désactive le fond noir de la barre (panneau transparent) tout en maintenant visibles l'horloge, les paramètres rapides, le logo Arrera et le bouton Activités.
  - `tinted-dark` : Fond sombre teinté translucide moderne.
  - `tinted-light` : Fond clair teinté translucide avec contraste automatique du texte, des icônes et des indicateurs d'espaces de travail.
- **Couleur des éléments en mode invisible (`invisible-elements-color`)** :
  - `auto` *(par défaut)* : Détecte automatiquement la luminosité de la bande supérieure du fond d'écran pour adapter la couleur des textes, icônes et boutons (sombre sur fond clair, clair sur fond sombre).
  - `white` : Force les éléments en blanc avec une ombre protectrice de sécurité.
  - `black` : Force les éléments en noir.
- **Masquage total de la barre supérieure (`hide-top-bar`)** :
  - `false` *(par défaut)* : Affichage normal de la barre supérieure.
  - `true` : Masque complètement le panneau supérieur et ses éléments natifs (date, paramètres rapides, logo Arrera), libère la zone d'écran pour permettre aux applications maximisées d'occuper 100% de la hauteur de l'écran (suppression des *struts* GNOME), et affiche la zone AppIndicator sous forme d'une élégante petite pilule noire flottante sur le bureau (qui s'efface automatiquement lorsqu'une fenêtre est maximisée ou en plein écran pour libérer l'accès aux boutons de contrôle de la fenêtre).
- **Position des indicateurs d'applications (`appindicator-position`)** :
  - `right` *(par défaut)* : Positionne les icônes de la zone de notification (AppIndicator) à droite du panneau supérieur.
  - `left` : Positionne les icônes de notification à gauche, immédiatement après le logo Arrera Blue.
- **Remplacement du bouton Activités** : Logo officiel Arrera Blue à la place du bouton natif.
- **Paramètre GSettings `logo-color`** (`org.gnome.shell.extensions.top-bar`) :
  - `colored` *(par défaut)* : S'adapte dynamiquement à la couleur d'accentuation de GNOME (`org.gnome.desktop.interface accent-color`).
  - `white` : Affiche le logo en blanc.
  - `black` : Affiche le logo en noir.
- **Lancement d'une application personnalisée au clic** :
  - `launch-custom-app` : Active le lancement direct d'une application au lieu d'ouvrir les Activités (`false` par défaut).
  - `custom-app-id` : Identifiant `.desktop` (ex: `ptyxis`, `org.gnome.Nautilus.desktop`) ou commande à exécuter.
  - `keep-activities-button` : Affiche le bouton natif Activités de GNOME (indicateur d'espaces de travail) à droite du logo Arrera Blue pour conserver l'accès à l'Overview (`false` par défaut).
- Configurable via `./settings.sh` ou en ligne de commande avec `gsettings`.

---

## 📄 Licence
GPL-2.0-or-later
