#!/bin/bash

# Configuration Arrera Top Bar
SCHEMA="org.gnome.shell.extensions.top-bar"
KEY_LOGO_COLOR="logo-color"
KEY_LAUNCH_APP="launch-custom-app"
KEY_APP_ID="custom-app-id"
KEY_KEEP_ACTIVITIES="keep-activities-button"
KEY_THEME="theme"
KEY_INVISIBLE_COLOR="invisible-elements-color"

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
    val_theme=$(get_val "$KEY_THEME")
    [ -z "$val_theme" ] && val_theme="vanilla"

    val_invisible_color=$(get_val "$KEY_INVISIBLE_COLOR")
    [ -z "$val_invisible_color" ] && val_invisible_color="auto"

    val_logo_color=$(get_val "$KEY_LOGO_COLOR")
    [ -z "$val_logo_color" ] && val_logo_color="colored"

    val_launch_app=$(get_val "$KEY_LAUNCH_APP")
    val_app_id=$(get_val "$KEY_APP_ID")
    val_keep_activities=$(get_val "$KEY_KEEP_ACTIVITIES")

    is_vanilla="false"
    is_invisible="false"
    is_tinted_dark="false"
    is_tinted_light="false"

    case "$val_theme" in
        invisible)
            is_invisible="true"
            ;;
        tinted-dark)
            is_tinted_dark="true"
            ;;
        tinted-light)
            is_tinted_light="true"
            ;;
        vanilla|*)
            is_vanilla="true"
            ;;
    esac

    is_inv_auto="false"
    is_inv_white="false"
    is_inv_black="false"

    case "$val_invisible_color" in
        white)
            is_inv_white="true"
            ;;
        black)
            is_inv_black="true"
            ;;
        auto|*)
            is_inv_auto="true"
            ;;
    esac

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
    echo -e "${BOLD}Thème de la barre supérieure :${RESET}"
    echo -e " 1) Vanilla (Défaut GNOME)             : $(format_status "$is_vanilla")"
    echo -e " 2) Invisible (Transparent)            : $(format_status "$is_invisible")"
    echo -e " 3) Tinté Sombre                       : $(format_status "$is_tinted_dark")"
    echo -e " 4) Tinté Clair                        : $(format_status "$is_tinted_light")"
    echo ""
    if [ "$val_theme" = "invisible" ]; then
        echo -e "${BOLD}Couleur des éléments (mode Invisible) :${RESET}"
        echo -e " 5) Auto (détection fond d'écran)      : $(format_status "$is_inv_auto")"
        echo -e " 6) Blanc (forcé)                      : $(format_status "$is_inv_white")"
        echo -e " 7) Noir (forcé)                       : $(format_status "$is_inv_black")"
    else
        echo -e "${BOLD}Couleur des éléments (mode Invisible) :${RESET}"
        echo -e "    ${RED}[ Verrouillé (activer le thème Invisible - option 2) ]${RESET}"
    fi
    echo ""
    echo -e "${BOLD}Style du logo Arrera :${RESET}"
    echo -e " 8) Logo Coloré (accentuation GNOME)   : $(format_status "$is_colored")"
    echo -e " 9) Logo Blanc                         : $(format_status "$is_white")"
    echo -e " 10) Logo Noir                         : $(format_status "$is_black")"
    echo ""
    echo -e "${BOLD}Action du bouton au clic :${RESET}"
    echo -e " 11) Lancer une application au clic    : $(format_status "$val_launch_app")"
    if [ -n "$val_app_id" ]; then
        echo -e " 12) Application configurée            : ${BOLD}$val_app_id${RESET}"
    else
        echo -e " 12) Application configurée            : ${RED}[ Non définie ]${RESET}"
    fi
    if [ "$val_launch_app" = "true" ]; then
        echo -e " 13) Conserver le bouton Activités    : $(format_status "$val_keep_activities")"
    else
        echo -e " 13) Conserver le bouton Activités    : ${RED}[ Verrouillé (activer l'option 11) ]${RESET}"
    fi
    echo ""
    echo -e " r) Réinitialiser les valeurs par défaut"
    echo -e " q) Quitter"
    echo ""
    echo -e "${BLUE}----------------------------------------${RESET}"
    read -rp "Choisissez une option (1-13, r, q) : " choix

    case "$choix" in
        1)
            set_val "$KEY_THEME" "'vanilla'"
            ;;
        2)
            set_val "$KEY_THEME" "'invisible'"
            ;;
        3)
            set_val "$KEY_THEME" "'tinted-dark'"
            ;;
        4)
            set_val "$KEY_THEME" "'tinted-light'"
            ;;
        5)
            if [ "$val_theme" = "invisible" ]; then
                set_val "$KEY_INVISIBLE_COLOR" "'auto'"
            else
                echo -e "${RED}⚠️  Activez d'abord le thème Invisible (option 2).${RESET}"
                sleep 2
            fi
            ;;
        6)
            if [ "$val_theme" = "invisible" ]; then
                set_val "$KEY_INVISIBLE_COLOR" "'white'"
            else
                echo -e "${RED}⚠️  Activez d'abord le thème Invisible (option 2).${RESET}"
                sleep 2
            fi
            ;;
        7)
            if [ "$val_theme" = "invisible" ]; then
                set_val "$KEY_INVISIBLE_COLOR" "'black'"
            else
                echo -e "${RED}⚠️  Activez d'abord le thème Invisible (option 2).${RESET}"
                sleep 2
            fi
            ;;
        8)
            set_val "$KEY_LOGO_COLOR" "'colored'"
            ;;
        9)
            set_val "$KEY_LOGO_COLOR" "'white'"
            ;;
        10)
            set_val "$KEY_LOGO_COLOR" "'black'"
            ;;
        11)
            toggle_val "$KEY_LAUNCH_APP"
            current_launch=$(get_val "$KEY_LAUNCH_APP")
            if [ "$current_launch" != "true" ]; then
                set_val "$KEY_KEEP_ACTIVITIES" false
            fi
            ;;
        12)
            echo ""
            read -rp "Entrez l'identifiant de l'app ou commande (ex: ptyxis, org.gnome.Nautilus.desktop) : " new_app
            if [ -n "$new_app" ]; then
                set_val "$KEY_APP_ID" "'$new_app'"
                set_val "$KEY_LAUNCH_APP" true
            fi
            ;;
        13)
            current_launch=$(get_val "$KEY_LAUNCH_APP")
            if [ "$current_launch" = "true" ]; then
                toggle_val "$KEY_KEEP_ACTIVITIES"
            else
                echo ""
                echo -e "${RED}⚠️  L'option 13 ne peut être activée que si l'option 11 (Lancer une application au clic) est active.${RESET}"
                sleep 2
            fi
            ;;
        r|R)
            set_val "$KEY_THEME" "'vanilla'"
            set_val "$KEY_INVISIBLE_COLOR" "'auto'"
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
