/* topBar.js
 *
 * Arrera Top Bar - Gestionnaire de la barre supérieure
 * Distribution Arrera Blue
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import Atk from 'gi://Atk';
import Clutter from 'gi://Clutter';
import GdkPixbuf from 'gi://GdkPixbuf';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

/**
 * Bouton personnalisé remplaçant le bouton Activités natif
 * par le logo officiel Arrera Blue.
 */
export const ArreraActivitiesButton = GObject.registerClass(
class ArreraActivitiesButton extends PanelMenu.Button {
    _init(extension, settings = null) {
        super._init(0.0, 'Activities', true);

        this._extension = extension;
        this._settings = settings || extension?.getSettings?.();
        this.set({
            name: 'panelArreraActivities',
            accessible_role: Atk.Role.TOGGLE_BUTTON,
            accessible_name: 'Activities',
        });

        this.add_style_class_name('panel-button');
        this.add_style_class_name('arrera-activities-button');

        this._icon = new St.Icon({
            style_class: 'system-status-icon arrera-activities-icon',
            icon_size: 24,
            y_align: Clutter.ActorAlign.CENTER,
            x_align: Clutter.ActorAlign.CENTER,
        });
        this.add_child(this._icon);

        // Écoute de la couleur d'accentuation native de GNOME (accent-color)
        this._interfaceSettings = new Gio.Settings({
            schema_id: 'org.gnome.desktop.interface',
        });
        this._accentColorSignalId = this._interfaceSettings.connect(
            'changed::accent-color',
            () => this._updateLogoIcon()
        );

        // Écoute du paramètre d'extension logo-color (colored, white, black)
        if (this._settings) {
            this._logoColorSignalId = this._settings.connect(
                'changed::logo-color',
                () => this._updateLogoIcon()
            );
        }

        this._updateLogoIcon();

        // Geste de clic pour basculer l'Overview ou lancer une application
        this._clickGesture = new Clutter.ClickGesture();
        this._clickGesture.connect('recognize', () => {
            if (this._shouldLaunchCustomApp()) {
                this._launchCustomApp();
            } else if (Main.overview.shouldToggleByCornerOrButton?.() ?? true) {
                Main.overview.toggle();
            }
        });
        this.add_action(this._clickGesture);

        // Synchronisation visuelle avec l'état ouvert de l'Overview
        Main.overview.connectObject(
            'showing', () => this.add_style_pseudo_class('checked'),
            'hiding', () => this.remove_style_pseudo_class('checked'),
            this
        );

        this.connect('destroy', () => this._onDestroy());
    }

    _getLogoColorMode() {
        try {
            if (this._settings?.settings_schema?.has_key('logo-color'))
                return this._settings.get_string('logo-color');
        } catch (e) {
            console.warn(`[ArreraTopBar] Erreur lors de la lecture de logo-color: ${e}`);
        }
        return 'colored';
    }

    _getAccentColor() {
        try {
            if (this._interfaceSettings?.settings_schema?.has_key('accent-color'))
                return this._interfaceSettings.get_string('accent-color');
        } catch (e) {
            console.warn(`[ArreraTopBar] Erreur lors de la lecture de accent-color: ${e}`);
        }
        return 'blue';
    }

    _updateLogoIcon() {
        const logoFile = this._findLogoFile();
        if (logoFile) {
            this._icon.icon_name = null;
            this._icon.gicon = new Gio.FileIcon({ file: logoFile });
        } else {
            this._icon.gicon = null;
            this._icon.icon_name = 'view-activities-symbolic';
        }
    }

    _findLogoFile() {
        const extPath = this._extension?.path;
        if (!extPath)
            return null;

        const logoColorMode = this._getLogoColorMode();

        let iconName;
        if (logoColorMode === 'white') {
            iconName = 'arrera-logo-white.svg';
        } else if (logoColorMode === 'black') {
            iconName = 'arrera-logo-black.svg';
        } else {
            // Mode 'colored' (par défaut) : suit la couleur d'accentuation de GNOME
            const accentColor = this._getAccentColor();
            const ACCENT_ICON_MAP = {
                'blue': 'arrera-logo-blue.svg',
                'teal': 'arrera-logo-turquoise.svg',
                'turquoise': 'arrera-logo-turquoise.svg',
                'green': 'arrera-logo-green.svg',
                'yellow': 'arrera-logo-yellow.svg',
                'orange': 'arrera-logo-orange.svg',
                'red': 'arrera-logo-red.svg',
                'pink': 'arrera-logo-pink.svg',
                'purple': 'arrera-logo-purple.svg',
                'slate': 'arrera-logo-slate.svg',
            };
            iconName = ACCENT_ICON_MAP[accentColor] || `arrera-logo-${accentColor}.svg`;
        }

        const candidates = [
            `icone/${iconName}`,
            `icons/${iconName}`,
            'icone/arrera-logo-blue.svg',
            'icons/arrera-logo-blue.svg',
            'icone/logo.svg',
            'icons/logo.svg',
        ];

        for (const relPath of candidates) {
            const file = Gio.File.new_for_path(`${extPath}/${relPath}`);
            if (file.query_exists(null))
                return file;
        }

        return null;
    }

    _onDestroy() {
        if (this._interfaceSettings) {
            if (this._accentColorSignalId) {
                this._interfaceSettings.disconnect(this._accentColorSignalId);
                this._accentColorSignalId = null;
            }
            this._interfaceSettings = null;
        }

        if (this._settings) {
            if (this._logoColorSignalId) {
                this._settings.disconnect(this._logoColorSignalId);
                this._logoColorSignalId = null;
            }
            this._settings = null;
        }

        Main.overview.disconnectObject?.(this);
    }

    destroy() {
        this._onDestroy();
        super.destroy();
    }

    vfunc_scroll_event(event) {
        return Main.wm.handleWorkspaceScroll(event);
    }

    _shouldLaunchCustomApp() {
        if (!this._settings?.settings_schema?.has_key('launch-custom-app'))
            return false;
        if (!this._settings.get_boolean('launch-custom-app'))
            return false;
        const appId = this._getCustomAppId();
        return appId.trim().length > 0;
    }

    _getCustomAppId() {
        try {
            if (this._settings?.settings_schema?.has_key('custom-app-id'))
                return this._settings.get_string('custom-app-id');
        } catch (e) {
            console.warn(`[ArreraTopBar] Erreur lors de la lecture de custom-app-id: ${e}`);
        }
        return '';
    }

    _launchCustomApp() {
        const appId = this._getCustomAppId().trim();
        if (!appId)
            return;

        // Fermer l'Overview si elle est actuellement ouverte
        if (Main.overview.visible)
            Main.overview.hide();

        const appSystem = Shell.AppSystem.get_default();
        let app = appSystem?.lookup_app(appId);
        if (!app && !appId.endsWith('.desktop'))
            app = appSystem?.lookup_app(`${appId}.desktop`);

        if (app) {
            try {
                app.activate();
                return;
            } catch (err) {
                console.warn(`[ArreraTopBar] Échec de l'activation via app.activate(), tentative de lancement: ${err}`);
                app.get_app_info()?.launch([], null);
                return;
            }
        }

        // Lancement direct via Gio.AppInfo (commande ou exécutable)
        try {
            const appInfo = Gio.AppInfo.create_from_commandline(appId, null, Gio.AppInfoCreateFlags.NONE);
            appInfo.launch([], null);
        } catch (e) {
            console.error(`[ArreraTopBar] Impossible de lancer "${appId}": ${e}`);
        }
    }

    vfunc_key_release_event(event) {
        const symbol = event.get_key_symbol();
        if (symbol === Clutter.KEY_Return || symbol === Clutter.KEY_space) {
            if (this._shouldLaunchCustomApp()) {
                this._launchCustomApp();
                return Clutter.EVENT_STOP;
            } else if (Main.overview.shouldToggleByCornerOrButton?.() ?? true) {
                Main.overview.toggle();
                return Clutter.EVENT_STOP;
            }
        }
        return Clutter.EVENT_PROPAGATE;
    }
});

