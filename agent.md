# Guide d'intégration et d'architecture pour Agents d'IA - Arrera Top Bar

Ce document sert de guide de référence complet et autonome pour tout agent d'IA ou développeur intervenant sur le projet **Arrera Top Bar**. Il détaille l'architecture, le cycle de vie, les interactions avec GNOME Shell et l'écosystème Arrera Blue, ainsi que les commandes de développement, les tests et les règles de conception.

---

## 1. Vue d'ensemble du projet

* **Nom** : Arrera Top Bar
* **UUID** : `top-bar@linux.arrera-software.fr`
* **Distribution cible** : Arrera Blue Linux
* **Environnement** : GNOME Shell (versions 45 à 50) sur Wayland & X11 (GJS, ES Modules, Clutter, St, Libadwaita)
* **Objectif** : Une extension moderne et modulaire pour personnaliser, styliser et contrôler la barre supérieure native (`Main.panel`) de GNOME Shell afin de s'intégrer harmonieusement avec le design system Arrera Blue.
* **Fonctionnalités principales** :
  * Personnalisation visuelle du panneau (`Main.panel`) via des styles prédéfinis : par défaut, transparent, flottant et pilule compacte.
  * Contrôle fin de la visibilité des éléments natifs : bouton Activités, horloge/calendrier (`dateMenu`), et paramètres rapides (`quickSettings`).
  * Adaptation contextuelle (masquage automatique, comportement en plein écran).
  * Interface graphique de préférences native en **Libadwaita** (`Adw.PreferencesWindow`) synchronisée avec GSettings.
  * Outil de configuration interactif en terminal (`settings.sh`).
  * Intégration et synergie avec les extensions sœurs de la suite Arrera Blue (`dock@linux.arrera-software.fr` et `app-menu@linux.arrera-software.fr`).

---

## 2. Structure des fichiers

```text
.
├── extension.js                    # Point d'entrée de l'extension (cycle de vie enable/disable)
├── topBar.js                       # Contrôleur principal de la barre supérieure (ArreraTopBar, ArreraIndicator)
├── prefs.js                        # Fenêtre graphique de préférences Libadwaita (Adw.PreferencesWindow)
├── stylesheet.css                  # Feuilles de style Clutter/St (styles transparent, flottant, pilule)
├── icone/                          # Ressources graphiques (logo Arrera Blue)
│   └── arrera-logo.svg
├── metadata.json                   # Métadonnées déclaratives de l'extension pour GNOME Shell (UUID, versions 45-50)
├── agent.md                        # Guide d'architecture et de référence pour agents d'IA
├── README.md                       # Documentation générale du projet
├── settings.sh                     # Menu CLI interactif Bash pour manipuler les réglages GSettings
├── compile_schemas.sh              # Script de compilation des schémas GSettings (local et utilisateur)
├── lauch_dev.sh                    # Script de lancement en session imbriquée de test (gnome-shell --devkit)
├── build.sh                        # Script d'empaquetage de l'archive tar.gz et génération du paquet RPM
├── gnome-shell-extension-arrera-top-bar.spec # Spécification RPM pour Fedora / Arrera Blue
├── schemas/
│   ├── org.gnome.shell.extensions.top-bar.gschema.xml  # Définitions XML des clés GSettings
│   └── gschemas.compiled                            # Binaire de schéma compilé localement
└── output/                         # Répertoire de sortie des RPM générés par build.sh
```

---

## 3. Rôle des composants clés

### `extension.js` (Point d'entrée principal)
* Hérite de `Extension` (`resource:///org/gnome/shell/extensions/extension.js`).
* **Cycle de vie** :
  * `enable()` : Obtient l'instance des paramètres GSettings via `this.getSettings()`, instancie `ArreraTopBar(this)` et expose `globalThis.arreraTopBar = this`.
  * `disable()` : Appelle `this._topBar.destroy()`, nettoie les références, supprime `globalThis.arreraTopBar` et remet `this._settings` à `null`.

### `topBar.js` (Contrôleur de la barre supérieure)
Gère la personnalisation de la barre supérieure et le remplacement propre du bouton Activités :

