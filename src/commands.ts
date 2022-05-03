import { isDeepStrictEqual } from 'node:util';

import { boundMethod } from 'autobind-decorator';

import {
  CacheType,
  Collection,
  CommandInteraction,
  DiscordAPIError,
  Guild,
  Interaction,
  MessageOptions,
} from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

import type { DiscordAdapter } from './main';
import { i18n } from './lib/i18n';
import {
  getBasenameFromFilePathOrUrl,
  getBufferAndNameFromBase64String,
} from './lib/utils';

export interface CommandObjectConfig {
  id: string;
  alias: string;
  name: string;
  get: boolean;
  set: boolean;
}

/**
 * Class for discord slash commands handling
 */
export class DiscordAdapterSlashCommands {

  /**
   * Reference to the adapter instance.
   */
  private adapter: DiscordAdapter;

  /**
   * Discord REST api interface.
   */
  private rest: REST = new REST({ version: '9' });

  /**
   * Command name for the get state command.
   */
  private cmdGetStateName: string = 'iob-get';

  /**
   * Command name for the set state command.
   */
  private cmdSetStateName: string = 'iob-set';

  /**
   * If commands are fully registered including their permissions.
   */
  private registerCommandsDone: boolean = false;

  /**
   * The last registered commands.
   * Used to check if something changed an we need to register the commands again.
   */
  private lastCommandsJson: any[] | null = null;

  /**
   * Collection of configurations for objects with commands enabled.
   */
  private commandObjectConfig: Collection<string, CommandObjectConfig> = new Collection();

  /**
   * Timeout to trigger the delayed registration of the slash commands.
   */
  private triggerDelayedRegisterSlashCommandsTimeout: ioBroker.Timeout | null = null;

  /**
   * Set of well known values that will be interperted as true.
   * This is extended by some localized strings at runtime.
   * Used to determine true values from iob-set slash commands.
   */
  private wellKnownbooleanTrueValues: Set<string> = new Set(['true', 'on', 'yes', '1']);

  constructor (adapter: DiscordAdapter) {
    this.adapter = adapter;
  }

  /**
   * When the adapter is Ready.
   * Called by `adapter.onReady()` after some basic checks and setup.
   */
  public async onReady (): Promise<void> {
    // apply custom command names if configured
    if (this.adapter.config.cmdGetStateName) {
      this.cmdGetStateName = this.adapter.config.cmdGetStateName;
    }
    if (this.adapter.config.cmdSetStateName) {
      this.cmdSetStateName = this.adapter.config.cmdSetStateName;
    }

    // setup REST interface
    this.rest.setToken(this.adapter.config.token);

    // check if commands are enabled
    if (!this.adapter.config.enableCommands) {
      return;
    }

    // add translated versions of true/on/yes to the set of well known boolean true values
    this.wellKnownbooleanTrueValues.add(i18n.getString('true'))
      .add(i18n.getString('on'))
      .add(i18n.getString('yes'));

    // setup interaction handler for commands
    if (!this.adapter.client) {
      throw new Error('Tried to setup interaction handler for commands, but client is not initialized!');
    }
    this.adapter.client.on('interactionCreate', this.onInteractionCreate);
  }