const THEME_CLASSES = [
    'topbar-theme-invisible',
    'topbar-theme-tinted-dark',
    'topbar-theme-tinted-light',
    'invisible-dark-elements',
    'invisible-light-elements',
    'topbar-hidden-mode',
];

/**
 * Contrôleur principal de la Top Bar
 */
export class ArreraTopBar {
    constructor(extension, settings = null) {
        this._extension = extension;
        this._settings = settings || extension?.getSettings?.();
        this._activitiesButton = null;
        this._signalIds = [];
        this._externalSignals = [];

        // Écoute des réglages de fond d'écran et d'apparence GNOME
        this._bgSettings = new Gio.Settings({
            schema_id: 'org.gnome.desktop.background',
        });
        this._interfaceSettings = new Gio.Settings({
            schema_id: 'org.gnome.desktop.interface',
        });

        this._externalSignals.push(
            {
                settings: this._bgSettings,
                id: this._bgSettings.connect('changed::picture-uri', () => this._onWallpaperChanged()),
            },
            {
                settings: this._bgSettings,
                id: this._bgSettings.connect('changed::picture-uri-dark', () => this._onWallpaperChanged()),
            },
            {
                settings: this._interfaceSettings,
                id: this._interfaceSettings.connect('changed::color-scheme', () => this._onWallpaperChanged()),
            }
        );

        // Initialisation de la liaison avec le moteur AppIndicator
        this._appIndicatorSettings = null;
        try {
            const schemaSource = Gio.SettingsSchemaSource.get_default();
            if (schemaSource?.lookup('org.gnome.shell.extensions.appindicator', true)) {
                this._appIndicatorSettings = new Gio.Settings({
                    schema_id: 'org.gnome.shell.extensions.appindicator',
                });
            }
        } catch (e) {
            console.warn(`[ArreraTopBar] Schéma appindicator introuvable: ${e}`);
        }

        this._enableActivitiesButton();

        if (this._settings) {
            this._signalIds.push(
                this._settings.connect('changed::launch-custom-app', () => this._updateNativeActivitiesVisibility()),
                this._settings.connect('changed::keep-activities-button', () => this._updateNativeActivitiesVisibility()),
                this._settings.connect('changed::theme', () => this._applyTheme()),
                this._settings.connect('changed::invisible-elements-color', () => this._applyTheme()),
                this._settings.connect('changed::appindicator-position', () => this._applyAppIndicatorPosition()),
                this._settings.connect('changed::hide-top-bar', () => this._updateBarVisibility())
            );
        }

        this._ensureAppIndicatorExtensionEnabled();
        this._updateNativeActivitiesVisibility();
        this._applyTheme();
        this._applyAppIndicatorPosition();

        // Écoute des signaux de fenêtres pour masquer l'AppIndicator quand une fenêtre est maximisée / plein écran
        try {
            global.window_manager.connectObject(
                'size-changed', () => this._updateBarVisibility(),
                'minimize', () => this._updateBarVisibility(),
                'unminimize', () => this._updateBarVisibility(),
                'destroy', () => this._updateBarVisibility(),
                this
            );
            global.workspace_manager.connectObject(
                'active-workspace-changed', () => this._updateBarVisibility(),
                this
            );
            global.display.connectObject(
                'restacked', () => this._updateBarVisibility(),
                'in-fullscreen-changed', () => this._updateBarVisibility(),
                'window-created', () => this._updateBarVisibility(),
                this
            );
            Main.overview.connectObject(
                'showing', () => this._updateBarVisibility(),
                'hidden', () => this._updateBarVisibility(),
                this
            );
        } catch (e) {
            console.warn(`[ArreraTopBar] Erreur lors de la connexion aux signaux du gestionnaire de fenêtres: ${e}`);
        }

        this._updateBarVisibility();
    }