* **`ArreraActivitiesButton`** (`PanelMenu.Button`) :
  * Bouton dédié intégrant l'icône SVG Arrera Blue adaptée à la couleur d'accentuation active de GNOME (`org.gnome.desktop.interface accent-color` : `blue`, `teal` -> turquoise, `green`, `yellow`, `orange`, `red`, `pink`, `purple`, `slate`).
  * Inséré à l'index `0` du conteneur gauche (`Main.panel.addToStatusArea(..., 0, 'left')`), à l'emplacement exact d'Activités.
  * Masque le conteneur natif (`Main.panel.statusArea.activities.container.visible = false`) pour éviter tout conflit de mise en page ou de points d'indicateurs de bureau.
  * Déclenche `Main.overview.toggle()` au clic et synchronise l'état pseudo-classe `checked` avec l'Overview.
  * Écoute en continu le signal `changed::accent-color` de `org.gnome.desktop.interface` pour rafraîchir l'icône à chaud.
* **Contrôle de `Main.panel`** :
  * Gère l'application dynamique des classes CSS selon la clé `style-mode` (`arrera-topbar-default`, `arrera-topbar-transparent`, `arrera-topbar-floating`, `arrera-topbar-pill`).
  * Pilote la visibilité des acteurs natifs de `Main.panel.statusArea` (`activities`, `dateMenu`, `quickSettings`).
* **Écoute GSettings** :
  * Enregistre les gestionnaires d'événements `changed::...` sur `_settings` et conserve leurs identifiants dans `_signalIds`.
* **Méthode `destroy()`** :
  * Détruit `ArreraActivitiesButton` et rétablit impérativement la visibilité native (`visible = true`) du bouton Activités d'origine.
  * Déconnecte tous les signaux GSettings via `_settings.disconnect(id)`.
  * Retire toutes les classes CSS personnalisées injectées dans `Main.panel`.

### `prefs.js` (Interface des préférences Libadwaita)
* Hérite de `ExtensionPreferences` (`resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js`).
* Implémente `fillPreferencesWindow(window)` en utilisant les widgets modernes de Libadwaita :
  * `Adw.PreferencesPage` : Page d'accueil avec icône de bureau.
  * `Adw.PreferencesGroup` : Organisation en sections claires (*Apparence*, *Éléments de la barre*, *Comportement*).
  * `Adw.ComboRow` : Sélection du mode visuel (défaut, transparent, flottant, pilule) via `Gtk.StringList`.
  * `Adw.SwitchRow` : Interrupteurs booléens liés directement à GSettings via `settings.bind(...)`.

### `stylesheet.css` (Feuille de style GNOME Shell)
* Cible l'acteur `#panel` et les classes appliquées par l'extension.
* Règles de marges, de rayons de bordure (`border-radius`), de fonds translucides et d'ombres portées pour les modes flottants et pilules.

---

## 4. Paramètres GSettings (`org.gnome.shell.extensions.top-bar`)

Le schéma est défini dans `schemas/org.gnome.shell.extensions.top-bar.gschema.xml`.

| Clé | Type | Défaut | Choix possibles | Description |
| --- | --- | --- | --- | --- |
| `logo-color` | `s` | `'colored'` | `'colored'`, `'white'`, `'black'` | Style de couleur du logo : coloré selon l'accentuation GNOME, blanc ou noir. |
| `launch-custom-app` | `b` | `false` | `true`, `false` | Lance une application spécifique au lieu d'ouvrir les activités. |
| `custom-app-id` | `s` | `''` | Identifiant ou commande | Identifiant de l'application (.desktop) ou commande à lancer au clic. |
| `keep-activities-button` | `b` | `false` | `true`, `false` | Conserve et affiche le bouton natif Activités de GNOME à droite du logo Arrera si le lancement d'app est actif. |

---

## 5. Commandes de développement, compilation et tests

### Vérification de la syntaxe JavaScript (Node.js)
```bash
node -c extension.js topBar.js prefs.js
```

