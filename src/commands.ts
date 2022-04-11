import { boundMethod } from 'autobind-decorator';

import { ApplicationCommandPermissionData, CacheType, Collection, CommandInteraction, Interaction } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

import type { DiscordAdapter } from './main';
import { i18n } from './lib/i18n';
import { isDeepStrictEqual } from 'node:util';

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

  private lastCommandsJson: any[] | null = null;

  private commandObjectConfig: Collection<string, CommandObjectConfig> = new Collection();

  private triggerDelayedRegisterSlashCommandsTimeout: ioBroker.Timeout | null = null;

  constructor (adapter: DiscordAdapter) {
    this.adapter = adapter;
  }

  /**
   * When the adapter is Ready.
   * Called by `adapter.onReady()` after some basic checks.
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

    // check if commands are enabled and if not remove set commands
    if (!this.adapter.config.enableCommands) {
      this.adapter.log.debug('Commands not enabled');

      // check for commands and remove them all
      for (const [, guild] of this.adapter.client.guilds.cache) {
        const guildCommands = await guild.commands.fetch();
        if (guildCommands.size > 0) {
          this.adapter.log.debug(`Currently ${guildCommands.size} commands registered for server ${guild.name}. Removing them...`);
          try {
            await this.rest.put(Routes.applicationGuildCommands(this.adapter.client.user.id, guild.id), { body: [] });
            this.adapter.log.info(`Removed commands for server ${guild.name} cause commands are not enabled`);
          } catch (err) {
            this.adapter.log.warn(`Error while removing registered commands for server ${guild.name}: ${err}`);
          }
        }
      }

      return;
    }

    const cmdGet = new SlashCommandBuilder()
      .setName(this.cmdGetStateName)
      .setDescription(i18n.getString('Get an ioBroker state value'));

    const cmdSet = new SlashCommandBuilder()
      .setName(this.cmdSetStateName)
      .setDescription(i18n.getString('Set an ioBroker state value'));

    // set default permissions depending on authorization settings
    cmdGet.setDefaultPermission(!this.adapter.config.enableAuthorization);
    cmdSet.setDefaultPermission(!this.adapter.config.enableAuthorization);

    // add options
    cmdGet.addStringOption((opt) => {
      opt.setName('state')
        .setDescription(i18n.getString('The ioBroker state to get'))
        .setRequired(true);
      for (const [, objCfg] of this.commandObjectConfig) {
        if (objCfg.get) {
          opt.addChoice(objCfg.name, objCfg.alias);
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
          opt.addChoice(objCfg.name, objCfg.alias);
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
          await this.rest.put(Routes.applicationGuildCommands(this.adapter.client.user.id, guild.id), { body: commandsJson });

          // fetch the current guild commands to be up to date
          const guildCommands = await guild.commands.fetch();

          // setup per user permissions is authorization is enabled
          if (this.adapter.config.enableAuthorization) {
            for (const [, gCmd] of guildCommands) {
              try {
                const permissions: ApplicationCommandPermissionData[] = [];
                for (const au of this.adapter.config.authorizedUsers) {
                  if ((gCmd.name === this.cmdGetStateName && au.getStates) || (gCmd.name === this.cmdSetStateName && au.setStates)) {
                    permissions.push({
                      id: au.userId,
                      type: 'USER',
                      permission: true,
                    });
                  }
                }

                await gCmd.permissions.set({ permissions });

              } catch (err) {
                this.adapter.log.warn(`Error while setting command permissions for server ${guild.name} command ${gCmd.name}: ${err}`);
              }
            }
          }

          this.adapter.log.info(`Registered commands for server ${guild.name} (id:${guild.id}) (get: ${numGet}, set: ${numSet})`);
        } catch (err) {
          this.adapter.log.warn(`Error registering commands for server ${guild.name} (id:${guild.id}): ${err}`);
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
   * Handler for "get state" slash commands.
   * @param interaction The interaction which triggered this.
   */
  private async handleCmdGetState (interaction: CommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    const objAlias = interaction.options.getString('state');

    // find the config for the requested object
    const cfg = this.commandObjectConfig.find((coc) => coc.alias === objAlias);
    if (!cfg) {
      await interaction.editReply(i18n.getString('Object `%s` not found!', objAlias || ''));
      return;
    }

    // get the object
    const obj = await this.adapter.getForeignObjectAsync(cfg.id);
    if (!obj) {
      await interaction.editReply(i18n.getString('Object `%s` not found!', cfg.id));
      return;
    }
    if (obj.type !== 'state') {
      await interaction.editReply(i18n.getString('Object `%s` is not of type state!', cfg.id));
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

    if (obj.common.role === 'date' && ((obj.common.type === 'string' && typeof state.val === 'string') || (obj.common.type === 'number' && typeof state.val === 'number'))) {
      // date values
      const d = new Date(state.val);
      val = d.toLocaleString(i18n.language, { dateStyle: 'full', timeStyle: 'long' });

    } else {
      // non date values
      switch (obj.common.type) {
        case 'boolean':
          if (state.val) {
            val = obj.common.custom?.[this.adapter.namespace].commandsBooleanValueTrue || i18n.getString('true');
          } else {
            val = obj.common.custom?.[this.adapter.namespace].commandsBooleanValueFalse || i18n.getString('false');
          }
          break;

        case 'number':
          // number values
          const decimals = obj.common.custom?.[this.adapter.namespace]?.commandsNumberDecimals || 0;
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

    // add unit if defined in the object
    const unit = obj.common.unit ? ` ${obj.common.unit}` : '';
    const ack = obj.common.custom?.[this.adapter.namespace]?.commandsShowAckFalse && !state.ack ? ` (_${i18n.getString('not acknowledged')}_)` : '';

    this.adapter.log.debug(`Get command for ${cfg.id} - ${val}${unit}${ack}`);

    // send the value as reply to the user
    try {
      await interaction.editReply(`${cfg.name}: ${val}${unit}${ack}`);
    } catch (err) {
      this.adapter.log.warn(`Error sending interaction reply for /${this.cmdGetStateName} command! ${err}`);
    }
  }

  /**
   * Handler for "set state" slash commands.
   * @param interaction The interaction which triggered this.
   */
  private async handleCmdSetState (interaction: CommandInteraction<CacheType>): Promise<void> {
    interaction.deferReply();

    // TODO: implement set command
    interaction.editReply('Not supported yet.');
  }
}