  /**
   * Register the commands on discord, if enabled.
   */
  public async registerSlashCommands (): Promise<void> {
    this.registerCommandsDone = false;

    if (!this.adapter.client?.user) {
      throw new Error('Discord client not available');
    }

    if (this.adapter.unloaded) return;

    // check if commands are enabled and if not remove set commands
    if (!this.adapter.config.enableCommands) {
      this.adapter.log.debug('Commands not enabled');

      // check for commands and remove them all
      for (const [, guild] of this.adapter.client.guilds.cache) {
        await this.removeGuildCommands(guild);
      }

      await this.removeGlobalCommands();

      return;
    }

    const cmdGet = new SlashCommandBuilder()
      .setName(this.cmdGetStateName)
      .setDescription(i18n.getString('Get an ioBroker state value'));

    const cmdSet = new SlashCommandBuilder()
      .setName(this.cmdSetStateName)
      .setDescription(i18n.getString('Set an ioBroker state value'));

    // set default permissions to true - permissions are checked by the adapter later
    cmdGet.setDefaultPermission(true);
    cmdSet.setDefaultPermission(true);

    // add options
    cmdGet.addStringOption((opt) => {
      opt.setName('state')
        .setDescription(i18n.getString('The ioBroker state to get'))
        .setRequired(true);
      for (const [, objCfg] of this.commandObjectConfig) {
        if (objCfg.get) {
          opt.addChoices({
            name: objCfg.name,
            value: objCfg.alias,
          });
        }
      }
      return opt;
    });

    cmdSet.addStringOption((opt) => {
      opt.setName('state')
        .setDescription(i18n.getString('The ioBroker state to set'))
        .setRequired(true);
      for (const [, objCfg] of this.commandObjectConfig) {
        if (objCfg.set) {
          opt.addChoices({
            name: objCfg.name,
            value: objCfg.alias,
          });
        }
      }
      return opt;
    });
    cmdSet.addStringOption((opt) => {
      return opt.setName('value')
        .setDescription(i18n.getString('The value to set'))
        .setRequired(true);
    });

    // build commands array
    const commands: SlashCommandBuilder[] = [
      cmdGet,
      cmdSet,
    ];

    const commandsJson = commands.map((cmd) => cmd.toJSON());

    // only update the commands if something has changed
    if (!isDeepStrictEqual(commandsJson, this.lastCommandsJson)) {
      this.adapter.log.debug('Commands needs to be updated');

      if (this.commandObjectConfig.size === 0) {
        this.adapter.log.warn('Commands are enabled but not configured for any state object! Use the custom configuration of a state object to activate commands on it.');
      }

      const numGet = this.commandObjectConfig.filter((c) => c.get === true).size;
      const numSet = this.commandObjectConfig.filter((c) => c.set === true).size;

      // register commands for all servers of the bot (guild commands are applied instant and may have permissions per user set)
      for (const [, guild] of this.adapter.client.guilds.cache) {
        try {
          if (this.adapter.config.commandsGlobal) {
            // global commands enabled, remove per guild commands
            await this.removeGuildCommands(guild);

          } else {
            // commands per guild
            await this.rest.put(Routes.applicationGuildCommands(this.adapter.client.user.id, guild.id), { body: commandsJson });
            this.adapter.log.info(`Registered commands for server ${guild.name} (id:${guild.id}) (get: ${numGet}, set: ${numSet})`);
          }

        } catch (err) {
          if (err instanceof DiscordAPIError && err.message === 'Missing Access'){
            this.adapter.log.warn(`Error registering commands for server ${guild.name} (id:${guild.id}). Seams like the bot is missing the 'applications.commands' scope on the server. ${err}`);
          } else {
            this.adapter.log.warn(`Error registering commands for server ${guild.name} (id:${guild.id}): ${err}`);
          }
        }
      }

      // register global commands if enabled
      try {
        if (this.adapter.config.commandsGlobal) {
          // global commands enabled
          await this.rest.put(Routes.applicationCommands(this.adapter.client.user.id), { body: commandsJson });
          this.adapter.log.info(`Registered global command (get: ${numGet}, set: ${numSet})`);

        } else {
          // global command disabled
          await this.removeGlobalCommands();
        }

      } catch (err) {
        if (err instanceof DiscordAPIError && err.message === 'Missing Access') {
          this.adapter.log.warn(`Error registering global commands. Seams like the bot is missing the 'applications.commands' scope on the server. ${err}`);
        } else {
          this.adapter.log.warn(`Error registering global commands: ${err}`);
        }
      }

      // cache the commandsJson for the next call of `registerSlashCommands()`
      this.lastCommandsJson = commandsJson;

    } else {
      this.adapter.log.debug('Commands seams to be up to date');
    }

    this.registerCommandsDone = true;
  }


