# TODO - Arrera Top Bar

## Tâches réalisées
- [x] Ajouter des theme a la bar (Vanilla,invisible,tinter(dark/light))
- [x] Ajouter la vu des application comme app indicator (Rendre bougable)
- [x] Possible de supprimer l'affichage de la bar totalement

---

## Fonctionnalités manquantes pour les 3 Designs de bureau

### 1. Résolution du conflit de masquage avec le Dock (Crucial pour Designs 2 & 3)
- [ ] **Préservation de `dateMenu` et `quickSettings` lors du masquage de la barre** :
  - Dans `topBar.js` (`_updateBarVisibility()`), lorsque `hide-top-bar` est actif, l'extension force `dateMenu.container.visible = false` et `quickSettings.container.visible = false`.
  - Si le Dock a reparenté ces conteneurs dans sa propre barre inférieure ou latérale, ils deviennent invisibles dans le Dock également !
  - **Correction requise** : Vérifier si `dateMenu.container` et `quickSettings.container` appartiennent encore à `Main.panel` avant de forcer leur visibilité à `false`. S'ils ont été adoptés par le Dock (`globalThis.arreraDock`), ne pas masquer leurs conteneurs.

### 2. Formatage personnalisé de la Date / Horloge (Pour le Design 1 - Bureau moderne)
- [ ] **Personnalisation de l'affichage de la date centrale** :
  - Ajouter une option pour formater la date centrale en texte majuscule étendu (ex. `DAY MONTH YEAR` / `MERCREDI 7 OCTOBRE 2026`).
  - Option pour masquer l'heure dans la barre supérieure afin de ne conserver que la date textuelle centrée.

### 3. Style « Pilule » pour les Paramètres Rapides (Quick Settings) (Pour le Design 1)
- [ ] **Conteneur pilule grise pour Quick Settings** :
  - Ajouter un style CSS encapsulant le groupe des indicateurs système (`panel-status-indicators-box`) dans une pilule grise contrastée aux bords arrondis (comme sur la maquette du Design 1), tout en conservant le logo Arrera épuré sans pilule à gauche.

### 4. Coordination et Presets avec le Dock
- [ ] **Synchronisation automatique de visibilité** :
  - Coordonner automatiquement l'état de la Top Bar selon le preset de bureau sélectionné :
    - Visible en haut pour le **Design 1** (Bureau moderne).
    - Masquée automatiquement sans casser l'horloge/statut pour le **Design 2** (Panneau inférieur) et le **Design 3** (Barre latérale droite).