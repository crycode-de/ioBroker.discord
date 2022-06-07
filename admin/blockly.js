'use strict';

if (typeof goog !== 'undefined') {
  goog.provide('Blockly.JavaScript.Discord');

  goog.require('Blockly.JavaScript');
}

Blockly.Words['Discord'] = { 'en': 'Discord', 'de': 'Discord', 'ru': 'Discord', 'pt': 'Discord', 'nl': 'Discord', 'fr': 'Discord', 'it': 'Discord', 'es': 'Discord', 'pl': 'Discord', 'zh-cn': 'Discord' };
Blockly.Words['discord_sendto_tooltip'] = { 'en': 'Send a message via Discord', 'de': 'Eine Nachricht über Discord senden', 'ru': 'Отправить сообщение через Discord', 'pt': 'Envie uma mensagem pelo Discord', 'nl': 'Stuur een bericht via Discord', 'fr': 'Envoyer un message via Discord', 'it': 'Invia un messaggio tramite Discord', 'es': 'Enviar un mensaje a través de Discord', 'pl': 'Wyślij wiadomość przez Discord', 'zh-cn': '通过 Discord 发送消息' };
Blockly.Words['discord_send_message'] = { 'en': 'Send Discord message', 'de': 'Discord-Nachricht senden', 'ru': 'Отправить сообщение в дискорде', 'pt': 'Enviar mensagem do Discord', 'nl': 'Discord-bericht verzenden', 'fr': 'Envoyer un message Discord', 'it': 'Invia messaggio Discordia', 'es': 'Enviar mensaje de discordia', 'pl': 'Wyślij wiadomość na Discordzie', 'zh-cn': '发送不和谐消息' };
Blockly.Words['discord_edit_message'] = { 'en': 'Edit Discord message', 'de': 'Discord-Nachricht bearbeiten', 'ru': 'Изменить сообщение Discord', 'pt': 'Editar mensagem do Discord', 'nl': 'Discord-bericht bewerken', 'fr': 'Modifier le message Discord', 'it': 'Modifica messaggio Discord', 'es': 'Editar mensaje de discordia', 'pl': 'Edytuj wiadomość na Discordzie', 'zh-cn': '编辑 Discord 消息' };
Blockly.Words['discord_message'] = { 'en': 'Nachricht', 'de': 'Nachricht', 'ru': 'Нахрихт', 'pt': 'Nachricht', 'nl': 'Nachricht', 'fr': 'Nachricht', 'it': 'Nachricht', 'es': 'Nachricht', 'pl': 'Nachricht', 'zh-cn': '纳赫里赫特' };
Blockly.Words['discord_message_id'] = { 'en': 'Message ID', 'de': 'Nachrichten-ID', 'ru': 'Идентификатор сообщения', 'pt': 'ID da mensagem', 'nl': 'Bericht-ID', 'fr': 'ID du message', 'it': 'ID messaggio', 'es': 'ID de mensaje', 'pl': 'ID wiadomości', 'zh-cn': '消息 ID' };
Blockly.Words['discord_save_messageId_in'] = { 'en': 'Save message ID in', 'de': 'Nachrichten-ID speichern in', 'ru': 'Сохранить идентификатор сообщения в', 'pt': 'Salvar ID da mensagem em', 'nl': 'Bericht-ID opslaan in', 'fr': 'Enregistrer l\'identifiant du message dans', 'it': 'Salva l\'ID del messaggio in', 'es': 'Guardar ID de mensaje en', 'pl': 'Zapisz identyfikator wiadomości w', 'zh-cn': '将消息 ID 保存在' };
Blockly.Words['discord_save_error_in'] = {  'en': 'Save error in', 'de': 'Fehler speichern in', 'ru': 'Сохранить ошибку в', 'pt': 'Salvar erro em', 'nl': 'Fout opslaan in', 'fr': 'Enregistrer l\'erreur dans', 'it': 'Salva errore in', 'es': 'Guardar error en', 'pl': 'Zapisz błąd w', 'zh-cn': '将错误保存在' };
Blockly.Words['discord_log_result_ok'] = { 'en': 'Log result if sent', 'de': 'Ergebnis protokollieren, wenn gesendet', 'ru': 'Результат журнала, если он отправлен', 'pt': 'Log do resultado se enviado', 'nl': 'Log resultaat indien verzonden', 'fr': 'Consigner le résultat si envoyé', 'it': 'Registra il risultato se inviato', 'es': 'Registrar resultado si se envía', 'pl': 'Zaloguj wynik, jeśli został wysłany', 'zh-cn': '记录结果（如果已发送）' };
Blockly.Words['discord_instance'] = { 'en': 'Discord instance', 'de': 'Discord-Instanz', 'ru': 'Дискорд-экземпляр', 'pt': 'Instância de discórdia', 'nl': 'Discord-instantie', 'fr': 'Instance de discorde', 'it': 'Istanza di discordia', 'es': 'Instancia de discordia', 'pl': 'Instancja Discord', 'zh-cn': '不和谐实例' };
Blockly.Words['discord_user'] = { 'en': 'User', 'de': 'Benutzer', 'ru': 'Пользователь', 'pt': 'Do utilizador', 'nl': 'Gebruiker', 'fr': 'Utilisateur', 'it': 'Utente', 'es': 'Usuario', 'pl': 'Użytkownik', 'zh-cn': '用户' };
Blockly.Words['discord_server_id'] = { 'en': 'Server ID', 'de': 'Server-ID', 'ru': 'Идентификатор сервера', 'pt': 'ID do servidor', 'nl': 'Server-ID', 'fr': 'Identifiant du serveur', 'it': 'ID server', 'es': 'identificación del servidor', 'pl': 'Identyfikator serwera', 'zh-cn': '服务器编号' };
Blockly.Words['discord_channel_id'] = { 'en': 'Channel ID', 'de': 'Kanal-ID', 'ru': 'Идентификатор канала', 'pt': 'ID do canal', 'nl': 'Kanaal Nr', 'fr': 'Identifiant de la chaine', 'it': 'Canale ID', 'es': 'Canal ID', 'pl': 'ID kanału', 'zh-cn': '频道 ID' };
Blockly.Words['discord_message_content'] = { 'en': 'Discord message content', 'de': 'Discord Nachricht', 'ru': 'Содержимое сообщения Discord', 'pt': 'Discord conteúdo da mensagem', 'nl': 'Inhoud van discord-bericht', 'fr': 'Discorder le contenu des messages', 'it': 'Discord contenuto del messaggio', 'es': 'Contenido del mensaje de discordia', 'pl': 'Treść wiadomości na Discordzie', 'zh-cn': '不和谐消息内容' };
Blockly.Words['discord_message_content_tooltip'] = { 'en': 'Create a Discord message. Embeds and Attachments may be a singe embed/attachment or a list of embeds/attachments.', 'de': 'Erstellen einer Discord-Nachricht. Einbettungen und Anhänge können einzelne Einbettungen/Anhänge oder eine Liste von Einbettungen/Anhängen sein.', 'ru': 'Создайте сообщение в Discord. Вложения и вложения могут быть отдельными вложениями/вложениями или списком вложений/вложений.', 'pt': 'Crie uma mensagem do Discord. Incorporações e anexos podem ser uma única incorporação/anexo ou uma lista de incorporações/anexos.', 'nl': 'Maak een Discord-bericht. Insluitingen en bijlagen kunnen een enkele insluiting/bijlage zijn of een lijst met insluitingen/bijlagen.', 'fr': 'Créez un message Discord. Les intégrations et les pièces jointes peuvent être une seule intégration/pièce jointe ou une liste d\'intégrations/pièces jointes.', 'it': 'Crea un messaggio Discord. Incorporamenti e allegati possono essere un unico incorporamento/allegato o un elenco di incorporamenti/allegati.', 'es': 'Crea un mensaje de Discord. Las incrustaciones y los archivos adjuntos pueden ser una sola inserción/archivo adjunto o una lista de incrustaciones/archivos adjuntos.', 'pl': 'Utwórz wiadomość na Discordzie. Osadzenia i załączniki mogą być pojedynczym osadzeniem/załącznikiem lub listą osadzonych/załączników.', 'zh-cn': '创建不和谐消息。嵌入和附件可以是单个嵌入/附件或嵌入/附件列表。' };
Blockly.Words['discord_content'] = {  'en': 'Content', 'de': 'Inhalt', 'ru': 'Содержание', 'pt': 'Contente', 'nl': 'Inhoud', 'fr': 'Contenu', 'it': 'Contenuto', 'es': 'Contenido', 'pl': 'Zawartość', 'zh-cn': '内容' };
Blockly.Words['discord_embeds'] = { 'en': 'Embeds', 'de': 'Einbettungen', 'ru': 'Встраивает', 'pt': 'Incorporações', 'nl': 'Ingesloten', 'fr': 'Intègre', 'it': 'Incorpora', 'es': 'incrustaciones', 'pl': 'Osadzenia', 'zh-cn': '嵌入' };
Blockly.Words['discord_attachments'] = { 'en': 'Attachments', 'de': 'Anhänge', 'ru': 'Вложения', 'pt': 'Anexos', 'nl': 'Bijlagen', 'fr': 'Pièces jointes', 'it': 'Allegati', 'es': 'Archivos adjuntos', 'pl': 'Załączniki', 'zh-cn': '附件' };
Blockly.Words['discord_reply_to_id'] = { 'en': 'Reply to message ID', 'de': 'Antwort auf Nachrichten-ID', 'ru': 'Ответ на идентификатор сообщения', 'pt': 'Responder ao ID da mensagem', 'nl': 'Antwoord op bericht-ID', 'fr': 'Répondre à l\'identifiant du message', 'it': 'Rispondi all\'ID del messaggio', 'es': 'Responder al ID del mensaje', 'pl': 'Odpowiedz na identyfikator wiadomości', 'zh-cn': '回复消息ID' };
Blockly.Words['discord_message_embed'] = { 'en': 'Discord message embed', 'de': 'Discord Nachrichteneinbettung', 'ru': 'Вставить Discord-сообщение', 'pt': 'Incorporação de mensagem do Discord', 'nl': 'Discord bericht insluiten', 'fr': 'Intégrer le message Discord', 'it': 'Incorpora messaggio Discord', 'es': 'Insertar mensaje de Discord', 'pl': 'Osadź wiadomość na Discordzie', 'zh-cn': '不和谐消息嵌入' };
Blockly.Words['discord_message_embed_tooltip'] = { 'en': 'Create a Discord message embed. To use a file attachment as embedded image write \'attachment://filename.jpg\' as image URL.', 'de': 'Erstellen einer Discord-Nachrichteneinbettung. Um einen Dateianhang als eingebettetes Bild zu verwenden, muss \'attachment://filename.jpg\' als Bild-URL verwendet werden.', 'ru': 'Создайте вставку сообщения Discord. Чтобы использовать вложенный файл в качестве встроенного изображения, напишите «attachment://filename.jpg» в качестве URL-адреса изображения.', 'pt': 'Crie uma incorporação de mensagem do Discord. Para usar um anexo de arquivo como imagem incorporada, escreva \'attachment://filename.jpg\' como URL da imagem.', 'nl': 'Maak een insluiting van een Discord-bericht. Om een bestandsbijlage als ingesloten afbeelding te gebruiken, schrijft u \'attachment://filename.jpg\' als afbeeldings-URL.', 'fr': 'Créez une intégration de message Discord. Pour utiliser une pièce jointe comme image intégrée, écrivez \'attachment://filename.jpg\' comme URL de l\'image.', 'it': 'Crea un messaggio Discord incorporato. Per utilizzare un file allegato come immagine incorporata, scrivi \'allegato://nomefile.jpg\' come URL dell\'immagine.', 'es': 'Crea una inserción de mensaje de Discord. Para usar un archivo adjunto como imagen incrustada, escriba \'archivo adjunto: // nombre de archivo.jpg\' como URL de imagen.', 'pl': 'Utwórz osadzoną wiadomość na Discordzie. Aby użyć załącznika jako osadzonego obrazu, wpisz „attachment://nazwapliku.jpg” jako adres URL obrazu.', 'zh-cn': '创建 Discord 消息嵌入。要将文件附件用作嵌入图像，请将 \'attachment://filename.jpg\' 作为图像 URL。' };
Blockly.Words['discord_description'] = { 'en': 'Description', 'de': 'Beschreibung', 'ru': 'Описание', 'pt': 'Descrição', 'nl': 'Beschrijving', 'fr': 'La description', 'it': 'Descrizione', 'es': 'Descripción', 'pl': 'Opis', 'zh-cn': '描述' };
Blockly.Words['discord_title'] = { 'en': 'Title', 'de': 'Titel', 'ru': 'Заголовок', 'pt': 'Título', 'nl': 'Titel', 'fr': 'Titre', 'it': 'Titolo', 'es': 'Título', 'pl': 'Tytuł', 'zh-cn': '标题' };
Blockly.Words['discord_url'] = { 'en': 'URL', 'de': 'URL', 'ru': 'URL-адрес', 'pt': 'URL', 'nl': 'URL', 'fr': 'URL', 'it': 'URL', 'es': 'URL', 'pl': 'URL', 'zh-cn': '网址' };
Blockly.Words['discord_color'] = { 'en': 'Color', 'de': 'Farbe', 'ru': 'Цвет', 'pt': 'Cor', 'nl': 'Kleur', 'fr': 'Couleur', 'it': 'Colore', 'es': 'Color', 'pl': 'Kolor', 'zh-cn': '颜色' };
Blockly.Words['discord_image_url'] = { 'en': 'Image URL', 'de': 'Bild URL', 'ru': 'URL изображения', 'pt': 'imagem URL', 'nl': 'afbeelding URL', 'fr': 'URL de l\'image', 'it': 'URL dell\'immagine', 'es': 'URL de la imagen', 'pl': 'URL obrazu', 'zh-cn': '图片网址' };
Blockly.Words['discord_footer_text'] = { 'en': 'Footer text', 'de': 'Fusszeile', 'ru': 'Текст нижнего колонтитула', 'pt': 'Texto de rodapé', 'nl': 'Voettekst', 'fr': 'Texte de pied de page', 'it': 'Testo a piè di pagina', 'es': 'Texto de pie de página', 'pl': 'Tekst stopki', 'zh-cn': '页脚文本' };
Blockly.Words['discord_file_attachment'] = { 'en': 'Discord file attachment', 'de': 'Discord Dateianhang', 'ru': 'Прикрепленный дискорд файл', 'pt': 'Anexo de arquivo do Discord', 'nl': 'Discord-bestandsbijlage', 'fr': 'Pièce jointe du fichier Discord', 'it': 'Discord file allegato', 'es': 'Archivo adjunto de discordia', 'pl': 'Załącznik do pliku Discord', 'zh-cn': '不和谐文件附件' };
Blockly.Words['discord_file_attachment_tooltip'] = { 'en': 'Create a Discord file attachment. File path may be local path to a file or an URL to a remote file. File name is the name of the file provided to Discord.', 'de': 'Erstellen eines Discord-Dateianhangs. Der Dateipfad kann ein lokaler Pfad zu einer Datei oder eine URL zu einer entfernten Datei sein. Dateiname ist der Name der Datei, die Discord zur Verfügung gestellt wird.', 'ru': 'Создайте вложенный файл Discord. Путь к файлу может быть локальным путем к файлу или URL-адресом удаленного файла. Имя файла — это имя файла, предоставленного Discord.', 'pt': 'Crie um anexo de arquivo Discord. O caminho do arquivo pode ser um caminho local para um arquivo ou uma URL para um arquivo remoto. Nome do arquivo é o nome do arquivo fornecido ao Discord.', 'nl': 'Maak een Discord-bestandsbijlage. Bestandspad kan een lokaal pad naar een bestand zijn of een URL naar een extern bestand. Bestandsnaam is de naam van het bestand dat aan Discord is verstrekt.', 'fr': 'Créez une pièce jointe de fichier Discord. Le chemin du fichier peut être un chemin local vers un fichier ou une URL vers un fichier distant. Le nom du fichier est le nom du fichier fourni à Discord.', 'it': 'Crea un file allegato Discord. Il percorso del file può essere il percorso locale di un file o un URL di un file remoto. Il nome del file è il nome del file fornito a Discord.', 'es': 'Cree un archivo adjunto de Discord. La ruta del archivo puede ser una ruta local a un archivo o una URL a un archivo remoto. El nombre del archivo es el nombre del archivo proporcionado a Discord.', 'pl': 'Utwórz załącznik do pliku Discord. Ścieżka pliku może być ścieżką lokalną do pliku lub adresem URL do pliku zdalnego. Nazwa pliku to nazwa pliku dostarczonego do Discord.', 'zh-cn': '创建 Discord 文件附件。文件路径可以是文件的本地路径或远程文件的 URL。文件名是提供给 Discord 的文件的名称。' };
Blockly.Words['discord_file_path'] = { 'en': 'File path', 'de': 'Dateipfad', 'ru': 'Путь к файлу', 'pt': 'Caminho de arquivo', 'nl': 'Bestandspad', 'fr': 'Chemin du fichier', 'it': 'Percorso del file', 'es': 'Ruta de archivo', 'pl': 'Ścieżka pliku', 'zh-cn': '文件路径' };
Blockly.Words['discord_file_name'] = { 'en': 'File name', 'de': 'Dateiname', 'ru': 'Имя файла', 'pt': 'Nome do arquivo', 'nl': 'Bestandsnaam', 'fr': 'Nom de fichier', 'it': 'Nome del file', 'es': 'Nombre del archivo', 'pl': 'Nazwa pliku', 'zh-cn': '文件名' };