  /**
   * Remove registered global commands if any.
   */
  private async removeGlobalCommands (): Promise<void> {
    if (!this.adapter.client?.user) {
      throw new Error('Discord client not available');
    }

    try {
      const globalCommands = await this.adapter.client.application?.commands.fetch();
      if (this.adapter.unloaded) return;

      if (globalCommands && globalCommands.size > 0) {
        this.adapter.log.debug(`Currently ${globalCommands.size} global commands registered. Removing them...`);
        await this.rest.put(Routes.applicationCommands(this.adapter.client.user.id), { body: [] });
        this.adapter.log.info(`Removed global commands cause commands they are not used anymore.`);
      }
    } catch (err) {
      if (err instanceof DiscordAPIError && err.message === 'Missing Access') {
        this.adapter.log.warn(`Error while removing registered global commands. Seams like the bot is missing the 'applications.commands' scope on the server. ${err}`);
      } else {
        this.adapter.log.warn(`Error while removing registered global commands: ${err}`);
      }
    }
  }

  /**
   * Remove registered guild commands if any.
   * @param guild The guild.
   */
  private async removeGuildCommands (guild: Guild): Promise<void> {
    if (!this.adapter.client?.user) {
      throw new Error('Discord client not available');
    }

    try {
      const guildCommands = await guild.commands.fetch();
      if (this.adapter.unloaded) return;

      if (guildCommands.size > 0) {
        this.adapter.log.debug(`Currently ${guildCommands.size} commands registered for server ${guild.name}. Removing them...`);
        await this.rest.put(Routes.applicationGuildCommands(this.adapter.client.user.id, guild.id), { body: [] });
        this.adapter.log.info(`Removed commands for server ${guild.name} cause commands theay are not used anymore.`);
      }
    } catch (err) {
      if (err instanceof DiscordAPIError && err.message === 'Missing Access') {
        this.adapter.log.warn(`Error while removing registered commands for server ${guild.name} (id:${guild.id}). Seams like the bot is missing the 'applications.commands' scope on the server. ${err}`);
      } else {
        this.adapter.log.warn(`Error while removing registered commands for server ${guild.name} (id:${guild.id}): ${err}`);
      }
    }
  }

  /**
   * Setup an ioBroker object for discord slash commands.
   * @param objId ID of the ioBroker object to set up.
   * @param cfg Command configuration for the ioBroker object or null to remove a possibly existing configuration.
   */
  public setupCommandObject (objId: string, cfg: CommandObjectConfig | null): void {
    // check if alias is already in use
    if (cfg) {
      const conflictingAlias = this.commandObjectConfig.find((coc) => coc.alias === cfg?.alias && coc.id !== cfg.id);
      if (conflictingAlias) {
        this.adapter.log.warn(`Command alias ${cfg.alias} of object ${cfg.id} already in use by object ${conflictingAlias.id}! ${cfg.id} will be ignored.`);
        cfg = null;
      }
    }

    // remove if commands are not enabled or alias conflict
    if (!cfg) {
      if (this.commandObjectConfig.has(objId)) {
        this.commandObjectConfig.delete(objId);
        this.triggerDelayedRegisterSlashCommands();
      }
      return;
    }

    // update only if changed
    const currentCfg = this.commandObjectConfig.get(objId);
    if (!isDeepStrictEqual(cfg, currentCfg)) {
      this.adapter.log.debug(`Update command configuration for ${objId}: ${JSON.stringify(cfg)}`);
      this.commandObjectConfig.set(objId, cfg);
      this.triggerDelayedRegisterSlashCommands();
    }
  }

