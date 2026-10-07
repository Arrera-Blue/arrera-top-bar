# Configuration GSettings - Arrera Top Bar

* **Schéma** : `org.gnome.shell.extensions.top-bar`
* **Chemin** : `/org/gnome/shell/extensions/top-bar/`

---

### `logo-color` (chaîne de caractères / choix)
* **Description** : Définit le style et la couleur du logo Arrera Blue remplaçant le bouton Activités dans la barre supérieure (`Main.panel`).
* **Valeurs possibles** :
  * `'colored'` *(défaut)* : Le logo s'adapte dynamiquement à la couleur d'accentuation native sélectionnée dans les paramètres de GNOME (`org.gnome.desktop.interface accent-color`).
  * `'white'` : Affiche le logo officiel Arrera Blue en blanc monochrome (`icone/arrera-logo-white.svg`).
  * `'black'` : Affiche le logo officiel Arrera Blue en noir monochrome (`icone/arrera-logo-black.svg`).
* **Commandes CLI** :
  ```bash
  # Activer le mode coloré dynamique (par défaut)
  gsettings set org.gnome.shell.extensions.top-bar logo-color 'colored'

  # Activer le logo blanc
  gsettings set org.gnome.shell.extensions.top-bar logo-color 'white'

  # Activer le logo noir
  gsettings set org.gnome.shell.extensions.top-bar logo-color 'black'

  # Consulter la valeur actuelle
  gsettings get org.gnome.shell.extensions.top-bar logo-color
  ```

---

### `launch-custom-app` (booléen)
* **Description** : Remplace l'ouverture de la vue d'ensemble des activités par le lancement d'une application ou d'une commande personnalisée au clic sur le logo Arrera.
* **Valeurs possibles** :
  * `false` *(défaut)* : Ouvre / ferme la vue d'ensemble des activités GNOME (Overview).
  * `true` : Lance l'application spécifiée dans la clé `custom-app-id`.
* **Commandes CLI** :
  ```bash
  # Activer le lancement d'application
  gsettings set org.gnome.shell.extensions.top-bar launch-custom-app true

  # Rétablir le comportement normal (Overview)
  gsettings set org.gnome.shell.extensions.top-bar launch-custom-app false
  ```

---

### `custom-app-id` (chaîne de caractères)
* **Description** : Identifiant de l'application (.desktop) ou nom de commande / exécutable à lancer lorsque `launch-custom-app` est activé.
* **Valeurs possibles** :
  * `''` *(défaut)* : Aucune application définie (repli sur l'Overview).
  * N'importe quel identifiant d'application desktop (ex. `ptyxis`, `org.gnome.Ptyxis.desktop`, `firefox`, `org.gnome.Nautilus.desktop`) ou commande terminal.
* **Commandes CLI** :
  ```bash
  # Définir le terminal Ptyxis comme application au clic
  gsettings set org.gnome.shell.extensions.top-bar custom-app-id 'ptyxis'

  # Définir le gestionnaire de fichiers
  gsettings set org.gnome.shell.extensions.top-bar custom-app-id 'org.gnome.Nautilus.desktop'
  ```

---

### `keep-activities-button` (booléen)
* **Description** : Lorsque le lancement d'une application personnalisée est activé (`launch-custom-app`), permet d'afficher le bouton natif Activités de GNOME (l'indicateur d'espaces de travail sous forme de pilule) immédiatement à droite du logo Arrera Blue, afin de conserver l'accès direct à l'Overview.
* **Valeurs possibles** :
  * `false` *(défaut)* : Le bouton Activités natif de GNOME reste masqué.
  * `true` : Affiche le bouton natif Activités à droite du logo Arrera Blue (si `launch-custom-app` est actif).
* **Commandes CLI** :
  ```bash
  # Conserver et afficher le bouton Activités de GNOME à droite du logo Arrera
  gsettings set org.gnome.shell.extensions.top-bar keep-activities-button true

  # Masquer le bouton Activités de GNOME
  gsettings set org.gnome.shell.extensions.top-bar keep-activities-button false
  ```

---

## 🎨 Intégration avec la couleur d'accentuation GNOME

Lorsque `logo-color` est sur `'colored'`, l'extension écoute en direct le signal `changed::accent-color` de GNOME :

* **Schéma système** : `org.gnome.desktop.interface`
* **Clé** : `accent-color`
* **Correspondance des icônes SVG** :
  * `blue` $\rightarrow$ `icone/arrera-logo-blue.svg`
  * `teal` $\rightarrow$ `icone/arrera-logo-turquoise.svg`
  * `green` $\rightarrow$ `icone/arrera-logo-green.svg`
  * `yellow` $\rightarrow$ `icone/arrera-logo-yellow.svg`
  * `orange` $\rightarrow$ `icone/arrera-logo-orange.svg`
  * `red` $\rightarrow$ `icone/arrera-logo-red.svg`
  * `pink` $\rightarrow$ `icone/arrera-logo-pink.svg`
  * `purple` $\rightarrow$ `icone/arrera-logo-purple.svg`
  * `slate` $\rightarrow$ `icone/arrera-logo-slate.svg`
