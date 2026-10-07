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

## ⚙️ Paramètres & Fonctionnalités
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
