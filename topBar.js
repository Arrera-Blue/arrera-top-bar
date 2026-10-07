/* topBar.js
 *
 * Arrera Top Bar - Gestionnaire de la barre supérieure
 * Distribution Arrera Blue
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import Atk from 'gi://Atk';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
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
 * Contrôleur principal de la Top Bar
 */
export class ArreraTopBar {
    constructor(extension, settings = null) {
        this._extension = extension;
        this._settings = settings || extension?.getSettings?.();
        this._activitiesButton = null;
        this._signalIds = [];

        this._enableActivitiesButton();

        if (this._settings) {
            this._signalIds.push(
                this._settings.connect('changed::launch-custom-app', () => this._updateNativeActivitiesVisibility()),
                this._settings.connect('changed::keep-activities-button', () => this._updateNativeActivitiesVisibility())
            );
        }

        this._updateNativeActivitiesVisibility();
    }

    _enableActivitiesButton() {
        // Créer et ajouter le bouton Arrera en première position (gauche)
        this._activitiesButton = new ArreraActivitiesButton(this._extension, this._settings);
        Main.panel.addToStatusArea(`${this._extension.uuid}-activities`, this._activitiesButton, 0, 'left');
    }

    _updateNativeActivitiesVisibility() {
        const nativeActivities = Main.panel.statusArea.activities;
        if (!nativeActivities?.container)
            return;

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
        // Supprimer le bouton Arrera
        if (this._activitiesButton) {
            this._activitiesButton.destroy();
            this._activitiesButton = null;
        }

        // Rétablissement inconditionnel du bouton Activités natif
        if (Main.panel.statusArea.activities?.container) {
            Main.panel.statusArea.activities.container.visible = true;
        }

        // Déconnexion des signaux GSettings
        if (this._settings && this._signalIds) {
            for (const id of this._signalIds)
                this._settings.disconnect(id);
            this._signalIds = [];
        }

        this._settings = null;
    }
}
