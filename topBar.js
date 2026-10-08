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
import GLib from 'gi://GLib';
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

/**
 * Carte Adwaita dédiée au Partage d'écran dans les Paramètres Rapides
 */
export const QuickSettingsScreenSharingCard = GObject.registerClass(
class QuickSettingsScreenSharingCard extends St.Button {
    _init() {
        super._init({
            style_class: 'quick-settings-indicator-card screen-sharing',
            can_focus: true,
            reactive: true,
            x_expand: true,
            visible: false,
        });

        const box = new St.BoxLayout({
            x_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.set_child(box);

        // Pastille icône orange à gauche
        const iconBadge = new St.Bin({
            style_class: 'quick-settings-indicator-icon-badge',
            y_align: Clutter.ActorAlign.CENTER,
        });
        iconBadge.set_child(new St.Icon({
            icon_name: 'screen-shared-symbolic',
            icon_size: 16,
        }));
        box.add_child(iconBadge);

        // Textes explicatifs au centre
        const textBox = new St.BoxLayout({
            orientation: Clutter.Orientation.VERTICAL,
            x_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        box.add_child(textBox);

        this._title = new St.Label({
            style_class: 'quick-settings-indicator-title',
            text: 'Partage d\'écran actif',
            y_align: Clutter.ActorAlign.CENTER,
        });
        textBox.add_child(this._title);

        this._subtitle = new St.Label({
            style_class: 'quick-settings-indicator-subtitle',
            text: 'Diffusion de l\'écran en cours',
            y_align: Clutter.ActorAlign.CENTER,
        });
        textBox.add_child(this._subtitle);

        // Bouton Arrêter à droite
        this._stopBtn = new St.Button({
            style_class: 'quick-settings-indicator-stop-btn',
            can_focus: true,
            reactive: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        const stopContent = new St.BoxLayout({
            y_align: Clutter.ActorAlign.CENTER,
        });
        stopContent.add_child(new St.Label({
            text: 'Arrêter',
            y_align: Clutter.ActorAlign.CENTER,
        }));
        stopContent.add_child(new St.Icon({
            icon_name: 'screencast-stop-symbolic',
            icon_size: 13,
            y_align: Clutter.ActorAlign.CENTER,
        }));
        this._stopBtn.set_child(stopContent);
        this._stopBtn.connect('clicked', () => this._stopSharing());
        box.add_child(this._stopBtn);

        this.connect('clicked', () => this._stopSharing());

        this._sharingIndicator = Main.panel?.statusArea?.screenSharing;
        this._signalId = null;
        if (this._sharingIndicator) {
            this._signalId = this._sharingIndicator.connect('notify::visible', () => this._sync());
        }
        this._sync();
    }

    _stopSharing() {
        try {
            if (this._sharingIndicator?._stopSharing)
                this._sharingIndicator._stopSharing();
            else if (typeof this._sharingIndicator?.activate === 'function')
                this._sharingIndicator.activate();
        } catch (e) {
            console.warn(`[ArreraTopBar] Erreur arrêt partage: ${e}`);
        }
    }

    _sync() {
        const isVisible = this._sharingIndicator?.visible ?? false;
        this.visible = isVisible;
    }

    destroy() {
        if (this._signalId && this._sharingIndicator) {
            try {
                this._sharingIndicator.disconnect(this._signalId);
            } catch (e) {}
            this._signalId = null;
        }
        super.destroy();
    }
});

/**
 * Carte Adwaita dédiée à l'Enregistrement vidéo dans les Paramètres Rapides
 */
export const QuickSettingsScreenRecordingCard = GObject.registerClass(
class QuickSettingsScreenRecordingCard extends St.Button {
    _init() {
        super._init({
            style_class: 'quick-settings-indicator-card screen-recording',
            can_focus: true,
            reactive: true,
            x_expand: true,
            visible: false,
        });

        this._secondsPassed = 0;
        this._timerId = 0;

        const box = new St.BoxLayout({
            x_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.set_child(box);

        // Pastille icône rouge à gauche
        const iconBadge = new St.Bin({
            style_class: 'quick-settings-indicator-icon-badge',
            y_align: Clutter.ActorAlign.CENTER,
        });
        iconBadge.set_child(new St.Icon({
            icon_name: 'media-record-symbolic',
            icon_size: 16,
        }));
        box.add_child(iconBadge);

        // Textes explicatifs au centre
        const textBox = new St.BoxLayout({
            orientation: Clutter.Orientation.VERTICAL,
            x_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        box.add_child(textBox);

        this._title = new St.Label({
            style_class: 'quick-settings-indicator-title',
            text: 'Enregistrement vidéo',
            y_align: Clutter.ActorAlign.CENTER,
        });
        textBox.add_child(this._title);

        this._subtitle = new St.Label({
            style_class: 'quick-settings-indicator-subtitle',
            text: '0:00 - Enregistrement en cours',
            y_align: Clutter.ActorAlign.CENTER,
        });
        textBox.add_child(this._subtitle);

        // Bouton Arrêter à droite
        this._stopBtn = new St.Button({
            style_class: 'quick-settings-indicator-stop-btn',
            can_focus: true,
            reactive: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        const stopContent = new St.BoxLayout({
            y_align: Clutter.ActorAlign.CENTER,
        });
        stopContent.add_child(new St.Label({
            text: 'Arrêter',
            y_align: Clutter.ActorAlign.CENTER,
        }));
        stopContent.add_child(new St.Icon({
            icon_name: 'screencast-stop-symbolic',
            icon_size: 13,
            y_align: Clutter.ActorAlign.CENTER,
        }));
        this._stopBtn.set_child(stopContent);
        this._stopBtn.connect('clicked', () => this._stopRecording());
        box.add_child(this._stopBtn);

        this.connect('clicked', () => this._stopRecording());

        this._notifyId = Main.screenshotUI.connect(
            'notify::screencast-in-progress',
            () => this._sync()
        );
        this._sync();
    }

    _updateTimer() {
        const mins = Math.floor(this._secondsPassed / 60);
        const secs = this._secondsPassed % 60;
        const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
        this._subtitle.text = `${formatted} - Enregistrement en cours`;
    }

    _stopRecording() {
        try {
            Main.screenshotUI?.stopScreencast?.();
        } catch (e) {
            console.warn(`[ArreraTopBar] Erreur arrêt screencast: ${e}`);
        }
    }

    _sync() {
        const inProgress = Main.screenshotUI?.screencast_in_progress ?? false;
        this.visible = inProgress;

        if (inProgress) {
            if (!this._timerId) {
                this._secondsPassed = 0;
                this._updateTimer();
                this._timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
                    this._secondsPassed++;
                    this._updateTimer();
                    return GLib.SOURCE_CONTINUE;
                });
            }
        } else {
            if (this._timerId) {
                GLib.source_remove(this._timerId);
                this._timerId = 0;
            }
            this._secondsPassed = 0;
        }
    }

    destroy() {
        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = 0;
        }
        if (this._notifyId) {
            try {
                Main.screenshotUI.disconnect(this._notifyId);
            } catch (e) {}
            this._notifyId = null;
        }
        super.destroy();
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
        this._indicatorsCardContainer = null;
        this._sharingCard = null;
        this._recordingCard = null;
        this._menuOpenSignalId = null;

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

        // Écoute de l'Overview pour garantir que le panneau reste masqué lors de l'ouverture/fermeture
        try {
            Main.overview.connectObject(
                'showing', () => this._updateBarVisibility(),
                'hidden', () => this._updateBarVisibility(),
                this
            );
        } catch (e) {
            console.warn(`[ArreraTopBar] Erreur connexion signaux overview: ${e}`);
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

    _syncIndicatorsCardsVisibility() {
        if (!this._indicatorsCardContainer)
            return;

        const hasVisible = (this._sharingCard && this._sharingCard.visible) ||
                           (this._recordingCard && this._recordingCard.visible);
        this._indicatorsCardContainer.visible = hasVisible;
    }

    _attachIndicatorsToQuickSettings() {
        const qs = Main.panel?.statusArea?.quickSettings;
        const menu = qs?.menu;
        if (!qs || !menu || !menu._grid)
            return;

        // 1. Masquer les petits conteneurs bruts du panneau supérieur pour éviter les artéfacts visuels
        const roles = [
            'screenRecording',
            'screenSharing',
        ];
        for (const role of roles) {
            const container = Main.panel?.statusArea?.[role]?.container;
            if (container)
                container.visible = false;
        }

        // 2. Créer le conteneur élégant de cartes Adwaita dans les Paramètres Rapides
        if (!this._indicatorsCardContainer) {
            this._indicatorsCardContainer = new St.BoxLayout({
                style_class: 'quick-settings-indicators-cards-box',
                orientation: Clutter.Orientation.VERTICAL,
                x_expand: true,
                y_align: Clutter.ActorAlign.CENTER,
                visible: false,
            });

            this._sharingCard = new QuickSettingsScreenSharingCard();
            this._sharingCard.connect('notify::visible', () => this._syncIndicatorsCardsVisibility());
            this._indicatorsCardContainer.add_child(this._sharingCard);

            this._recordingCard = new QuickSettingsScreenRecordingCard();
            this._recordingCard.connect('notify::visible', () => this._syncIndicatorsCardsVisibility());
            this._indicatorsCardContainer.add_child(this._recordingCard);

            // Insérer juste au-dessus du curseur de volume dans la grille des paramètres rapides
            const volumeItem = qs._volumeOutput?.quickSettingsItems?.[0];
            const colSpan = menu._grid.layout_manager?.nColumns || 2;

            if (volumeItem && menu._grid.contains(volumeItem)) {
                menu.insertItemBefore(this._indicatorsCardContainer, volumeItem, colSpan);
            } else {
                const firstItem = typeof menu.getFirstItem === 'function' ? menu.getFirstItem() : (menu.firstMenuItem || null);
                if (firstItem)
                    menu.insertItemBefore(this._indicatorsCardContainer, firstItem, colSpan);
                else
                    menu.addItem(this._indicatorsCardContainer, colSpan);
            }
        }

        // Écouter l'ouverture du menu pour synchroniser instantanément l'affichage
        if (!this._menuOpenSignalId) {
            this._menuOpenSignalId = menu.connect('open-state-changed', (_m, open) => {
                if (open) {
                    this._sharingCard?._sync?.();
                    this._recordingCard?._sync?.();
                    this._syncIndicatorsCardsVisibility();
                }
            });
        }

        this._syncIndicatorsCardsVisibility();
    }

    _restoreIndicatorsFromQuickSettings() {
        const qs = Main.panel?.statusArea?.quickSettings;
        const menu = qs?.menu;

        if (this._menuOpenSignalId && menu) {
            try {
                menu.disconnect(this._menuOpenSignalId);
            } catch (e) {}
            this._menuOpenSignalId = null;
        }

        if (this._indicatorsCardContainer) {
            const parent = this._indicatorsCardContainer.get_parent();
            if (parent) {
                try {
                    parent.remove_child(this._indicatorsCardContainer);
                } catch (e) {}
            }

            if (this._sharingCard) {
                this._sharingCard.destroy();
                this._sharingCard = null;
            }
            if (this._recordingCard) {
                this._recordingCard.destroy();
                this._recordingCard = null;
            }

            this._indicatorsCardContainer.destroy();
            this._indicatorsCardContainer = null;
        }

        // Rétablir la visibilité normale des conteneurs natifs
        const roles = [
            'screenRecording',
            'screenSharing',
        ];
        for (const role of roles) {
            const container = Main.panel?.statusArea?.[role]?.container;
            if (container)
                container.visible = true;
        }
    }

    _isContainerOwnedByPanel(container) {
        if (!container)
            return false;
        const panel = Main.panel;
        const parent = container.get_parent();
        return parent === panel || parent === panel?._leftBox || parent === panel?._centerBox || parent === panel?._rightBox;
    }

    _updateBarVisibility() {
        const hidden = this._isBarHidden();
        const panel = Main.panel;
        const panelBox = Main.layoutManager.panelBox;

        if (hidden) {
            // 1. Libérer l'espace pour que les fenêtres maximisées montent jusqu'en haut
            this._setAffectsStruts(false);

            // 2. Rattacher tous les indicateurs d'indication/statut au Control Center (quickSettings)
            try {
                this._attachIndicatorsToQuickSettings();
            } catch (e) {
                console.warn(`[ArreraTopBar] Erreur rattachement indicateurs à Quick Settings: ${e}`);
            }

            // 3. Masquer totalement et inconditionnellement le panneau et sa boîte
            if (panelBox) {
                panelBox.visible = false;
                panelBox.set_height(0);
            }
            if (panel) {
                panel.visible = false;
                panel.reactive = false;
                panel.set_height(0);
                panel.add_style_class_name('topbar-hidden-mode');
            }

            // 4. Masquer les éléments natifs et Arrera (en préservant dateMenu et quickSettings s'ils sont adoptés par le Dock)
            if (this._activitiesButton)
                this._activitiesButton.visible = false;
            if (panel?.statusArea?.activities?.container)
                panel.statusArea.activities.container.visible = false;
            if (panel?.statusArea?.dateMenu?.container && this._isContainerOwnedByPanel(panel.statusArea.dateMenu.container))
                panel.statusArea.dateMenu.container.visible = false;
            if (panel?.statusArea?.quickSettings?.container && this._isContainerOwnedByPanel(panel.statusArea.quickSettings.container))
                panel.statusArea.quickSettings.container.visible = false;

            const gpasteBtn = panel?.statusArea?.gpaste;
            if (gpasteBtn && this._isContainerOwnedByPanel(gpasteBtn.container))
                gpasteBtn.container.visible = false;

            Main.layoutManager._queueUpdateRegions();
        } else {
            // 1. Rétablir les indicateurs dans le panneau natif
            try {
                this._restoreIndicatorsFromQuickSettings();
            } catch (e) {
                console.warn(`[ArreraTopBar] Erreur restauration indicateurs Quick Settings: ${e}`);
            }

            // 2. Rétablir les struts pour que les fenêtres maximisées respectent la barre
            this._setAffectsStruts(true);

            // 3. Rétablir la visibilité normale de panelBox et panel
            if (panelBox) {
                panelBox.visible = true;
                panelBox.set_height(-1);
            }
            if (panel) {
                panel.visible = true;
                panel.reactive = true;
                panel.set_height(-1);
                panel.remove_style_class_name('topbar-hidden-mode');
            }

            const gpasteBtn = panel?.statusArea?.gpaste;
            if (gpasteBtn)
                gpasteBtn.remove_style_class_name('gpaste-floating-pill');

            // 4. Rétablir les éléments selon leurs réglages respectifs
            if (this._activitiesButton)
                this._activitiesButton.visible = true;
            this._updateNativeActivitiesVisibility();
            if (panel?.statusArea?.dateMenu?.container)
                panel.statusArea.dateMenu.container.visible = true;
            if (panel?.statusArea?.quickSettings?.container)
                panel.statusArea.quickSettings.container.visible = true;
            if (panel?.statusArea?.gpaste?.container)
                panel.statusArea.gpaste.container.visible = true;

            this._applyTheme();
            Main.layoutManager._queueUpdateRegions();
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
        // Déconnexion de l'Overview
        try {
            Main.overview?.disconnectObject(this);
        } catch (e) {
            console.warn(`[ArreraTopBar] Erreur déconnexion signaux overview: ${e}`);
        }

        // Rétablir inconditionnellement les indicateurs rattachés à Quick Settings
        try {
            this._restoreIndicatorsFromQuickSettings();
        } catch (e) {}

        // Rétablir inconditionnellement les struts natifs de GNOME Shell
        this._setAffectsStruts(true);

        // Rétablir inconditionnellement la visibilité de panelBox et panel
        if (Main.layoutManager.panelBox) {
            Main.layoutManager.panelBox.visible = true;
            Main.layoutManager.panelBox.set_height(-1);
        }
        if (Main.panel) {
            Main.panel.visible = true;
            Main.panel.reactive = true;
            Main.panel.set_height(-1);
            for (const cls of THEME_CLASSES) {
                if (Main.panel.has_style_class_name(cls))
                    Main.panel.remove_style_class_name(cls);
            }
        }

        // Supprimer le bouton Arrera
        if (this._activitiesButton) {
            this._activitiesButton.destroy();
            this._activitiesButton = null;
        }

        // Rétablissement inconditionnel du bouton Activités natif
        if (Main.panel?.statusArea?.activities?.container) {
            Main.panel.statusArea.activities.container.visible = true;
        }

        // Rétablissement inconditionnel de la date et des paramètres rapides
        if (Main.panel?.statusArea?.dateMenu?.container) {
            Main.panel.statusArea.dateMenu.container.visible = true;
        }
        if (Main.panel?.statusArea?.quickSettings?.container) {
            Main.panel.statusArea.quickSettings.container.visible = true;
        }
        if (Main.panel?.statusArea?.gpaste?.container) {
            Main.panel.statusArea.gpaste.container.visible = true;
        }

        if (Main.panel?.statusArea?.gpaste) {
            Main.panel.statusArea.gpaste.remove_style_class_name('gpaste-floating-pill');
        }

        Main.layoutManager._queueUpdateRegions();

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
