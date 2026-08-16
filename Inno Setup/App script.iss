; ============================================
; AirAMB Installer
; ============================================

#define MyAppName      "AirAMB"
#define MyAppVersion   "1.0"
#define MyAppPublisher "AirAMB"
#define MyAppExeName   "AirAMB.exe"

[Setup]
AppId={{F83830E7-2760-4E8D-A5A2-83C8DF2291DB}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}

; Installation folder on the system
DefaultDirName={autopf}\{#MyAppName}

; Icon shown in "Add/Remove Programs"
UninstallDisplayIcon={app}\{#MyAppExeName}

; Architecture and permissions
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
DisableProgramGroupPage=yes

; License
LicenseFile=license.txt

; ===== Folder where the installer will be created =====
; (Path RELATIVE to the .iss file)
OutputDir=..\Ejecutable
OutputBaseFilename=AirAMB_Setup

; Installer icon
SetupIconFile=..\Logo\AirAMB_Logo.ico

SolidCompression=yes
WizardStyle=modern dynamic

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]

; Path RELATIVE to the .iss file inside "Inno Setup"
Source: "..\dist\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent


