#!/bin/bash
# Recompiler les schémas GSettings locaux
if [ -d "schemas" ]; then
    glib-compile-schemas schemas/
    # Enregistrer et compiler le schéma pour gnome-control-center
    mkdir -p "$HOME/.local/share/glib-2.0/schemas"
    if [ -f "schemas/org.gnome.shell.extensions.top-bar.gschema.xml" ]; then
        cp -u schemas/org.gnome.shell.extensions.top-bar.gschema.xml "$HOME/.local/share/glib-2.0/schemas/"
        glib-compile-schemas "$HOME/.local/share/glib-2.0/schemas"
    fi
fi

# S'assurer que le mode sans échec de GNOME Shell est levé et les extensions activées
rm -f "/run/user/$(id -u)/gnome-shell-disable-extensions"
gsettings set org.gnome.shell disable-user-extensions false
gsettings set org.gnome.shell enabled-extensions "['dock@linux.arrera-software.fr', 'app-menu@linux.arrera-software.fr', 'top-bar@linux.arrera-software.fr']"

# Lancer la session de test GNOME Shell
dbus-run-session -- gnome-shell --devkit
