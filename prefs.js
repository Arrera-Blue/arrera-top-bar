/* prefs.js
 *
 * Arrera Top Bar - Préférences de l'extension
 * Distribution Arrera Blue
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class ArreraTopBarPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        // Page principale
        const page = new Adw.PreferencesPage({
            title: _('Général'),
            icon_name: 'preferences-desktop-display-symbolic',
        });
        window.add(page);

        // Groupe : Apparence
        const appearanceGroup = new Adw.PreferencesGroup({
            title: _('Apparence'),
            description: _('Personnalisation visuelle de la barre supérieure'),
        });
        page.add(appearanceGroup);

        // Style Mode (ComboRow)
        const styleChoices = ['default', 'transparent', 'floating', 'pill'];
        const styleNames = [_('Par défaut'), _('Transparent'), _('Flottant'), _('Pilule')];
        const stringList = new Gtk.StringList();
        styleNames.forEach(name => stringList.append(name));

        const styleRow = new Adw.ComboRow({
            title: _('Style de la barre'),
            subtitle: _('Modifier l’apparence et les bordures du panel'),
            model: stringList,
        });

        const currentStyle = settings.get_string('style-mode');
        const currentIndex = styleChoices.indexOf(currentStyle);
        if (currentIndex >= 0) {
            styleRow.selected = currentIndex;
        }

        styleRow.connect('notify::selected', () => {
            const selectedChoice = styleChoices[styleRow.selected];
            if (selectedChoice) {
                settings.set_string('style-mode', selectedChoice);
            }
        });
        appearanceGroup.add(styleRow);

        // Groupe : Éléments du panel
        const componentsGroup = new Adw.PreferencesGroup({
            title: _('Éléments de la barre'),
            description: _('Afficher ou masquer les composants par défaut de GNOME'),
        });
        page.add(componentsGroup);

        // Switch: Activités
        const activitiesRow = new Adw.SwitchRow({
            title: _('Bouton Activités'),
            subtitle: _('Afficher le bouton Activités à gauche'),
        });
        settings.bind('show-activities-button', activitiesRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        componentsGroup.add(activitiesRow);

        // Switch: Date et heure
        const dateRow = new Adw.SwitchRow({
            title: _('Date et Horloge'),
            subtitle: _('Afficher le menu de date, heure et calendrier au centre'),
        });
        settings.bind('show-date-menu', dateRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        componentsGroup.add(dateRow);

        // Switch: Paramètres rapides
        const quickSettingsRow = new Adw.SwitchRow({
            title: _('Paramètres rapides (Quick Settings)'),
            subtitle: _('Afficher le menu système (Wi-Fi, son, batterie) à droite'),
        });
        settings.bind('show-quick-settings', quickSettingsRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        componentsGroup.add(quickSettingsRow);

        // Groupe : Comportement
        const behaviorGroup = new Adw.PreferencesGroup({
            title: _('Comportement'),
            description: _('Options d’affichage contextuel'),
        });
        page.add(behaviorGroup);

        const autohideRow = new Adw.SwitchRow({
            title: _('Masquage automatique'),
            subtitle: _('Masquer automatiquement la barre supérieure'),
        });
        settings.bind('autohide', autohideRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        behaviorGroup.add(autohideRow);

        const fullscreenRow = new Adw.SwitchRow({
            title: _('Masquer en plein écran'),
            subtitle: _('Masquer la barre lorsqu’une application est en plein écran'),
        });
        settings.bind('hide-in-fullscreen', fullscreenRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        behaviorGroup.add(fullscreenRow);
    }
}
