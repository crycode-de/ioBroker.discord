'use strict';

if (typeof goog !== 'undefined') {
  goog.provide('Blockly.JavaScript.Discord');

  goog.require('Blockly.JavaScript');
}

Blockly.Words['Discord'] = { 'en': 'Discord', 'de': 'Discord', 'ru': 'Discord', 'pt': 'Discord', 'nl': 'Discord', 'fr': 'Discord', 'it': 'Discord', 'es': 'Discord', 'pl': 'Discord', 'uk': 'Discord', 'zh-cn': 'Discord' };
Blockly.Words['discord_send_message'] = { 'en': 'Send Discord message', 'de': 'Discord-Nachricht senden', 'ru': 'Отправить сообщение в дискорде', 'pt': 'Enviar mensagem do Discord', 'nl': 'Discord-bericht verzenden', 'fr': 'Envoyer un message Discord', 'it': 'Invia messaggio Discordia', 'es': 'Enviar mensaje de discordia', 'pl': 'Wyślij wiadomość na Discordzie', 'uk': 'Надіслати повідомлення Discord', 'zh-cn': '发送不和谐消息' };
Blockly.Words['discord_send_message_tooltip'] = { 'en': 'Send a message via Discord', 'de': 'Eine Nachricht über Discord senden', 'ru': 'Отправить сообщение через Discord', 'pt': 'Envie uma mensagem pelo Discord', 'nl': 'Stuur een bericht via Discord', 'fr': 'Envoyer un message via Discord', 'it': 'Invia un messaggio tramite Discord', 'es': 'Enviar un mensaje a través de Discord', 'pl': 'Wyślij wiadomość przez Discord', 'uk': 'Надішліть повідомлення через Discord', 'zh-cn': '通过 Discord 发送消息' };
Blockly.Words['discord_edit_message'] = { 'en': 'Edit Discord message', 'de': 'Discord-Nachricht bearbeiten', 'ru': 'Изменить сообщение Discord', 'pt': 'Editar mensagem do Discord', 'nl': 'Discord-bericht bewerken', 'fr': 'Modifier le message Discord', 'it': 'Modifica messaggio Discord', 'es': 'Editar mensaje de discordia', 'pl': 'Edytuj wiadomość na Discordzie', 'uk': 'Редагувати повідомлення Discord', 'zh-cn': '编辑 Discord 消息' };
Blockly.Words['discord_edit_message_tooltip'] = { 'en': 'Edit a former message in Discord', 'de': 'Eine frühere Nachricht in Discord bearbeiten', 'ru': 'Редактировать предыдущее сообщение в Discord', 'pt': 'Editar uma mensagem anterior no Discord', 'nl': 'Bewerk een eerder bericht in Discord', 'fr': 'Modifier un ancien message dans Discord', 'it': 'Modifica un messaggio precedente in Discord', 'es': 'Editar un mensaje anterior en Discord', 'pl': 'Edytuj poprzednią wiadomość w Discord', 'uk': 'Edit a former message in Discord', 'zh-cn': '在 Discord 中编辑以前的消息' };
Blockly.Words['discord_delete_message'] = { 'en': 'Delete Discord message', 'de': 'Discord-Nachricht löschen', 'ru': 'Удалить Discord-сообщение', 'pt': 'Excluir mensagem do Discord', 'nl': 'Discord-bericht verwijderen', 'fr': 'Supprimer le message Discord', 'it': 'Elimina messaggio Discord', 'es': 'Eliminar mensaje de discordia', 'pl': 'Usuń wiadomość z Discorda', 'uk': 'Видалити повідомлення Discord', 'zh-cn': '删除 Discord 消息' };
Blockly.Words['discord_delete_message_tooltip'] = { 'en': 'Delete a former message in Discord', 'de': 'Lösche eine frühere Nachricht in Discord', 'ru': 'Удалить прежнее сообщение в Discord', 'pt': 'Excluir uma mensagem anterior no Discord', 'nl': 'Een eerder bericht verwijderen in Discord', 'fr': 'Supprimer un ancien message dans Discord', 'it': 'Elimina un messaggio precedente in Discord', 'es': 'Eliminar un mensaje anterior en Discord', 'pl': 'Usuń poprzednią wiadomość w Discord', 'uk': 'Видалення попереднього повідомлення в Discord', 'zh-cn': '在 Discord 中删除以前的消息' };
Blockly.Words['discord_add_message_reaction'] = { 'en': 'Add Discord message reaction', 'de': 'Reaktion auf Discord-Nachricht hinzufügen', 'ru': 'Добавить реакцию на сообщение Discord', 'pt': 'Adicionar reação de mensagem do Discord', 'nl': 'Reactie op Discord-bericht toevoegen', 'fr': 'Ajouter une réaction au message Discord', 'it': 'Aggiungi la reazione al messaggio Discord', 'es': 'Agregar reacción de mensaje de Discord', 'pl': 'Dodaj reakcję na wiadomość Discord', 'uk': 'Додайте реакцію на повідомлення Discord', 'zh-cn': '添加 Discord 消息反应' };
Blockly.Words['discord_add_message_reaction_tooltip'] = { 'en': 'Add a reaction (emoji) to a former Discord message', 'de': 'Eine Reaktion (Emoji) zu einer früheren Discord-Nachricht hinzufügen', 'ru': 'Добавить реакцию (эмодзи) на предыдущее сообщение Discord', 'pt': 'Adicionar uma reação (emoji) a uma mensagem anterior do Discord', 'nl': 'Voeg een reactie (emoji) toe aan een eerder Discord-bericht', 'fr': 'Ajouter une réaction (emoji) à un ancien message Discord', 'it': 'Aggiungi una reazione (emoji) a un precedente messaggio Discord', 'es': 'Agregue una reacción (emoji) a un mensaje anterior de Discord', 'pl': 'Dodaj reakcję (emotikon) do poprzedniej wiadomości na Discordzie', 'uk': 'Додайте реакцію (емодзі) до попереднього повідомлення Discord', 'zh-cn': '向以前的 Discord 消息添加反应（表情符号）' };
Blockly.Words['discord_message'] = { 'en': 'Message', 'de': 'Nachricht', 'ru': 'Нахрихт', 'pt': 'Nachricht', 'nl': 'Nachricht', 'fr': 'Nachricht', 'it': 'Nachricht', 'es': 'Nachricht', 'pl': 'Nachricht', 'uk': 'повідомлення', 'zh-cn': '纳赫里赫特' };
Blockly.Words['discord_message_id'] = { 'en': 'Message ID', 'de': 'Nachrichten-ID', 'ru': 'Идентификатор сообщения', 'pt': 'ID da mensagem', 'nl': 'Bericht-ID', 'fr': 'ID du message', 'it': 'ID messaggio', 'es': 'ID de mensaje', 'pl': 'ID wiadomości', 'uk': 'ID повідомлення', 'zh-cn': '消息 ID' };
Blockly.Words['discord_save_message_id_in'] = { 'en': 'Save message ID in', 'de': 'Nachrichten-ID speichern in', 'ru': 'Сохранить идентификатор сообщения в', 'pt': 'Salvar ID da mensagem em', 'nl': 'Bericht-ID opslaan in', 'fr': 'Enregistrer l\'identifiant du message dans', 'it': 'Salva l\'ID del messaggio in', 'es': 'Guardar ID de mensaje en', 'pl': 'Zapisz identyfikator wiadomości w', 'uk': 'Зберегти ідентифікатор повідомлення в', 'zh-cn': '将消息 ID 保存在' };
Blockly.Words['discord_save_error_in'] = { 'en': 'Save error in', 'de': 'Fehler speichern in', 'ru': 'Сохранить ошибку в', 'pt': 'Salvar erro em', 'nl': 'Fout opslaan in', 'fr': 'Enregistrer l\'erreur dans', 'it': 'Salva errore in', 'es': 'Guardar error en', 'pl': 'Zapisz błąd w', 'uk': 'Зберегти помилку в', 'zh-cn': '将错误保存在' };
Blockly.Words['discord_log_result_ok'] = { 'en': 'Log result if sent', 'de': 'Ergebnis protokollieren, wenn gesendet', 'ru': 'Результат журнала, если он отправлен', 'pt': 'Log do resultado se enviado', 'nl': 'Log resultaat indien verzonden', 'fr': 'Consigner le résultat si envoyé', 'it': 'Registra il risultato se inviato', 'es': 'Registrar resultado si se envía', 'pl': 'Zaloguj wynik, jeśli został wysłany', 'uk': 'Зареєструвати результат, якщо надіслано', 'zh-cn': '记录结果（如果已发送）' };
Blockly.Words['discord_instance'] = { 'en': 'Discord instance', 'de': 'Discord-Instanz', 'ru': 'Дискорд-экземпляр', 'pt': 'Instância de discórdia', 'nl': 'Discord-instantie', 'fr': 'Instance de discorde', 'it': 'Istanza di discordia', 'es': 'Instancia de discordia', 'pl': 'Instancja Discord', 'uk': 'Примірник Discord', 'zh-cn': '不和谐实例' };
Blockly.Words['discord_user_id_name_or_tag'] = {
  'en': 'User ID, Name or Tag', 'de': 'Benutzer-ID, Name oder Tag', 'ru': 'ID пользователя, имя или тег', 'pt': 'ID do usuário, nome ou Tag', 'nl': 'User ID, Naam of Tag', 'fr': 'ID utilisateur, nom ou étiquette', 'it': 'ID utente, nome o tag', 'es': 'ID de usuario, nombre o etiqueta', 'pl': 'Użytkownik ID, nazwa lub tag', 'uk': 'Ідентифікатор користувача, ім\'я або тег', 'zh-cn': '用户:ID、姓名或Tag' };
