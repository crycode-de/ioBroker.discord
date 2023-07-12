import { isDeepStrictEqual } from 'node:util';

import { boundMethod } from 'autobind-decorator';

import {
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  CacheType,
  ChannelType,
  Collection,
  CommandInteraction,
  DiscordAPIError,
  Guild,
  GuildChannel,
  GuildMember,
  Interaction,
  MessageCreateOptions,
  Role,
  Snowflake,
  User,
} from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

import type { DiscordAdapter } from './main';
import { i18n } from './lib/i18n';
import {
  getBasenameFromFilePathOrUrl,
  getBufferAndNameFromBase64String,
  userNameOrTag,
} from './lib/utils';
import { ChannelTypeNames, JsonSlashCommandObj } from './lib/definitions';

export interface CommandObjectConfig {
  id: string;
  alias: string;
  name: string;
  get: boolean;
  set: boolean;
}

interface CommandOptionChoiceData {
  name: string;
  value: string;
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
  private rest: REST = new REST({ version: '10' });

  /**
   * Command name for the get state command.
   */
  private cmdGetStateName: string = 'iob-get';

  /**
   * Command name for the set state command.
   */
  private cmdSetStateName: string = 'iob-set';

  /**
   * Possible choices for get state command state-option.
   */
  private cmdGetStateChoices: CommandOptionChoiceData[] = [];

  /**
   * Possible choices for set state command state-option.
   */
  private cmdSetStateChoices: CommandOptionChoiceData[] = [];

