# ioBroker.discord

![Logo](../../admin/discord.png)

Dieser [ioBroker] Adapter integriert einen [Discord] Bot in ioBroker.

Der Adapter erstellt einen Objektbaum mit Objekten und Zuständen für die Server
und Kanäle, in denen der Bot vertreten ist.
Zudem wird ein Objektbaum für alle Benutzer, die vom Bot gesehen werden, erstellt.  
Über diese Zustände ist es dann möglich über Discord Nachrichten zu empfangen
und Nachrichten sowie Dateien zu versenden.

Zusätzlich kann der Adapter Discord Slash-Befehle registrieren.
Über diese ist es dann möglich, ioBroker-Zustände abzufragen oder zu festzulegen.

* [Funktionen](#funktionen)
* [Erstellen eines Discord Bots](#erstellen-eines-discord-bots)
* [Den Bot einem Server hinzufügen](#den-bot-einem-server-hinzufügen)
* [Zustände (States)](#zustände-states)
  * [discord.0.bot.*](#discord0bot)
  * [discord.0.servers.\<server-id\>.*](#discord0serversserver-id)
  * [discord.0.servers.\<server-id\>.channels.\<channel-id\>.*](#discord0serversserver-idchannelschannel-id)
  * [discord.0.servers.\<server-id\>.members.\<user-id\>.*](#discord0serversserver-idmembersuser-id)
  * [discord.0.users.\<user-id\>.*](#discord0usersuser-id)
  * [discord.0.raw.*](#discord0raw)
* [Autorisierung](#autorisierung)
* [Nachrichten](#nachrichten)
  * [Nachrichten empfangen](#nachrichten-empfangen)
    * [Verwendung von text2command](#verwendung-von-text2command)
  * [Nachrichten senden](#nachrichten-senden)
    * [Senden einfacher Texte](#senden-einfacher-texte)
    * [Senden von Dateien](#senden-von-dateien)
    * [Senden von Reaktionen](#senden-von-reaktionen)
    * [Senden von Antworten](#senden-von-antworten)
    * [Senden von speziellen benutzerdefinierten Nachrichten](#senden-von-speziellen-benutzerdefinierten-nachrichten)
* [Slash-Befehle](#slash-befehle)
  * [Zustände für Slash-Befehle konfigurieren](#zustände-für-slash-befehle-konfigurieren)
  * [Zustände abfragen](#zustände-abfragen)
  * [Zustände festlegen](#zustände-festlegen)
  * [Einen Überblick über Zustände mit Konfigurationen für Slash-Befehle erhalten](#einen-überblick-über-zustände-mit-konfigurationen-für-slash-befehle-erhalten)
* [Verwendung in Skripten](#verwendung-in-skripten)
  * [Senden einer Nachricht in einem Skript](#senden-einer-nachricht-in-einem-skript)
  * [Bearbeiten einer Nachricht in einem Skript](#bearbeiten-einer-nachricht-in-einem-skript)
  * [Löschen einer Nachricht in einem Skript](#löschen-einer-nachricht-in-einem-skript)
  * [Reaktions-Emoji zu einer Nachricht hinzufügen in einem Skript](#reaktions-emoji-zu-einer-nachricht-hinzufügen-in-einem-skript)
  * [Auf Reaktionen auf eine Nachricht warten in einem Skript](#auf-reaktionen-auf-eine-nachricht-warten-in-einem-skript)

## Funktionen

* ioBroker-Zustände für alle Server des Bots zum Empfangen und Senden von Nachrichten
* ioBroker-Zustände für alle Benutzer, die vom Bot gesehen werden, zum Empfangen und Senden von Direktnachrichten
* Festlegen des Bot-Status inklusive Aktionen
* Optional beobachten des Anwesenheitsstatus der Benutzer
* Optional beobachten des Voice-Status der Benutzer
* Voice-Aktionen für Servermitglieder (stumm, gehörlos, trennen)
* Behandlung aller Nachrichten, oder nur von Nachrichten mit Erwähnungen des Bots in Serverkanälen
* Behandlung von Direktnachrichten
* Optional automatisch mit einem Emoji auf Erwähnungen des Bots reagieren
* `.json`-Zustände für Kanal-, Benutzer- und Nachrichten-Daten
* Nachrichten, Dateien, Reaktionen (Emojis), Antworten, oder benutzerdefinierte Nachrichteninhalte mit JSON-Formatierung senden
* Auflistung der Server- und Kanalmitglieder inklusive der zugeteilten Rollen
* Unterstützung von Discord Slash-Befehlen zum Abfragen und Festlegen von Zustandswerten
* Unterstützung von [text2command] (muss für jeden `.message`-Zustand einzeln aktiviert werden)
* Senden, bearbeiten und löschen von Nachrichten, Senden von und warten auf Reaktionen auf Nachrichten in eigenen Skripten
* Optional raw-Zustände für mehr Flexibilität in einen Skripten

Es fehlt ein Feature? Erstelle einfach ein Feature-Request auf [GitHub][GitHub New Issue].

## Erstellen eines Discord Bots

Um diesen Adapter zu benutzen, muss eine Discord Bot Anwendung erstellt werden.

1. Gehe zum [Discord Developer Portal] und logge dich mit deinem Discord-Account ein, wenn nicht bereits eingeloggt.
2. In der _Applications_ Ansicht, klicke auf den Button _New Application_ oben rechts.  
[![New Application](../en/media/bot-creation-1.png)](../en/media/bot-creation-1.png)
3. Wähle einen Namen für die Applikation (das wird der Name des Bots) und klicke _Create_.  
[![Application Name](../en/media/bot-creation-2.png)](../en/media/bot-creation-2.png)
4. (Optional) Lade ein _App Icon_ hoch, ändere den Namen (_Name_), Ändere die Beschreibung (_Description_), füge ein paar _Tags_ hinzu und speichere die Änderungen (_Save Changes_).  
[![Application Settings](../en/media/bot-creation-3.png)](../en/media/bot-creation-3.png)
5. Navigiere im linken Menü zu _Bot_ klicke den _Add Bot_ Button.  
[![Add Bot](../en/media/bot-creation-4.png)](../en/media/bot-creation-4.png)  
Im folgenden Dialog klicke _Yes, do it!_ um die Erstellung des Bots zu bestätigen.
6. Wenn der Bot erstellt ist, musst du einmalig auf den Button _Reset Token_ klicken, um das Bot-Token zu erhalten.  
[![Reset Token](../en/media/bot-creation-5.png)](../en/media/bot-creation-5.png)  
Da dies alle früheren Tokens für ungültig erklärt, musst du dies mit dem Button _Yes, do it!_ im aufpoppenden Dialog bestätigen.  
Danach wird das Bot-Token **einmalig** angezeigt und du solltest es an einen sicheren Ort kopieren (z.B. die Konfiguration der Adapterinstanz).
7. Scrolle auf der _Bot_-Seite ein Stück herunter zu _Privileged Gateway Intents_ und aktiviere _Presence Intent_, _Server Members Intent_ sowie _Message Content Intent_. Vergiss nicht die Änderungen zu speichern (_Save Changes_).  
[![Privileged Gateway Intents](../en/media/bot-creation-6.png)](../en/media/bot-creation-6.png)  
Hinweis: Sobald der Bot auf mehr als 100 Servern vertreten ist, werden diese Intents eine Verifikation und Genehmigung seitens Discord benötigen.
8. Jetzt ist alles bereit, um die Adapterinstanz zu starten und anschließend den Bot einem Discord-Server hinzuzufügen.

## Den Bot einem Server hinzufügen

Um den Bot einem Server hinzuzufügen, kann in der Konfiguration der
Adapterinstanz der Reiter _Bot zu einem Server hinzufügen_ genutzt werden.
Dort wird ein Link angezeigt, mit dem der Bot zu einem Server hinzugefügt werden
kann, wobei alle nötigen Berechtigungen und Anwendungsbereiche richtig gesetzt werden.

[![Bot zu einem Server hinzufügen](./media/bot-zu-server-hinzufuegen.png)](./media/bot-zu-server-hinzufuegen.png)

Die folgenden Bot-Berechtigungen werden vom Adapter benötigt:

* Spitznamen ändern
* Nachrichten lesen/Kanäle anzeigen
* Mitglieder moderieren
* Nachrichten senden
* Links einbetten
* Dateien anhängen
* Nachrichtenverlauf lesen
* Jeden erwähnen
* Reaktionen hinzufügen
* Mitglieder stummschalten
* Mitglieder gehörlosschalten
* Mitglieder verschieben

Zudem werden die folgenden Anwendungsbereiche benötigt:

* bot
* applications.commands

Wenn Berechtigungen oder Anwendungsbereiche fehlen, dann werden manche
Funktionen des Adapters nicht funktionieren.

## Zustände (States)

Jeder Server, Kanal und Benutzer wird über dessen einmalige nummerische ID identifiziert.  
Da Namen sich ändern können, nutzt der vom Adapter erstellt Objektbaum diese IDs,
um eine zuverlässige Struktur zu erstellen.

Der gesamte Objektbaum wird auf Grundlage dessen erzeugt, was der Bot sehen kann.
Somit ist es beispielsweise möglich, dass es auf einem Server mehr Kanäle gibt,
als angezeigt werden.

### discord.0.bot.*

| Name | Beschreibung |
|---|---|
| `activityType` | Die Art der Bot-Aktivität. Mögliche Werte sind `PLAYING`, `STREAMING`, `LISTENING`, `WATCHING`, `COMPETING` oder ein leerer String. |
| `activityName` | Der Name der Bot-Aktivität. Wird nur verwendet, wenn eine Art gesetzt ist. |
| `status` | Der Anwesenheitsstatus des Bots. Mögliche Werte sind `online`, `idle`, `dnd` und `invisible`. |

Diese Zustände werden verwendet, um den Anwesenheitsstatus und die Aktivität des
Bots festzulegen, wie es den Benutzern angezeigt werden soll.

### discord.0.servers.\<server-id\>.*

| Name | Beschreibung |
|---|---|
| `channels.*` | Kanäle des Servers. |
| `members.*` | Mitglieder des Servers. |

### discord.0.servers.\<server-id\>.channels.\<channel-id\>.*

| Name | Beschreibung |
|---|---|
| `channels.*` | Nur vorhanden, wenn der Kanal eine Kategorie ist. Die Struktur dahin ist dieselbe, wie für Serverkanäle. |
| `memberCount` | Anzahl der Mitglieder in diesem Kanal. |
| `members` | Mit Komma getrennte Liste der Mitglieder (Anzeigenamen) des Kanals. |
| `message` | Letzte empfangene Nachricht in diesem Kanal. |
| `messageId` | ID der letzten empfangenen Nachricht. |
| `messageAuthor` | Verfasser (Benutzer-Tag) der letzten empfangenen Nachricht. |
| `messageTimestamp` | Zeitstempel der letzten empfangenen Nachricht. |
| `messageJson` | JSON-Daten der letzten empfangenen Nachricht. |
| `send` | Senden von Texten oder JSON-formatierten Nachrichten. |
| `sendFile` | Senden einer Datei. |
| `sendReply` | Senden einer Antwort auf eine Nachricht. |
| `sendReaction` | Senden einer Reaktion (Emoji) auf eine Nachricht. |
| `json` | JSON-Daten der Kanalinformationen. |

Zu allen `message*` und `send*` Zuständen siehe den Abschnitt _Nachrichten_ weiter unten.

### discord.0.servers.\<server-id\>.members.\<user-id\>.*

| Name | Beschreibung |
|---|---|
| `tag` | Der eindeutige Tag des Benutzers in Discord. |
| `displayName` | Der Anzeigename des Benutzers auf dem Server. |
| `roles` | Mit Komma getrennte Liste der Rollen des Benutzers auf dem Server. |
| `joinedAt` | Zeitstempel, wann der Benutzer dem Server beigetreten ist. |
| `voiceChannel` | Sprachkanal mit dem der Benutzer momentan verbunden ist, oder ein leerer String, wenn nicht verbunden. |
| `voiceDisconnect` | Button um den Benutzer vom Sprachkanal zu trennen. |
| `voiceSelfDeaf` | Indikator, ob der Benutzer sich selbst gehörlos geschaltet hat. |
| `voiceSelfMute` | Indikator, ob der Benutzer sich selbst stumm geschaltet hat. |
| `voiceServerDeaf` | Indikator, ob der Benutzer vom Server gehörlos geschaltet wurde. Kann außerdem verwendet werden, um diesen Status zu ändern. |
| `voiceServerMute` | Indikator, ob der Benutzer vom Server stumm geschaltet wurde. Kann außerdem verwendet werden, um diesen Status zu ändern. |
| `json` | JSON-Daten der Benutzerinformationen. |

Damit die `voice*`-Zustände aktuell sind, muss die Option _Sprachchatstatus der Benutzer beobachten_ in der Instanzkonfiguration aktiviert sein.  
Für die Verwendung der Aktionen `voiceDisconnect`, `voiceServerDeaf` und `voiceServerMute`, muss der Bot die zugehörigen Berechtigungen auf dem Server haben.

### discord.0.users.\<user-id\>.*

| Name | Beschreibung |
|---|---|
| `tag` | Der eindeutige Tag des Benutzers in Discord. |
| `status` | Der Anwesenheitsstatus des Benutzers. Eins von `online`, `offline`, `idle`, `dnd` |
| `activityType` | Die Art der momentanen Aktivität des Benutzers. Eins von `PLAYING`, `STREAMING`, `LISTENING`, `WATCHING`, `COMPETING`, `CUSTOM` oder ein leerer String. |
| `activityName` | Der Name der momentanen Aktivität des Benutzers. Z.B. der Name eines Spiels während `PLAYING`. |
| `avatarUrl` | URL zum Avatar des Benutzers. |
| `bot` | Indikator, ob der Benutzer ein Bot ist. |
| `message` | Letzte empfangene Direktnachricht des Benutzers. |
| `messageId` | ID der letzten empfangenen Direktnachricht des Benutzers. |
| `messageTimestamp` | Zeitstempel der letzten empfangenen Direktnachricht des Benutzers. |
| `messageJson` | JSON-Daten der letzten empfangenen Direktnachricht des Benutzers. |
| `send` | Senden von Texten oder JSON-formatierten Nachrichten. |
| `sendFile` | Senden einer Datei. |
| `sendReply` | Senden einer Antwort auf eine Nachricht. |
| `sendReaction` | Senden einer Reaktion (Emoji) auf eine Nachricht. |
| `json` | JSON-Daten der Benutzerinformationen. |

Damit die `status`- und `activity*`-Zustände aktuell sind, muss die Option
_Anwesenheit der Benutzer beobachten_ in der Instanzkonfiguration aktiviert sein.

Zu allen `message*` und `send*` Zuständen siehe den Abschnitt _Nachrichten_ weiter unten.

### discord.0.raw.*

Wenn die Rohzustände in der Instanzkonfiguration aktiviert sind, werden die gibt
es zusätzlich die folgenden Zustände.

**Hinweis:** Diese Zustände beinhalten Rohdaten ohne jegliche Prüfung, Filterung
oder Modifizierung durch den Adapter. Server werden als Guild bezeichnet.

| Name | Beschreibung |
|---|---|
| `messageJson` | Roh-JSON-Daten der letzten empfangen Nachricht. (Kanalnachrichten und Direktnachrichten) |
| `interactionJson` | Roh-JSON-Daten der letzten empfangenen Interaktion. (z.B. Slash-Befehle) |

## Autorisierung

Standardmäßig ist die Autorisierung aktiviert und nur autorisierte Benutzer
werden in der Lage sein, mit dem Adapter zu interagieren.

Die autorisierten Benutzer und Serverrollen können in der Instanzkonfiguration
des Adapters inklusive pro-Benutzer/Rolle-Berechtigungen festgelegt werden.  
Für Serverrollen werden die Berechtigungen nur auf dem jeweiligen Server
angewendet und nicht auf anderen Servern und nicht in Direktnachrichten.  
Wenn Berechtigungen pro Benutzer und Serverrolle vergeben wurden, dann werden
diese für den entsprechenden Server zusammengeführt.

Die Benutzer und Rollen werden dabei über deren interne ID identifiziert, sodass
selbst Änderungen des Benutzer-Tags, des Benutzernamens oder des Rollennamens
die Autorisierung nicht beeinträchtigen.

Es ist auch möglich die Autorisierung zu deaktivieren. Dies sollte jedoch nur
gemacht werden, wenn allen Benutzern auf allen Servern des Bots vertraut werden kann!

**Hinweis:** Selbst mit aktivierter Autorisierung kann jeder nicht autorisierte
Benutzer möglicherweise die konfigurierten Discord-Slash-Befehle und die zugehörigen
konfigurierten Zustandsnamen und Aliase sehen.
Dies ist eine Einschränkung von Discord und hat nichts mit dem Adapter zu tun.

## Nachrichten

Der Adapter ist in der Lage, Nachrichten von Discord Textkanälen und Benutzern
zu empfangen und zu senden.

Standardmäßig werden in Kanälen nur Nachrichten mit Erwähnungen des Bots verarbeitet.
Damit auch Nachrichten ohne Erwähnungen verarbeitet werden, muss die Option
_Alle Nachrichten in Serverkanälen verarbeiten_ in der Instanzkonfiguration aktiviert werden.

Wenn eine Nachricht mit einer Erwähnung des Bots empfangen wird, dann reagiert
der Adapter auf diese Nachricht mit einem Emoji.
Dies kann in der Instanzkonfiguration des Adapters angepasst werden.  
Wenn die Autorisierung aktiviert ist, dann wird der Bot nur Erwähnungen von
autorisierten Benutzern reagieren.

### Nachrichten empfangen

Empfangene Nachrichten werden in den `.message*`-Zuständen des entsprechenden
Kanal-Objektes für Kanalnachrichten oder des Benutzer-Objektes für
Direktnachrichten abgelegt.

Wenn die Autorisierung aktiviert ist, werden standardmäßig nur Nachrichten von
autorisierten Benutzern abgelegt.
Dies kann über die Option _Nachrichten von nicht autorisierten Benutzern verarbeiten_
in der Instanzkonfiguration des Adapters angepasst werden, sodass auch
Nachrichten von nicht autorisierten Benutzern abgelegt werden.

Die zuletzt empfangene Nachricht pro Kanal/Benutzer ist immer im
`.message`-Zustand abgelegt.
Der Zeitstempel, der Verfasser und die ID der zuletzt empfangenen Nachricht sind
in den zugehörigen Zuständen abgelegt.  
Zusätzlich werden alle diese Informationen auch im JSON-Format im
`.messageJson`-Zustand abgelegt.

#### Verwendung von text2command

Um text2command zu nutzen, muss eine text2command-Instanz in der
Instanzkonfiguration des Adapters ausgewählt werden.

Für jeden `.message`-Zustand kann die benutzerdefinierte Einstellung
_text2command für diesen Zustand aktivieren_ aktiviert werden.  
Wenn aktiviert, dann werden empfangene Nachrichten an die ausgewählte
text2command-Instanz gesendet.

Die Antwort von text2command wird vom Adapter als Antwort, als normale Nachricht
oder gar nicht gesendet, abhängig von der Instanzkonfiguration des Adapters.

### Nachrichten senden

Um eine Nachricht zu senden, kann der Inhalt in die `.send*`-Zustände eines
Kanals oder Benutzers geschrieben werden.

#### Senden einfacher Texte

Zum Senden einfacher Texte schreibt man einfach den Text in den `.send`-Zustand
des gewünschten Ziels.  
Es kann [Discord Markdown] zur Formatierung des Textes verwendet werden,
genauso wie im Discord-Client.

Um einen Benutzer zu erwähnen, kann die Benutzer-ID in der Form `<@Benutzer-ID>`
verwendet werden.  
Für die Erwähnung von Gruppen kann `<@&Gruppen-ID>` und für Kanäle `<#Kanal-ID>`
genutzt werden.

Beispiele: `Dies ist meine Nachricht.`, `Dies ist _meine_ **formatierte** Nachricht.`, `Hey <@490222742801481728>!`

#### Senden von Dateien

Zum Senden einer Datei als Anhang schreibt man den Ort der Datei in den
`.sendFile`-Zustand des gewünschten Ziels.

Der Ort der Datei kann sein …

* Ein absoluter oder relativer Pfad zu einer lokalen Datei.  
  Relative Pfade sind relativ zum Adapterverzeichnis der ioBroker-Installation.  
  Der Pfad kann optional `file://` vorangestellt haben.
  Beispiele: `/home/user/image.png`, `../../iobroker-data/files/myfile.txt`, `file:///tmp/image.jpg`

* URL zu einer entfernten Datei.  
  Beispiel: `https://www.iobroker.dev/images/iobroker.png`

* Base64 kodierter Dateiinhalt.  
  Beispiel: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACzklEQVQ4y3WTy2tcdRTHP+d3753HncncmbaJiYvEhZrU+ii2urJgFCyCLnykpbQrsbR/gRQaXPUPUHBlH4ogUsRSqq7qLtlZrQpKg6Uu1OCkSWZ65859zfzucTExsYLf3Tl8zznf85JHZ5+cVuGcMebg0YXXHN/3UVVAqfk1VJV+HCMiAKRpyuXPr1hrixsCZ10VzgEnXMeRF+afJwgaFIUC0Go1UYVOp4OYUYIoivjiyjWszecUMMaYAyXPk7m5R8jznCjqk2YpjuMQhj1AcT2XLM3oR30GgyFB0KDkeWKMOeAeP7ZgDh16jizNeO/9Dwh7PR7ft5ejRxa49tXXvPnG6yRJzNWrX/LDjz8xMTHOu4tnKJXLLC0tG1OtViVoNKhWK9wLQ9pr6yRJwtTUJC/Oz3P9+jckccrk5APcXd+g3V6jUqkwiqmKKwKIMBrbCKpw585vvHNmkT17dvHQzAylUhkjZocnggi4I0+BAML9sEXBX+27XLj0MXGSMLR2h6cFKLh+zSdoNlHYXtW/oaq019a3bRGhPlYnaDbxaz5GVflHV7lcYlcrYJRH+V9s8VUVN4r6bG5ugginT52k2+ny/c2bADjGMDG+m073HlmWbyvq9XoURUEU9TGO4+C4DsPBgI31DZIkwVqLAs8+8zQnjh/j1Vdevq84Iriei+M4GABByLKMTz+7zMWPPuHBqSkGgwGdbpeZ6WmiXu+/g9nu0E2SRMMwJMty6rUa+596gsOHX+L8hUvEcUyp5PH7H38yMb4bgMbYGFmWE4YhSZKozO3b/7PruI/Nzj7MybffotVqYYwhjmPq9TpBo8Hq6iqFjkpmWcaH5y+ysnKboR3+4lpbfGdtvvfWrV+lUi5T8jyKoqBeq9FqBqiC7/sYM7qAnggrK7fJ8lyBG67AWQWstQeXlpd33lmhVt96535/60aENE0YWmuBbwUW/wZQx0cNXLu4ygAAAABJRU5ErkJggg==`

Zusätzlich kann eine Textnachricht zur Datei hinzugefügt werden. Dazu einfach
den Ort der Datei, gefolgt vom Pipe-Zeichen `|` und der Nachricht in den
`.sendFile`-Zustand schreiben.  
Beispiele: `/tmp/image.png|Dies ist meine Datei`, `https://www.iobroker.dev/images/iobroker.png|Das ioBroker Logo`

#### Senden von Reaktionen

Über den `.sendReaction`-Zustand kann mit einem Emoji auf vorherige Nachrichten
reagiert werden. Hierzu einfach den Emoji in den Zustand schreiben.

Standardmäßig wird die Reaktion zu der Nachricht gesendet, deren ID aktuell im
zugehörigen `.messageId`-Zustand enthalten ist.

Wenn auf eine bestimmte Nachricht reagiert werden soll, dann kann die
Nachrichten-ID, gefolgt vom Pipe-Zeichen `|` und dem Emoji in den
`.sendReaction`-Zustand geschrieben werden.

Beispiele: `👍`, `971032590515568660|👍`

#### Senden von Antworten

Über den `.sendReply`-Zustand kann auf vorherige Nachrichten geantwortet werden.
Hierzu einfach die Antwort in den Zustand schreiben.

Standardmäßig wird die Antwort zu der Nachricht gesendet, deren ID aktuell im
zugehörigen `.messageId`-Zustand enthalten ist.

Wenn auf eine bestimmte Nachricht geantwortet werden soll, dann kann die
Nachrichten-ID, gefolgt vom Pipe-Zeichen `|` und der Antwort in den
`.sendReply`-Zustand geschrieben werden.

Beispiele: `Dies ist eine Antwort.`, `971032590515568660|Dies ist eine Antwort.`

#### Senden von speziellen benutzerdefinierten Nachrichten

Es können auch spezielle benutzerdefinierte Nachrichten gesendet werden, indem
ein JSON-Nachrichten-Objekt in den `.send`-Zustand geschrieben wird.

Das JSON-Object muss dabei vom Typ `MessageOptions` sein.
Für mehr Information dazu siehe die [discord.js MessageOptions Dokumentation][MessageOptions].

Beispiele:

Ein Bild senden:

```json
{
  "files": [
    {
      "attachment": "/tmp/image.jpg",
      "name": "image.jpg",
      "description": "Mein tolles Bild"
    }
  ]
}
```

Eingebetteten Inhalt senden:

```json
{
  "content": "Verwende das:",
  "embeds": [
    {
      "title": "ioBorker.discord",
      "description": "Discord Adapter für ioBroker",
      "color": "#5865f2",
      "url": "https://github.com/crycode-de/ioBroker.discord",
      "author": {
        "name": "Peter Müller",
        "url": "https://github.com/crycode-de"
      },
      "image": {
        "url": "https://github.com/crycode-de/ioBroker.discord/raw/main/admin/discord.png"
      },
      "footer": {
        "text": "❤👍"
      }
    }
  ]
}
```

Eingebettetes Bild von einer lokalen Quelle senden:

```json
{
  "embeds": [
    {
      "title": "IP-Cam Alarm",
      "description": "Schau dir das an:",
      "color": "#ff0000",
      "image": {
        "url": "attachment://cam.jpg"
      }
    }
  ],
  "files": [
    {
      "attachment": "http://192.168.1.50:8080/ip-cam.jpg",
      "name": "cam.jpg"
    }
  ]
}
```

## Slash-Befehle

Sofern in der Instanzkonfiguration des Adapters aktiviert, kann der Adapter mit
Discord-Slash-Befehlen arbeiten. Diese Befehle können genutzt werden, um
ioBroker-Zustände abzufragen oder festzulegen.

**Hinweis:** Die Zustände, die für Discord-Slash-Befehle verfügbar sein sollen,
müssen individuell konfiguriert werden. Siehe dazu weiter unten.

Discord-Slash-Befehle können vom Adapter als Server-Befehle (Standard) oder als
globale Befehle registriert werden. Dies kann in der Instanzkonfiguration des
Adapters eingestellt werden.  
Die Nutzung von Server-Befehlen hat den Vorteil, dass Änderungen denBefehlen
(z.B. das Hinzufügen von Zuständen) sofort und ohne Verzögerung übernommen werden.
Jedoch können Server-Befehle nicht in Direktnachrichten zwischen einem Benutzer
und dem Bot verwendet werden.  
Globale Befehle können auch in Direktnachrichten verwendet werden, aber jede
Änderung an den Befehlen kann bis zu einer Stunde dauern, bis sie von Discord
übernommen wird. Dies ist eine Beschränkung von Discord und nicht vom Adapter.

Die standardmäßig verwendeten Slash-Befehle sind `/iob-get` und `/iob-set`.
Die Namen und Beschreibungen der Befehle können in der Instanzkonfiguration
des Adapters angepasst werden.

### Zustände für Slash-Befehle konfigurieren

Für jeden Zustand, der über Discord-Slash-Befehle verfügbar sein soll, muss dies
in den benutzerdefinierten Einstellungen des Zustands aktiviert werden.
Dazu einfach auf das _Benutzerdefinierte Einstellungen_ Zahnrad-Symbol in der
_Objekte_-Ansicht im Admin klicken, die Einstellungen für die Adapterinstanz
aktivieren und die Option _Discord-Befehle für diesen Zustand aktivieren_ aktivieren.

[![Discord-Befehle aktivieren](./media/slash-befehl-konfiguration-1.png)](./media/slash-befehl-konfiguration-1.png)

[![Discord-Befehle aktivieren](./media/slash-befehl-konfiguration-2.png)](./media/slash-befehl-konfiguration-2.png)

Es können ein _Name_ und ein _Alias_ für jeden Zustand für die Nutzung in
Discord definiert werden.
Der _Name_ wird bei der Autovervollständigung der Befehle und der _Alias_ als
interne Identifikation verwendet. Beides darf eine Länge von 100 Zeichen nicht
überschreiten.

Für jeden Zustand kann einzeln festgelegt werden, ob dieser zum Abfragen und/oder
zum Festlegen verfügbar sein soll.  
Zusätzlich kann aktiviert werden, dass beim Abfragen eine Information angezeigt
wird, wenn der jeweilige Zustand nicht bestätigt ist, oder das beim Setzen immer
mit Bestätigung gesetzt werden soll.

Für Zustände vom Datentyp `string` kann ausgewählt werden, dass der Wert als
Datei (Ort einer Datei) behandelt werden soll.  
Ist dies aktiviert, dann wird der aktuelle Wert des Zustands wie bei den
`.sendFile`-Zuständen gesendet.  
Damit ist es beispielsweise möglich Bilder über einen Abfragebefehl anzufordern.

Für Zustände vom Datentyp `number` kann die Anzahl an Dezimalstellen zum Runden
des Wertes bei Abfragebefehlen angegeben werden.

Für Zustände vom Datentyp `boolean` können benutzerdefinierte Werte für `true`
und `false` definiert werden, die dann bei Abfragebefehlen zur Anzeige und bei
Festlegebefehlen zur Erkennung genutzt werden.

### Zustände abfragen

Um einen Zustand abzufragen, rufe einfach `/iob-get Zustandsalias` im Discord-Client auf.  
Für `Zustandsalias` wird eine Autovervollständigung während der Eingabe des
Befehls angezeigt.

Jeder Wert wird für die Ausgabe so formatiert, wie im Zustandsobjekt und den
zugehörigen benutzerdefinierten Einstellungen festgelegt ist.
Optional wird eine Information bei fehlender Bestätigung des Zustands hinzugefügt.

### Zustände festlegen

Um einen Zustand abzufragen, rufe einfach `/iob-set Zustandsalias Neuer-Wert` im
Discord-Client auf.  
Für `Zustandsalias` wird eine Autovervollständigung während der Eingabe des
Befehls angezeigt.  
`Neuer-Wert` wird vom Adapter analysiert, wenn der Datentyp des Zustands
`boolean` oder `number` ist.

Je Zustand kann einzeln konfiguriert werden, ob der Wert mit oder ohne
Bestätigung gesetzt werden soll.

Für Zustände vom Datentyp `boolean` werden die Werte `true`, `on`, `yes`, `1`
und ihre zugehörigen Übersetzungen (`wahr`, `an`, `ja`), sowie der zum Zustand
konfigurierte _Wahre Wert_ als `true` interpretiert.
Jeder andere Wert wird als `false` interpretiert.

Für Zustände vom Datentyp `number` wird der angegebene Wert als Dezimalzahl interpretiert.  
Wenn die ioBroker-Installation so konfiguriert ist, dass ein Komma als
Dezimaltrenner verwendet werden soll, dann kann die Zahl mit Komma oder Punkt als
Dezimaltrenner angegeben werden. Andernfalls ist nur der Punkt als
Dezimaltrenner erlaubt.  
Wenn im Zustandsobjekt Werte für `min` und `max` festgelegt wird, dann werden
diese ebenfalls geprüft.

### Einen Überblick über Zustände mit Konfigurationen für Slash-Befehle erhalten

Um einen Überblick über alle Zustände mit aktiver Konfiguration für
Slash-Befehle zu erhalten, kann in der Instanzkonfiguration des Adapter der
Button _Für Befehle konfigurierte Zustandsobjekte protokollieren_ angeklickt
werden. Die Ausgabe erfolgt dann im Log der ioBroker-Installation.

## Verwendung in Skripten

In Skripten kann die Funktion `sendTo(...)` genutzt werden, um mit der
Adapterinstanz zu interagieren.

_Hinweis:_ Alle verwendeten IDs sind Strings.

### Senden einer Nachricht in einem Skript

Um eine Nachricht zu senden, können der `send` oder `sendMessage` Befehl
genutzt werden. Sie sind beide identisch.

Der `message` Teil von `sendTo(...)` muss ein Objekt mit dem zu sendenden
`content` und einem der folgenden Parameter zur Identifikation des Ziels sein:

* `userId`
* `userTag`
* `serverId` und `channelId`

Der `content` kann ein einfacher String oder ein [MessageOptions]-Objekt sein.

Der Rückgabewert im Callback von `sendTo(...)` ist ein Objekt, welches die
Nachrichtenparameter und einen `result`-String, sowie die `messageId` der
gesendeten Discord-Nachricht bei Erfolg oder eine `error`-Nachricht im
Falle eines Fehlers enthält.

Beispiele:

```js
// Senden einer Nachricht zu einem Benutzer
sendTo('discord.0', 'sendMessage', {
  userTag: 'cryCode#9911',
  content: 'Hi!',
}, (ret) => {
  log(ret);
  // {'result':'Message sent to user cryCode#9911','userTag':'cryCode#9911','content':'Hi!','messageId':'971779972052160552'}

  if (ret.error) {
    log(ret.error, 'error');
    return;
  }
  log(`Nachricht gesendet mit ID ${ret.messageId}`);
});

// Senden einer Antwort zu einem Benutzer
sendTo('discord.0', 'sendMessage', {
  userId: '490222742801481728',
  content: {
    content: 'Ok!',
    reply: {
      messageReference: '971779972052160552', // ID der Nachricht, auf die geantwortet werden soll
    },
  },
}, (ret) => {
  log(ret);
  // {'result':'Message sent to user cryCode#9911','userId':'490222742801481728','content':{'content':'Ok!','reply':{'messageReference':'971779972052160552'}},'messageId':'971786369401761832'}
});

// Senden einer Datei an einen Serverkanal
sendTo('discord.0', 'sendMessage', {
  serverId: '813364154118963251',
  channelId: '813364154559102998',
  content: {
    content: 'Schau dir das an:',
    files: [
      {
        attachment: "/tmp/image.jpg",
        name: "image.jpg",
        description: "Mein tolles Bild"
      },
    ],
  },
}, (ret) => {
  log(ret);
  // {'result':'Message sent to channel Allgemein','serverId':'813364154118963251','channelId':'813364154559102998','content':{'content':'Schau dir das an:','files':[{'attachment':'/tmp/image.jpg','name':'image.jpg','description':'Mein tolles Bild'}]},'messageId':'971780152759558234'}
});
```

### Bearbeiten einer Nachricht in einem Skript

Über den `editMessage` Befehl können vorherige Nachrichten bearbeitet werden.  
Natürlich können nur Nachrichten bearbeitet werden, die vom Bot gesendet wurden.

Der `message` Teil von `sendTo(...)` ist der gleiche wie bei `sendMessage` (siehe oben)
mit zusätzlich der `messageId` der Nachricht, die bearbeitet werden soll.

Der Rückgabewert ist der gleiche wie bei `sendMessage`.

Beispiele:

```js
// Eine Nachricht bearbeiten
sendTo('discord.0', 'editMessage', {
  userTag: 'cryCode#9911',
  content: 'Hallo!',
  messageId: '971495175367049276',
}, (ret) => {
  log(ret);
  // {'result':'Message edited','userTag':'cryCode#9911','content':'Hallo!','messageId':'971495175367049276'}
});

// Nachricht senden und nach fünf Sekunden bearbeiten
sendTo('discord.0', 'sendMessage', {
    userTag: 'cryCode#9911',
    content: 'Es ist jetzt: ' + new Date().toLocaleString(),
}, (ret) => {
  if (ret.error) {
    log(ret.error, 'error');
    return;
  }
  setTimeout(() => {
    sendTo('discord.0', 'editMessage', {
      userTag: 'cryCode#9911',
      content:  'Es ist jetzt: ' + new Date().toLocaleString(),
      messageId: ret.messageId,
    }, (ret2) => {
      log(ret2);
      // {'result':'Message edited','userTag':'cryCode#9911','content':'Es ist jetzt: 5.5.2022, 16:25:38','messageId':'971779692166266920'}
    });
  }, 5000);
});
```

### Löschen einer Nachricht in einem Skript

Über den `deleteMessage` Befehl kann eine vorherige Nachrichte gelöscht werden.  
Natürlich können nur Nachrichten gelöscht werden, die vom Bot gesendet wurden.

Der `message` Teil von `sendTo(...)` ist der gleiche wie bei `sendMessage` (siehe oben),
jedoch ohne den `content`, aber dafür zusätzlich mit der `messageId` der
Nachricht, die bearbeitet werden soll.

Der Rückgabewert ist der gleiche wie bei `sendMessage`.

Beispiel:

```js
// Löschen einer Nachricht
sendTo('discord.0', 'deleteMessage', {
  userTag: 'cryCode#9911',
  messageId: '971495175367049276',
}, (ret) => {
  log(ret);
  // {'result':'Message deleted','userTag':'cryCode#9911','messageId':'971495175367049276'}
});
```

### Reaktions-Emoji zu einer Nachricht hinzufügen in einem Skript

Über den `addReaction` Befehl kann einer vorherigen Nachricht eine Reaktion
(Emoji) hinzugefügt werden.

Der `message` Teil von `sendTo(...)` ist der gleiche wie bei `sendMessage` (siehe oben),
jedoch ohne den `content`, aber dafür zusätzlich mit der `messageId` der
Nachricht, auf die reagiert werden soll, und dem `emoji`.

Der Rückgabewert ist der gleiche wie bei `sendMessage`.

Beispiel:

```js
// Hinzufügen einer Reaktion auf eine Nachricht
sendTo('discord.0', 'addReaction', {
  userTag: 'cryCode#9911',
  messageId: '971786369401761832',
  emoji: '😎',
}, (ret) => {
  log(ret);
  // {'result':'Reaction added to message','userTag':'cryCode#9911','messageId':'971786369401761832','emoji':'😎'}
});
```

### Auf Reaktionen auf eine Nachricht warten in einem Skript

Es ist möglich auf Reaktionen (Emojis) auf eine vorherige Nachricht zu warten.

Der `message` Teil von `sendTo(...)` ist der gleiche wie bei `editMessage` (siehe oben),
jedoch ohne den `content`, aber dafür zusätzlich mit einem `timeout` und einer
`max`-Anzahl.

Der `timeout` ist die maximale Wartezeit, um die Reaktionen zu sammeln in einem
Bereich von 100 bis 60000 ms.

Die `max`-Anzahl bestimmt, wie viele Reaktionen maximal gesammelt werden sollen.
Standard ist 1, wenn nicht angegeben.

Der Callback von `sendTo(...)` wird aufgerufen, wenn entweder die maximale
Wartezeit oder die angegebene Anzahl an Reaktionen erreicht ist.  
Der Rückgabewert ist ein Objekt mit den Nachrichtenparameters und einem
`reactions`-Array. Jede Reaktion ist ein Objekt aus `emoji`, `emojiId` und `users`,
wobei `users` ein Array von Objekten mit `id` und `tag` ist.  
Wenn eine Reaktion ein normales Emoji ist, dann ist die `emojiId` `null`.
Für benutzerdefinierte Emojis enthält `emoji` den Namen und `emojiId` die ID des
Emojis.

```js
sendTo('discord.0', 'awaitMessageReaction', {
  serverId: '813364154118963251',
  channelId: '813364154559102998',
  messageId: '970754574879162458',
  timeout: 10000,
  max: 3,
}, (ret) => {
  log(ret);
  // {'reactions':[{'emoji':'👍','emojiId':null,'users':[{'id':'490222742801481728','tag':'cryCode#9911'}]}],'serverId':'813364154118963251','channelId':'813364154559102998','messageId':'970754574879162458','timeout':10000,'max':3}
});
```

[ioBroker]: https://www.iobroker.net
[Discord]: https://discord.com
[text2command]: https://github.com/ioBroker/ioBroker.text2command
[GitHub New Issue]: https://github.com/crycode-de/ioBroker.discord/issues/new/choose
[Discord Developer Portal]: https://discord.com/developers/applications
[Discord Markdown]: https://support.discord.com/hc/en-us/articles/210298617-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline-
[MessageOptions]: https://discord.js.org/#/docs/discord.js/stable/typedef/MessageOptions