Blockly.Words['discord_server_id'] = { 'en': 'Server ID', 'de': 'Server-ID', 'ru': 'Идентификатор сервера', 'pt': 'ID do servidor', 'nl': 'Server-ID', 'fr': 'Identifiant du serveur', 'it': 'ID server', 'es': 'identificación del servidor', 'pl': 'Identyfikator serwera', 'uk': 'ID сервера', 'zh-cn': '服务器编号' };
Blockly.Words['discord_channel_id'] = { 'en': 'Channel ID', 'de': 'Kanal-ID', 'ru': 'Идентификатор канала', 'pt': 'ID do canal', 'nl': 'Kanaal Nr', 'fr': 'Identifiant de la chaine', 'it': 'Canale ID', 'es': 'Canal ID', 'pl': 'ID kanału', 'uk': 'ID каналу', 'zh-cn': '频道 ID' };
Blockly.Words['discord_message_content'] = { 'en': 'Discord message content', 'de': 'Discord Nachricht', 'ru': 'Содержимое сообщения Discord', 'pt': 'Discord conteúdo da mensagem', 'nl': 'Inhoud van discord-bericht', 'fr': 'Discorder le contenu des messages', 'it': 'Discord contenuto del messaggio', 'es': 'Contenido del mensaje de discordia', 'pl': 'Treść wiadomości na Discordzie', 'uk': 'Вміст повідомлення Discord', 'zh-cn': '不和谐消息内容' };
Blockly.Words['discord_message_content_tooltip'] = { 'en': 'Create a Discord message. Embeds and Attachments may be a singe embed/attachment or a list of embeds/attachments.', 'de': 'Erstellen einer Discord-Nachricht. Einbettungen und Anhänge können einzelne Einbettungen/Anhänge oder eine Liste von Einbettungen/Anhängen sein.', 'ru': 'Создайте сообщение в Discord. Вложения и вложения могут быть отдельными вложениями/вложениями или списком вложений/вложений.', 'pt': 'Crie uma mensagem do Discord. Incorporações e anexos podem ser uma única incorporação/anexo ou uma lista de incorporações/anexos.', 'nl': 'Maak een Discord-bericht. Insluitingen en bijlagen kunnen een enkele insluiting/bijlage zijn of een lijst met insluitingen/bijlagen.', 'fr': 'Créez un message Discord. Les intégrations et les pièces jointes peuvent être une seule intégration/pièce jointe ou une liste d\'intégrations/pièces jointes.', 'it': 'Crea un messaggio Discord. Incorporamenti e allegati possono essere un unico incorporamento/allegato o un elenco di incorporamenti/allegati.', 'es': 'Crea un mensaje de Discord. Las incrustaciones y los archivos adjuntos pueden ser una sola inserción/archivo adjunto o una lista de incrustaciones/archivos adjuntos.', 'pl': 'Utwórz wiadomość na Discordzie. Osadzenia i załączniki mogą być pojedynczym osadzeniem/załącznikiem lub listą osadzonych/załączników.', 'uk': 'Створіть повідомлення Discord. Вбудовані та вкладені файли можуть бути одним вбудованим/вкладеним файлом або списком вбудованих/вкладених файлів.', 'zh-cn': '创建不和谐消息。嵌入和附件可以是单个嵌入/附件或嵌入/附件列表。' };
Blockly.Words['discord_content'] = { 'en': 'Content', 'de': 'Inhalt', 'ru': 'Содержание', 'pt': 'Contente', 'nl': 'Inhoud', 'fr': 'Contenu', 'it': 'Contenuto', 'es': 'Contenido', 'pl': 'Zawartość', 'uk': 'Зміст', 'zh-cn': '内容' };
Blockly.Words['discord_emoji'] = { 'en': 'Emoji', 'de': 'Emoji', 'ru': 'эмодзи', 'pt': 'Emoji', 'nl': 'Emoji', 'fr': 'Émoji', 'it': 'Emoji', 'es': 'emoticonos', 'pl': 'Emoji', 'uk': 'Emoji', 'zh-cn': '表情符号' };
Blockly.Words['discord_embeds'] = { 'en': 'Embeds', 'de': 'Einbettungen', 'ru': 'Встраивает', 'pt': 'Incorporações', 'nl': 'Ingesloten', 'fr': 'Intègre', 'it': 'Incorpora', 'es': 'incrustaciones', 'pl': 'Osadzenia', 'uk': 'Вбудовує', 'zh-cn': '嵌入' };
Blockly.Words['discord_attachments'] = { 'en': 'Attachments', 'de': 'Anhänge', 'ru': 'Вложения', 'pt': 'Anexos', 'nl': 'Bijlagen', 'fr': 'Pièces jointes', 'it': 'Allegati', 'es': 'Archivos adjuntos', 'pl': 'Załączniki', 'uk': 'Додатки', 'zh-cn': '附件' };
Blockly.Words['discord_reply_to_id'] = { 'en': 'Reply to message ID', 'de': 'Antwort auf Nachrichten-ID', 'ru': 'Ответ на идентификатор сообщения', 'pt': 'Responder ao ID da mensagem', 'nl': 'Antwoord op bericht-ID', 'fr': 'Répondre à l\'identifiant du message', 'it': 'Rispondi all\'ID del messaggio', 'es': 'Responder al ID del mensaje', 'pl': 'Odpowiedz na identyfikator wiadomości', 'uk': 'Відповідь на ID повідомлення', 'zh-cn': '回复消息ID' };
Blockly.Words['discord_message_embed'] = { 'en': 'Discord message embed', 'de': 'Discord Nachrichteneinbettung', 'ru': 'Вставить Discord-сообщение', 'pt': 'Incorporação de mensagem do Discord', 'nl': 'Discord bericht insluiten', 'fr': 'Intégrer le message Discord', 'it': 'Incorpora messaggio Discord', 'es': 'Insertar mensaje de Discord', 'pl': 'Osadź wiadomość na Discordzie', 'uk': 'Вбудоване повідомлення Discord', 'zh-cn': '不和谐消息嵌入' };
Blockly.Words['discord_message_embed_tooltip'] = { 'en': 'Create a Discord message embed. To use a file attachment as embedded image write \'attachment://filename.jpg\' as image URL.', 'de': 'Erstellen einer Discord-Nachrichteneinbettung. Um einen Dateianhang als eingebettetes Bild zu verwenden, muss \'attachment://filename.jpg\' als Bild-URL verwendet werden.', 'ru': 'Создайте вставку сообщения Discord. Чтобы использовать вложенный файл в качестве встроенного изображения, напишите «attachment://filename.jpg» в качестве URL-адреса изображения.', 'pt': 'Crie uma incorporação de mensagem do Discord. Para usar um anexo de arquivo como imagem incorporada, escreva \'attachment://filename.jpg\' como URL da imagem.', 'nl': 'Maak een insluiting van een Discord-bericht. Om een bestandsbijlage als ingesloten afbeelding te gebruiken, schrijft u \'attachment://filename.jpg\' als afbeeldings-URL.', 'fr': 'Créez une intégration de message Discord. Pour utiliser une pièce jointe comme image intégrée, écrivez \'attachment://filename.jpg\' comme URL de l\'image.', 'it': 'Crea un messaggio Discord incorporato. Per utilizzare un file allegato come immagine incorporata, scrivi \'allegato://nomefile.jpg\' come URL dell\'immagine.', 'es': 'Crea una inserción de mensaje de Discord. Para usar un archivo adjunto como imagen incrustada, escriba \'archivo adjunto: // nombre de archivo.jpg\' como URL de imagen.', 'pl': 'Utwórz osadzoną wiadomość na Discordzie. Aby użyć załącznika jako osadzonego obrazu, wpisz „attachment://nazwapliku.jpg” jako adres URL obrazu.', 'uk': 'Створіть вбудоване повідомлення Discord. Щоб використовувати вкладений файл як вбудоване зображення, напишіть \'attachment://filename.jpg\' як URL зображення.', 'zh-cn': '创建 Discord 消息嵌入。要将文件附件用作嵌入图像，请将 \'attachment://filename.jpg\' 作为图像 URL。' };
Blockly.Words['discord_description'] = { 'en': 'Description', 'de': 'Beschreibung', 'ru': 'Описание', 'pt': 'Descrição', 'nl': 'Beschrijving', 'fr': 'La description', 'it': 'Descrizione', 'es': 'Descripción', 'pl': 'Opis', 'uk': 'опис', 'zh-cn': '描述' };
Blockly.Words['discord_title'] = { 'en': 'Title', 'de': 'Titel', 'ru': 'Заголовок', 'pt': 'Título', 'nl': 'Titel', 'fr': 'Titre', 'it': 'Titolo', 'es': 'Título', 'pl': 'Tytuł', 'uk': 'Назва', 'zh-cn': '标题' };
Blockly.Words['discord_url'] = { 'en': 'URL', 'de': 'URL', 'ru': 'URL-адрес', 'pt': 'URL', 'nl': 'URL', 'fr': 'URL', 'it': 'URL', 'es': 'URL', 'pl': 'URL', 'uk': 'URL', 'zh-cn': '网址' };
Blockly.Words['discord_color'] = { 'en': 'Color', 'de': 'Farbe', 'ru': 'Цвет', 'pt': 'Cor', 'nl': 'Kleur', 'fr': 'Couleur', 'it': 'Colore', 'es': 'Color', 'pl': 'Kolor', 'uk': 'Колір', 'zh-cn': '颜色' };
Blockly.Words['discord_image_url'] = { 'en': 'Image URL', 'de': 'Bild URL', 'ru': 'URL изображения', 'pt': 'imagem URL', 'nl': 'afbeelding URL', 'fr': 'URL de l\'image', 'it': 'URL dell\'immagine', 'es': 'URL de la imagen', 'pl': 'URL obrazu', 'uk': 'URL зображення', 'zh-cn': '图片网址' };
Blockly.Words['discord_footer_text'] = { 'en': 'Footer text', 'de': 'Fusszeile', 'ru': 'Текст нижнего колонтитула', 'pt': 'Texto de rodapé', 'nl': 'Voettekst', 'fr': 'Texte de pied de page', 'it': 'Testo a piè di pagina', 'es': 'Texto de pie de página', 'pl': 'Tekst stopki', 'uk': 'Текст нижнього колонтитула', 'zh-cn': '页脚文本' };
Blockly.Words['discord_file_attachment'] = { 'en': 'Discord file attachment', 'de': 'Discord Dateianhang', 'ru': 'Прикрепленный дискорд файл', 'pt': 'Anexo de arquivo do Discord', 'nl': 'Discord-bestandsbijlage', 'fr': 'Pièce jointe du fichier Discord', 'it': 'Discord file allegato', 'es': 'Archivo adjunto de discordia', 'pl': 'Załącznik do pliku Discord', 'uk': 'Вкладений файл Discord', 'zh-cn': '不和谐文件附件' };
Blockly.Words['discord_file_attachment_tooltip'] = { 'en': 'Create a Discord file attachment. File path may be local path to a file or an URL to a remote file. File name is the name of the file provided to Discord.', 'de': 'Erstellen eines Discord-Dateianhangs. Der Dateipfad kann ein lokaler Pfad zu einer Datei oder eine URL zu einer entfernten Datei sein. Dateiname ist der Name der Datei, die Discord zur Verfügung gestellt wird.', 'ru': 'Создайте вложенный файл Discord. Путь к файлу может быть локальным путем к файлу или URL-адресом удаленного файла. Имя файла — это имя файла, предоставленного Discord.', 'pt': 'Crie um anexo de arquivo Discord. O caminho do arquivo pode ser um caminho local para um arquivo ou uma URL para um arquivo remoto. Nome do arquivo é o nome do arquivo fornecido ao Discord.', 'nl': 'Maak een Discord-bestandsbijlage. Bestandspad kan een lokaal pad naar een bestand zijn of een URL naar een extern bestand. Bestandsnaam is de naam van het bestand dat aan Discord is verstrekt.', 'fr': 'Créez une pièce jointe de fichier Discord. Le chemin du fichier peut être un chemin local vers un fichier ou une URL vers un fichier distant. Le nom du fichier est le nom du fichier fourni à Discord.', 'it': 'Crea un file allegato Discord. Il percorso del file può essere il percorso locale di un file o un URL di un file remoto. Il nome del file è il nome del file fornito a Discord.', 'es': 'Cree un archivo adjunto de Discord. La ruta del archivo puede ser una ruta local a un archivo o una URL a un archivo remoto. El nombre del archivo es el nombre del archivo proporcionado a Discord.', 'pl': 'Utwórz załącznik do pliku Discord. Ścieżka pliku może być ścieżką lokalną do pliku lub adresem URL do pliku zdalnego. Nazwa pliku to nazwa pliku dostarczonego do Discord.', 'uk': 'Створіть вкладений файл Discord. Шлях до файлу може бути локальним шляхом до файлу або URL-адресою до віддаленого файлу. Ім’я файлу – це ім’я файлу, наданого Discord.', 'zh-cn': '创建 Discord 文件附件。文件路径可以是文件的本地路径或远程文件的 URL。文件名是提供给 Discord 的文件的名称。' };
Blockly.Words['discord_file_path'] = { 'en': 'File path', 'de': 'Dateipfad', 'ru': 'Путь к файлу', 'pt': 'Caminho de arquivo', 'nl': 'Bestandspad', 'fr': 'Chemin du fichier', 'it': 'Percorso del file', 'es': 'Ruta de archivo', 'pl': 'Ścieżka pliku', 'uk': 'Шлях до файлу', 'zh-cn': '文件路径' };
Blockly.Words['discord_file_name'] = {
  'en': 'File name', 'de': 'Dateiname', 'ru': 'Имя файла', 'pt': 'Nome do arquivo', 'nl': 'Bestandsnaam', 'fr': 'Nom de fichier', 'it': 'Nome del file', 'es': 'Nombre del archivo', 'pl': 'Nazwa pliku', 'uk': 'Ім\'я файлу', 'zh-cn': '文件名' };
