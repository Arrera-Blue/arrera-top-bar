%global uuid top-bar@linux.arrera-software.fr

Name:           gnome-shell-extension-arrera-top-bar
Version:        1.0.0
Release:        0.1.beta1%{?dist}
Summary:        Barre supérieure moderne pour GNOME Shell (Distribution Arrera Blue)

License:        GPL-2.0-or-later
URL:            https://github.com/Arrera-Blue/arrera-top-bar
Source0:        %{name}-%{version}.tar.gz

BuildArch:      noarch

BuildRequires:  glib2-devel
Requires:       gnome-shell >= 45
Requires:       glib2

Provides:       arrera-top-bar = %{version}-%{release}
Provides:       gnome-shell-extension-top-bar = %{version}-%{release}

%description
Arrera Top Bar est une extension de personnalisation et de gestion de la barre supérieure pour GNOME Shell, conçue pour la distribution Arrera Blue Linux.

%prep
%autosetup -n %{name}-%{version}

%build
glib-compile-schemas schemas/

%install
rm -rf %{buildroot}

install -d -m 0755 %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}
install -d -m 0755 %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}/schemas

install -p -m 0644 metadata.json %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}/
install -p -m 0644 extension.js %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}/
install -p -m 0644 topBar.js %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}/
install -p -m 0644 stylesheet.css %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}/

install -d -m 0755 %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}/icone
install -p -m 0644 icone/* %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}/icone/

install -p -m 0644 schemas/org.gnome.shell.extensions.top-bar.gschema.xml %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}/schemas/
install -p -m 0644 schemas/gschemas.compiled %{buildroot}%{_datadir}/gnome-shell/extensions/%{uuid}/schemas/

install -d -m 0755 %{buildroot}%{_datadir}/glib-2.0/schemas
install -p -m 0644 schemas/org.gnome.shell.extensions.top-bar.gschema.xml %{buildroot}%{_datadir}/glib-2.0/schemas/

%files
%doc README.md
%{_datadir}/gnome-shell/extensions/%{uuid}/
%{_datadir}/glib-2.0/schemas/org.gnome.shell.extensions.top-bar.gschema.xml

%changelog
* Wed Oct 07 2026 Arrera Software <contact@arrera.org> - 1.0.0-0.1.beta1
- Initialisation du squelette d'extension Arrera Top Bar pour Arrera Blue Linux
