#!/bin/bash

# Configuration Arrera Top Bar
SCHEMA="org.gnome.shell.extensions.top-bar"
KEY_ACTIVITIES="show-activities-button"
KEY_DATE="show-date-menu"
KEY_QUICKSETTINGS="show-quick-settings"
KEY_AUTOHIDE="autohide"
KEY_FULLSCREEN="hide-in-fullscreen"
KEY_STYLE="style-mode"

# Couleurs pour le terminal
GREEN="\033[0;32m"
RED="\033[0;31m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
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
    $GSETTINGS_CMD get "$SCHEMA" "$1"
}

set_val() {
    $GSETTINGS_CMD set "$SCHEMA" "$1" "$2"
}

toggle_val() {
    local key="$1"
    local current
    current=$(get_val "$key")
    if [ "$current" = "true" ]; then
        set_val "$key" false
    else
        set_val "$key" true
    fi
}

cycle_style() {
    local current
    current=$(get_val "$KEY_STYLE" | tr -d "'")
    case "$current" in
        "default")
            set_val "$KEY_STYLE" "'transparent'"
            ;;
        "transparent")
            set_val "$KEY_STYLE" "'floating'"
            ;;
        "floating")
            set_val "$KEY_STYLE" "'pill'"
            ;;
        "pill"|*)
            set_val "$KEY_STYLE" "'default'"
            ;;
    esac
}

format_status() {
    local val="$1"
    if [ "$val" = "true" ]; then
        echo -e "${GREEN}[ Activé ]${RESET}"
    else
        echo -e "${RED}[ Désactivé ]${RESET}"
    fi
}

format_style() {
    local val="$1"
    echo -e "${CYAN}[ $val ]${RESET}"
}

while true; do
    clear
    val_activities=$(get_val "$KEY_ACTIVITIES")
    val_date=$(get_val "$KEY_DATE")
    val_qs=$(get_val "$KEY_QUICKSETTINGS")
    val_autohide=$(get_val "$KEY_AUTOHIDE")
    val_fullscreen=$(get_val "$KEY_FULLSCREEN")
    val_style=$(get_val "$KEY_STYLE" | tr -d "'")

    echo -e "${BLUE}${BOLD}========================================${RESET}"
    echo -e "${BOLD}   Configuration - Arrera Top Bar    ${RESET}"
    echo -e "${BLUE}${BOLD}========================================${RESET}"
    echo ""
    echo -e " 1) Afficher bouton Activités          : $(format_status "$val_activities")"
    echo -e " 2) Afficher Date et Horloge          : $(format_status "$val_date")"
    echo -e " 3) Afficher Paramètres rapides       : $(format_status "$val_qs")"
    echo -e " 4) Masquage automatique              : $(format_status "$val_autohide")"
    echo -e " 5) Masquer en plein écran            : $(format_status "$val_fullscreen")"
    echo -e " 6) Style de la barre                 : $(format_style "$val_style")"
    echo ""
    echo -e " r) Réinitialiser les valeurs par défaut"
    echo -e " q) Quitter"
    echo ""
    echo -e "${BLUE}----------------------------------------${RESET}"
    read -rp "Choisissez une option (1-6, r, q) : " choix

    case "$choix" in
        1)
            toggle_val "$KEY_ACTIVITIES"
            ;;
        2)
            toggle_val "$KEY_DATE"
            ;;
        3)
            toggle_val "$KEY_QUICKSETTINGS"
            ;;
        4)
            toggle_val "$KEY_AUTOHIDE"
            ;;
        5)
            toggle_val "$KEY_FULLSCREEN"
            ;;
        6)
            cycle_style
            ;;
        r|R)
            set_val "$KEY_ACTIVITIES" true
            set_val "$KEY_DATE" true
            set_val "$KEY_QUICKSETTINGS" true
            set_val "$KEY_AUTOHIDE" false
            set_val "$KEY_FULLSCREEN" true
            set_val "$KEY_STYLE" "'default'"
            ;;
        q|Q)
            echo "Au revoir !"
            break
            ;;
        *)
            # Choix invalide
            ;;
    esac
done