Blockly.Words['discord_on_custom_cmd'] = { 'en': 'On custom Discord slash command', 'de': 'Bei benutzerdefiniertem Discord-Slash-Befehl', 'ru': 'В пользовательской команде косой черты Discord', 'pt': 'No comando de barra Discord personalizado', 'nl': 'Op aangepaste Discord slash-opdracht', 'fr': 'Sur la commande personnalisée Discord slash', 'it': 'Sul comando barra Discord personalizzato', 'es': 'En el comando de barra diagonal Discord personalizado', 'pl': 'W niestandardowym poleceniu ukośnika Discord', 'uk': 'У користувальницькій команді косої риски Discord', 'zh-cn': '在自定义 Discord 斜杠命令上' };
Blockly.Words['discord_on_custom_cmd_tooltip'] = { 'en': 'Do some action when a custom Discord slash command is executed. Set the command name an command options like in the adapter instance configuration to store the given options into local variables. Use the block \'Send custom command reply\' to reply.', 'de': 'Eine Aktion auslösen, wenn ein benutzerdefinierter Discord-Slash-Befehl ausgeführt wurde. Den Befehlsnamen und die Befehlsoptionen wie in der Adapterinstanzkonfiguration festlegen, um die angegebenen Optionen in lokalen Variablen zu speichern. Zum Antworten den Block \'Antwort auf benutzerdefinierten Discord-Slash-Befehl senden\' verwenden.', 'ru': 'Сделайте некоторые действия, когда пользовательская команда Discord slash выполняется. Установите название команды, такие как в конфигурации адаптера, чтобы сохранить эти опции в локальные переменные. Используйте блок \'Отправить пользовательский ответ команды\' для ответа.', 'pt': 'Faça alguma ação quando um comando slash Discord personalizado for executado. Defina o nome do comando uma opção de comando como na configuração da instância do adaptador para armazenar as opções fornecidas em variáveis locais. Use o bloco \'Enviar resposta de comando personalizada\' para responder.', 'nl': 'Doe wat actie als een aangepaste Discord commando wordt geëxecuteerd. Zet de commandopost een commando-opties zoals in het adapter instance configuration om de gegeven opties op te bergen in plaatselijke variabelen. Gebruik het blok \'Stuur de commandopost\' om te antwoorden.', 'fr': 'Faites une action quand une commande personnalisée Discord slash est exécutée. Définir le nom de commande une option de commande comme dans la configuration de l\'instance adaptateur pour stocker les options données dans les variables locales. Utilisez le bloc \'Envoyer la réponse de commande personnalisée\' pour répondre.', 'it': 'Fai qualche azione quando viene eseguito un comando Discord slash personalizzato. Impostare il nome di comando opzioni di comando come nella configurazione dell\'istanza dell\'adattatore per memorizzare le opzioni date in variabili locali. Utilizzare il blocco \'Invia risposta di comando personalizzata\' per rispondere.', 'es': 'Haga alguna acción cuando se ejecute un comando de discordia personalizado. Establecer el nombre de comando una opción de comando como en la configuración de instancia del adaptador para almacenar las opciones dadas en variables locales. Utilice el bloque \'Enviar respuesta de comando personalizada\' para responder.', 'pl': 'Do niektórych działań, gdy zostaje stracony zwyczajowe dowództwo Discord slash. Nazwa komendy jest opcją taka jak w konfiguracji adapterowej, która pozwala na przechowywanie opcji w lokalnych zmiennych. Zastosowanie bloku \'Send customowe polecenie odpowiadania.', 'uk': 'Виконайте певну дію, коли виконується спеціальна команда Discord. Встановіть ім’я команди та параметри команди, як у конфігурації екземпляра адаптера, щоб зберегти задані параметри в локальних змінних. Щоб відповісти, використовуйте блок \'Надіслати відповідь на спеціальну команду\'.', 'zh-cn': '实施定制的反弹指挥时,有些行动。 确定指挥名称,如适应组合中的指挥选择,以将特定的选择留给当地变量。 使用封锁的习俗指挥答复。.' };
Blockly.Words['discord_save_interaction_id_in'] = { 'en': 'Save interaction ID in', 'de': 'Interaktions-ID speichern in', 'ru': 'Сохранить идентификатор взаимодействия в', 'pt': 'Salvar ID de interação em', 'nl': 'Interactie-ID opslaan in', 'fr': 'Enregistrer l\'ID d\'interaction dans', 'it': 'Salva l\'ID interazione in', 'es': 'Guardar ID de interacción en', 'pl': 'Zapisz identyfikator interakcji w', 'uk': 'Зберегти ідентифікатор взаємодії в', 'zh-cn': '将交互 ID 保存在' };
Blockly.Words['discord_save_user_id_in'] = { 'en': 'Save user ID in', 'de': 'Benutzer-ID speichern in', 'ru': 'Сохранить ID пользователя в', 'pt': 'Salvar ID de usuário em', 'nl': 'Bewaar gebruiker ID', 'fr': 'Enregistrer l\'ID utilisateur dans', 'it': 'Salva ID utente in', 'es': 'Guardar ID de usuario en', 'pl': 'Save user Identity w bazie IMDb (ang.)', 'uk': 'Зберегти ідентифікатор користувача в', 'zh-cn': '拯救用户协会' };
Blockly.Words['discord_save_user_name_in'] = {
  'en': 'Save user name in', 'de': 'Benutzername speichern in', 'ru': 'Сохранить имя пользователя в', 'pt': 'Salvar nome de usuário em', 'nl': 'Bewaar gebruikersnaam', 'fr': 'Enregistrer le nom d\'utilisateur dans', 'it': 'Salva il nome utente in', 'es': 'Guardar el nombre de usuario en', 'pl': 'Nazwisko użytkowników w serwisie Save', 'uk': 'Зберегти ім\'я користувача в', 'zh-cn': '简称' };
