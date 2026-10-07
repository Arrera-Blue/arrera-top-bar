#!/bin/bash

# Configuration Arrera Top Bar
SCHEMA="org.gnome.shell.extensions.top-bar"
KEY_LOGO_COLOR="logo-color"

# Couleurs pour le terminal
GREEN="\033[0;32m"
RED="\033[0;31m"
BLUE="\033[0;34m"
BOLD="\033[1m"
RESET="\033[0m"

# Vérifier si gsettings a accès au schéma
if ! gsettings list-schemas | grep -qx "$SCHEMA"; then
    # Vérification avec le dossier local schemas si nécessaire
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ -d "$SCRIPT_DIR/schemas" ]; then
        GSETTINGS_CMD="gsettings --schemadir $SCRIPT_DIR/schemas"
    else
        echo -e "${RED}Erreur : Le schéma $SCHEMA n'est pas trouvé.${RESET}"
        exit 1
    fi
else
    GSETTINGS_CMD="gsettings"
fi

get_val() {
    $GSETTINGS_CMD get "$SCHEMA" "$1" 2>/dev/null | tr -d "'"
}

set_val() {
    $GSETTINGS_CMD set "$SCHEMA" "$1" "$2"
}

format_status() {
    local is_active="$1"
    if [ "$is_active" = "true" ]; then
        echo -e "${GREEN}[ Activé ]${RESET}"
    else
        echo -e "${RED}[ Désactivé ]${RESET}"
    fi
}

while true; do
    clear
    val_logo_color=$(get_val "$KEY_LOGO_COLOR")
    [ -z "$val_logo_color" ] && val_logo_color="colored"

    is_colored="false"
    is_white="false"
    is_black="false"

    case "$val_logo_color" in
        white)
            is_white="true"
            ;;
        black)
            is_black="true"
            ;;
        colored|*)
            is_colored="true"
            ;;
    esac

    echo -e "${BLUE}${BOLD}========================================${RESET}"
    echo -e "${BOLD}    Configuration - Arrera Top Bar      ${RESET}"
    echo -e "${BLUE}${BOLD}========================================${RESET}"
    echo ""
    echo -e " 1) Logo Coloré (accentuation GNOME)   : $(format_status "$is_colored")"
    echo -e " 2) Logo Blanc                         : $(format_status "$is_white")"
    echo -e " 3) Logo Noir                          : $(format_status "$is_black")"
    echo ""
    echo -e " r) Réinitialiser les valeurs par défaut"
    echo -e " q) Quitter"
    echo ""
    echo -e "${BLUE}----------------------------------------${RESET}"
    read -rp "Choisissez une option (1, 2, 3, r, q) : " choix

    case "$choix" in
        1)
            set_val "$KEY_LOGO_COLOR" "'colored'"
            ;;
        2)
            set_val "$KEY_LOGO_COLOR" "'white'"
            ;;
        3)
            set_val "$KEY_LOGO_COLOR" "'black'"
            ;;
        r|R)
            set_val "$KEY_LOGO_COLOR" "'colored'"
            ;;
        q|Q)
            echo "Au revoir !"
            break
            ;;
        *)
            # Choix invalide, la boucle continue
            ;;
    esac
done