### Recompilation des schémas GSettings
À exécuter obligatoirement après toute modification du fichier XML de schéma :
```bash
./compile_schemas.sh
```
*Compile les schémas dans `schemas/` et installe le schéma dans `~/.local/share/glib-2.0/schemas/` pour que `gsettings` puisse y accéder sans redémarrage.*

### Lancement de l'environnement de test (Session GNOME Shell isolée)
```bash
./lauch_dev.sh
```
*Supprime les fichiers de verrouillage du mode sans échec, active l'ensemble des extensions Arrera (`dock`, `app-menu`, `top-bar`), et lance une instance imbriquée Wayland via `dbus-run-session -- gnome-shell --devkit`.*

### Configuration en ligne de commande (CLI)
```bash
./settings.sh
```
*Ou directement via la commande `gsettings` :*
```bash
gsettings set org.gnome.shell.extensions.top-bar style-mode 'floating'
gsettings set org.gnome.shell.extensions.top-bar show-activities-button false
```

### Ouverture des préférences graphiques
```bash
gnome-extensions prefs top-bar@linux.arrera-software.fr
```

### Génération du paquet RPM
```bash
./build.sh
```
*Crée l'archive tarball source et lance `rpmbuild` pour générer les paquets `.rpm` et `.src.rpm` dans le répertoire `output/`.*

---

## 6. Interaction avec l'écosystème Arrera & GNOME

### Coexistence avec `dock@linux.arrera-software.fr`
* L'extension `arrera-dock` dispose d'options pour déporter certains composants du panneau supérieur vers le dock (ex. : `show-quick-settings`, `show-date-menu`, `show-activities-button`).
* `top-bar` permet de masquer les éléments originaux correspondants sur `Main.panel` de manière coordonnée pour éviter toute duplication visuelle.
* `globalThis.arreraTopBar` est disponible globalement si `arrera-dock` doit interagir avec la barre supérieure.

### Coexistence avec `app-menu@linux.arrera-software.fr`
* Si le lanceur Arrera est configuré pour remplacer le menu d'applications, le bouton Activités dans la barre supérieure peut être personnalisé ou masqué au profit du lanceur flottant.

### Préservation de `Main.layoutManager` et des Struts
* Par défaut, `Main.panel` réserve une zone d'écran (struts) pour empêcher les fenêtres maximisées de le chevaucher.
* Si le mode `autohide` ou le masquage en plein écran est ajusté, toujours veiller à manipuler `affectsStruts` ou la visibilité du panneau en conformité avec `Main.layoutManager`.

---

## 7. Règles de conception & Bonnes pratiques pour l'agent

1. **Cycle de vie et nettoyage strict (`enable` / `disable`)** :
   * Ne jamais laisser d'état orphelin. Tout élément modifié dans `Main.panel` ou `Main.panel.statusArea` **doit être fidèlement rétabli à son état par défaut** dans `destroy()` et `disable()`.
   * Déconnecter explicitement chaque signal GSettings et libérer les objets pour éviter toute fuite de mémoire.
   * Supprimer systématiquement `globalThis.arreraTopBar` lors de la désactivation.

2. **Compatibilité GNOME Shell 45 à 50** :
   * Utiliser obligatoirement la syntaxe ECMAScript Modules (`import ... from 'resource:///...'` et `import ... from 'gi://...'`).
   * Ne jamais utiliser la syntaxe obsolète GJS (`const { ... } = imports.gi;`).

3. **Spécificités Clutter et St** :
   * Le moteur de style de Clutter/St n'est pas un moteur CSS web complet. Utiliser uniquement les propriétés supportées par St (`background-color`, `border-radius`, `box-shadow`, `margin`, `padding`, `color`).
   * Toujours vérifier l'existence des conteneurs avant d'y accéder (ex. `if (Main.panel.statusArea.activities) ...`).

4. **Préférences Libadwaita** :
   * Conserver l'approche moderne `fillPreferencesWindow(window)` avec `Adw.PreferencesPage` et `Adw.PreferencesGroup` pour une expérience visuelle parfaitement intégrée à GNOME 45+.