Blockly.Words['discord_save_user_tag_in'] = { 'en': 'Save user tag in', 'de': 'Benutzer-Tag speichern in', 'ru': 'Сохранить тег пользователя в', 'pt': 'Salvar tag de usuário em', 'nl': 'Bewaar gebruiker', 'fr': 'Enregistrer le tag utilisateur dans', 'it': 'Salvare il tag utente', 'es': 'Guardar la etiqueta de usuario en', 'pl': 'Tagowanie użytkowników', 'uk': 'Зберегти тег користувача', 'zh-cn': '拯救用户的传染' };
Blockly.Words['discord_log_command'] = { 'en': 'Log each command execution', 'de': 'Jede Befehlsausführung protokollieren', 'ru': 'Журнал выполнения каждой команды', 'pt': 'Registrar cada execução de comando', 'nl': 'Log elke uitvoering van de opdracht in', 'fr': 'Journaliser chaque exécution de commande', 'it': 'Registra ogni esecuzione di comando', 'es': 'Registrar cada ejecución de comando', 'pl': 'Zaloguj każde wykonanie polecenia', 'uk': 'Записувати кожне виконання команди', 'zh-cn': '记录每个命令的执行' };
Blockly.Words['discord_custom_command_name'] = { 'en': 'Custom command name', 'de': 'Benutzerdefinierter Befehlsname', 'ru': 'Пользовательское имя команды', 'pt': 'Nome do comando personalizado', 'nl': 'Naam aangepaste opdracht', 'fr': 'Nom de commande personnalisé', 'it': 'Nome comando personalizzato', 'es': 'Nombre de comando personalizado', 'pl': 'Niestandardowa nazwa polecenia', 'uk': 'Назва спеціальної команди', 'zh-cn': '自定义命令名称' };
Blockly.Words['discord_on_custom_cmd_options_to_vars'] = { 'en': 'Command options to variables', 'de': 'Befehlsoptionen in Variablen speichern', 'ru': 'Параметры команды для переменных', 'pt': 'Opções de comando para variáveis', 'nl': 'Opdrachtopties voor variabelen', 'fr': 'Options de commande aux variables', 'it': 'Opzioni di comando per le variabili', 'es': 'Opciones de comando a variables', 'pl': 'Opcje poleceń do zmiennych', 'uk': 'Параметри команд для змінних', 'zh-cn': '变量的命令选项' };
Blockly.Words['discord_custom_cmd_options'] = { 'en': 'Command options', 'de': 'Befehlsoptionen', 'ru': 'Параметры команды', 'pt': 'Opções de comando', 'nl': 'Opdrachtopties', 'fr': 'Options de commande', 'it': 'Opzioni di comando', 'es': 'Opciones de comando', 'pl': 'Opcje poleceń', 'uk': 'Параметри команди', 'zh-cn': '命令选项' };
Blockly.Words['discord_custom_cmd_option'] = { 'en': 'Option', 'de': 'Option', 'ru': 'вариант', 'pt': 'Opção', 'nl': 'Keuze', 'fr': 'Option', 'it': 'Opzione', 'es': 'Opción', 'pl': 'Opcja', 'uk': 'Варіант', 'zh-cn': '选项' };
Blockly.Words['discord_custom_cmd_option_tooltip'] = { 'en': 'Options for the custom discord slash command.', 'de': 'Optionen für den benutzerdefinierten Discord-Slash-Befehl.', 'ru': 'Параметры пользовательской команды косой черты раздора.', 'pt': 'Opções para o comando de barra de discórdia personalizado.', 'nl': 'Opties voor de aangepaste onenigheid slash-opdracht.', 'fr': 'Options pour la commande personnalisée Discord Slash.', 'it': 'Opzioni per il comando barra discord personalizzato.', 'es': 'Opciones para el comando de barra diagonal de discordia personalizado.', 'pl': 'Opcje niestandardowego polecenia discord slash.', 'uk': 'Параметри для спеціальної команди розбіжності.', 'zh-cn': '自定义不和谐斜线命令的选项。' };
Blockly.Words['discord_send_custom_command_reply'] = { 'en': 'Send reply to a custom Discord slash command', 'de': 'Antwort auf benutzerdefinierten Discord-Slash-Befehl senden', 'ru': 'Отправить ответ на специальную косую черту Discord', 'pt': 'Enviar resposta a um comando de barra personalizado do Discord', 'nl': 'Stuur antwoord op een aangepast Discord-slash-commando', 'fr': 'Envoyer une réponse à une commande slash Discord personnalisée', 'it': 'Invia risposta a un comando slash Discord personalizzato', 'es': 'Enviar respuesta a un comando de barra diagonal personalizado de Discord', 'pl': 'Wyślij odpowiedź na niestandardowe polecenie ukośnika Discord', 'uk': 'Надіслати відповідь на спеціальну команду Discord зі слешем', 'zh-cn': '发送对自定义 Discord 斜杠命令的回复' };
Blockly.Words['discord_send_custom_command_reply_tooltip'] = { 'en': 'Send a reply to a custom Discord slash command.', 'de': 'Senden einer Antwort auf einen benutzerdefinierten Discord-Slash-Befehl.', 'ru': 'Отправьте ответ на пользовательскую косую черту Discord.', 'pt': 'Envie uma resposta a um comando de barra personalizado do Discord.', 'nl': 'Stuur een antwoord op een aangepast Discord-slash-commando.', 'fr': 'Envoyez une réponse à une commande slash Discord personnalisée.', 'it': 'Invia una risposta a un comando slash Discord personalizzato.', 'es': 'Envíe una respuesta a un comando de barra inclinada de Discord personalizado.', 'pl': 'Wyślij odpowiedź na niestandardowe polecenie ukośnika Discorda.', 'uk': 'Надішліть відповідь на спеціальну команду Discord зі слешем.', 'zh-cn': '发送对自定义 Discord 斜杠命令的回复。' };
Blockly.Words['discord_interaction_id'] = { 'en': 'Interaction ID', 'de': 'Interaktions-ID', 'ru': 'Идентификатор взаимодействия', 'pt': 'Código de interação', 'nl': 'Interactie-ID', 'fr': 'ID d\'interaction', 'it': 'ID interazione', 'es': 'ID de interacción', 'pl': 'Identyfikator interakcji', 'uk': 'ID взаємодії', 'zh-cn': '交互 ID' };
Blockly.Words['discord_help_url'] = { 'en': 'https://github.com/crycode-de/ioBroker.discord/blob/main/docs/en/README.md#blockly', 'de': 'https://github.com/crycode-de/ioBroker.discord/blob/main/docs/de/README.md#blockly', 'ru': 'https://github.com/crycode-de/ioBroker.discord/blob/main/docs/en/README.md#blockly', 'pt': 'https://github.com/crycode-de/ioBroker.discord/blob/main/docs/en/README.md#blockly', 'nl': 'https://github.com/crycode-de/ioBroker.discord/blob/main/docs/en/README.md#blockly', 'fr': 'https://github.com/crycode-de/ioBroker.discord/blob/main/docs/en/README.md#blockly', 'it': 'https://github.com/crycode-de/ioBroker.discord/blob/main/docs/en/README.md#blockly', 'es': 'https://github.com/crycode-de/ioBroker.discord/blob/main/docs/en/README.md#blockly', 'pl': 'https://github.com/crycode-de/ioBroker.discord/blob/main/docs/en/README.md#blockly', 'uk': 'https://github.com/crycode-de/ioBroker.discord/blob/main/docs/en/README.md#blockly', 'zh-cn': 'https://github.com/crycode-de/ioBroker.discord/blob/main/docs/en/README.md#blockly' };

Blockly.CustomBlocks = Blockly.CustomBlocks || [];
Blockly.CustomBlocks.push('Discord');

Blockly.Discord = {
  HUE: 235,
  blocks: {},
};