    _ensureAppIndicatorExtensionEnabled() {
        try {
            const shellSettings = new Gio.Settings({ schema_id: 'org.gnome.shell' });
            if (shellSettings.settings_schema?.has_key('enabled-extensions')) {
                const enabledExtensions = shellSettings.get_strv('enabled-extensions');
                const appIndicatorUuid = 'appindicatorsupport@rgcjonas.gmail.com';
                if (!enabledExtensions.includes(appIndicatorUuid)) {
                    const extPath = `/usr/share/gnome-shell/extensions/${appIndicatorUuid}`;
                    const file = Gio.File.new_for_path(extPath);
                    if (file.query_exists(null)) {
                        enabledExtensions.push(appIndicatorUuid);
                        shellSettings.set_strv('enabled-extensions', enabledExtensions);
                    }
                }
            }
        } catch (e) {
            console.warn(`[ArreraTopBar] Erreur lors de l'activation de l'extension appindicator: ${e}`);
        }
    }

    _getAppIndicatorPosition() {
        try {
            if (this._settings?.settings_schema?.has_key('appindicator-position'))
                return this._settings.get_string('appindicator-position');
        } catch (e) {
            console.warn(`[ArreraTopBar] Erreur lors de la lecture de appindicator-position: ${e}`);
        }
        return 'right';
    }

