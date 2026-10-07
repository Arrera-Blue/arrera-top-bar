/* prefs.js
 *
 * Arrera Top Bar - Préférences de l'extension
 * Distribution Arrera Blue
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import Adw from 'gi://Adw';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class ArreraTopBarPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const page = new Adw.PreferencesPage({
            title: _('Général'),
            icon_name: 'preferences-desktop-display-symbolic',
        });
        window.add(page);

        const group = new Adw.PreferencesGroup({
            title: _('Arrera Top Bar'),
            description: _('Aucun paramètre configurable pour le moment.'),
        });
        page.add(group);
    }
}