const DiscordHelpers = {
  helpUrl: Blockly.Translate('discord_help_url'),

  getInstancesOptions: () => {
    const options = [];
    if (typeof main !== 'undefined' && main.instances) {
      for (const instance of main.instances) {
        const m = instance.match(/^system.adapter.discord.(\d+)$/);
        if (m) {
          const k = parseInt(m[1], 10);
          options.push(['discord.' + k, '.' + k]);
        }
      }
      if (options.length === 0) {
        for (let u = 0; u <= 4; u++) {
          options.push(['discord.' + u, '.' + u]);
        }
      }
    } else {
      for (let n = 0; n <= 4; n++) {
        options.push(['discord.' + n, '.' + n]);
      }
    }

    return options;
  },

  createSendToXml: (name, opts) => {
    let xml = `<block type='${name}'>
      <value name='instance'>
      </value>`;

    if (opts.inputUser) {
      xml += `
      <value name='user'>
        <shadow type='text'>
          <field name='TEXT'></field>
        </shadow>
      </value>`;
    }

    if (opts.inputServerChannel) {
      xml += `
      <value name='serverId'>
        <shadow type='text'>
          <field name='TEXT'></field>
        </shadow>
      </value>
      <value name='channelId'>
        <shadow type='text'>
          <field name='TEXT'></field>
        </shadow>
      </value>`;
    }

    if (opts.inputMessageId) {
      xml += `
      <value name='messageId'>
        <shadow type='text'>
          <field name='TEXT'></field>
        </shadow>
      </value>`;
    }

    if (opts.inputInteractionId) {
      xml += `
      <value name='interactionId'>
      </value>`;
    }

    if (opts.inputContent) {
      xml += `
      <value name='content'>
        <shadow type='text'>
          <field name='TEXT'></field>
        </shadow>
      </value>`;
    }

    if (opts.inputEmoji) {
      xml += `
      <value name='emoji'>
        <shadow type='text'>
          <field name='TEXT'>👍</field>
        </shadow>
      </value>`;
    }

    if (opts.inputVarMessageId) {
      xml += `
      <value name='varMessageId'>
        <shadow type='logic_null'></shadow>
      </value>`;
    }

    xml += `
      <value name='varError'>
        <shadow type='logic_null'></shadow>
      </value>
      <value name='logResultOk'>
      </value>
    </block>`;

    return xml;
  },

  createSendToJs: (opts) => {
    let resultCode = '';
    if (opts.varMessageId && opts.varMessageId !== 'null') {
      resultCode += `\n        ${opts.varMessageId} = result.messageId || null;`;
    }
    if (opts.varError && opts.varError !== 'null') {
      resultCode += `\n        ${opts.varError} = result.error || null;`;
    }

    if (opts.logResultOk === true || opts.logResultOk === 'true' || opts.logResultOk === 'TRUE') {
      resultCode += `\n        log(\`[discord${opts.instance}] sendTo result: \${result.result}\`)`;
    }

    let contentCode = null;

    if (opts.content) {
      contentCode = `const content = ${opts.content};

      if (typeof content === 'object') {
        // remove empty content
        if (content.hasOwnProperty('content') && !content.content) {
          delete content.content;
        }

        // check files
        if (content.files) {
          if (!Array.isArray(content.files)) {
            content.files = [content.files];
          }
          for (let i = 0; i < content.files.length; i++) {
            if (typeof content.files[i] === 'object') {
              if (!content.files[i].name) {
                content.files[i].name = content.files[i].attachment.split(/[\\/]/).pop();
              }
            } else {
              content.files[i] = {
                attachment: content.files[i],
                name: content.files[i].split(/[\\/]/).pop(),
              };
            }
          }
        }

        // check embeds
        if (content.embeds) {
          if (!Array.isArray(content.embeds)) {
            content.embeds = [content.embeds];
          }
          for (let i = 0; i < content.embeds.length; i++) {
            if (typeof content.embeds[i] === 'object') {
              for (const n of ['title', 'description', 'url']) {
                if (!content.embeds[i].hasOwnProperty(n) && !content.embeds[i][n]) {
                  delete content.embeds[i][n];
                }
              }
            } else {
              content.embeds[i] = {
                description: content.embeds[i],
              };
            }
          }
        }
      }\n`;
    }

    let userCode = null;
    if (opts.user) {
      userCode = `if (typeof ${opts.user} === 'string') {
        if (${opts.user}.match(/^\\d+$/)) {
          data.userId = ${opts.user};
        } else if (${opts.user}.match(/^.*#(\\d|\\d{4})$/)) {
          data.userTag = ${opts.user};
        } else {
          data.userName = ${opts.user};
        }
      }`;
    }

    return `await new Promise((resolve) => {
      ${contentCode || ''}
      const data =  {
        ${opts.target ? `${opts.target},` : ''}
        ${opts.messageId ? `messageId: ${opts.messageId},` : ''}
        ${contentCode ? `content: content,` : ''}
        ${opts.emoji ? `emoji: ${opts.emoji},` : ''}
      };
      ${userCode || ''}
      sendTo('discord${opts.instance}', '${opts.action}', data, (result) => {
        if (result.error) {
          log(\`[discord${opts.instance}] sendTo error: \${result.error}\\n\${JSON.stringify(result)}\`, 'warn');
          resolve();
          return;
        }
        ${resultCode}
        resolve();
      });
    });\n`;
  },

  setupSendToBlock: (block, opts) => {
    if (opts.label) {
      block.appendDummyInput('_label')
        .appendField(Blockly.Translate(opts.label));
    }

    block.appendDummyInput('instance')
      .appendField(Blockly.Translate('discord_instance'))
      .appendField(new Blockly.FieldDropdown(DiscordHelpers.getInstancesOptions()), 'instance');

    if (opts.inputUser) {
      block.appendValueInput('user')
        .setCheck('String')
        .appendField(Blockly.Translate('discord_user_id_name_or_tag'));
    }

    if (opts.inputServerChannel) {
      block.appendValueInput('serverId')
        .setCheck('String')
        .appendField(Blockly.Translate('discord_server_id'));

      block.appendValueInput('channelId')
        .setCheck('String')
        .appendField(Blockly.Translate('discord_channel_id'));
    }

    if (opts.inputInteractionId) {
      block.appendDummyInput('interactionId')
        .appendField(Blockly.Translate('discord_interaction_id'))
        .appendField(new Blockly.FieldVariable('interactionId'), 'interactionId');
    }

    if (opts.inputMessageId) {
      block.appendValueInput('messageId')
        .setCheck('String')
        .appendField(Blockly.Translate('discord_message_id'));
    }

    if (opts.inputContent) {
      block.appendValueInput('content')
        .setCheck(['String', 'DiscordMessageContent'])
        .appendField(Blockly.Translate('discord_message'));
    }

    if (opts.inputEmoji) {
      block.appendValueInput('emoji')
        .setCheck('String')
        .appendField(Blockly.Translate('discord_emoji'));
    }

    if (opts.inputVarMessageId) {
      block.appendValueInput('varMessageId')
        .appendField(Blockly.Translate('discord_save_message_id_in'))
        .setCheck('Variable');
    }

    block.appendValueInput('varError')
      .appendField(Blockly.Translate('discord_save_error_in'))
      .setCheck('Variable');

    block.appendDummyInput('logResultOk')
      .appendField(Blockly.Translate('discord_log_result_ok'))
      .appendField(new Blockly.FieldCheckbox('FALSE'), 'logResultOk');

    block.setInputsInline(false);
    block.setPreviousStatement(true, null);
    block.setNextStatement(true, null);

    block.setColour(Blockly.Discord.HUE);
    block.setHelpUrl(DiscordHelpers.helpUrl);

    if (opts.tooltip) {
      block.setTooltip(Blockly.Translate(opts.tooltip));
    }
  },
};

// --- Block send message to user ----------------------------------------------
Blockly.Discord.blocks['discord_send_message_user'] = DiscordHelpers.createSendToXml('discord_send_message_user', {
  inputUser: true,
  inputContent: true,
  inputVarMessageId: true,
});

Blockly.Blocks['discord_send_message_user'] = {
  init: function () {
    DiscordHelpers.setupSendToBlock(this, {
      label: 'discord_send_message',
      inputUser: true,
      inputContent: true,
      inputVarMessageId: true,
      tooltip: 'discord_send_message_tooltip',
    });
  },
};

Blockly.JavaScript['discord_send_message_user'] = function (block) {
  const user = Blockly.JavaScript.valueToCode(block, 'user', Blockly.JavaScript.ORDER_ATOMIC);

  return DiscordHelpers.createSendToJs({
    action: 'sendMessage',
    instance: block.getFieldValue('instance'),
    user: user,
    content: Blockly.JavaScript.valueToCode(block, 'content', Blockly.JavaScript.ORDER_ATOMIC),
    varMessageId: Blockly.JavaScript.valueToCode(block, 'varMessageId', Blockly.JavaScript.ORDER_ATOMIC),
    varError: Blockly.JavaScript.valueToCode(block, 'varError', Blockly.JavaScript.ORDER_ATOMIC),
    logResultOk: block.getFieldValue('logResultOk'),
  });
};

// --- Block send message to server channel ------------------------------------
Blockly.Discord.blocks['discord_send_message_server_channel'] = DiscordHelpers.createSendToXml('discord_send_message_server_channel', {
  inputServerChannel: true,
  inputContent: true,
  inputVarMessageId: true,
});

Blockly.Blocks['discord_send_message_server_channel'] = {
  init: function () {
    DiscordHelpers.setupSendToBlock(this, {
      label: 'discord_send_message',
      inputServerChannel: true,
      inputContent: true,
      inputVarMessageId: true,
      tooltip: 'discord_send_message_tooltip',
    });
  },
};

Blockly.JavaScript['discord_send_message_server_channel'] = function (block) {
  const serverId = Blockly.JavaScript.valueToCode(block, 'serverId', Blockly.JavaScript.ORDER_ATOMIC);
  const channelId = Blockly.JavaScript.valueToCode(block, 'channelId', Blockly.JavaScript.ORDER_ATOMIC);

  return DiscordHelpers.createSendToJs({
    action: 'sendMessage',
    instance: block.getFieldValue('instance'),
    target: `serverId: ${serverId}, channelId: ${channelId}`,
    content: Blockly.JavaScript.valueToCode(block, 'content', Blockly.JavaScript.ORDER_ATOMIC),
    varMessageId: Blockly.JavaScript.valueToCode(block, 'varMessageId', Blockly.JavaScript.ORDER_ATOMIC),
    varError: Blockly.JavaScript.valueToCode(block, 'varError', Blockly.JavaScript.ORDER_ATOMIC),
    logResultOk: block.getFieldValue('logResultOk'),
  });
};

// --- Block edit message to user ----------------------------------------------
Blockly.Discord.blocks['discord_edit_message_user'] = DiscordHelpers.createSendToXml('discord_edit_message_user', {
  inputUser: true,
  inputMessageId: true,
  inputContent: true,
});

Blockly.Blocks['discord_edit_message_user'] = {
  init: function () {
    DiscordHelpers.setupSendToBlock(this, {
      label: 'discord_edit_message',
      inputUser: true,
      inputMessageId: true,
      inputContent: true,
      tooltip: 'discord_edit_message_tooltip',
    });
  },
};

