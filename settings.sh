#!/bin/bash

SCHEMA="org.gnome.shell.extensions.top-bar"
KEY="logo-color"

current=$(gsettings get $SCHEMA $KEY 2>/dev/null | tr -d "'")
if [ -z "$current" ]; then
    current="colored"
fi

echo "========================================"
echo "    Configuration - Arrera Top Bar      "
echo "========================================"
echo ""
echo "Mode actuel : $current"
echo ""
echo "Choisissez la couleur du logo :"
echo "  1) Coloré (suit l'accentuation de GNOME) [défaut]"
echo "  2) Blanc"
echo "  3) Noir"
echo "  q) Quitter"
echo ""
read -rp "Votre choix [1-3, q] : " choice

case "$choice" in
    1)
        gsettings set $SCHEMA $KEY 'colored'
        echo "✅ Logo configuré sur : Coloré"
        ;;
    2)
        gsettings set $SCHEMA $KEY 'white'
        echo "✅ Logo configuré sur : Blanc"
        ;;
    3)
        gsettings set $SCHEMA $KEY 'black'
        echo "✅ Logo configuré sur : Noir"
        ;;
    q|Q)
        echo "Annulé."
        ;;
    *)
        echo "Option invalide."
        ;;
esac