    _applyAppIndicatorPosition() {
        const pos = this._getAppIndicatorPosition();
        if (this._appIndicatorSettings?.settings_schema?.has_key('tray-pos')) {
            try {
                if (this._appIndicatorSettings.get_string('tray-pos') !== pos)
                    this._appIndicatorSettings.set_string('tray-pos', pos);
            } catch (e) {
                console.warn(`[ArreraTopBar] Erreur lors de la mise à jour de tray-pos: ${e}`);
            }
        }
    }

    _enableActivitiesButton() {
        // Créer et ajouter le bouton Arrera en première position (gauche)
        this._activitiesButton = new ArreraActivitiesButton(this._extension, this._settings);
        Main.panel.addToStatusArea(`${this._extension.uuid}-activities`, this._activitiesButton, 0, 'left');
    }

    _onWallpaperChanged() {
        if (this._getTheme() === 'invisible') {
            this._applyTheme();
        }
    }

    _detectWallpaperBrightness() {
        try {
            if (!this._bgSettings)
                return 'white';

            const isDark = (this._interfaceSettings?.get_string('color-scheme') === 'prefer-dark');
            let uri = isDark
                ? this._bgSettings.get_string('picture-uri-dark')
                : this._bgSettings.get_string('picture-uri');

            if (!uri || uri.trim() === '')
                uri = this._bgSettings.get_string('picture-uri');

            if (!uri || !uri.startsWith('file://'))
                return 'white';

            const file = Gio.File.new_for_uri(uri);
            const path = file.get_path();
            if (!path || !file.query_exists(null))
                return 'white';

            // Charge uniquement une vignette ultra-légère (64x16) pour analyser la barre supérieure
            const pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(path, 64, 16, false);
            if (!pixbuf)
                return 'white';

            const pixels = pixbuf.get_pixels();
            const nChannels = pixbuf.get_n_channels();
            const rowstride = pixbuf.get_rowstride();
            const width = pixbuf.get_width();
            const height = pixbuf.get_height();

            let totalLuminance = 0;
            let count = 0;

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const offset = y * rowstride + x * nChannels;
                    const r = pixels[offset];
                    const g = pixels[offset + 1];
                    const b = pixels[offset + 2];
                    totalLuminance += 0.2126 * r + 0.7152 * g + 0.0722 * b;
                    count++;
                }
            }

            if (count === 0)
                return 'white';