Blockly.JavaScript['discord_edit_message_user'] = function (block) {
  const user = Blockly.JavaScript.valueToCode(block, 'user', Blockly.JavaScript.ORDER_ATOMIC);

  return DiscordHelpers.createSendToJs({
    action: 'editMessage',
    instance: block.getFieldValue('instance'),
    user: user,
    messageId: Blockly.JavaScript.valueToCode(block, 'messageId', Blockly.JavaScript.ORDER_ATOMIC),
    content: Blockly.JavaScript.valueToCode(block, 'content', Blockly.JavaScript.ORDER_ATOMIC),
    varError: Blockly.JavaScript.valueToCode(block, 'varError', Blockly.JavaScript.ORDER_ATOMIC),
    logResultOk: block.getFieldValue('logResultOk'),
  });
};

// --- Block edit message to server channel ------------------------------------
Blockly.Discord.blocks['discord_edit_message_server_channel'] = DiscordHelpers.createSendToXml('discord_edit_message_server_channel', {
  inputServerChannel: true,
  inputMessageId: true,
  inputContent: true,
});

Blockly.Blocks['discord_edit_message_server_channel'] = {
  init: function () {
    DiscordHelpers.setupSendToBlock(this, {
      label: 'discord_edit_message',
      inputServerChannel: true,
      inputMessageId: true,
      inputContent: true,
      tooltip: 'discord_edit_message_tooltip',
    });
  },
};

Blockly.JavaScript['discord_edit_message_server_channel'] = function (block) {
  const serverId = Blockly.JavaScript.valueToCode(block, 'serverId', Blockly.JavaScript.ORDER_ATOMIC);
  const channelId = Blockly.JavaScript.valueToCode(block, 'channelId', Blockly.JavaScript.ORDER_ATOMIC);

  return DiscordHelpers.createSendToJs({
    action: 'editMessage',
    instance: block.getFieldValue('instance'),
    target: `serverId: ${serverId}, channelId: ${channelId}`,
    messageId: Blockly.JavaScript.valueToCode(block, 'messageId', Blockly.JavaScript.ORDER_ATOMIC),
    content: Blockly.JavaScript.valueToCode(block, 'content', Blockly.JavaScript.ORDER_ATOMIC),
    varError: Blockly.JavaScript.valueToCode(block, 'varError', Blockly.JavaScript.ORDER_ATOMIC),
    logResultOk: block.getFieldValue('logResultOk'),
  });
};

// --- Block delete message to user --------------------------------------------
Blockly.Discord.blocks['discord_delete_message_user'] = DiscordHelpers.createSendToXml('discord_delete_message_user', {
  inputUser: true,
  inputMessageId: true,
});

Blockly.Blocks['discord_delete_message_user'] = {
  init: function () {
    DiscordHelpers.setupSendToBlock(this, {
      label: 'discord_delete_message',
      inputUser: true,
      inputMessageId: true,
      tooltip: 'discord_delete_message_tooltip',
    });
  },
};

Blockly.JavaScript['discord_delete_message_user'] = function (block) {
  const user = Blockly.JavaScript.valueToCode(block, 'user', Blockly.JavaScript.ORDER_ATOMIC);

  return DiscordHelpers.createSendToJs({
    action: 'deleteMessage',
    instance: block.getFieldValue('instance'),
    user: user,
    messageId: Blockly.JavaScript.valueToCode(block, 'messageId', Blockly.JavaScript.ORDER_ATOMIC),
    varError: Blockly.JavaScript.valueToCode(block, 'varError', Blockly.JavaScript.ORDER_ATOMIC),
    logResultOk: block.getFieldValue('logResultOk'),
  });
};

// --- Block delete message to server channel ----------------------------------
Blockly.Discord.blocks['discord_delete_message_server_channel'] = DiscordHelpers.createSendToXml('discord_delete_message_server_channel', {
  inputServerChannel: true,
  inputMessageId: true,
});

Blockly.Blocks['discord_delete_message_server_channel'] = {
  init: function () {
    DiscordHelpers.setupSendToBlock(this, {
      label: 'discord_delete_message',
      inputServerChannel: true,
      inputMessageId: true,
      tooltip: 'discord_delete_message_tooltip',
    });
  },
};

Blockly.JavaScript['discord_delete_message_server_channel'] = function (block) {
  const serverId = Blockly.JavaScript.valueToCode(block, 'serverId', Blockly.JavaScript.ORDER_ATOMIC);
  const channelId = Blockly.JavaScript.valueToCode(block, 'channelId', Blockly.JavaScript.ORDER_ATOMIC);

  return DiscordHelpers.createSendToJs({
    action: 'deleteMessage',
    instance: block.getFieldValue('instance'),
    target: `serverId: ${serverId}, channelId: ${channelId}`,
    messageId: Blockly.JavaScript.valueToCode(block, 'messageId', Blockly.JavaScript.ORDER_ATOMIC),
    varError: Blockly.JavaScript.valueToCode(block, 'varError', Blockly.JavaScript.ORDER_ATOMIC),
    logResultOk: block.getFieldValue('logResultOk'),
  });
};

// --- Block add message reaction to user --------------------------------------
Blockly.Discord.blocks['discord_add_message_reaction_user'] = DiscordHelpers.createSendToXml('discord_add_message_reaction_user', {
  inputUser: true,
  inputMessageId: true,
  inputEmoji: true,
});

Blockly.Blocks['discord_add_message_reaction_user'] = {
  init: function () {
    DiscordHelpers.setupSendToBlock(this, {
      label: 'discord_add_message_reaction',
      inputUser: true,
      inputMessageId: true,
      inputEmoji: true,
      tooltip: 'discord_add_message_reaction_tooltip',
    });
  },
};

Blockly.JavaScript['discord_add_message_reaction_user'] = function (block) {
  const user = Blockly.JavaScript.valueToCode(block, 'user', Blockly.JavaScript.ORDER_ATOMIC);

  return DiscordHelpers.createSendToJs({
    action: 'addReaction',
    instance: block.getFieldValue('instance'),
    user: user,
    messageId: Blockly.JavaScript.valueToCode(block, 'messageId', Blockly.JavaScript.ORDER_ATOMIC),
    emoji: Blockly.JavaScript.valueToCode(block, 'emoji', Blockly.JavaScript.ORDER_ATOMIC),
    varError: Blockly.JavaScript.valueToCode(block, 'varError', Blockly.JavaScript.ORDER_ATOMIC),
    logResultOk: block.getFieldValue('logResultOk'),
  });
};

// --- Block add message reaction to server channel ----------------------------
Blockly.Discord.blocks['discord_add_message_reaction_server_channel'] = DiscordHelpers.createSendToXml('discord_add_message_reaction_server_channel', {
  inputServerChannel: true,
  inputMessageId: true,
  inputEmoji: true,
});

Blockly.Blocks['discord_add_message_reaction_server_channel'] = {
  init: function () {
    DiscordHelpers.setupSendToBlock(this, {
      label: 'discord_add_message_reaction',
      inputServerChannel: true,
      inputMessageId: true,
      inputEmoji: true,
      tooltip: 'discord_add_message_reaction_tooltip',
    });
  },
};

Blockly.JavaScript['discord_add_message_reaction_server_channel'] = function (block) {
  const serverId = Blockly.JavaScript.valueToCode(block, 'serverId', Blockly.JavaScript.ORDER_ATOMIC);
  const channelId = Blockly.JavaScript.valueToCode(block, 'channelId', Blockly.JavaScript.ORDER_ATOMIC);

  return DiscordHelpers.createSendToJs({
    action: 'addReaction',
    instance: block.getFieldValue('instance'),
    target: `serverId: ${serverId}, channelId: ${channelId}`,
    messageId: Blockly.JavaScript.valueToCode(block, 'messageId', Blockly.JavaScript.ORDER_ATOMIC),
    emoji: Blockly.JavaScript.valueToCode(block, 'emoji', Blockly.JavaScript.ORDER_ATOMIC),
    varError: Blockly.JavaScript.valueToCode(block, 'varError', Blockly.JavaScript.ORDER_ATOMIC),
    logResultOk: block.getFieldValue('logResultOk'),
  });
};

// --- Block create content ----------------------------------------------------
Blockly.Discord.blocks['discord_create_content'] =
  `<block type='discord_create_content'>
    <value name='content'>
      <shadow type='text'>
        <field name='TEXT'></field>
      </shadow>
    </value>
    <value name='embeds'>
      <shadow type='logic_null'></shadow>
    </value>
    <value name='files'>
      <shadow type='logic_null'></shadow>
    </value>
    <value name='replyToId'>
      <shadow type='logic_null'></shadow>
    </value>
  </block>`;

Blockly.Blocks['discord_create_content'] = {
  init: function () {
    this.appendDummyInput('_title')
      .appendField(Blockly.Translate('discord_message_content'));

    this.appendValueInput('content')
      .setCheck('String')
      .appendField(Blockly.Translate('discord_content'));

    this.appendValueInput('embeds')
      .setCheck(['String', 'Array', 'DiscordEmbed']) // may be a single sting, embed or array of both
      .appendField(Blockly.Translate('discord_embeds'));

    this.appendValueInput('files')
      .setCheck(['String', 'Array', 'DiscordFile']) // may be a single filename, attachment or array of both
      .appendField(Blockly.Translate('discord_attachments'));

    this.appendValueInput('replyToId')
      .setCheck('String')
      .appendField(Blockly.Translate('discord_reply_to_id'));

    this.setInputsInline(false);

    this.setOutput(true, 'DiscordMessageContent');

    this.setColour(Blockly.Discord.HUE);
    this.setTooltip(Blockly.Translate('discord_message_content_tooltip'));
    this.setHelpUrl(DiscordHelpers.helpUrl);
  },
};

