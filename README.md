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
├── prefs.js               # Fenêtre de préférences Libadwaita (Adw.PreferencesWindow)
├── stylesheet.css         # Styles CSS personnalisés pour le panel et les widgets
├── icone/                 # Ressources graphiques et icônes (logo Arrera Blue)
│   └── arrera-logo.svg
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
Vous pouvez configurer les options soit via l'interface graphique :
```bash
gnome-extensions prefs top-bar@linux.arrera-software.fr
```
Ou directement dans le terminal avec le script interactif :
```bash
./settings.sh
```

---

## ⚙️ Paramètres
Aucun paramètre pour le moment. L'extension applique directement le remplacement du bouton Activités par le logo Arrera Blue.

---

## 📄 Licence
GPL-2.0-or-later