  /**
   * Collection of the known (registered) custom commands and their option choices.
   */
  private customCommands: Collection<string, Collection<string, CommandOptionChoiceData[]>> = new Collection();

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
   * Collection of the last seen interactions of custom commands (not iob-get/-set).
   * Need to cache this here since there seams be no way to get an interaction by ID from discord.js.
   */
  private lastInteractions: Collection<Snowflake, CommandInteraction<CacheType>> = new Collection();

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
      if (this.adapter.config.cmdGetStateName.match(/^[a-z][0-9a-z-_]{1,32}$/)) {
        this.cmdGetStateName = this.adapter.config.cmdGetStateName;
      } else {
        this.adapter.log.warn(`Invalid custom get state command name '${this.adapter.config.cmdGetStateName}' provied! Using default 'iob-get'.`);
      }
    }
    if (this.adapter.config.cmdSetStateName) {
      this.cmdSetStateName = this.adapter.config.cmdSetStateName;
      if (this.adapter.config.cmdSetStateName.match(/^[a-z][0-9a-z-_]{1,32}$/)) {
        this.cmdSetStateName = this.adapter.config.cmdSetStateName;
      } else {
        this.adapter.log.warn(`Invalid custom set state command name '${this.adapter.config.cmdSetStateName}' provied! Using default 'iob-set'.`);
      }
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

    // build commands array
    const commands: SlashCommandBuilder[] = [];

    const numGet = this.commandObjectConfig.filter((c) => c.get === true).size;
    const numSet = this.commandObjectConfig.filter((c) => c.set === true).size;

    // setup iob-get command if objects configured for get
    if (numGet > 0) {
      const cmdGet = new SlashCommandBuilder()
        .setName(this.cmdGetStateName)
        .setDescription(i18n.getString('Get an ioBroker state value'));

      // add options
      cmdGet.addStringOption((opt) => (
        opt.setName('state')
          .setDescription(i18n.getString('The ioBroker state to get'))
          .setRequired(true)
          .setAutocomplete(true)
      ));

      commands.push(cmdGet);
    }

    // setup iob-set command if objects configured for set
    if (numSet > 0) {
      const cmdSet = new SlashCommandBuilder()
        .setName(this.cmdSetStateName)
        .setDescription(i18n.getString('Set an ioBroker state value'));

      cmdSet.addStringOption((opt) => (
        opt.setName('state')
          .setDescription(i18n.getString('The ioBroker state to set'))
          .setRequired(true)
          .setAutocomplete(true)
      ));
      cmdSet.addStringOption((opt) => {
        return opt.setName('value')
          .setDescription(i18n.getString('The value to set'))
          .setRequired(true);
      });

      commands.push(cmdSet);
    }

    // setup choices for get and set commands
    this.cmdGetStateChoices = [];
    this.cmdSetStateChoices = [];
    for (const [, objCfg] of this.commandObjectConfig) {
      if (objCfg.get) {
        this.cmdGetStateChoices.push({
          name: objCfg.name,
          value: objCfg.alias,
        });
      }
      if (objCfg.set) {
        this.cmdSetStateChoices.push({
          name: objCfg.name,
          value: objCfg.alias,
        });
      }
    }

    // sort choices for get and set commands
    const sortFn = (a: CommandOptionChoiceData, b: CommandOptionChoiceData): -1 | 0 | 1 => {
      if (a.name > b.name) return 1;
      if (a.name < b.name) return -1;
      return 0;
    };
    this.cmdGetStateChoices.sort(sortFn);
    this.cmdSetStateChoices.sort(sortFn);

    // custom commands
    this.customCommands.clear();
    if (this.adapter.config.enableCustomCommands) {
      loopCustomCommands:
      for (const customCommandCfg of this.adapter.config.customCommands) {
        if (!customCommandCfg.name.match(/^[a-z][0-9a-z-_]{1,32}$/) || customCommandCfg.description.length === 0 || customCommandCfg.description.length > 100) {
          this.adapter.log.warn(`Custom command "${customCommandCfg.name}" has an invalid name or description configured!`);
          continue;
        }

        if (customCommandCfg.name === this.cmdGetStateName) {
          this.adapter.log.warn(`Custom command "${customCommandCfg.name}" is configured but conflicts with default get command! The command will be ignored.`);
          continue;
        }
        if (customCommandCfg.name === this.cmdSetStateName) {
          this.adapter.log.warn(`Custom command "${customCommandCfg.name}" is configured but conflicts with default set command! The command will be ignored.`);
          continue;
        }

        if (this.customCommands.has(customCommandCfg.name)) {
          this.adapter.log.warn(`Custom command "${customCommandCfg.name}" is configured multiple times! The command will be ignored.`);
          continue;
        }

        // create the command
        const cmdCustom = new SlashCommandBuilder()
          .setName(customCommandCfg.name)
          .setDescription(customCommandCfg.description);

        const optionsChoices = new Collection<string, CommandOptionChoiceData[]>();

        // add configured options
        const cmdOpts: Set<string> = new Set();
        if (Array.isArray(customCommandCfg.options)) {
          // max 25 options are allowed
          if (customCommandCfg.options.length > 25) {
            this.adapter.log.warn(`Custom command "${customCommandCfg.name}" has more than 25 options configured! Only the first 25 options will be used.`);
            customCommandCfg.options.splice(25);
          }
        } else {
          customCommandCfg.options = [];
        }

        // create/update the ioBroker objects
        await this.setupCustomCommandIobObjects(customCommandCfg);

        for (const customCommandCfgOpt of customCommandCfg.options) {
          if (!customCommandCfgOpt.name.match(/^[a-z][0-9a-z-_]{1,32}$/) || customCommandCfgOpt.description.length === 0 || customCommandCfgOpt.description.length > 100) {
            this.adapter.log.warn(`Custom command "${customCommandCfg.name}" option "${customCommandCfgOpt.name}" has an invalid name or description configured!`);
            continue loopCustomCommands;
          }

          if (cmdOpts.has(customCommandCfgOpt.name)) {
            this.adapter.log.warn(`Custom command "${customCommandCfg.name}" option "${customCommandCfgOpt.name}" is configured multiple times! The command will be ignored.`);
            continue loopCustomCommands;
          }
          cmdOpts.add(customCommandCfgOpt.name);

          switch (customCommandCfgOpt.type) {
            case 'string':
              // string options may have choices from the ioBroker object
              let choices: (string | CommandOptionChoiceData)[] = [];
              try {
                const val = (await this.adapter.getStateAsync(`slashCommands.${customCommandCfg.name}.option-${customCommandCfgOpt.name}.choices`))?.val ?? '[]';
                if (typeof val !== 'string') {
                  this.adapter.log.warn(`Value of ${this.adapter.namespace}.slashCommands.${customCommandCfg.name}.option-${customCommandCfgOpt.name}.choices is not a string!`);
                } else {
                  choices = JSON.parse(val);
                }
              } catch (err) {
                this.adapter.log.warn(`Could not parse JSON from ${this.adapter.namespace}.slashCommands.${customCommandCfg.name}.option-${customCommandCfgOpt.name}.choices! ${err}`);
              }

              optionsChoices.set(customCommandCfgOpt.name, choices.map((choice) => {
                if (typeof choice === 'string' && choice.length >= 1 && choice.length <= 100) {
                  return { name: choice, value: choice };
                } else if (typeof choice === 'object' && typeof choice.value === 'string' && typeof choice.name === 'string' && choice.name.length >= 1 && choice.name.length <= 100 && choice.value.length <= 100) {
                  return { name: choice.name, value: choice.value };
                } else {
                  this.adapter.log.warn(`Choice ${JSON.stringify(choice)} is not valid for ${this.adapter.namespace}.slashCommands.${customCommandCfg.name}.option-${customCommandCfgOpt.name}.choices and will be ignored!`);
                  return null;
                }
              }).filter((choice) => choice !== null) as CommandOptionChoiceData[]);

              cmdCustom.addStringOption((opt) => {
                opt.setName(customCommandCfgOpt.name)
                  .setDescription(customCommandCfgOpt.description)
                  .setRequired(!!customCommandCfgOpt.required);

                if (choices.length > 0) {
                  opt.setAutocomplete(true);
                }

                return opt;
              });
              break;

            case 'number':
              cmdCustom.addNumberOption((opt) => opt.setName(customCommandCfgOpt.name).setDescription(customCommandCfgOpt.description).setRequired(!!customCommandCfgOpt.required));
              break;

            case 'boolean':
              cmdCustom.addBooleanOption((opt) => opt.setName(customCommandCfgOpt.name).setDescription(customCommandCfgOpt.description).setRequired(!!customCommandCfgOpt.required));
              break;

            case 'user':
              cmdCustom.addUserOption((opt) => opt.setName(customCommandCfgOpt.name).setDescription(customCommandCfgOpt.description).setRequired(!!customCommandCfgOpt.required));
              break;

            case 'role':
              cmdCustom.addRoleOption((opt) => opt.setName(customCommandCfgOpt.name).setDescription(customCommandCfgOpt.description).setRequired(!!customCommandCfgOpt.required));
              break;

            case 'channel':
              cmdCustom.addChannelOption((opt) => opt.setName(customCommandCfgOpt.name).setDescription(customCommandCfgOpt.description).setRequired(!!customCommandCfgOpt.required));
              break;

            case 'mentionable':
              cmdCustom.addMentionableOption((opt) => opt.setName(customCommandCfgOpt.name).setDescription(customCommandCfgOpt.description).setRequired(!!customCommandCfgOpt.required));
              break;

            default:
              this.adapter.log.warn(`Custom command "${customCommandCfg.name}" option "${customCommandCfgOpt.name} has an invalid type set"!`);
              continue loopCustomCommands;
          }
        }

        // add custom command to the commands
        commands.push(cmdCustom);
        this.customCommands.set(customCommandCfg.name, optionsChoices);
      }

      /*
       * find and delete old custom slash command objects
       */
      const objListSlashCommands = await this.adapter.getObjectListAsync({
        startkey: `${this.adapter.namespace}.slashCommands.`,
        endkey: `${this.adapter.namespace}.slashCommands.\u9999`,
      });
      const re = new RegExp(`^${this.adapter.name}\\.${this.adapter.instance}\\.slashCommands\\.([^.]+)$`);
      for (const item of objListSlashCommands.rows) {
        const m = item.id.match(re);
        if (m) {
          const cmdName = m[1];
          if (!this.customCommands.has(cmdName)) {
            this.adapter.log.debug(`Custom slash command ${cmdName} is not configured - deleting objects`);
            await this.adapter.delObjectAsyncCached(`slashCommands.${cmdName}`, { recursive: true });
          }
        }
      }
    }

    // check if any command is set and log an warning if not
    if (commands.length === 0) {
      if (this.adapter.config.enableCustomCommands) {
        this.adapter.log.warn('Commands are enabled but not configured for any state object and no custom commands are configured! Use the custom configuration of a state object to activate commands on it or add custom commands in the adapter instance configuration.');
      } else {
        this.adapter.log.warn('Commands are enabled but not configured for any state object! Use the custom configuration of a state object to activate commands on it.');
      }
    }

    const commandsJson = commands.map((cmd) => cmd.toJSON());

    // only update the commands if something has changed
    if (!isDeepStrictEqual(commandsJson, this.lastCommandsJson)) {
      this.adapter.log.debug('Commands needs to be updated');

      // register commands for all servers of the bot (guild commands are applied instant and may have permissions per user set)
      for (const [, guild] of this.adapter.client.guilds.cache) {
        try {
          if (this.adapter.config.commandsGlobal) {
            // global commands enabled, remove per guild commands
            await this.removeGuildCommands(guild);

          } else {
            // commands per guild
            await this.rest.put(Routes.applicationGuildCommands(this.adapter.client.user.id, guild.id), { body: commandsJson });
            this.adapter.log.info(`Registered commands for server ${guild.name} (id:${guild.id}) (get: ${numGet}, set: ${numSet}, custom: ${this.customCommands.size})`);
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
          this.adapter.log.info(`Registered global commands (get: ${numGet}, set: ${numSet}, custom: ${this.customCommands.size})`);

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
        this.adapter.log.info(`Removed commands for server ${guild.name} cause commands they are not used anymore.`);
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
   * Setup the ioBroker object tree for the configured custom commands.
   */
  private async setupCustomCommandIobObjects (cmdCfg: ioBroker.AdapterConfigCustomCommand): Promise<void> {
    const cmdName = cmdCfg.name;

    await this.adapter.extendObjectAsyncCached(`slashCommands.${cmdName}`, {
      type: 'channel',
      common: {
        name: cmdCfg.description,
      },
      native: {},
    });

    // generic custom command objects
    await Promise.all([
      this.adapter.extendObjectAsyncCached(`slashCommands.${cmdName}.json`, {
        type: 'state',
        common: {
          name: i18n.getStringOrTranslated('JSON data'),
          role: 'json',
          type: 'string',
          read: true,
          write: false,
          def: '',
        },
        native: {},
      }),
      this.adapter.extendObjectAsyncCached(`slashCommands.${cmdName}.timestamp`, {
        type: 'state',
        common: {
          name: i18n.getStringOrTranslated('Last use timestamp'),
          role: 'date',
          type: 'number',
          read: true,
          write: false,
          def: 0,
        },
        native: {},
      }),
      this.adapter.extendObjectAsyncCached(`slashCommands.${cmdName}.sendReply`, {
        type: 'state',
        common: {
          name: i18n.getStringOrTranslated('Send reply'),
          role: 'text',
          type: 'string',
          read: false,
          write: true,
          def: '',
        },
        native: {},
      }),
      this.adapter.extendObjectAsyncCached(`slashCommands.${cmdName}.interactionId`, {
        type: 'state',
        common: {
          name: i18n.getStringOrTranslated('Interaction ID'),
          role: 'text',
          type: 'string',
          read: true,
          write: false,
          def: '',
        },
        native: {},
      }),
      this.adapter.extendObjectAsyncCached(`slashCommands.${cmdName}.userId`, {
        type: 'state',
        common: {
          name: i18n.getStringOrTranslated('User ID'),
          role: 'text',
          type: 'string',
          read: true,
          write: false,
          def: '',
        },
        native: {},
      }),
      this.adapter.extendObjectAsyncCached(`slashCommands.${cmdName}.userTag`, {
        type: 'state',
        common: {
          name: i18n.getStringOrTranslated('User tag'),
          role: 'text',
          type: 'string',
          read: true,
          write: false,
          def: '',
        },
        native: {},
      }),
      this.adapter.extendObjectAsyncCached(`slashCommands.${cmdName}.userName`, {
        type: 'state',
        common: {
          name: i18n.getStringOrTranslated('User name'),
          role: 'text',
          type: 'string',
          read: true,
          write: false,
          def: '',
        },
        native: {},
      }),
      this.adapter.extendObjectAsyncCached(`slashCommands.${cmdName}.serverId`, {
        type: 'state',
        common: {
          name: i18n.getStringOrTranslated('Server ID'),
          role: 'text',
          type: 'string',
          read: true,
          write: false,
          def: '',
        },
        native: {},
      }),
      this.adapter.extendObjectAsyncCached(`slashCommands.${cmdName}.channelId`, {
        type: 'state',
        common: {
          name: i18n.getStringOrTranslated('Channel ID'),
          role: 'text',
          type: 'string',
          read: true,
          write: false,
          def: '',
        },
        native: {},
      }),
    ]);

    // custom command option objects
    const proms: Promise<any>[] = [];
    for (const cmdCfgOpt of cmdCfg.options) {
      await this.adapter.extendObjectAsyncCached(`slashCommands.${cmdName}.option-${cmdCfgOpt.name}`, {
        type: 'channel',
        common: {
          name: i18n.getStringOrTranslated('Option %s', cmdCfgOpt.description),
        },
        native: {},
      });

      let role: string;
      let type: ioBroker.CommonType;
      let def: any;
      switch (cmdCfgOpt.type) {
        case 'number':
          role = 'value';
          type = 'number';
          def = null;
          break;

        case 'boolean':
          role = 'indicator';
          type = 'boolean';
          def = null;
          break;

        default:
          role = 'text';
          type = 'string';
          def = '';
      }

      proms.push(this.adapter.extendObjectAsyncCached(`slashCommands.${cmdName}.option-${cmdCfgOpt.name}.value`, {
        type: 'state',
        common: {
          name: i18n.getStringOrTranslated('Option %s value', cmdCfgOpt.description),
          role,
          type,
          read: true,
          write: false,
          def,
        },
        native: {},
      }));

      // for string options add a choices state
      if (cmdCfgOpt.type === 'string') {
        proms.push(this.adapter.extendObjectAsyncCached(`slashCommands.${cmdName}.option-${cmdCfgOpt.name}.choices`, {
          type: 'state',
          common: {
            name: i18n.getStringOrTranslated('Option %s choices', cmdCfgOpt.description),
            role: 'json',
            type: 'string',
            read: true,
            write: true,
            def: '[]',
          },
          native: {},
        }));
      } else {
        // remove the state for non-string options
        proms.push(this.adapter.delObjectAsyncCached(`slashCommands.${cmdName}.option-${cmdCfgOpt.name}.choices`));
      }
    }

    // check for unused (old) custom command option objects and remove them
    const objListOptions = await this.adapter.getObjectListAsync({
      startkey: `${this.adapter.namespace}.slashCommands.${cmdName}.option-`,
      endkey: `${this.adapter.namespace}.slashCommands.${cmdName}.option-\u9999`,
    });
    const reOptionsName = new RegExp(`^${this.adapter.name}\\.${this.adapter.instance}\\.slashCommands\\.${cmdName}\\.option-([^.]+)$`);
    for (const item of objListOptions.rows) {
      const m = item.id.match(reOptionsName);
      if (m) {
        const oldoptName = m[1];
        if (!cmdCfg.options.find((o) => o.name === oldoptName)) {
          // option does not exist... delete the object and custom command option choices cache
          proms.push(this.adapter.delObjectAsyncCached(`slashCommands.${cmdName}.option-${oldoptName}`, { recursive: true }));
          this.customCommands.get(cmdName)?.delete(oldoptName);
        }
      }
    }

    // wait for object create/delete
    await Promise.all(proms);
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
  public triggerDelayedRegisterSlashCommands (): void {
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
   * Handle interactions.
   */
  @boundMethod
  private async onInteractionCreate (interaction: Interaction<CacheType>): Promise<void> {

    // raw states enabled?
    if (this.adapter.config.enableRawStates) {
      // set raw state... not async here since it should not block!
      const interactionJson = interaction.toJSON() as Record<string, unknown>;
      if (interaction.isCommand()) {
        interactionJson.options = interaction.options.data;
      }
      this.adapter.setState('raw.interactionJson', JSON.stringify(interactionJson, (_key, value) => typeof value === 'bigint' ? value.toString() : value), true);
    }

    if (interaction.isCommand()) {
      this.handleCommandInteraction(interaction);
    } else if (interaction.isAutocomplete()) {
      this.handleAutocompleteInteraction(interaction);
    }
  }

  /**
   * Handle command interactions.
   */
  private async handleCommandInteraction (interaction: CommandInteraction<CacheType>): Promise<void> {
    const { commandName, user } = interaction;

    if (!this.registerCommandsDone) {
      this.adapter.log.warn(`Got command ${commandName} but command registration is not done yet.`);
      return;
    }

    this.adapter.log.debug(`Got command ${commandName} ${JSON.stringify(interaction.options.data)}`);

    const authCheckTarget = interaction.member instanceof GuildMember ? interaction.member : user;

    if (commandName === this.cmdGetStateName) {
      // check user authorization
      if (this.adapter.checkUserAuthorization(authCheckTarget, { getStates: true })) {
        // user authorized
        await this.handleCmdGetState(interaction);
      } else {
        // user not authorized
        this.adapter.log.warn(`User ${userNameOrTag(user)} (id:${user.id}) is not authorized to call /${commandName} commands!`);
        await interaction.reply({
          content: i18n.getString('You are not authorized to call this command!'),
          ephemeral: true,
        });
      }

    } else if (commandName === this.cmdSetStateName) {
      // check user authorization
      if (this.adapter.checkUserAuthorization(authCheckTarget, { setStates: true })) {
        // user authorized
        await this.handleCmdSetState(interaction);
      } else {
        // user not authorized
        this.adapter.log.warn(`User ${userNameOrTag(user)} (id:${user.id}) is not authorized to call /${commandName} commands!`);
        await interaction.reply({
          content: i18n.getString('You are not authorized to call this command!'),
          ephemeral: true,
        });
      }

    } else if (this.customCommands.has(commandName)) {
      // check user authorization
      if (this.adapter.checkUserAuthorization(authCheckTarget, { useCustomCommands: true })) {
        // user authorized
        await this.handleCmdCustom(interaction);
      } else {
        // user not authorized
        this.adapter.log.warn(`User ${userNameOrTag(user)} (id:${user.id}) is not authorized to call /${commandName} commands!`);
        await interaction.reply({
          content: i18n.getString('You are not authorized to call this command!'),
          ephemeral: true,
        });
      }

    } else {
      this.adapter.log.warn(`Got unknown command ${commandName}!`);
      await interaction.editReply(i18n.getString('Unknown command!'));
    }
  }

  /**
   * Handle autocomplete for command interactions.
   */
  private async handleAutocompleteInteraction (interaction: AutocompleteInteraction<CacheType>): Promise<void> {
    const { commandName, user } = interaction;

    const focused = interaction.options.getFocused(true);
    let focusedValue: string;
    if (typeof focused.value !== 'string') {
      return interaction.respond([]);
    } else {
      focusedValue = focused.value.toLowerCase();
    }

    // check authorization
    const authCheckTarget = interaction.member instanceof GuildMember ? interaction.member : user;

    let choices: CommandOptionChoiceData[];

    if (commandName === this.cmdGetStateName) {
      // get state command
      if (!this.adapter.checkUserAuthorization(authCheckTarget, { getStates: true })) {
        return interaction.respond([]);
      }

      choices = this.cmdGetStateChoices;

    } else if (commandName === this.cmdSetStateName) {
      // set state command
      if (!this.adapter.checkUserAuthorization(authCheckTarget, { setStates: true })) {
        return interaction.respond([]);
      }

      choices = this.cmdSetStateChoices;

    } else if (this.customCommands.has(commandName)) {
      // custom command
      if (!this.adapter.checkUserAuthorization(authCheckTarget, { useCustomCommands: true })) {
        return interaction.respond([]);
      }

      choices = this.customCommands.get(commandName)?.get(focused.name) ?? [];

    } else {
      // unknown command
      return interaction.respond([]);
    }

    // filter for given input
    const matchedChoices = choices.filter((choice) => {
      return choice.name.normalize('NFKC').toLowerCase().includes(focusedValue)
        || choice.value.normalize('NFKC').toLowerCase().includes(focusedValue);
    });

    // max. 25 choices are allowed
    matchedChoices.splice(25);

    return interaction.respond(matchedChoices);
  }

  /**
   * Try to get the ioBroker object and CommandObjectConfig for a given object alias.
   * The object will be checked if it's a valid state object.
   *
   * In case of an error, a reply will be sent to the interaction.
   * @param objAlias The alias of the object.
   * @param interaction The interaction for replies on errors.
   * @returns Array containing the object and the config or null and null.
   */
  private async getObjectAndCfgFromAlias (objAlias: string | null, interaction: CommandInteraction<CacheType>): Promise<[ioBroker.StateObject | null, CommandObjectConfig | null]> {
    // find the config for the requested object
    const cfg = this.commandObjectConfig.find((coc) => coc.alias === objAlias);
    if (!cfg) {
      if (interaction.replied) {
        await interaction.editReply({
          content: i18n.getString('Object `%s` not found!', objAlias ?? ''),
        });
      } else {
        await interaction.reply({
          content: i18n.getString('Object `%s` not found!', objAlias ?? ''),
          ephemeral: true,
        });
      }
      return [null, null];
    }

    // get the object
    const obj = await this.adapter.getForeignObjectAsync(cfg.id);
    if (!obj) {
      if (interaction.replied) {
        await interaction.editReply({
          content: i18n.getString('Object `%s` not found!', cfg.id),
        });
      } else {
        await interaction.reply({
          content: i18n.getString('Object `%s` not found!', cfg.id),
          ephemeral: true,
        });
      }
      return [null, null];
    }
    if (obj.type !== 'state') {
      if (interaction.replied) {
        await interaction.editReply({
          content: i18n.getString('Object `%s` is not of type state!', cfg.id),
        });
      } else {
        await interaction.reply({
          content: i18n.getString('Object `%s` is not of type state!', cfg.id),
          ephemeral: true,
        });
      }
      return [null, null];
    }

    return [obj, cfg];
  }

  /**
   * Handler for "get state" slash commands.
   * @param interaction The interaction which triggered this.
   */
  private async handleCmdGetState (interaction: CommandInteraction<CacheType>): Promise<void> {
    const objAlias = interaction.options.get('state', true).value as string;

    const [obj, cfg] = await this.getObjectAndCfgFromAlias(objAlias, interaction);
    if (!obj || !cfg) {
      return;
    }

    const objCustom: ioBroker.CustomConfig | undefined = obj.common.custom?.[this.adapter.namespace];

    // check if get allowed
    if (!objCustom?.commandsAllowGet) {
      await interaction.reply({
        content: i18n.getString('Get not allowed for state `%s`!', cfg.id),
        ephemeral: true,
      });
      return;
    }

    // get the state
    const state = await this.adapter.getForeignStateAsync(cfg.id);
    if (!state) {
      await interaction.reply({
        content: i18n.getString('State `%s` not found!', cfg.id),
        ephemeral: true,
      });
      return;
    }

    // defer the reply to have more time
    if (!interaction.deferred) {
      await interaction.deferReply({ ephemeral: this.adapter.config.commandRepliesEphemeral });
    }

    // get the value depending on the state type
    let val: string = '';

    // an optional MessageOptions object for special cases (like sending files)
    let msgOpts: MessageCreateOptions | undefined = undefined;

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
            val = objCustom.commandsBooleanValueTrue ?? i18n.getString('true');
          } else {
            val = objCustom.commandsBooleanValueFalse ?? i18n.getString('false');
          }
          break;

        case 'number':
          // number values
          const decimals = objCustom.commandsNumberDecimals ?? 0;
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
    const objAlias = interaction.options.get('state', true).value as string;

    const [obj, cfg] = await this.getObjectAndCfgFromAlias(objAlias, interaction);
    if (!obj || !cfg) {
      return;
    }

    const objCustom: ioBroker.CustomConfig | undefined = obj.common.custom?.[this.adapter.namespace];

    // check if set allowed
    if (!objCustom?.commandsAllowSet) {
      await interaction.reply({
        content: i18n.getString('Set not allowed for state `%s`!', cfg.id),
        ephemeral: true,
      });
      return;
    }

    let valueStr = interaction.options.get('value')?.value;
    if (typeof valueStr !== 'string') {
      await interaction.reply({
        content: i18n.getString('No value provided!'),
        ephemeral: true,
      });
      return;
    }

    // defer the reply to have more time
    if (!interaction.deferred) {
      await interaction.deferReply({ ephemeral: this.adapter.config.commandRepliesEphemeral });
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
          valueReply = objCustom.commandsBooleanValueTrue ?? i18n.getString('true');
        } else {
          // false value
          value = false;
          valueReply = objCustom.commandsBooleanValueFalse ?? i18n.getString('false');
        }
        break;

      case 'number':
        // parse as number (float) value
        if (i18n.isFloatComma) {
          valueStr = valueStr.replace(',', '.');
        }
        value = parseFloat(valueStr);

        if (isNaN(value)) {
          await interaction.editReply(i18n.getString('The given value is not a number!'));
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
   * Handler for custom slash commands.
   * @param interaction The interaction which triggered this.
   */
  private async handleCmdCustom (interaction: CommandInteraction<CacheType>): Promise<void> {
    const {
      commandName,
      channelId,
      guildId,
      user,
      options,
    } = interaction;

    // get the related custom command config
    const cmdCfg = this.adapter.config.customCommands.find((c) => c.name === commandName);
    if (!cmdCfg) return; // should never happen, but to be sure

    // defer the reply to have more time
    if (!interaction.deferred) {
      await interaction.deferReply({ ephemeral: this.adapter.config.commandRepliesEphemeral });
    }

    // add this interaction to the collection of last interactions
    this.lastInteractions.set(interaction.id, interaction);

    // promises for all set state actions
    const proms: Promise<any>[] = [];

    // prepare json data
    const json: JsonSlashCommandObj = {
      interactionId: interaction.id,
      commandName,
      channelId,
      serverId: guildId ?? null,
      user: {
        id: user.id,
        tag: user.tag,
        name: user.username,
        displayName: interaction.member instanceof GuildMember ? interaction.member.displayName : user.username,
      },
      timestamp: interaction.createdTimestamp,
      options: {},
    };

    // loop over configured options and prepare data ... options.data* may not be set for optional options
    for (const optCfg of cmdCfg.options) {
      const opt = options.data.find((o) => o.name === optCfg.name);
      if (opt) {
        json.options[optCfg.name] = {
          value: opt.value ?? null,
          type: ApplicationCommandOptionType[opt.type],
        };

        if (opt.user instanceof User) {
          json.options[optCfg.name].user = {
            id: opt.user.id,
            tag: opt.user.tag,
            name: opt.user.username,
            bot: opt.user.bot,
          };
        }
        if (opt.member instanceof GuildMember) {
          json.options[optCfg.name].member = {
            id: opt.member.id,
            tag: opt.member.user.tag,
            name: opt.member.user.username,
            displayName: opt.member.displayName,
            roles: opt.member.roles.cache.map((r) => ({ id: r.id, name: r.name })),
          };
        }
        if (opt.role instanceof Role) {
          json.options[optCfg.name].role = {
            id: opt.role.id,
            name: opt.role.name,
          };
        }
        if (opt.channel instanceof GuildChannel) {
          json.options[optCfg.name].channel = {
            id: opt.channel.id,
            name: opt.channel.name,
            type: ChannelType[opt.channel.type] as ChannelTypeNames,
            lastMessageId: (opt.channel.type === ChannelType.GuildText || opt.channel.type == ChannelType.GuildVoice) ? opt.channel.lastMessageId : null,
          };
        }
      } else {
        json.options[optCfg.name] = {
          value: null,
          type: null,
        };
      }
      proms.push(this.adapter.setStateAsync(`slashCommands.${commandName}.option-${optCfg.name}.value`, json.options[optCfg.name].value, true));
    }

    // set the states
    await Promise.all([
      this.adapter.setStateAsync(`slashCommands.${commandName}.interactionId`, interaction.id, true),
      this.adapter.setStateAsync(`slashCommands.${commandName}.channelId`, channelId, true),
      this.adapter.setStateAsync(`slashCommands.${commandName}.serverId`, guildId ?? null, true),
      this.adapter.setStateAsync(`slashCommands.${commandName}.userId`, user.id, true),
      this.adapter.setStateAsync(`slashCommands.${commandName}.userTag`, user.tag, true),
      this.adapter.setStateAsync(`slashCommands.${commandName}.userName`, user.username, true),
      this.adapter.setStateAsync(`slashCommands.${commandName}.timestamp`, interaction.createdTimestamp, true),
      this.adapter.setStateAsync(`slashCommands.${commandName}.json`, JSON.stringify(json), true),
      ...proms,
    ]);

    /*****
     * Hint: Interaction reply is deferred, but no reply will be send here.
     *       The reply must be triggered by the user using the .sendReply state or a `sendTo(...)` action.
     *****/

    // remove outdated interactions
    const outdatedTs = Date.now() - 15 * 60000; // 15 min
    const removedInteractions = this.lastInteractions.sweep((ia) => ia.createdTimestamp < outdatedTs);
    if (removedInteractions > 0) {
      this.adapter.log.debug(`Removed ${removedInteractions} outdated interactions from cache`);
    }
  }

  /**
   * Send a reply to a custom slash command.
   * @param interactionId The ID of the interaction to reply to. The interactions needs to be cached in this instance.
   * @param msg The message to reply with. May be a simple string, a MessageOptions object or a stringified JSON MessageOptions object.
   * @returns Promise which resolves withe the ID of the reply message if the reply is sent.
   * @throws Error if the reply could not be sent for some reason (i.e. some check failed).
   */
  public async sendCmdCustomReply (interactionId: Snowflake, msg: string | MessageCreateOptions): Promise<Snowflake> {
    // get the interaction
    const interaction = this.lastInteractions.get(interactionId);

    if (!interaction) {
      throw new Error(`No current interaction with ID ${interactionId} found for reply!`);
    }

    const { commandName } = interaction;

    const cmdCfg = this.adapter.config.customCommands.find((c) => c.name === commandName);
    if (!cmdCfg) {
      throw new Error(`No configuration for custom slash command ${commandName} of interaction ${interactionId} found for reply!`);
    }

    if (!interaction.isRepliable()) {
      throw new Error(`Interaction ${interactionId} of custom slash command ${commandName} is not repliable!`);
    }

    // if a string is given try to parse it and prepare it as MessageOptions object
    if (typeof msg === 'string') {
      try {
        msg = this.adapter.parseStringifiedMessageOptions(msg);
      } catch (err) {
        throw new Error(`Reply to interaction ${interactionId} of custom slash command ${commandName} is invalid: ${err}`);
      }
    }

    // send the reply
    const replyMsg = await interaction.editReply(msg);
    return replyMsg.id;
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