Blockly.JavaScript['discord_create_content'] = function (block) {
  const content = Blockly.JavaScript.valueToCode(block, 'content', Blockly.JavaScript.ORDER_ATOMIC);
  const replyToId = Blockly.JavaScript.valueToCode(block, 'replyToId', Blockly.JavaScript.ORDER_ATOMIC);
  const embeds = Blockly.JavaScript.valueToCode(block, 'embeds', Blockly.JavaScript.ORDER_ATOMIC);
  const files = Blockly.JavaScript.valueToCode(block, 'files', Blockly.JavaScript.ORDER_ATOMIC);

  const propEmbeds = embeds && embeds !== 'null' ? `\n    embeds: ${embeds},` : '';
  const propFiles = files && files !== 'null' ? `\n    files: ${files},` : '';
  const propReply = replyToId && replyToId !== 'null' ? `\n    reply: { messageReference: ${replyToId} },` : '';

  const ret = `{
    content: ${content},${propEmbeds}${propFiles}${propReply}
  }`;
  return [ret, Blockly.JavaScript.ORDER_ATOMIC];
};

// --- Block create embed -------------------------------------------------------
Blockly.Discord.blocks['discord_create_embed'] =
  `<block type='discord_create_embed'>
    <value name='description'>
      <shadow type='text'>
        <field name='TEXT'></field>
      </shadow>
    </value>
    <value name='title'>
      <shadow type='logic_null'>
      </shadow>
    </value>
    <value name='url'>
      <shadow type='logic_null'>
      </shadow>
    </value>
    <value name='color'>
      <shadow type='colour_picker'>
        <field name='COLOUR'>#5865f2</field>
      </shadow>
    </value>
    <value name='imageUrl'>
      <shadow type='logic_null'>
      </shadow>
    </value>
    <value name='footerText'>
      <shadow type='logic_null'>
      </shadow>
    </value>
  </block>`;

Blockly.Blocks['discord_create_embed'] = {
  init: function () {

    this.appendDummyInput('_title')
      .appendField(Blockly.Translate('discord_message_embed'));

    this.appendValueInput('description')
      .setCheck('String')
      .appendField(Blockly.Translate('discord_description'));

    this.appendValueInput('title')
      .setCheck('String')
      .appendField(Blockly.Translate('discord_title'));

    this.appendValueInput('url')
      .setCheck('String')
      .appendField(Blockly.Translate('discord_url'));

    this.appendValueInput('color')
      .setCheck('Colour')
      .appendField(Blockly.Translate('discord_color'));

    this.appendValueInput('imageUrl')
      .setCheck('String')
      .appendField(Blockly.Translate('discord_image_url'));

    this.appendValueInput('footerText')
      .setCheck('String')
      .appendField(Blockly.Translate('discord_footer_text'));

    this.setInputsInline(false);

    this.setOutput(true, 'DiscordEmbed');

    this.setColour(Blockly.Discord.HUE);
    this.setTooltip(Blockly.Translate('discord_message_embed_tooltip'));
    this.setHelpUrl(DiscordHelpers.helpUrl);
  },
};

Blockly.JavaScript['discord_create_embed'] = function (block) {
  const title = Blockly.JavaScript.valueToCode(block, 'title', Blockly.JavaScript.ORDER_ATOMIC);
  const description = Blockly.JavaScript.valueToCode(block, 'description', Blockly.JavaScript.ORDER_ATOMIC);
  const color = Blockly.JavaScript.valueToCode(block, 'color', Blockly.JavaScript.ORDER_ATOMIC);
  const url = Blockly.JavaScript.valueToCode(block, 'url', Blockly.JavaScript.ORDER_ATOMIC);
  const imageUrl = Blockly.JavaScript.valueToCode(block, 'imageUrl', Blockly.JavaScript.ORDER_ATOMIC);
  const footerText = Blockly.JavaScript.valueToCode(block, 'footerText', Blockly.JavaScript.ORDER_ATOMIC);

  let ret = `{`;

  if (title && title !== 'null' && title !== `''`) {
    ret += `\n    title: ${title},`;
  }
  if (description && description !== 'null' && description !== `''`) {
    ret += `\n    description: ${description},`;
  }
  if (color && color !== 'null' && color !== `''`) {
    ret += `\n    color: ${color},`;
  }
  if (url && url !== 'null' && url !== `''`) {
    ret += `\n    url: ${url},`;
  }
  if (imageUrl && imageUrl !== 'null' && imageUrl !== `''`) {
    ret += `\n    image: { url: ${imageUrl} },`;
  }
  if (footerText && imageUrl !== 'null' && footerText !== `''`) {
    ret += `\n    footer: { text: ${footerText} },`;
  }
  ret += '\n  }';

  return [ret, Blockly.JavaScript.ORDER_ATOMIC];
};

// --- Block create file -------------------------------------------------------
Blockly.Discord.blocks['discord_create_file'] =
  `<block type='discord_create_file'>
    <value name='attachment'>
      <shadow type='text'>
        <field name='TEXT'></field>
      </shadow>
    </value>
    <value name='name'>
      <shadow type='text'>
        <field name='TEXT'></field>
      </shadow>
    </value>
    <value name='description'>
      <shadow type='text'>
        <field name='TEXT'></field>
      </shadow>
    </value>
  </block>`;

Blockly.Blocks['discord_create_file'] = {
  init: function () {

    this.appendDummyInput('_title')
      .appendField(Blockly.Translate('discord_file_attachment'));

    this.appendValueInput('attachment')
      .setCheck('String')
      .appendField(Blockly.Translate('discord_file_path'));

    this.appendValueInput('name')
      .setCheck('String')
      .appendField(Blockly.Translate('discord_file_name'));

    this.appendValueInput('description')
      .setCheck('String')
      .appendField(Blockly.Translate('discord_description'));

    this.setInputsInline(false);

    this.setOutput(true, 'DiscordFile');

    this.setColour(Blockly.Discord.HUE);
    this.setTooltip(Blockly.Translate('discord_file_attachment_tooltip'));
    this.setHelpUrl(DiscordHelpers.helpUrl);
  },
};

Blockly.JavaScript['discord_create_file'] = function (block) {
  const attachment = Blockly.JavaScript.valueToCode(block, 'attachment', Blockly.JavaScript.ORDER_ATOMIC);
  const name = Blockly.JavaScript.valueToCode(block, 'name', Blockly.JavaScript.ORDER_ATOMIC);
  const description = Blockly.JavaScript.valueToCode(block, 'description', Blockly.JavaScript.ORDER_ATOMIC);

  let ret = `{
    attachment: ${attachment},`;

  if (name && name !== 'null' && name !== `''`) {
    ret += `\n    name: ${name},`;
  }
  if (description && description !== 'null' && description !== `''`) {
    ret += `\n    description: ${description},`;
  }
  ret += '\n  }';

  return [ret, Blockly.JavaScript.ORDER_ATOMIC];
};

// --- Block on custom slash command -------------------------------------------
Blockly.Discord.blocks['discord_on_custom_cmd'] =
  `<block type='discord_on_custom_cmd'>
    <value name='instance'>
    </value>
    <value name='commandName'>
    </value>
    <value name='varInteractionId'>
    </value>
    <value name='varUserId'>
      <shadow type='logic_null'>
      </shadow>
    </value>
    <value name='varUserName'>
      <shadow type='logic_null'>
      </shadow>
    </value>
    <value name='varUserTag'>
      <shadow type='logic_null'>
      </shadow>
    </value>
    <value name='log'>
    </value>
    <value name='STATEMENT'>
    </value>
    <mutation options='${Blockly.Translate('discord_custom_cmd_option').toLowerCase()}1'></mutation>
  </block>`;

Blockly.Blocks['discord_on_custom_cmd_container'] = {
  /**
   * Mutator block for container.
   * @this Blockly.Block
   */
  init: function () {
    this.setColour(Blockly.Discord.HUE);

    this.appendDummyInput()
      .appendField(Blockly.Translate('discord_custom_cmd_options'));

    this.appendStatementInput('STACK');
    this.setTooltip(Blockly.Translate('discord_custom_cmd_option_tooltip'));
    this.contextMenu = false;
  }
};

Blockly.Blocks['discord_on_custom_cmd_item'] = {
  /**
   * Mutator block for add items.
   * @this Blockly.Block
   */
  init: function () {
    this.setColour(Blockly.Discord.HUE);

    this.appendDummyInput('NAME')
      .appendField(Blockly.Translate('discord_custom_cmd_option'));

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip(Blockly.Translate('discord_custom_cmd_option_tooltip'));
    this.contextMenu = false;
  }
};

