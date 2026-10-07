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
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

/**
 * Bouton personnalisé remplaçant le bouton Activités natif
 * par le logo officiel Arrera Blue.
 */
export const ArreraActivitiesButton = GObject.registerClass(
class ArreraActivitiesButton extends PanelMenu.Button {
    _init(extension) {
        super._init(0.0, 'Activities', true);

        this._extension = extension;
        this.set({
            name: 'panelArreraActivities',
            accessible_role: Atk.Role.TOGGLE_BUTTON,
            accessible_name: 'Activities',
        });

        this.add_style_class_name('panel-button');
        this.add_style_class_name('arrera-activities-button');

        const logoFile = this._findLogoFile();
        if (logoFile) {
            this._icon = new St.Icon({
                gicon: new Gio.FileIcon({ file: logoFile }),
                style_class: 'system-status-icon arrera-activities-icon',
                icon_size: 22,
                y_align: Clutter.ActorAlign.CENTER,
                x_align: Clutter.ActorAlign.CENTER,
            });
        } else {
            this._icon = new St.Icon({
                icon_name: 'view-activities-symbolic',
                style_class: 'system-status-icon arrera-activities-icon',
                icon_size: 22,
                y_align: Clutter.ActorAlign.CENTER,
                x_align: Clutter.ActorAlign.CENTER,
            });
        }
        this.add_child(this._icon);

        // Geste de clic pour basculer l'Overview
        this._clickGesture = new Clutter.ClickGesture();
        this._clickGesture.connect('recognize', () => {
            if (Main.overview.shouldToggleByCornerOrButton?.() ?? true)
                Main.overview.toggle();
        });
        this.add_action(this._clickGesture);

        // Synchronisation visuelle avec l'état ouvert de l'Overview
        Main.overview.connectObject(
            'showing', () => this.add_style_pseudo_class('checked'),
            'hiding', () => this.remove_style_pseudo_class('checked'),
            this
        );
    }

    _findLogoFile() {
        const extPath = this._extension?.path;
        if (!extPath)
            return null;

        const candidates = [
            'icone/arrera-logo.svg',
            'icone/arrera-logo.png',
            'icons/arrera-logo.svg',
            'icons/arrera-logo.png',
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

    vfunc_scroll_event(event) {
        return Main.wm.handleWorkspaceScroll(event);
    }

    vfunc_key_release_event(event) {
        const symbol = event.get_key_symbol();
        if (symbol === Clutter.KEY_Return || symbol === Clutter.KEY_space) {
            if (Main.overview.shouldToggleByCornerOrButton?.() ?? true) {
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
    constructor(extension) {
        this._extension = extension;
        this._activitiesButton = null;

        this._enableActivitiesButton();
    }

    _enableActivitiesButton() {
        const nativeActivities = Main.panel.statusArea.activities;

        // Masquer le bouton Activités natif
        if (nativeActivities?.container) {
            nativeActivities.container.visible = false;
        }

        // Créer et ajouter le bouton Arrera en première position (gauche)
        this._activitiesButton = new ArreraActivitiesButton(this._extension);
        Main.panel.addToStatusArea(`${this._extension.uuid}-activities`, this._activitiesButton, 0, 'left');
    }

    destroy() {
        // Supprimer le bouton Arrera
        if (this._activitiesButton) {
            this._activitiesButton.destroy();
            this._activitiesButton = null;
        }

        // Rétablissement du bouton Activités natif
        if (Main.panel.statusArea.activities) {
            Main.panel.statusArea.activities.container.visible = true;
        }
    }
}
