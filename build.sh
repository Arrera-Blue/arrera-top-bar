#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SPEC_FILE="${ROOT_DIR}/gnome-shell-extension-arrera-top-bar.spec"

PACKAGE_NAME="$(rpmspec -q --queryformat '%{name}\n' "${SPEC_FILE}" 2>/dev/null | head -n1 || grep -E '^Name:' "${SPEC_FILE}" | awk '{print $2}')"
VERSION="$(rpmspec -q --queryformat '%{version}\n' "${SPEC_FILE}" 2>/dev/null | head -n1 || grep -E '^Version:' "${SPEC_FILE}" | awk '{print $2}')"
TARBALL_NAME="${PACKAGE_NAME}-${VERSION}"
BUILD_DIR="${ROOT_DIR}/build_rpm"
OUTPUT_DIR="${ROOT_DIR}/output"

echo "==> Préparation de la construction de ${PACKAGE_NAME}-${VERSION}..."

rm -rf "${BUILD_DIR}" "${OUTPUT_DIR}" "${TARBALL_NAME}.tar.gz"
mkdir -p "${BUILD_DIR}"/{BUILD,RPMS,SOURCES,SPECS,SRPMS} "${OUTPUT_DIR}"

echo "==> Création de l'archive source tar.gz..."
TMP_ARCHIVE_DIR=$(mktemp -d)
mkdir -p "${TMP_ARCHIVE_DIR}/${TARBALL_NAME}"

rsync -a \
    --exclude='.git' \
    --exclude='build_rpm*' \
    --exclude='output' \
    --exclude='build.sh' \
    --exclude='*.tar.gz' \
    "${ROOT_DIR}/" "${TMP_ARCHIVE_DIR}/${TARBALL_NAME}/"

tar -czf "${BUILD_DIR}/SOURCES/${TARBALL_NAME}.tar.gz" -C "${TMP_ARCHIVE_DIR}" "${TARBALL_NAME}"
rm -rf "${TMP_ARCHIVE_DIR}"

cp "${SPEC_FILE}" "${BUILD_DIR}/SPECS/"

echo "==> Lancement de rpmbuild..."
rpmbuild -ba \
    --define "_topdir ${BUILD_DIR}" \
    "${BUILD_DIR}/SPECS/$(basename "${SPEC_FILE}")"

find "${BUILD_DIR}/RPMS" -name "*.rpm" -exec cp {} "${OUTPUT_DIR}/" \;
find "${BUILD_DIR}/SRPMS" -name "*.rpm" -exec cp {} "${OUTPUT_DIR}/" \;

rm -rf "${BUILD_DIR}"

echo ""
echo "=========================================================="
echo " [SUCCÈS] RPMs générés dans : ${OUTPUT_DIR}"
echo "=========================================================="
ls -lh "${OUTPUT_DIR}"