  /**
   * Initialize a delayed registration of the slash commands.
   * Calls `registerSlashCommands()` five seconds after the last call of this method.
   * If called again within the five seconds the timeout starts again.
   *
   * This is used to handle object changes better and concat multiple changed
   * object configurations into a single API call.
   *
   * If the initial custom objects setup of the adapter isn't done, this method
   * does nothing since the command registration is called during this explicit.
   */
  private triggerDelayedRegisterSlashCommands (): void {
    // do nothing on init
    if (!this.adapter.initialCustomObjectSetupDone) return;

    if (this.triggerDelayedRegisterSlashCommandsTimeout) {
      this.adapter.clearTimeout(this.triggerDelayedRegisterSlashCommandsTimeout);
    }

    this.adapter.setTimeout(() => {
      this.triggerDelayedRegisterSlashCommandsTimeout = null;
      this.adapter.log.debug('Starting delayed slash commands registration...');
      this.registerSlashCommands();
    }, 5000);
  }

  /**
   * Handle interaction commands.
   */
  @boundMethod
  private async onInteractionCreate (interaction: Interaction<CacheType>): Promise<void> {
    // is it a command?
    if (!interaction.isCommand()) return;

    const { commandName, user } = interaction;

    if (!this.registerCommandsDone) {
      this.adapter.log.warn(`Got command ${commandName} but command registration is not done yet.`);
      return;
    }

    this.adapter.log.debug(`Got command ${commandName} ${interaction.toJSON()}`);

    switch (commandName) {
      case this.cmdGetStateName:
        // check user authorization (user should only be able to call the command if authorized but check it nevertheless to be sure)
        if (this.adapter.checkUserAuthorization(user.id, { getStates: true })) {
          // user authorized
          await this.handleCmdGetState(interaction);
        } else {
          // user not authorized
          this.adapter.log.warn(`User ${user.tag} (id:${user.id}) is not authorized to call /${commandName} commands!`);
          interaction.reply(i18n.getString('You are not authorized to call this command!'));
        }
        break;

      case this.cmdSetStateName:
        // check user authorization (user should only be able to call the command if authorized but check it nevertheless to be sure)
        if (this.adapter.checkUserAuthorization(user.id, { setStates: true })) {
          // user authorized
          await this.handleCmdSetState(interaction);
        } else {
          // user not authorized
          this.adapter.log.warn(`User ${user.tag} (id:${user.id}) is not authorized to call /${commandName} commands!`);
          interaction.reply(i18n.getString('You are not authorized to call this command!'));
        }
        break;

      default:
        this.adapter.log.warn(`Got unknown command ${commandName}!`);
        interaction.reply(i18n.getString('Unknown command!'));
    }
  }

  /**
   * Try to get the ioBroker object and CommandObjectConfig for a given object alias.
   * The object will be checked if it's a valid state object.
   * @param objAlias The alias of the object.
   * @param interaction The interaction for replies on errors.
   * @returns Array containing the object and the config or null and null.
   */
  private async getObjectAndCfgFromAlias (objAlias: string | null, interaction: CommandInteraction<CacheType>): Promise<[ioBroker.StateObject | null, CommandObjectConfig | null]> {
    // find the config for the requested object
    const cfg = this.commandObjectConfig.find((coc) => coc.alias === objAlias);
    if (!cfg) {
      await interaction.editReply(i18n.getString('Object `%s` not found!', objAlias || ''));
      return [null, null];
    }

    // get the object
    const obj = await this.adapter.getForeignObjectAsync(cfg.id);
    if (!obj) {
      await interaction.editReply(i18n.getString('Object `%s` not found!', cfg.id));
      return [null, null];
    }
    if (obj.type !== 'state') {
      await interaction.editReply(i18n.getString('Object `%s` is not of type state!', cfg.id));
      return [null, null];
    }

    return [obj, cfg];
  }