            const avgLuminance = totalLuminance / count;
            // Si la moyenne est claire (>= 130 sur 255), on privilégie des éléments noirs
            return avgLuminance >= 130 ? 'black' : 'white';
        } catch (e) {
            console.warn(`[ArreraTopBar] Erreur lors de la détection de luminosité du fond d'écran: ${e}`);
            return 'white';
        }
    }

    _getInvisibleElementsColor() {
        try {
            if (this._settings?.settings_schema?.has_key('invisible-elements-color')) {
                const mode = this._settings.get_string('invisible-elements-color');
                if (mode === 'black' || mode === 'white')
                    return mode;
            }
        } catch (e) {
            console.warn(`[ArreraTopBar] Erreur lors de la lecture de invisible-elements-color: ${e}`);
        }
        return this._detectWallpaperBrightness();
    }

    _getTheme() {
        try {
            if (this._settings?.settings_schema?.has_key('theme'))
                return this._settings.get_string('theme');
        } catch (e) {
            console.warn(`[ArreraTopBar] Erreur lors de la lecture de theme: ${e}`);
        }
        return 'vanilla';
    }

    _applyTheme() {
        const panel = Main.panel;
        if (!panel)
            return;

        // Nettoyer les classes de thème existantes
        for (const cls of THEME_CLASSES) {
            if (panel.has_style_class_name(cls))
                panel.remove_style_class_name(cls);
        }

        const currentTheme = this._getTheme();
        switch (currentTheme) {
            case 'invisible': {
                panel.add_style_class_name('topbar-theme-invisible');
                const elementsColor = this._getInvisibleElementsColor();
                if (elementsColor === 'black') {
                    panel.add_style_class_name('invisible-dark-elements');
                } else {
                    panel.add_style_class_name('invisible-light-elements');
                }
                break;
            }
            case 'tinted-dark':
                panel.add_style_class_name('topbar-theme-tinted-dark');
                break;
            case 'tinted-light':
                panel.add_style_class_name('topbar-theme-tinted-light');
                break;
            case 'vanilla':
            default:
                // Style par défaut de GNOME Shell
                break;
        }
    }

    _isBarHidden() {
        try {
            if (this._settings?.settings_schema?.has_key('hide-top-bar'))
                return this._settings.get_boolean('hide-top-bar');
        } catch (e) {
            console.warn(`[ArreraTopBar] Erreur lors de la lecture de hide-top-bar: ${e}`);
        }
        return false;
    }

    _setAffectsStruts(affects) {
        try {
            const panelBox = Main.layoutManager.panelBox;
            if (!panelBox)
                return;

            const actorData = Main.layoutManager._trackedActors?.find(a => a.actor === panelBox);
            if (actorData && actorData.affectsStruts !== affects) {
                actorData.affectsStruts = affects;
                Main.layoutManager._queueUpdateRegions();
            }
        } catch (e) {
            console.warn(`[ArreraTopBar] Erreur lors de la manipulation des struts: ${e}`);
        }
    }

    _isWindowMaximizedOrFullscreen(metaWindow, monitorIndex) {
        if (!metaWindow || metaWindow.minimized)
            return false;

        if (metaWindow.get_monitor() !== monitorIndex)
            return false;

        const windowType = metaWindow.get_window_type?.();
        if (windowType !== Meta.WindowType.NORMAL)
            return false;

        try {
            if (metaWindow.is_fullscreen?.())
                return true;
            if (typeof metaWindow.is_maximized === 'function' && metaWindow.is_maximized())
                return true;
            if (typeof metaWindow.get_maximized === 'function') {
                const max = metaWindow.get_maximized();
                if (max === 3 || (Meta.MaximizeFlags && max === Meta.MaximizeFlags.BOTH))
                    return true;
            }
        } catch (e) {
            console.warn(`[ArreraTopBar] Erreur vérification fenêtre maximisée: ${e}`);
        }

        return false;
    }

    _hasMaximizedOrFullscreenWindow() {
        if (Main.overview?.visible)
            return false;

        try {
            const panelBox = Main.layoutManager.panelBox;
            if (!panelBox)
                return false;

            const monitor = Main.layoutManager.findMonitorForActor(panelBox)
                ?? Main.layoutManager.primaryMonitor;
            const monitorIndex = monitor?.index ?? Main.layoutManager.primaryIndex;
            const workspace = global.workspace_manager?.get_active_workspace();
            if (!workspace)
                return false;

            const windows = workspace.list_windows();
            for (const win of windows) {
                if (this._isWindowMaximizedOrFullscreen(win, monitorIndex))
                    return true;
            }
        } catch (e) {
            console.warn(`[ArreraTopBar] Erreur détection fenêtre maximisée: ${e}`);
        }

        return false;
    }

    _updateBarVisibility() {
        const hidden = this._isBarHidden();
        const panel = Main.panel;
        const panelBox = Main.layoutManager.panelBox;

        if (hidden) {
            // 1. Libérer l'espace pour que les fenêtres maximisées montent jusqu'en haut
            this._setAffectsStruts(false);

            // 2. Appliquer la classe CSS masquant le panneau sauf AppIndicator
            panel?.add_style_class_name('topbar-hidden-mode');

            // 3. Masquer les éléments natifs et Arrera
            if (this._activitiesButton)
                this._activitiesButton.visible = false;
            if (panel?.statusArea?.activities?.container)
                panel.statusArea.activities.container.visible = false;
            if (panel?.statusArea?.dateMenu?.container)
                panel.statusArea.dateMenu.container.visible = false;
            if (panel?.statusArea?.quickSettings?.container)
                panel.statusArea.quickSettings.container.visible = false;

            // 4. Si une fenêtre est maximisée ou en plein écran sur le moniteur, masquer la pilule AppIndicator
            //    pour que la fenêtre puisse occuper tout l'écran sans être gênée
            const hasMaximized = this._hasMaximizedOrFullscreenWindow();
            if (panelBox)
                panelBox.visible = !hasMaximized;
        } else {
            // 1. Rétablir les struts pour que les fenêtres maximisées respectent la barre
            this._setAffectsStruts(true);

            // 2. Rétablir la visibilité normale de panelBox
            if (panelBox)
                panelBox.visible = true;

            // 3. Retirer la classe CSS
            panel?.remove_style_class_name('topbar-hidden-mode');

            // 4. Rétablir les éléments selon leurs réglages respectifs
            if (this._activitiesButton)
                this._activitiesButton.visible = true;
            this._updateNativeActivitiesVisibility();
            if (panel?.statusArea?.dateMenu?.container)
                panel.statusArea.dateMenu.container.visible = true;
            if (panel?.statusArea?.quickSettings?.container)
                panel.statusArea.quickSettings.container.visible = true;
        }
    }

    _updateNativeActivitiesVisibility() {
        const nativeActivities = Main.panel.statusArea.activities;
        if (!nativeActivities?.container)
            return;

        if (this._isBarHidden()) {
            nativeActivities.container.visible = false;
            return;
        }

        const launchApp = this._settings?.get_boolean('launch-custom-app') ?? false;
        const keepActivities = this._settings?.get_boolean('keep-activities-button') ?? false;

        // Si le lancement personnalisé est désactivé, s'assurer que keep-activities-button est à false
        if (!launchApp && keepActivities) {
            this._settings?.set_boolean('keep-activities-button', false);
        }

        // Le bouton Activités natif de GNOME (indicateur d'espaces de travail) est affiché à droite du logo
        // uniquement si le lancement personnalisé est actif ET que l'utilisateur a choisi de conserver le bouton.
        nativeActivities.container.visible = launchApp && keepActivities;
    }

    destroy() {
        // Déconnexion des écouteurs d'événements de fenêtres
        try {
            global.window_manager?.disconnectObject(this);
            global.workspace_manager?.disconnectObject(this);
            global.display?.disconnectObject(this);
            Main.overview?.disconnectObject(this);
        } catch (e) {
            console.warn(`[ArreraTopBar] Erreur déconnexion signaux fenêtres: ${e}`);
        }

        // Rétablir inconditionnellement les struts natifs de GNOME Shell
        this._setAffectsStruts(true);

        // Rétablir inconditionnellement la visibilité de panelBox
        if (Main.layoutManager.panelBox) {
            Main.layoutManager.panelBox.visible = true;
        }

        // Supprimer le bouton Arrera
        if (this._activitiesButton) {
            this._activitiesButton.destroy();
            this._activitiesButton = null;
        }

        // Rétablissement inconditionnel du bouton Activités natif
        if (Main.panel.statusArea.activities?.container) {
            Main.panel.statusArea.activities.container.visible = true;
        }

        // Rétablissement inconditionnel de la date et des paramètres rapides
        if (Main.panel.statusArea.dateMenu?.container) {
            Main.panel.statusArea.dateMenu.container.visible = true;
        }
        if (Main.panel.statusArea.quickSettings?.container) {
            Main.panel.statusArea.quickSettings.container.visible = true;
        }

        // Rétablissement inconditionnel du style natif du panneau
        if (Main.panel) {
            for (const cls of THEME_CLASSES) {
                if (Main.panel.has_style_class_name(cls))
                    Main.panel.remove_style_class_name(cls);
            }
        }

        // Déconnexion des signaux GSettings internes
        if (this._settings && this._signalIds) {
            for (const id of this._signalIds)
                this._settings.disconnect(id);
            this._signalIds = [];
        }

        // Déconnexion des signaux système (fond d'écran, interface)
        if (this._externalSignals) {
            for (const { settings, id } of this._externalSignals) {
                if (settings && id)
                    settings.disconnect(id);
            }
            this._externalSignals = [];
        }

        this._bgSettings = null;
        this._interfaceSettings = null;
        this._appIndicatorSettings = null;
        this._settings = null;
    }
}