Blockly.CustomBlocks = Blockly.CustomBlocks || [];
Blockly.CustomBlocks.push('Discord');

Blockly.Discord = {
  HUE: 235,
  blocks: {},
};

const DiscordHelpers = {
  helpUrl: 'https://github.com/crycode-de/ioBroker.discord/blob/main/README.md',

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

  createSendMessageJs: (opts) => {
    let resultCode = '';
    if (opts.varMessageId && opts.varMessageId !== 'null') {
      resultCode += `\n        ${opts.varMessageId} = result.messageId || null;`;
    }
    if (opts.varError && opts.varError !== 'null') {
      resultCode += `\n        ${opts.varError} = result.error || null;`;
    }

    if (opts.logResultOk === true || opts.logResultOk === 'true' || opts.logResultOk === 'TRUE') {
      resultCode += `\n        log(\`discord${opts.instance} send message result: \${result.result}\`)`;
    }

    return `await new Promise((resolve) => {
      const content = ${opts.content};

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
      }

      sendTo('discord${opts.instance}', '${opts.action}', {
        ${opts.target},
        ${opts.messageId ? `messageId: ${opts.messageId},` : ''}
        content: content,
      }, (result) => {
        if (result.error) {
          log(\`discord${opts.instance} send message error: \${result.error}\\n\${JSON.stringify(result)}\`, 'warn');
          resolve();
          return;
        }
        ${resultCode}
        resolve();
      });
    });\n`;
  },

  setupSendToMessageBlock: (block, opts) => {
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
        .appendField(Blockly.Translate('discord_user'));
    }

    if (opts.inputServerChannel) {
      block.appendValueInput('serverId')
        .setCheck('String')
        .appendField(Blockly.Translate('discord_server_id'));

      block.appendValueInput('channelId')
        .setCheck('String')
        .appendField(Blockly.Translate('discord_channel_id'));
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

    block.appendValueInput('varMessageId')
      .appendField(Blockly.Translate('discord_save_messageId_in'))
      .setCheck('Variable');

    block.appendValueInput('varError')
      .appendField(Blockly.Translate('discord_save_error_in'))
      .setCheck('Variable');

    block.appendDummyInput('logResultOk')
      .appendField(Blockly.Translate('discord_log_result_ok'))
      .appendField(new Blockly.FieldCheckbox('FALSE'), 'logResultOk');

    block.setInputsInline(false);
    block.setPreviousStatement(true, null);
    block.setNextStatement(true, null);

    block.setColour(Blockly.Sendto.HUE);
    block.setHelpUrl(DiscordHelpers.helpUrl);

    if (opts.tooltip) {
      block.setTooltip(Blockly.Translate(opts.tooltip));
    }
  },
};