Blockly.Blocks['discord_on_custom_cmd'] = {
  init: function () {
    this.appendDummyInput('_label')
      .appendField(Blockly.Translate('discord_on_custom_cmd'));


    this.appendDummyInput('instance')
      .appendField(Blockly.Translate('discord_instance'))
      .appendField(new Blockly.FieldDropdown(DiscordHelpers.getInstancesOptions()), 'instance');

    this.appendDummyInput('varInteractionId')
      .appendField(Blockly.Translate('discord_save_interaction_id_in'))
      .appendField(new Blockly.FieldVariable('interactionId'), 'varInteractionId');

    this.appendValueInput('varUserId')
      .appendField(Blockly.Translate('discord_save_user_id_in'))
      .setCheck('Variable');

    this.appendValueInput('varUserName')
      .appendField(Blockly.Translate('discord_save_user_name_in'))
      .setCheck('Variable');

    this.appendValueInput('varUserTag')
      .appendField(Blockly.Translate('discord_save_user_tag_in'))
      .setCheck('Variable');

    this.appendDummyInput('log')
      .appendField(Blockly.Translate('discord_log_command'))
      .appendField(new Blockly.FieldCheckbox('FALSE'), 'log');

    this.appendDummyInput('commandName')
      .appendField(Blockly.Translate('discord_custom_command_name'))
      .appendField(new Blockly.FieldTextInput('my-cmd'), 'commandName');

    this.appendDummyInput('_label')
      .appendField(Blockly.Translate('discord_on_custom_cmd_options_to_vars'));

    this.setColour(Blockly.Discord.HUE);

    this.itemCount_ = 1;
    this.updateShape_();
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    if (typeof Blockly.icons === 'object') {
      // Blockly >= 10
      this.setMutator(new Blockly.icons.MutatorIcon(['discord_on_custom_cmd_item'], this));
    } else {
      // Blockly 9.x
      this.setMutator(new Blockly.Mutator(['discord_on_custom_cmd_item']));
    }
    this.setTooltip(Blockly.Translate('discord_on_custom_cmd_tooltip'));
    this.setHelpUrl(DiscordHelpers.helpUrl);
  },

  /**
   * Create XML to represent number of text inputs.
   * @return {!Element} XML storage element.
   * @this Blockly.Block
   */
  mutationToDom: function () {
    const container = document.createElement('mutation');
    const names = [];
    for (let i = 0; i < this.itemCount_; i++) {
      const input = this.getInput('option' + i);
      names[i] = input.fieldRow[0].getValue();
    }

    container.setAttribute('options', names.join(','));
    return container;
  },

  /**
   * Parse XML to restore the text inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this Blockly.Block
   */
  domToMutation: function (xmlElement) {
    const names = xmlElement.getAttribute('options').split(',');
    this.itemCount_ = names.length;
    this.updateShape_(names);
  },

  /**
   * Populate the mutator's dialog with this block's components.
   * @param {!Blockly.Workspace} workspace Mutator's workspace.
   * @return {!Blockly.Block} Root block in mutator.
   * @this Blockly.Block
   */
  decompose: function (workspace) {
    const containerBlock = workspace.newBlock('discord_on_custom_cmd_container');
    containerBlock.initSvg();
    let connection = containerBlock.getInput('STACK').connection;
    for (let i = 0; i < this.itemCount_; i++) {
      const itemBlock = workspace.newBlock('discord_on_custom_cmd_item');
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }
    return containerBlock;
  },

  /**
   * Reconfigure this block based on the mutator dialog's components.
   * @param {!Blockly.Block} containerBlock Root block in mutator.
   * @this Blockly.Block
   */
  compose: function (containerBlock) {
    let itemBlock = containerBlock.getInputTargetBlock('STACK');
    // Count number of inputs.
    const connections = [];
    const names = [];
    while (itemBlock) {
      connections.push(itemBlock.valueConnection_);
      itemBlock = itemBlock.nextConnection &&
        itemBlock.nextConnection.targetBlock();
    }
    // Disconnect any children that don't belong.
    for (let i = 0; i < this.itemCount_; i++) {
      const input = this.getInput('option' + i);
      const connection = input.connection.targetConnection;
      names[i] = input.fieldRow[0].getValue();
      if (connection && connections.indexOf(connection) === -1) {
        connection.disconnect();
      }
    }
    this.itemCount_ = connections.length;
    if (this.itemCount_ < 1) this.itemCount_ = 1;
    this.updateShape_(names);
    // Reconnect any child blocks.
    for (let j = 0; j < this.itemCount_; j++) {
      Blockly.Mutator.reconnect(connections[j], this, 'option' + j);
    }
  },

  /**
   * Store pointers to any connected child blocks.
   * @param {!Blockly.Block} containerBlock Root block in mutator.
   * @this Blockly.Block
   */
  saveConnections: function (containerBlock) {
    let itemBlock = containerBlock.getInputTargetBlock('STACK');
    let i = 0;
    while (itemBlock) {
      const input = this.getInput('option' + i);
      itemBlock.valueConnection_ = input && input.connection.targetConnection;
      itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
      i++;
    }
  },

  /**
   * Modify this block to have the correct number of inputs.
   * @private
   * @this Blockly.Block
   */
  updateShape_: function (names) {
    names = names || [];
    let _input;
    const wp = this.workspace;

    this.getInput('STATEMENT') && this.removeInput('STATEMENT');

    // Add new inputs.
    let i;
    for (i = 0; i < this.itemCount_; i++) {
      _input = this.getInput('option' + i);

      if (!_input) {
        _input = this.appendValueInput('option' + i);
        if (!names[i]) {
          names[i] = Blockly.Translate('discord_custom_cmd_option').toLowerCase() + (i + 1);
        }
        _input.appendField(new Blockly.FieldTextInput(names[i]));
        _input.setAlign(Blockly.ALIGN_RIGHT);
        _input.setCheck('Variable');
        setTimeout(function (_input) {
          if (!_input.connection.isConnected()) {
            const _shadow = wp.newBlock('logic_null');
            _shadow.setShadow(true);
            _shadow.initSvg();
            _shadow.render();
            _shadow.outputConnection.connect(_input.connection);
            //console.log('New ' + names[i]);
          }
        }, 100, _input);
      } else {
        _input.fieldRow[0].setValue(names[i]);
        //console.log('Exist ' + names[i]);
        setTimeout(function (_input, name) {
          if (!_input.connection.isConnected()) {
            console.log('Create ' + name);
            const shadow = wp.newBlock('logic_null');
            shadow.setShadow(true);
            shadow.initSvg();
            shadow.render();
            shadow.outputConnection.connect(_input.connection);
          }
        }, 100, _input, names[i]);
      }
    }

    // Remove deleted inputs.
    const blocks = [];
    while (_input = this.getInput('option' + i)) {
      const b = _input.connection.targetBlock();
      if (b && b.isShadow()) {
        blocks.push(b);
      }
      this.removeInput('option' + i);
      i++;
    }

    if (blocks.length) {
      const ws = this.workspace;
      setTimeout(function () {
        for (var b = 0; b < blocks.length; b++) {
          ws.removeTopBlock(blocks[b]);
        }
      }, 100);
    }

    this.appendStatementInput('STATEMENT');
  }
};

Blockly.JavaScript['discord_on_custom_cmd'] = function (block) {
  const instance = block.getFieldValue('instance');
  const varUserId = Blockly.JavaScript.valueToCode(block, 'varUserId', Blockly.JavaScript.ORDER_ATOMIC);
  const varUserTag = Blockly.JavaScript.valueToCode(block, 'varUserTag', Blockly.JavaScript.ORDER_ATOMIC);
  const log = block.getFieldValue('log');
  let commandName = block.getFieldValue('commandName').replace(/[^0-9a-z-_]/g, '');
  const statement = Blockly.JavaScript.statementToCode(block, 'STATEMENT');

  let varAssigns = '';

  if (varUserId && varUserId !== 'null') {
    varAssigns += `\n      ${varUserId} = data.user.id;`;
  }
  if (varUserTag && varUserTag !== 'null') {
    varAssigns += `\n      ${varUserTag} = data.user.tag;`;
  }

  for (let n = 0; n < block.itemCount_; n++) {
    const input = this.getInput('option' + n);
    let val = Blockly.JavaScript.valueToCode(block, 'option' + n, Blockly.JavaScript.ORDER_COMMA);
    if (val && val !== 'null') {
      varAssigns += `\n      ${val} = (data.options && data.options['${input.fieldRow[0].getValue()}']) ? data.options['${input.fieldRow[0].getValue()}'].value : null;`;
    }
  }

  return `  (function () {
    const id = 'discord${instance}.slashCommands.${commandName}.json';
    on({ id: id, change: 'any', ack: true }, async (obj) => {
      if (typeof obj.state.val !== 'string' || obj.state.val.length === 0) return;
      ${log === true || log === 'true' || log === 'TRUE' ? `log(\`[discord${instance}] Custom slash command ${commandName}: \${obj.state.val}\`);` : '' }
      let data;
      try {
        data = JSON.parse(obj.state.val);
      } catch (e) {
        log(\`[discord${instance}] JSON state \${id} could not be parsed!\`, 'warn');
        return;
      }
      ${Blockly.JavaScript.nameDB_.getName(block.getFieldValue('varInteractionId'), Blockly.Variables.NAME_TYPE)} = data.interactionId;
      ${varAssigns}

      ${statement}
    });
  })();\n`;
};

// --- Block send custom command reply -----------------------------------------
Blockly.Discord.blocks['discord_send_custom_command_reply'] = DiscordHelpers.createSendToXml('discord_send_custom_command_reply', {
  inputInteractionId: true,
  inputContent: true,
  inputVarMessageId: true,
});

Blockly.Blocks['discord_send_custom_command_reply'] = {
  init: function () {
    DiscordHelpers.setupSendToBlock(this, {
      label: 'discord_send_custom_command_reply',
      inputInteractionId: true,
      inputContent: true,
      inputVarMessageId: true,
      tooltip: 'discord_send_custom_command_reply_tooltip',
    });
  },
};

Blockly.JavaScript['discord_send_custom_command_reply'] = function (block) {
  return DiscordHelpers.createSendToJs({
    action: 'sendCustomCommandReply',
    instance: block.getFieldValue('instance'),
    target: `interactionId: ${Blockly.JavaScript.nameDB_.getName(block.getFieldValue('interactionId'), Blockly.Variables.NAME_TYPE)}`,
    content: Blockly.JavaScript.valueToCode(block, 'content', Blockly.JavaScript.ORDER_ATOMIC),
    varMessageId: Blockly.JavaScript.valueToCode(block, 'varMessageId', Blockly.JavaScript.ORDER_ATOMIC),
    varError: Blockly.JavaScript.valueToCode(block, 'varError', Blockly.JavaScript.ORDER_ATOMIC),
    logResultOk: block.getFieldValue('logResultOk'),
  });
};
