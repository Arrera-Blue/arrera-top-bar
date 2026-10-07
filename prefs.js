/* prefs.js
 *
 * Arrera Top Bar - Préférences de l'extension
 * Distribution Arrera Blue
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import Adw from 'gi://Adw';
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

        const group = new Adw.PreferencesGroup({
            title: _('Bouton Activités'),
            description: _('Personnalisation du logo Arrera Blue dans la barre supérieure.'),
        });
        page.add(group);

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

        group.add(comboRow);
    }
}
