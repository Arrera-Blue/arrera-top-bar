/* topBar.js
 *
 * Arrera Top Bar - Gestionnaire de la barre supérieure
 * Distribution Arrera Blue
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

/**
 * Contrôleur principal de la Top Bar
 * Gère uniquement la personnalisation, l'apparence et l'état de la barre supérieure native.
 */
export class ArreraTopBar {
    constructor(extension) {
        this._extension = extension;
        this._settings = extension.getSettings();
        this._signalIds = [];

        this._applySettings();
        this._bindSettings();
    }

    _bindSettings() {
        const keys = [
            'show-activities-button',
            'show-date-menu',
            'show-quick-settings',
            'style-mode',
        ];

        for (const key of keys) {
            const id = this._settings.connect(`changed::${key}`, () => {
                this._applySettings();
            });
            this._signalIds.push(id);
        }
    }

    _applySettings() {
        // Gestion de la visibilité des composants natifs
        const showActivities = this._settings.get_boolean('show-activities-button');
        const showDate = this._settings.get_boolean('show-date-menu');
        const showQuickSettings = this._settings.get_boolean('show-quick-settings');
        const styleMode = this._settings.get_string('style-mode');

        if (Main.panel.statusArea.activities) {
            Main.panel.statusArea.activities.container.visible = showActivities;
        }

        if (Main.panel.statusArea.dateMenu) {
            Main.panel.statusArea.dateMenu.container.visible = showDate;
        }

        if (Main.panel.statusArea.quickSettings) {
            Main.panel.statusArea.quickSettings.container.visible = showQuickSettings;
        }

        // Application des styles CSS sur Main.panel
        this._applyStyleMode(styleMode);
    }

    _applyStyleMode(mode) {
        const panel = Main.panel;
        const styleClasses = [
            'arrera-topbar-default',
            'arrera-topbar-transparent',
            'arrera-topbar-floating',
            'arrera-topbar-pill',
        ];

        for (const cls of styleClasses) {
            panel.remove_style_class_name(cls);
        }

        panel.add_style_class_name(`arrera-topbar-${mode}`);
    }

    destroy() {
        // Déconnexion des signaux GSettings
        for (const id of this._signalIds) {
            this._settings.disconnect(id);
        }
        this._signalIds = [];

        // Rétablissement de la visibilité d'origine des composants natifs
        if (Main.panel.statusArea.activities)
            Main.panel.statusArea.activities.container.visible = true;

        if (Main.panel.statusArea.dateMenu)
            Main.panel.statusArea.dateMenu.container.visible = true;

        if (Main.panel.statusArea.quickSettings)
            Main.panel.statusArea.quickSettings.container.visible = true;

        // Nettoyage des styles CSS ajoutés sur Main.panel
        const panel = Main.panel;
        const styleClasses = [
            'arrera-topbar-default',
            'arrera-topbar-transparent',
            'arrera-topbar-floating',
            'arrera-topbar-pill',
        ];
        for (const cls of styleClasses) {
            panel.remove_style_class_name(cls);
        }
    }
}