// --- Block send message to user ----------------------------------------------
Blockly.Discord.blocks['discord_sendto_user'] =
  `<block type="discord_sendto_user">
    <value name="instance">
    </value>
    <value name="user">
      <shadow type="text">
        <field name="TEXT">User ID or tag</field>
      </shadow>
    </value>
    <value name="content">
      <shadow type="text">
        <field name="TEXT">The message to send.</field>
      </shadow>
    </value>
    <value name="varMessageId">
      <shadow type="logic_null"></shadow>
    </value>
    <value name="varError">
      <shadow type="logic_null"></shadow>
    </value>
    <value name="logResultOk">
    </value>
  </block>`;

Blockly.Blocks['discord_sendto_user'] = {
  init: function () {
    DiscordHelpers.setupSendToMessageBlock(this, {
      label: 'discord_send_message',
      inputUser: true,
      inputContent: true,
      tooltip: 'discord_sendto_tooltip',
    });
  },
};

Blockly.JavaScript['discord_sendto_user'] = (block) => {
  const user = Blockly.JavaScript.valueToCode(block, 'user', Blockly.JavaScript.ORDER_ATOMIC);

  return DiscordHelpers.createSendMessageJs({
    action: 'sendMessage',
    instance: block.getFieldValue('instance'),
    target: user.match(/^["']\d+["']$/) ? `userId: ${user}` : `userTag: ${user}`,
    content: Blockly.JavaScript.valueToCode(block, 'content', Blockly.JavaScript.ORDER_ATOMIC),
    varMessageId: Blockly.JavaScript.valueToCode(block, 'varMessageId', Blockly.JavaScript.ORDER_ATOMIC),
    varError: Blockly.JavaScript.valueToCode(block, 'varError', Blockly.JavaScript.ORDER_ATOMIC),
    logResultOk: block.getFieldValue('logResultOk'),
  });
};

// --- Block send message to server channel ------------------------------------
Blockly.Discord.blocks['discord_sendto_server_channel'] =
  `<block type="discord_sendto_server_channel">
    <value name="instance">
    </value>
    <value name="serverId">
      <shadow type="text">
        <field name="TEXT">Server ID</field>
      </shadow>
    </value>
    <value name="channelId">
      <shadow type="text">
        <field name="TEXT">Channel ID</field>
      </shadow>
    </value>
    <value name="content">
      <shadow type="text">
        <field name="TEXT">The message to send.</field>
      </shadow>
    </value>
    <value name="varMessageId">
      <shadow type="logic_null"></shadow>
    </value>
    <value name="varError">
      <shadow type="logic_null"></shadow>
    </value>
    <value name="logResultOk">
    </value>
  </block>`;

Blockly.Blocks['discord_sendto_server_channel'] = {
  init: function () {
    DiscordHelpers.setupSendToMessageBlock(this, {
      label: 'discord_send_message',
      inputServerChannel: true,
      inputContent: true,
      tooltip: 'discord_sendto_tooltip',
    });
  },
};

Blockly.JavaScript['discord_sendto_server_channel'] = (block) => {
  const serverId = Blockly.JavaScript.valueToCode(block, 'serverId', Blockly.JavaScript.ORDER_ATOMIC);
  const channelId = Blockly.JavaScript.valueToCode(block, 'channelId', Blockly.JavaScript.ORDER_ATOMIC);

  return DiscordHelpers.createSendMessageJs({
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
Blockly.Discord.blocks['discord_edit_message_user'] =
  `<block type="discord_edit_message_user">
    <value name="instance">
    </value>
    <value name="user">
      <shadow type="text">
        <field name="TEXT">User ID or tag</field>
      </shadow>
    </value>
    <value name="messageId">
      <shadow type="text">
        <field name="TEXT">Message ID to edit</field>
      </shadow>
    </value>
    <value name="content">
      <shadow type="text">
        <field name="TEXT">The message to send.</field>
      </shadow>
    </value>
    <value name="varMessageId">
      <shadow type="logic_null"></shadow>
    </value>
    <value name="varError">
      <shadow type="logic_null"></shadow>
    </value>
    <value name="logResultOk">
    </value>
  </block>`;

Blockly.Blocks['discord_edit_message_user'] = {
  init: function () {
    DiscordHelpers.setupSendToMessageBlock(this, {
      label: 'discord_edit_message',
      inputUser: true,
      inputMessageId: true,
      inputContent: true,
    });
  },
};

Blockly.JavaScript['discord_edit_message_user'] = (block) => {
  const user = Blockly.JavaScript.valueToCode(block, 'user', Blockly.JavaScript.ORDER_ATOMIC);

  return DiscordHelpers.createSendMessageJs({
    action: 'editMessage',
    instance: block.getFieldValue('instance'),
    target: user.match(/^["']\d+["']$/) ? `userId: ${user}` : `userTag: ${user}`,
    messageId: Blockly.JavaScript.valueToCode(block, 'messageId', Blockly.JavaScript.ORDER_ATOMIC),
    content: Blockly.JavaScript.valueToCode(block, 'content', Blockly.JavaScript.ORDER_ATOMIC),
    varMessageId: Blockly.JavaScript.valueToCode(block, 'varMessageId', Blockly.JavaScript.ORDER_ATOMIC),
    varError: Blockly.JavaScript.valueToCode(block, 'varError', Blockly.JavaScript.ORDER_ATOMIC),
    logResultOk: block.getFieldValue('logResultOk'),
  });
};

// --- Block edit message to server channel ------------------------------------
Blockly.Discord.blocks['discord_edit_message_server_channel'] =
  `<block type="discord_edit_message_server_channel">
    <value name="instance">
    </value>
    <value name="serverId">
      <shadow type="text">
        <field name="TEXT">Server ID</field>
      </shadow>
    </value>
    <value name="channelId">
      <shadow type="text">
        <field name="TEXT">Channel ID</field>
      </shadow>
    </value>
    <value name="messageId">
      <shadow type="text">
        <field name="TEXT">Message ID to edit</field>
      </shadow>
    </value>
    <value name="content">
      <shadow type="text">
        <field name="TEXT">The message to send.</field>
      </shadow>
    </value>
    <value name="varMessageId">
      <shadow type="logic_null"></shadow>
    </value>
    <value name="varError">
      <shadow type="logic_null"></shadow>
    </value>
    <value name="logResultOk">
    </value>
  </block>`;

Blockly.Blocks['discord_edit_message_server_channel'] = {
  init: function () {
    DiscordHelpers.setupSendToMessageBlock(this, {
      label: 'discord_edit_message',
      inputServerChannel: true,
      inputMessageId: true,
      inputContent: true,
    });
  },
};

Blockly.JavaScript['discord_edit_message_server_channel'] = (block) => {
  const serverId = Blockly.JavaScript.valueToCode(block, 'serverId', Blockly.JavaScript.ORDER_ATOMIC);
  const channelId = Blockly.JavaScript.valueToCode(block, 'channelId', Blockly.JavaScript.ORDER_ATOMIC);

  return DiscordHelpers.createSendMessageJs({
    action: 'editMessage',
    instance: block.getFieldValue('instance'),
    target: `serverId: ${serverId}, channelId: ${channelId}`,
    messageId: Blockly.JavaScript.valueToCode(block, 'messageId', Blockly.JavaScript.ORDER_ATOMIC),
    content: Blockly.JavaScript.valueToCode(block, 'content', Blockly.JavaScript.ORDER_ATOMIC),
    varMessageId: Blockly.JavaScript.valueToCode(block, 'varMessageId', Blockly.JavaScript.ORDER_ATOMIC),
    varError: Blockly.JavaScript.valueToCode(block, 'varError', Blockly.JavaScript.ORDER_ATOMIC),
    logResultOk: block.getFieldValue('logResultOk'),
  });
};

// --- Block create content ----------------------------------------------------
Blockly.Discord.blocks['discord_create_content'] =
  `<block type="discord_create_content">
    <value name="content">
      <shadow type="text">
        <field name="TEXT">The message to send.</field>
      </shadow>
    </value>
    <value name="embeds">
      <shadow type="logic_null"></shadow>
    </value>
    <value name="files">
      <shadow type="logic_null"></shadow>
    </value>
    <value name="replyToId">
      <shadow type="logic_null"></shadow>
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

Blockly.JavaScript['discord_create_content'] = (block) => {
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
  `<block type="discord_create_embed">
    <value name="description">
      <shadow type="text">
        <field name="TEXT">Embeded content</field>
      </shadow>
    </value>
    <value name="title">
      <shadow type="logic_null">
      </shadow>
    </value>
    <value name="url">
      <shadow type="logic_null">
      </shadow>
    </value>
    <value name="color">
      <shadow type="colour_picker">
        <field name="COLOUR">#5865f2</field>
      </shadow>
    </value>
    <value name="imageUrl">
      <shadow type="logic_null">
      </shadow>
    </value>
    <value name="footerText">
      <shadow type="logic_null">
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

Blockly.JavaScript['discord_create_embed'] = (block) => {
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
  `<block type="discord_create_file">
    <value name="attachment">
      <shadow type="text">
        <field name="TEXT">/tmp/myfile.jpg</field>
      </shadow>
    </value>
    <value name="name">
      <shadow type="text">
        <field name="TEXT">myfile.jpg</field>
      </shadow>
    </value>
    <value name="description">
      <shadow type="text">
        <field name="TEXT"></field>
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

Blockly.JavaScript['discord_create_file'] = (block) => {
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
