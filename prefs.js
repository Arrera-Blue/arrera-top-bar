/* prefs.js
 *
 * Arrera Top Bar - Préférences de l'extension
 * Distribution Arrera Blue
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class ArreraTopBarPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: _('Général'),
            icon_name: 'preferences-desktop-display-symbolic',
        });
        window.add(page);

        // Groupe 1 : Apparence du logo
        const groupLogo = new Adw.PreferencesGroup({
            title: _('Bouton Activités'),
            description: _('Personnalisation du logo Arrera Blue dans la barre supérieure.'),
        });
        page.add(groupLogo);

        const modes = [
            { id: 'colored', title: _('Coloré (accentuation GNOME)') },
            { id: 'white', title: _('Blanc') },
            { id: 'black', title: _('Noir') },
        ];

        const model = new Gtk.StringList();
        modes.forEach(mode => model.append(mode.title));

        const comboRow = new Adw.ComboRow({
            title: _('Couleur du logo'),
            subtitle: _('Style de couleur appliqué au logo Arrera'),
            model,
        });

        const currentMode = settings.get_string('logo-color');
        const currentIndex = modes.findIndex(m => m.id === currentMode);
        if (currentIndex !== -1)
            comboRow.selected = currentIndex;

        comboRow.connect('notify::selected', () => {
            const selectedMode = modes[comboRow.selected];
            if (selectedMode)
                settings.set_string('logo-color', selectedMode.id);
        });

        groupLogo.add(comboRow);

        // Groupe 2 : Action déclenchée par le bouton
        const groupAction = new Adw.PreferencesGroup({
            title: _('Action du bouton'),
            description: _('Personnalisation de l’action déclenchée au clic sur le bouton Arrera.'),
        });
        page.add(groupAction);

        const launchSwitch = new Adw.SwitchRow({
            title: _('Lancer une application au clic'),
            subtitle: _('Lance une application personnalisée au lieu d’ouvrir les Activités'),
        });
        groupAction.add(launchSwitch);
        settings.bind('launch-custom-app', launchSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

        const appEntry = new Adw.EntryRow({
            title: _('Application ou commande (.desktop / binaire)'),
            text: settings.get_string('custom-app-id'),
        });
        groupAction.add(appEntry);
        settings.bind('custom-app-id', appEntry, 'text', Gio.SettingsBindFlags.DEFAULT);

        launchSwitch.bind_property(
            'active',
            appEntry,
            'sensitive',
            GObject.BindingFlags.SYNC_CREATE
        );

        const keepActivitiesSwitch = new Adw.SwitchRow({
            title: _('Conserver le bouton Activités de GNOME'),
            subtitle: _('Affiche le bouton natif Activités (indicateur d’espaces de travail) à droite du logo Arrera'),
        });
        groupAction.add(keepActivitiesSwitch);
        settings.bind('keep-activities-button', keepActivitiesSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

        launchSwitch.bind_property(
            'active',
            keepActivitiesSwitch,
            'sensitive',
            GObject.BindingFlags.SYNC_CREATE
        );

        launchSwitch.connect('notify::active', () => {
            if (!launchSwitch.active) {
                settings.set_boolean('keep-activities-button', false);
            }
        });
    }
}
