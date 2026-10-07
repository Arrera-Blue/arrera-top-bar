#!/bin/bash

# Configuration Arrera Top Bar
SCHEMA="org.gnome.shell.extensions.top-bar"
KEY_LOGO_COLOR="logo-color"
KEY_LAUNCH_APP="launch-custom-app"
KEY_APP_ID="custom-app-id"
KEY_KEEP_ACTIVITIES="keep-activities-button"

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

    val_launch_app=$(get_val "$KEY_LAUNCH_APP")
    val_app_id=$(get_val "$KEY_APP_ID")
    val_keep_activities=$(get_val "$KEY_KEEP_ACTIVITIES")

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
    echo -e "${BOLD}Style du logo Arrera :${RESET}"
    echo -e " 1) Logo Coloré (accentuation GNOME)   : $(format_status "$is_colored")"
    echo -e " 2) Logo Blanc                         : $(format_status "$is_white")"
    echo -e " 3) Logo Noir                          : $(format_status "$is_black")"
    echo ""
    echo -e "${BOLD}Action du bouton au clic :${RESET}"
    echo -e " 4) Lancer une application au clic     : $(format_status "$val_launch_app")"
    if [ -n "$val_app_id" ]; then
        echo -e " 5) Application configurée             : ${BOLD}$val_app_id${RESET}"
    else
        echo -e " 5) Application configurée             : ${RED}[ Non définie ]${RESET}"
    fi
    if [ "$val_launch_app" = "true" ]; then
        echo -e " 6) Conserver le bouton Activités      : $(format_status "$val_keep_activities")"
    else
        echo -e " 6) Conserver le bouton Activités      : ${RED}[ Verrouillé (activer l'option 4) ]${RESET}"
    fi
    echo ""
    echo -e " r) Réinitialiser les valeurs par défaut"
    echo -e " q) Quitter"
    echo ""
    echo -e "${BLUE}----------------------------------------${RESET}"
    read -rp "Choisissez une option (1-6, r, q) : " choix

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
        4)
            toggle_val "$KEY_LAUNCH_APP"
            current_launch=$(get_val "$KEY_LAUNCH_APP")
            if [ "$current_launch" != "true" ]; then
                set_val "$KEY_KEEP_ACTIVITIES" false
            fi
            ;;
        5)
            echo ""
            read -rp "Entrez l'identifiant de l'app ou commande (ex: ptyxis, org.gnome.Nautilus.desktop) : " new_app
            if [ -n "$new_app" ]; then
                set_val "$KEY_APP_ID" "'$new_app'"
                set_val "$KEY_LAUNCH_APP" true
            fi
            ;;
        6)
            current_launch=$(get_val "$KEY_LAUNCH_APP")
            if [ "$current_launch" = "true" ]; then
                toggle_val "$KEY_KEEP_ACTIVITIES"
            else
                echo ""
                echo -e "${RED}⚠️  L'option 6 ne peut être activée que si l'option 4 (Lancer une application au clic) est active.${RESET}"
                sleep 2
            fi
            ;;
        r|R)
            set_val "$KEY_LOGO_COLOR" "'colored'"
            set_val "$KEY_LAUNCH_APP" false
            set_val "$KEY_APP_ID" "''"
            set_val "$KEY_KEEP_ACTIVITIES" false
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