  /**
   * Handler for "get state" slash commands.
   * @param interaction The interaction which triggered this.
   */
  private async handleCmdGetState (interaction: CommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    const objAlias = interaction.options.getString('state');

    const [obj, cfg] = await this.getObjectAndCfgFromAlias(objAlias, interaction);
    if (!obj || !cfg) {
      return;
    }

    const objCustom: ioBroker.CustomConfig | undefined = obj.common.custom?.[this.adapter.namespace];

    // check if get allowed
    if (!objCustom?.commandsAllowGet) {
      await interaction.editReply(i18n.getString('Get not allowed for state `%s`!', cfg.id));
      return;
    }

    // get the state
    const state = await this.adapter.getForeignStateAsync(cfg.id);
    if (!state) {
      await interaction.editReply(i18n.getString('State `%s` not found!', cfg.id));
      return;
    }

    // get the value depending on the state type
    let val: string = '';

    // an optional MessageOptions object for special cases (like sending files)
    let msgOpts: MessageOptions | undefined = undefined;

    // add unit if defined in the object
    const unit = obj.common.unit ? ` ${obj.common.unit}` : '';

    // add info about missing ack flag if configured so
    const ack = objCustom.commandsShowAckFalse && !state.ack ? ` (_${i18n.getString('not acknowledged')}_)` : '';

    if (obj.common.role === 'date' && ((obj.common.type === 'string' && typeof state.val === 'string') || (obj.common.type === 'number' && typeof state.val === 'number'))) {
      // date values
      const d = new Date(state.val);
      val = d.toLocaleString(i18n.language, { dateStyle: 'full', timeStyle: 'long' });

    } else if (obj.common.type === 'string' && objCustom.commandsStringSendAsFile && typeof state.val === 'string') {
      // path or url to file or base64 encoded file
      const b64data = getBufferAndNameFromBase64String(state.val);
      if (b64data) {
        // base64 encoded content

        msgOpts = {
          content: `${cfg.name}${ack}:`,
          files: [{
            attachment: b64data.buffer,
            name: b64data.name,
          }],
        };
        val = 'file:base64';

      } else {
        // file path or url

        // remove file:// prefix
        if (state.val.startsWith('file://')) {
          state.val = state.val.slice(7);
        }

        msgOpts = {
          content: `${cfg.name}${ack}:`,
          files: [{
            attachment: state.val,
            name: getBasenameFromFilePathOrUrl(state.val),
          }],
        };
        val = `file:${state.val}`;
      }

    } else {
      // non special value
      switch (obj.common.type) {
        case 'boolean':
          if (state.val) {
            val = objCustom.commandsBooleanValueTrue || i18n.getString('true');
          } else {
            val = objCustom.commandsBooleanValueFalse || i18n.getString('false');
          }
          break;

        case 'number':
          // number values
          const decimals = objCustom.commandsNumberDecimals || 0;
          if (typeof state.val === 'number') {
            val = state.val.toFixed(decimals);
          } else if (state.val === null) {
            val = '_NULL_';
          } else {
            val = state.val.toString() || 'NaN';
          }
          if (i18n.isFloatComma) {
            val = val.replace('.', ',');
          }
          break;

        default:
          if (typeof state.val === 'string') {
            val = state.val;
          } else if (state.val === null) {
            val = '_NULL_';
          } else {
            val = state.val.toString();
          }
      }
    }

    this.adapter.log.debug(`Get command for ${cfg.id} - ${val}${unit}${ack}`);

    // send the value as reply to the user
    try {
      if (msgOpts) {
        // message
        await interaction.editReply(msgOpts);
      } else {
        // just text
        await interaction.editReply(`${cfg.name}: ${val}${unit}${ack}`);
      }
    } catch (err) {
      this.adapter.log.warn(`Error sending interaction reply for /${this.cmdGetStateName} command! ${err}`);
    }
  }

