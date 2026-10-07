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
