/* extension.js
 *
 * Arrera Top Bar - Extension GNOME Shell
 * Distribution Arrera Blue
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { ArreraTopBar } from './topBar.js';

export default class ArreraTopBarExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._topBar = new ArreraTopBar(this);
    }

    disable() {
        if (this._topBar) {
            this._topBar.destroy();
            this._topBar = null;
        }

        this._settings = null;
    }
}