  /**
   * Handler for "set state" slash commands.
   * @param interaction The interaction which triggered this.
   */
  private async handleCmdSetState (interaction: CommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    const objAlias = interaction.options.getString('state');

    const [obj, cfg] = await this.getObjectAndCfgFromAlias(objAlias, interaction);
    if (!obj || !cfg) {
      return;
    }

    const objCustom: ioBroker.CustomConfig | undefined = obj.common.custom?.[this.adapter.namespace];

    // check if set allowed
    if (!objCustom?.commandsAllowSet) {
      await interaction.editReply(i18n.getString('Set not allowed for state `%s`!', cfg.id));
      return;
    }

    let valueStr = interaction.options.getString('value');
    if (typeof valueStr !== 'string') {
      await interaction.editReply(i18n.getString('No value provided!'));
      return;
    }

    valueStr = valueStr.trim();

    // add unit if defined in the object
    const unit = obj.common.unit ? ` ${obj.common.unit}` : '';

    let value: string | number | boolean;
    let valueReply: string;

    switch (obj.common.type) {
      case 'boolean':
        // parse as boolean value
        valueStr = valueStr.toLowerCase();
        if (valueStr === objCustom.commandsBooleanValueTrue?.toLowerCase() || this.wellKnownbooleanTrueValues.has(valueStr)) {
          // true value form configures custom value or from well known boolean true values
          value = true;
          valueReply = objCustom.commandsBooleanValueTrue || i18n.getString('true');
        } else {
          // false value
          value = false;
          valueReply = objCustom.commandsBooleanValueFalse || i18n.getString('false');
        }
        break;

      case 'number':
        // parse as number (float) value
        if (i18n.isFloatComma) {
          valueStr = valueStr.replace(',', '.');
        }
        value = parseFloat(valueStr);

        if (isNaN(value)) {
          interaction.editReply(i18n.getString('The given value is not a number!'));
          return;
        }

        valueReply = value.toString();
        if (i18n.isFloatComma) {
          valueReply = valueReply.replace('.', ',');
        }

        // check min and max if configured
        if (typeof obj.common.min === 'number' && value < obj.common.min) {
          let min = obj.common.min.toString();
          if (i18n.isFloatComma) {
            min = min.replace('.', ',');
          }
          await interaction.editReply(i18n.getString('Value %s is below the allowed minium of %s!', `${valueReply}${unit}`, `${min}${unit}`));
          return;
        }
        if (typeof obj.common.max === 'number' && value > obj.common.max) {
          let max = obj.common.max.toString();
          if (i18n.isFloatComma) {
            max = max.replace('.', ',');
          }
          await interaction.editReply(i18n.getString('Value %s is above the allowed maximum of %s!', `${valueReply}${unit}`, `${max}${unit}`));
          return;
        }

        break;

      default:
        // string values
        value = valueStr;
        valueReply = valueStr;
    }

    this.adapter.log.debug(`Set command for ${cfg.id} - ${value}${unit}`);

    // set the state
    try {
      await this.adapter.setForeignStateAsync(cfg.id, value, !!objCustom.commandsSetWithAck);
    } catch (err) {
      this.adapter.log.warn(`Error while setting state ${cfg.id} to ${value}! ${err}`);
      await interaction.editReply(i18n.getString('Error while setting the state value!'));
      return;
    }

    // send reply
    await interaction.editReply(`${cfg.name}: ${valueReply}${unit}`);
  }

  /**
   * Write a summay of all currently for commands configured objects to the log.
   */
  public logConfiguredCommandObjects (): void {
    this.adapter.log.info('Configured state objects for discord slash commands:');
    for (const [, cmdObjCfg] of this.commandObjectConfig) {
      this.adapter.log.info(` |- ${cmdObjCfg.id} - alias:${cmdObjCfg.alias}, name:${cmdObjCfg.name}, get:${cmdObjCfg.get}, set:${cmdObjCfg.set}`);
    }
    this.adapter.log.info('---');
  }
}
