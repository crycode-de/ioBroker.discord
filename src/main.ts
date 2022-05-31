import 'source-map-support/register';

import { isDeepStrictEqual } from 'node:util';

import { boundMethod } from 'autobind-decorator';

import {
  Adapter,
  AdapterOptions,
  EXIT_CODES,
} from '@iobroker/adapter-core';

import {
  Client,
  Collection,
  Guild,
  GuildBasedChannel,
  GuildMember,
  Intents,
  Message,
  MessageOptions,
  NonThreadGuildBasedChannel,
  Permissions,
  Presence,
  PresenceData,
  PresenceStatusData,
  Snowflake,
  User,
  VoiceState,
} from 'discord.js';

import {
  CommandObjectConfig,
  DiscordAdapterSlashCommands,
} from './commands';
import {
  SetBotPresenceOptions,
  Text2commandMessagePayload,
  VALID_ACTIVITY_TYPES,
  VALID_PRESENCE_STATUS_DATA,
  ValidActivityType,
  JsonServersMembersObj,
  JsonServersChannelsObj,
  JsonUsersObj,
  UpdateUserPresenceResult,
  JsonMessageObj,
  CheckAuthorizationOpts,
  SendToActionSendPayload,
  SendToActionEditMessagePayload,
  MessageIdentifier,
  SendToActionAwaitMessageReactionPayload,
  SendToActionAddReactionPayload,
  SendToActionServerIdentifier,
  SendToActionSendCustomCommandReplyPayload,
  SendToActionChannelIdentifier,
  SendToActionServerMemberIdentifier,
  SendToActionUserIdentifier,
} from './lib/definitions';
import { i18n } from './lib/i18n';
import {
  getBasenameFromFilePathOrUrl,
  getBufferAndNameFromBase64String,
} from './lib/utils';

const LOGIN_WAIT_TIMES = <const>[
  0, // none - first try!
  5000, // 5 sek
  10000, // 10 sek
  30000, // 30 sek
  60000, // 1 min
  120000, // 2 min
  120000, // 2 min
  300000, // 5 min
  300000, // 5 min
  300000, // 5 min
  600000, // 10 min
];

/**
 * ioBroker.discord adapter
 */
class DiscordAdapter extends Adapter {

  /**
   * Local cache for `info.connection` state.
   */
  private infoConnected: boolean = false;

  /**
   * Instance of the discord client.
   */
  public client: Client | null = null;

  /**
   * Set of state IDs where received discord messages will be stored to.
   * Used to identify target states for received discord messages.
   */
  private messageReceiveStates: Set<string> = new Set();

  /**
   * Set user IDs known to set up.
   * Used to check if the user objects are created on some events.
   */
  private knownUsers: Set<Snowflake> = new Set();

  /**
   * Set of objects from this instance with text2command enabled.
   */
  private text2commandObjects: Set<string> = new Set();

  /**
   * Cache for `extendObjectCache(...)` calls to extend objects only when changed.
   */
  private extendObjectCache: Collection<string, ioBroker.PartialObject> = new Collection();

  /**
   * Cache for `.json` states.
   */
  private jsonStateCache: Collection<string, JsonServersMembersObj | JsonServersChannelsObj | JsonUsersObj | JsonMessageObj> = new Collection();

  /**
   * Instance of the slash commands handler class.
   */
  private discordSlashCommands: DiscordAdapterSlashCommands;

  /**
   * Flag if the initial setup of the custom object configurations is done or not.
   * While not done, custom object configuration changes will not trigger a
   * slash commands registration automatically.
   */
  public initialCustomObjectSetupDone: boolean = false;

  /**
   * Flag if the adapter is unloaded or is unloading.
   * Used to check this in some async operations.
   */
  public unloaded: boolean = false;

  public constructor(options: Partial<AdapterOptions> = {}) {
    super({
      ...options,
      name: 'discord',
    });

    this.discordSlashCommands = new DiscordAdapterSlashCommands(this);

    this.on('ready', this.onReady);
    this.on('stateChange', this.onStateChange);
    this.on('objectChange', this.onObjectChange);
    this.on('message', this.onMessage);
    this.on('unload', this.onUnload);
  }

  /**
   * Is called when databases are connected and adapter received configuration.
   */
  @boundMethod
  private async onReady(): Promise<void> {

    // Reset the connection indicator during startup
    await this.setInfoConnectionState(false, true);

    // try to get the system language
    const systemConfig = await this.getForeignObjectAsync('system.config');
    i18n.language = systemConfig?.common.language || 'en';
    i18n.isFloatComma = systemConfig?.common.isFloatComma || false;

    // validate config
    if (typeof this.config.token !== 'string' || !this.config.token.match(/^[0-9a-zA-Z-_]{24}\.[0-9a-zA-Z-_]{6}\.[0-9a-zA-Z-_]{27,38}$/)) {
      this.log.error(`No or invalid token!`);
      return;
    }
    if (!Array.isArray(this.config.authorizedUsers)) {
      this.config.authorizedUsers = [];
    }
    if (!Array.isArray(this.config.authorizedServerRoles)) {
      this.config.authorizedServerRoles = [];
    }
    if (!this.config.enableAuthorization) {
      this.log.info('Authorization is disabled, so any user is able to interact with the bot. You should only disable authorization if you trust all users on any server where the bot is on.');
    }
    if (this.config.enableAuthorization && this.config.authorizedUsers.length === 0 && this.config.authorizedServerRoles.length === 0) {
      this.log.info('Authorization is enabled but no authorized users are defined!');
    }
    if (this.config.enableCustomCommands && !Array.isArray(this.config.customCommands)) {
      this.config.customCommands = [];
    }
    this.config.reactOnMentionsEmoji = this.config.reactOnMentionsEmoji?.trim() || '👍';

    // setup generic dynamic objects (most objects will be set up in `updateGuilds` method)
    if (this.config.enableRawStates) {
      await this.extendObjectAsync('raw', {
        type: 'channel',
        common: {
          name: i18n.getStringOrTranslated('Raw data'),
        },
        native: {},
      });
      await Promise.all([
        this.extendObjectAsync('raw.interactionJson', {
          type: 'state',
          common: {
            name: i18n.getStringOrTranslated('Last interaction JSON data'),
            role: 'json',
            type: 'string',
            read: true,
            write: false,
            def: '',
          },
          native: {},
        }),
        this.extendObjectAsync('raw.messageJson', {
          type: 'state',
          common: {
            name: i18n.getStringOrTranslated('Last message JSON data'),
            role: 'json',
            type: 'string',
            read: true,
            write: false,
            def: '',
          },
          native: {},
        }),
      ]);
    } else {
      await this.delObjectAsync('raw', { recursive: true });
    }

    if (this.config.enableCustomCommands) {
      await this.extendObjectAsync('slashCommands', {
        type: 'channel',
        common: {
          name: i18n.getStringOrTranslated('Custom Discord slash commands'),
        },
        native: {},
      });
    } else {
      await this.delObjectAsync('slashCommands', { recursive: true });
    }

    // setup the discord client
    this.client = new Client({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MESSAGE_TYPING,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        Intents.FLAGS.DIRECT_MESSAGE_TYPING,
        Intents.FLAGS.GUILD_VOICE_STATES,
      ],
      partials: [
        'CHANNEL', // needed for DMs
      ],
    });

    this.client.on('ready', this.onClientReady);

    if (this.log.level === 'silly') {
      this.client.on('debug', (message) => this.log.silly(`discordjs: ${message}`));
    }
    this.client.on('warn', (message) => this.log.warn(`Discord client warning: ${message}`));
    this.client.on('error', (err) => this.log.error(`Discord client error: ${err.toString()}`));
    this.client.on('rateLimit', (rateLimitData) => this.log.debug(`Discord client rate limit hit: ${JSON.stringify(rateLimitData)}`)); // rate limit event is just a information - discord.js handels rate limits
    this.client.on('invalidRequestWarning', (invalidRequestWarningData) => this.log.warn(`Discord client invalid request warning: ${JSON.stringify(invalidRequestWarningData)}`));

    this.client.on('invalidated', () => {
      this.log.warn('Discord client session invalidated');
      this.setInfoConnectionState(false);
    });

    this.client.on('shardError', (err) => {
      // discord.js internally handles websocket errors and reconnects
      // this is just for some logging
      this.log.warn(`Discord client websocket error: ${err.toString()}`);
      this.setInfoConnectionState(false);
    });
    this.client.on('shardReady', (shardId) => {
      // discord.js websocket is ready (connected)
      this.log.info(`Discord client websocket connected (shardId:${shardId})`);
      this.setInfoConnectionState(true);
      this.setBotPresence();
    });
    this.client.on('shardResume', (shardId, replayedEvents) => this.log.debug(`Discord client websocket resume (shardId:${shardId} replayedEvents:${replayedEvents})`));
    this.client.on('shardDisconnect', (event, shardId) => this.log.debug(`Discord client websocket disconnect (shardId:${shardId} ${event.reason})`));
    this.client.on('shardReconnecting', (shardId) => this.log.debug(`Discord client websocket reconnecting (shardId:${shardId})`));
    this.client.on('shardError', (err, shardId) => {
      this.log.error(`Discord client websocket error (shardId:${shardId}) ${err}`);
      this.terminate('Discord client websocket error', EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
    });

    this.client.on('messageCreate', this.onClientMessageCreate);

    if (this.config.dynamicServerUpdates) {
      this.client.on('channelCreate', () => this.updateGuilds());
      this.client.on('channelDelete', () => this.updateGuilds());
      this.client.on('channelUpdate', () => this.updateGuilds());
      this.client.on('guildCreate', () => this.updateGuilds());
      this.client.on('guildDelete', () => this.updateGuilds());
      this.client.on('guildUpdate', () => this.updateGuilds());
      this.client.on('guildMemberAdd', () => this.updateGuilds());
      this.client.on('guildMemberRemove', () => this.updateGuilds());
      this.client.on('roleCreate', () => this.updateGuilds());
      this.client.on('roleDelete', () => this.updateGuilds());
      this.client.on('roleUpdate', () => this.updateGuilds());
      this.client.on('userUpdate', () => this.updateGuilds());
    }

    if (this.config.observeUserPresence) {
      this.client.on('presenceUpdate', (_oldPresence, newPresence) => { this.updateUserPresence(newPresence.userId, newPresence); });
    }

    if (this.config.observeUserVoiceState) {
      this.client.on('voiceStateUpdate', this.onClientVoiceStateUpdate);
    }

    // init commands instance - need to be done after discord client setup
    this.discordSlashCommands.onReady();

    // subscribe needed states and objects
    this.subscribeStates('servers.*.channels.*.send');
    this.subscribeStates('servers.*.channels.*.sendFile');
    this.subscribeStates('servers.*.channels.*.sendReply');
    this.subscribeStates('servers.*.channels.*.sendReaction');
    this.subscribeStates('users.*.send');
    this.subscribeStates('users.*.sendFile');
    this.subscribeStates('users.*.sendReply');
    this.subscribeStates('users.*.sendReaction');
    this.subscribeStates('servers.*.members.*.voiceDisconnect');
    this.subscribeStates('servers.*.members.*.voiceServerMute');
    this.subscribeStates('servers.*.members.*.voiceServerDeaf');
    this.subscribeStates('slashCommands.*.sendReply');
    this.subscribeStates('bot.*');
    this.subscribeForeignObjects('*'); // needed to handle custom object configs

    // initially get all objects with custom config
    this.log.debug('Get all objects with custom config ...');
    const view = await this.getObjectViewAsync('system', 'custom', {});
    if (view?.rows) {
      for (const item of view.rows) {
        await this.setupObjCustom(item.id, item.value?.[this.namespace]);
      }
    }
    this.log.debug('Getting all objects with custom config done');

    // remember that the initial setup of the custom objects is done
    this.initialCustomObjectSetupDone = true;

    // try to log in the client, terminate if this was not successfull
    if (!await this.loginClient()) {
      this.terminate('No connection to Discord', EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
      return; // needed!
    }

    // register discord commands if login was successfull
    await this.discordSlashCommands.registerSlashCommands();
  }

  /**
   * Try to log in the discord client.
   *
   * This will also handle network related errors.
   * In case of networt related errors this will retry the login after some time.
   * The wait time before each retry will be increased for each try, as defined
   * in `LOGIN_WAIT_TIMES`.
   * @param tryNr Number of the login try. Should be `0` when login process is started and is increased internally in each try.
   * @returns Promise which resolves to `true` if logged in, `false` otherwise.
   */
  private async loginClient (tryNr: number = 0): Promise<boolean> {
    if (!this.client || this.unloaded) {
      return false;
    }

    try {
      await this.client.login(this.config.token);
      return true;
    } catch (err) {
      if (err instanceof Error) {
        this.log.error(`Discord login error: ${err.toString()}`);
        if (err.name === 'AbortError') {
          // AbortError is a result of network errors ... retry
          tryNr++;
          if (tryNr >= LOGIN_WAIT_TIMES.length) {
            tryNr = LOGIN_WAIT_TIMES.length - 1;
          }

          this.log.info(`Wait ${LOGIN_WAIT_TIMES[tryNr] / 1000} seconds before next login try (#${tryNr+1}) ...`);
          await this.wait(LOGIN_WAIT_TIMES[tryNr]);

          return this.loginClient(tryNr);
        }
      } else {
        this.log.error(`Unknown Discord login error`);
      }
      return false;
    }
  }

  /**
   * When the discord client is ready.
   */
  @boundMethod
  private async onClientReady (): Promise<void> {
    if (!this.client?.user) {
      this.log.error('Discord client has no user!');
      return;
    }

    this.log.info(`Logged in as ${this.client.user.tag}!`);
    this.log.debug(`User ID: ${this.client.user.id}`);

    // change the bot username/nickname if needed
    if (this.config.botName) {
      if (this.client.user.username !== this.config.botName) {
        // update needed
        this.log.debug(`Update of bot name needed - current name: ${this.client.user.username} - configured name: ${this.config.botName}`);
        try {
          const proms: Promise<any>[] = [];
          proms.push(this.client.user.setUsername(this.config.botName));

          for (const [, guild] of this.client.guilds.cache) {
            const me = guild.members.cache.get(this.client.user.id);
            if (me) {
              proms.push(me.setNickname(this.config.botName));
            }
          }

          await Promise.all(proms);
          this.log.debug(`Bot name updated`);
        } catch (err) {
          this.log.warn(`Error setting the bot name to "${this.config.botName}": ${err}`);
        }
      } else {
        // up to date
        this.log.debug('Bot name is up to date');
      }
    }

    try {
      await this.updateGuilds();
    } catch (err) {
      this.log.error(`Error while updating server information: ${err}`);
    }
  }

  /**
   * Update the guilds (servers), channels and users seen by the discord bot.
   * This will create/update all dynamic objects for all servers and users if needed.
   */
  private async updateGuilds (): Promise<void> {
    if (!this.client?.user) {
      throw new Error('Client not loaded');
    }

    /**
     * Collection of known users on all known servers.
     * Used to create/delete user objects.
     */
    const allServersUsers: Collection<Snowflake, { user: User, presence: Presence | null }> = new Collection();

    /**
     * Set of object IDs for all known servers and channels.
     * Used to detect server/channel objects which have be deleted.
     */
    const knownServersAndChannelsIds: Set<string> = new Set();

    if (this.unloaded) return;
    const guilds = await this.client.guilds.fetch();
    if (this.unloaded) return;

    for (const [, guildBase] of guilds) {

      if (this.unloaded) return;
      let guild: Guild;
      try {
        guild = await guildBase.fetch();
      } catch (err) {
        this.log.warn(`Could not fetch guild information for guild "${guildBase.name}" id:${guildBase.id}`);
        this.log.debug(`Error: ${err}`);
        continue;
      }
      if (this.unloaded) return;

      knownServersAndChannelsIds.add(`${this.namespace}.servers.${guild.id}`);

      // create channel for this guild
      await this.extendObjectAsyncCached(`servers.${guild.id}`, {
        type: 'channel',
        common: {
          name: guild.name,
        },
        native: {},
      });

      await Promise.all([
        this.extendObjectAsyncCached(`servers.${guild.id}.members`, {
          type: 'channel',
          common: {
            name: i18n.getStringOrTranslated('Members'),
          },
          native: {},
        }),
        this.extendObjectAsyncCached(`servers.${guild.id}.channels`, {
          type: 'channel',
          common: {
            name: i18n.getStringOrTranslated('Channels'),
          },
          native: {},
        }),
      ]);

      // add guild member objects
      const guildMembers = await guild.members.fetch();
      if (this.unloaded) return;

      for (const [, member] of guildMembers) {
        // remember user if not the bot itself
        if (member.user.id !== this.client.user.id) {
          allServersUsers.set(member.user.id, { user: member.user, presence: member.presence });
        }

        await this.extendObjectAsyncCached(`servers.${guild.id}.members.${member.id}`, {
          type: 'channel',
          common: {
            name: `${member.displayName} (${member.user.tag})`,
          },
          native: {},
        });

        await Promise.all([
          this.extendObjectAsyncCached(`servers.${guild.id}.members.${member.id}.tag`, {
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
          this.extendObjectAsyncCached(`servers.${guild.id}.members.${member.id}.displayName`, {
            type: 'state',
            common: {
              name: i18n.getStringOrTranslated('Display name'),
              role: 'text',
              type: 'string',
              read: true,
              write: false,
              def: '',
            },
            native: {},
          }),
          this.extendObjectAsyncCached(`servers.${guild.id}.members.${member.id}.roles`, {
            type: 'state',
            common: {
              name: i18n.getStringOrTranslated('Roles'),
              role: 'text',
              type: 'string',
              read: true,
              write: false,
              def: '',
            },
            native: {},
          }),

          this.extendObjectAsyncCached(`servers.${guild.id}.members.${member.id}.joinedAt`, {
            type: 'state',
            common: {
              name: i18n.getStringOrTranslated('Joined at'),
              role: 'date',
              type: 'number',
              read: true,
              write: false,
              def: 0,
            },
            native: {},
          }),

          this.extendObjectAsyncCached(`servers.${guild.id}.members.${member.id}.voiceChannel`, {
            type: 'state',
            common: {
              name: i18n.getStringOrTranslated('Voice channel'),
              role: 'text',
              type: 'string',
              read: true,
              write: false,
              def: '',
            },
            native: {},
          }),
          this.extendObjectAsyncCached(`servers.${guild.id}.members.${member.id}.voiceDisconnect`, {
            type: 'state',
            common: {
              name: i18n.getStringOrTranslated('Voice disconnect'),
              role: 'button',
              type: 'boolean',
              read: false,
              write: true,
              def: false,
            },
            native: {},
          }),
          this.extendObjectAsyncCached(`servers.${guild.id}.members.${member.id}.voiceSelfDeaf`, {
            type: 'state',
            common: {
              name: i18n.getStringOrTranslated('Voice self deafen'),
              role: 'indicator',
              type: 'boolean',
              read: true,
              write: false,
              def: false,
            },
            native: {},
          }),
          this.extendObjectAsyncCached(`servers.${guild.id}.members.${member.id}.voiceServerDeaf`, {
            type: 'state',
            common: {
              name: i18n.getStringOrTranslated('Voice server deafen'),
              role: 'switch',
              type: 'boolean',
              read: true,
              write: true,
              def: false,
            },
            native: {},
          }),
          this.extendObjectAsyncCached(`servers.${guild.id}.members.${member.id}.voiceSelfMute`, {
            type: 'state',
            common: {
              name: i18n.getStringOrTranslated('Voice self mute'),
              role: 'indicator',
              type: 'boolean',
              read: true,
              write: false,
              def: false,
            },
            native: {},
          }),
          this.extendObjectAsyncCached(`servers.${guild.id}.members.${member.id}.voiceServerMute`, {
            type: 'state',
            common: {
              name: i18n.getStringOrTranslated('Voice server mute'),
              role: 'switch',
              type: 'boolean',
              read: true,
              write: true,
              def: false,
            },
            native: {},
          }),

          this.extendObjectAsyncCached(`servers.${guild.id}.members.${member.id}.json`, {
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
        ]);


        const memberRoles = member.roles.cache.map((role) => role.name);
        await Promise.all([
          this.setStateAsync(`servers.${guild.id}.members.${member.id}.tag`, member.user.tag, true),
          this.setStateAsync(`servers.${guild.id}.members.${member.id}.displayName`, member.displayName, true),
          this.setStateAsync(`servers.${guild.id}.members.${member.id}.roles`, memberRoles.join(', '), true),
          this.setStateAsync(`servers.${guild.id}.members.${member.id}.joinedAt`, member.joinedTimestamp, true),
          this.setStateAsync(`servers.${guild.id}.members.${member.id}.voiceChannel`, member.voice.channel?.name || '', true),
          this.setStateAsync(`servers.${guild.id}.members.${member.id}.voiceSelfDeaf`, !!member.voice.selfDeaf, true),
          this.setStateAsync(`servers.${guild.id}.members.${member.id}.voiceServerDeaf`, !!member.voice.serverDeaf, true),
          this.setStateAsync(`servers.${guild.id}.members.${member.id}.voiceSelfMute`, !!member.voice.selfMute, true),
          this.setStateAsync(`servers.${guild.id}.members.${member.id}.voiceServerMute`, !!member.voice.serverMute, true),
        ]);

        const json: JsonServersMembersObj = {
          tag: member.user.tag,
          id: member.id,
          displayName: member.displayName,
          roles: memberRoles,
          joined: member.joinedTimestamp,
          voiceChannel: member.voice.channel?.name || '',
          voiceChannelId: member.voice.channel?.id || '',
          voiceSelfDeaf: !!member.voice.selfDeaf,
          voiceServerDeaf: !!member.voice.serverDeaf,
          voiceSelfMute: !!member.voice.selfMute,
          voiceServerMute: !!member.voice.serverMute,
        };
        if (!isDeepStrictEqual(json, this.jsonStateCache.get(`${this.namespace}.servers.${guild.id}.members.${member.id}.json`))) {
          await this.setStateAsync(`servers.${guild.id}.members.${member.id}.json`, JSON.stringify(json), true);
          this.jsonStateCache.set(`${this.namespace}.servers.${guild.id}.members.${member.id}.json`, json);
        }

      }

      // guild channels
      if (this.unloaded) return;
      const channels = await guild.channels.fetch();
      if (this.unloaded) return;

      // loop over all channels twice to setup the parent channel objects first and afterwards the child channel objects
      for (const parents of [true, false]) {
        for (const [, channel] of channels) {
          if ((parents && channel.parentId) || (!parents && !channel.parentId)) {
            continue;
          }
          const channelIdPrefix = parents ? `servers.${guild.id}.channels.${channel.id}` : `servers.${guild.id}.channels.${channel.parentId}.channels.${channel.id}`;

          knownServersAndChannelsIds.add(`${this.namespace}.${channelIdPrefix}`);

          let icon: string | undefined = undefined;
          if (channel.isText()) {
            icon = 'channel-text.svg';
          }
          if (channel.isVoice()) {
            icon = 'channel-voice.svg';
          }
          await this.extendObjectAsyncCached(channelIdPrefix, {
            type: 'channel',
            common: {
              name: channel.parent ? `${channel.parent.name} / ${channel.name}` : channel.name,
              icon,
            },
            native: {
              channelId: channel.id,
            },
          });
          if (channel.type === 'GUILD_CATEGORY') {
            await this.extendObjectAsyncCached(`${channelIdPrefix}.channels`, {
              type: 'channel',
              common: {
                name: i18n.getStringOrTranslated('Channels'),
              },
              native: {},
            });
          }

          await Promise.all([
            this.extendObjectAsyncCached(`${channelIdPrefix}.json`, {
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
            this.extendObjectAsyncCached(`${channelIdPrefix}.memberCount`, {
              type: 'state',
              common: {
                name: i18n.getStringOrTranslated('Member count'),
                role: 'value',
                type: 'number',
                read: true,
                write: false,
                def: 0,
              },
              native: {},
            }),
            this.extendObjectAsyncCached(`${channelIdPrefix}.members`, {
              type: 'state',
              common: {
                name: i18n.getStringOrTranslated('Members'),
                role: 'text',
                type: 'string',
                read: true,
                write: false,
                def: '',
              },
              native: {},
            }),
          ]);

          if (channel.isText()) {
            await Promise.all([
              this.extendObjectAsyncCached(`${channelIdPrefix}.message`, {
                type: 'state',
                common: {
                  name: i18n.getStringOrTranslated('Last message'),
                  role: 'text',
                  type: 'string',
                  read: true,
                  write: false,
                  def: '',
                },
                native: {},
              }),
              this.extendObjectAsyncCached(`${channelIdPrefix}.messageId`, {
                type: 'state',
                common: {
                  name: i18n.getStringOrTranslated('Last message ID'),
                  role: 'text',
                  type: 'string',
                  read: true,
                  write: false,
                  def: '',
                },
                native: {},
              }),
              this.extendObjectAsyncCached(`${channelIdPrefix}.messageAuthor`, {
                type: 'state',
                common: {
                  name: i18n.getStringOrTranslated('Last message author'),
                  role: 'text',
                  type: 'string',
                  read: true,
                  write: false,
                  def: '',
                },
                native: {},
              }),
              this.extendObjectAsyncCached(`${channelIdPrefix}.messageTimestamp`, {
                type: 'state',
                common: {
                  name: i18n.getStringOrTranslated('Last message timestamp'),
                  role: 'date',
                  type: 'number',
                  read: true,
                  write: false,
                  def: 0,
                },
                native: {},
              }),
              this.extendObjectAsyncCached(`${channelIdPrefix}.messageJson`, {
                type: 'state',
                common: {
                  name: i18n.getStringOrTranslated('Last message JSON data'),
                  role: 'json',
                  type: 'string',
                  read: true,
                  write: false,
                  def: '',
                },
                native: {},
              }),

              this.extendObjectAsyncCached(`${channelIdPrefix}.send`, {
                type: 'state',
                common: {
                  name: i18n.getStringOrTranslated('Send message'),
                  role: 'text',
                  type: 'string',
                  read: false,
                  write: true,
                  def: '',
                },
                native: {},
              }),
              this.extendObjectAsyncCached(`${channelIdPrefix}.sendFile`, {
                type: 'state',
                common: {
                  name: i18n.getStringOrTranslated('Send file'),
                  role: 'text',
                  type: 'string',
                  read: false,
                  write: true,
                  def: '',
                },
                native: {},
              }),
              this.extendObjectAsyncCached(`${channelIdPrefix}.sendReply`, {
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
              this.extendObjectAsyncCached(`${channelIdPrefix}.sendReaction`, {
                type: 'state',
                common: {
                  name: i18n.getStringOrTranslated('Send reaction'),
                  role: 'text',
                  type: 'string',
                  read: false,
                  write: true,
                  def: '',
                },
                native: {},
              }),
            ]);

            this.messageReceiveStates.add(`${this.namespace}.${channelIdPrefix}.message`);
          }

          const members = [...channel.members.values()];
          const json: JsonServersChannelsObj = {
            id: channel.id,
            name: channel.name,
            type: channel.type,
            memberCount: members.length,
            members: members.map((m) => ({
              id: m.user.id,
              tag: m.user.tag,
              displayName: m.displayName,
            })),
          };
          const proms: Promise<any>[] = [];
          if (!isDeepStrictEqual(json, this.jsonStateCache.get(`${this.namespace}.${channelIdPrefix}.json`))) {
            proms.push(this.setStateAsync(`${channelIdPrefix}.json`, JSON.stringify(json), true));
            this.jsonStateCache.set(`${this.namespace}.${channelIdPrefix}.json`, json);
          }
          await Promise.all([
            this.setStateAsync(`${channelIdPrefix}.memberCount`, members.length, true),
            this.setStateAsync(`${channelIdPrefix}.members`, members.map((m) => m.displayName).join(', '), true),
            ...proms,
          ]);
        }
      }

      /*
       * Delete objects for unknown server members
       */
      const objListMembers = await this.getObjectListAsync({
        startkey: `${this.namespace}.servers.${guild.id}.members.`,
        endkey: `${this.namespace}.servers.${guild.id}.members.\u9999`,
      });
      const reServersMembers = new RegExp(`^${this.name}\\.${this.instance}\\.servers\\.${guild.id}.members\\.(\\d+)$`);
      for (const item of objListMembers.rows) {
        const m = item.id.match(reServersMembers);
        if (m) {
          const memberId = m[1];
          if (!guild.members.cache.has(memberId)) {
            this.log.debug(`Server member ${memberId} of server ${guild.id} is no longer available - deleting objects`);
            this.jsonStateCache.delete(`${this.namespace}.servers.${guild.id}.members.${memberId}.json`);
            await this.delObjectAsyncCached(`servers.${guild.id}.members.${memberId}`, { recursive: true });
          }
        }
      }
    }

    /*
     * Create objects/states for all known users.
     */
    for (const [, {user, presence}] of allServersUsers) {
      this.log.debug(`Known user: ${user.tag} id:${user.id}`);

      await this.extendObjectAsyncCached(`users.${user.id}`, {
        type: 'channel',
        common: {
          name: user.tag,
        },
        native: {
          userId: user.id,
        },
      });

      await Promise.all([
        this.extendObjectAsyncCached(`users.${user.id}.json`, {
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

        this.extendObjectAsyncCached(`users.${user.id}.tag`, {
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

        this.extendObjectAsyncCached(`users.${user.id}.message`, {
          type: 'state',
          common: {
            name: i18n.getStringOrTranslated('Last message'),
            role: 'text',
            type: 'string',
            read: true,
            write: false,
            def: '',
          },
          native: {},
        }),
        this.extendObjectAsyncCached(`users.${user.id}.messageId`, {
          type: 'state',
          common: {
            name: i18n.getStringOrTranslated('Last message ID'),
            role: 'text',
            type: 'string',
            read: true,
            write: false,
            def: '',
          },
          native: {},
        }),
        this.extendObjectAsyncCached(`users.${user.id}.messageTimestamp`, {
          type: 'state',
          common: {
            name: i18n.getStringOrTranslated('Last message timestamp'),
            role: 'date',
            type: 'number',
            read: true,
            write: false,
            def: 0,
          },
          native: {},
        }),
        this.extendObjectAsyncCached(`users.${user.id}.messageJson`, {
          type: 'state',
          common: {
            name: i18n.getStringOrTranslated('Last message JSON data'),
            role: 'json',
            type: 'string',
            read: true,
            write: false,
            def: '',
          },
          native: {},
        }),

        this.extendObjectAsyncCached(`users.${user.id}.send`, {
          type: 'state',
          common: {
            name: i18n.getStringOrTranslated('Send message'),
            role: 'text',
            type: 'string',
            read: false,
            write: true,
            def: '',
          },
          native: {},
        }),
        this.extendObjectAsyncCached(`users.${user.id}.sendFile`, {
          type: 'state',
          common: {
            name: i18n.getStringOrTranslated('Send file'),
            role: 'text',
            type: 'string',
            read: false,
            write: true,
            def: '',
          },
          native: {},
        }),
        this.extendObjectAsyncCached(`users.${user.id}.sendReply`, {
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
        this.extendObjectAsyncCached(`users.${user.id}.sendReaction`, {
          type: 'state',
          common: {
            name: i18n.getStringOrTranslated('Send reaction'),
            role: 'text',
            type: 'string',
            read: false,
            write: true,
            def: '',
          },
          native: {},
        }),

        this.extendObjectAsyncCached(`users.${user.id}.avatarUrl`, {
          type: 'state',
          common: {
            name: i18n.getStringOrTranslated('Avatar'),
            role: 'media.link',
            type: 'string',
            read: true,
            write: false,
            def: '',
          },
          native: {},
        }),

        this.extendObjectAsyncCached(`users.${user.id}.bot`, {
          type: 'state',
          common: {
            name: i18n.getStringOrTranslated('Bot'),
            role: 'indicator',
            type: 'boolean',
            read: true,
            write: false,
            def: false,
          },
          native: {},
        }),

        this.extendObjectAsyncCached(`users.${user.id}.status`, {
          type: 'state',
          common: {
            name: i18n.getStringOrTranslated('Status'),
            role: 'text',
            type: 'string',
            read: true,
            write: false,
            def: '',
          },
          native: {},
        }),
        this.extendObjectAsyncCached(`users.${user.id}.activityType`, {
          type: 'state',
          common: {
            name: i18n.getStringOrTranslated('Activity type'),
            role: 'text',
            type: 'string',
            read: true,
            write: false,
            def: '',
          },
          native: {},
        }),
        this.extendObjectAsyncCached(`users.${user.id}.activityName`, {
          type: 'state',
          common: {
            name: i18n.getStringOrTranslated('Activity name'),
            role: 'text',
            type: 'string',
            read: true,
            write: false,
            def: '',
          },
          native: {},
        }),
      ]);

      this.messageReceiveStates.add(`${this.namespace}.users.${user.id}.message`);

      this.knownUsers.add(user.id);

      const ps = await this.updateUserPresence(user.id, presence, true);

      const proms: Promise<any>[] = [];
      const json: JsonUsersObj = {
        id: user.id,
        tag: user.tag,
        activityName: ps.activityName,
        activityType: ps.activityType,
        avatarUrl: user.displayAvatarURL(),
        bot: user.bot,
        status: ps.status,
      };
      if (!isDeepStrictEqual(json, this.jsonStateCache.get(`${this.namespace}.users.${user.id}.json`))) {
        proms.push(this.setStateAsync(`users.${user.id}.json`, JSON.stringify(json), true));
        this.jsonStateCache.set(`${this.namespace}.users.${user.id}.json`, json);
      }
      await Promise.all([
        this.setStateAsync(`users.${user.id}.tag`, user.tag, true),
        this.setStateAsync(`users.${user.id}.avatarUrl`, json.avatarUrl, true),
        this.setStateAsync(`users.${user.id}.bot`, user.bot, true),
        ...proms,
        this.updateUserPresence(user.id, presence),
      ]);

    }

    /*
     * Delete objects for unknown Channels/Servers
     */
    const objListServers = await this.getObjectListAsync({
      startkey: `${this.namespace}.servers.`,
      endkey: `${this.namespace}.servers.\u9999`,
    });
    const reServersChannels = new RegExp(`^${this.name}\\.${this.instance}\\.servers\\.((\\d+)(\\.channels\\.(\\d+)){0,2})$`);
    for (const item of objListServers.rows) {
      const m = item.id.match(reServersChannels);
      if (m) {
        const idPath = m[1];
        if (!knownServersAndChannelsIds.has(item.id)) {
          this.log.debug(`Server/Channel ${idPath} "${item.value.common.name}" is no longer available - deleting objects`);
          this.messageReceiveStates.delete(`${this.namespace}.servers.${idPath}.message`);
          this.jsonStateCache.delete(`${this.namespace}.servers.${idPath}.json`);
          await this.delObjectAsyncCached(`servers.${idPath}`, { recursive: true });
        }
      }
    }

    /*
     * Delete objects for unknown users
     */
    const objListUsers = await this.getObjectListAsync({
      startkey: `${this.namespace}.users.`,
      endkey: `${this.namespace}.users.\u9999`,
    });
    const reUsers = new RegExp(`^${this.name}\\.${this.instance}\\.users\\.(\\d+)$`);
    for (const item of objListUsers.rows) {
      const m = item.id.match(reUsers);
      if (m) {
        const userId = m[1];
        if (!allServersUsers.has(userId)) {
          this.log.debug(`User ${userId} "${item.value.common.name}" is no longer available - deleting objects`);
          this.knownUsers.delete(userId);
          this.messageReceiveStates.delete(`${this.namespace}.users.${userId}.message`);
          this.jsonStateCache.delete(`${this.namespace}.users.${userId}.json`);
          await this.delObjectAsyncCached(`users.${userId}`, { recursive: true });
        }
      }
    }
  }

  /**
   * Update the presence states of a user.
   * @param userId ID of the user.
   * @param presence The user presence.
   * @param skipJsonStateUpdate If the json state of the user should not be updated.
   */
  private async updateUserPresence (userId: Snowflake, presence: Presence | null, skipJsonStateUpdate: boolean = false): Promise<UpdateUserPresenceResult> {
    if (!this.config.observeUserPresence) {
      return { activityName: '', activityType: '', status: '' };
    }

    if (!this.knownUsers.has(userId)) {
      this.log.debug(`Can't update user presence for unknown user ${userId}`);
      return { activityName: '', activityType: '', status: '' };
    }

    try {
      const p: UpdateUserPresenceResult = {
        status: presence?.status || '',
        activityName: (presence?.activities[0]?.type === 'CUSTOM' ? presence?.activities[0]?.state : presence?.activities[0]?.name) || '',
        activityType: presence?.activities[0]?.type || '',
      };
      const proms: Promise<any>[] = [];
      if (!skipJsonStateUpdate) {
        const json = this.jsonStateCache.get(`${this.namespace}.users.${userId}.json`) as JsonUsersObj | undefined;
        if (json) {
          json.status = p.status;
          json.activityName = p.activityName;
          json.activityType = p.activityType;
          this.jsonStateCache.set(`${this.namespace}.users.${userId}.json`, json);
          proms.push(this.setStateAsync(`users.${userId}.json`, JSON.stringify(json), true));
        }
      }
      await Promise.all([
        this.setStateAsync(`users.${userId}.status`, p.status , true),
        this.setStateAsync(`users.${userId}.activityName`, p.activityName, true),
        this.setStateAsync(`users.${userId}.activityType`, p.activityType, true),
        ...proms,
      ]);
      return p;
    } catch (err) {
      this.log.warn(`Error while updating user presence of user ${userId}: ${err}`);
      return { activityName: '', activityType: '', status: '' };
    }
  }

  /**
   * Set the presence status of the discord bot.
   */
  private async setBotPresence (opts?: SetBotPresenceOptions): Promise<void> {
    if (!this.client?.user) return;

    if (!opts) {
      opts = {};
    }

    if (!opts.status) {
      opts.status = ((await this.getStateAsync('bot.status'))?.val as PresenceStatusData | undefined) || 'online';
    }
    if (!VALID_PRESENCE_STATUS_DATA.includes(opts.status)) {
      opts.status = 'online';
    }

    const presenceData: PresenceData = {
      status: opts.status,
      activities: [],
    };

    if (opts.activityType === undefined) {
      opts.activityType = ((await this.getStateAsync('bot.activityType'))?.val as ValidActivityType | undefined) || '';
    }
    if (!VALID_ACTIVITY_TYPES.includes(opts.activityType)) {
      opts.activityType = '';
    }
    if (opts.activityName === undefined) {
      opts.activityName = ((await this.getStateAsync('bot.activityName'))?.val as string | undefined) || '';
    }
    if (opts.activityType && opts.activityName) {
      presenceData.activities = [{
        type: opts.activityType,
        name: opts.activityName,
      }];
    }

    this.log.debug(`Set bot presence: ${JSON.stringify(presenceData)}`);
    this.client.user.setPresence(presenceData);
  }

  /**
   * Handler for received discord messages.
   * @param message The discord message.
   */
  @boundMethod
  private async onClientMessageCreate (message: Message<boolean>): Promise<void> {
    this.log.debug(`Discord message: mId:${message.id} cId:${message.channelId} uId: ${message.author.id} - ${message.content}`);

    // raw states enabled?
    if (this.config.enableRawStates) {
      // set raw state... not async here since it should not block!
      this.setState('raw.messageJson', JSON.stringify(message.toJSON(), (_key, value) => typeof value === 'bigint' ? value.toString() : value), true);
    }

    if (!this.client?.user?.id) return;

    // don't process interactions here
    if (message.interaction) {
      return;
    }

    const { author, channel, content } = message;

    // don't process own messages
    if (author.id === this.client.user.id) {
      return;
    }

    const authCheckTarget = message.member || author;

    const isAuthorAuthorized = this.checkUserAuthorization(authCheckTarget);

    if (!this.config.processMessagesFromUnauthorizedUsers && !isAuthorAuthorized) {
      this.log.debug(`Ignore message from unauthorized user ${author.tag} (id:${author.id})`);
      return;
    }

    const mentioned = message.mentions.users.has(this.client.user.id);

    if (mentioned && this.config.reactOnMentions && isAuthorAuthorized) {
      try {
        await message.react(this.config.reactOnMentionsEmoji);
      } catch (err) {
        this.log.warn(`Error while adding reaction to message ${message.id}! ${err}`);
      }
    }

    if (!mentioned && channel.type === 'GUILD_TEXT' && !this.config.processAllMessagesInServerChannel) {
      this.log.debug('Server channel message without mention ignored');
      return;
    }

    let msgStateIdPrefix: string;
    if (channel.type === 'GUILD_TEXT') {
      msgStateIdPrefix = channel.parentId ? `${this.namespace}.servers.${message.guildId}.channels.${channel.parentId}.channels.${channel.id}` : `${this.namespace}.servers.${message.guildId}.channels.${channel.id}`;
    } else if (channel.type === 'DM') {
      msgStateIdPrefix = `${this.namespace}.users.${author.id}`;
    } else {
      this.log.warn('Received unexpected message!');
      return;
    }

    // check if a valid object/state for this received message is known by the adapter
    if (!this.messageReceiveStates.has(`${msgStateIdPrefix}.message`)) {
      this.log.debug(`State for received message ${msgStateIdPrefix} is not known for receiving messages`);
      return;
    }

    // prepare json state object
    const json: JsonMessageObj = {
      content,
      attachments: message.attachments.map((att) => ({ attachment: att.attachment.toString(), name: att.name, size: att.size, id: att.id })),
      id: message.id,
      mentions: message.mentions.members?.map((m) => ({ id: m.id, tag: m.user.tag, displayName: m.displayName })) || [],
      mentioned,
      timestamp: message.createdTimestamp,
      authorized: isAuthorAuthorized,
    };
    const proms: Promise<any>[] = [];
    if (message.guildId) {
      json.author = {
        id: author.id,
        tag: author.tag,
        displayName: this.client.guilds.cache.get(message.guildId)?.members.cache.get(author.id)?.displayName || author.username,
      };
      proms.push(this.setStateAsync(`${msgStateIdPrefix}.messageAuthor`, author.tag, true));
    }
    if (!isDeepStrictEqual(json, this.jsonStateCache.get(`${this.namespace}.${msgStateIdPrefix}.messageJson`))) {
      proms.push(this.setStateAsync(`${msgStateIdPrefix}.messageJson`, JSON.stringify(json), true));
      this.jsonStateCache.set(`${this.namespace}.${msgStateIdPrefix}.messageJson`, json);
    }
    await Promise.all([
      this.setStateAsync(`${msgStateIdPrefix}.message`, content, true),
      this.setStateAsync(`${msgStateIdPrefix}.messageId`, message.id, true),
      this.setStateAsync(`${msgStateIdPrefix}.messageTimestamp`, message.createdTimestamp, true),
      ...proms,
    ]);

    // handle text2command if enabled for this receiving state
    if (content && this.config.text2commandInstance && this.text2commandObjects.has(`${msgStateIdPrefix}.message`)) {
      // check user authorization to use text2command
      if (this.checkUserAuthorization(authCheckTarget, { useText2command: true })) {
        // authorization disabled or user is allowed to use text2command
        this.log.debug(`Sending "${content}" to ${this.config.text2commandInstance}`);
        // prepare message payload
        const payload: Text2commandMessagePayload = {
          text: content,
        };
        // use callback style sendTo here to not block message processing here if text2command instance is not running
        this.sendTo(this.config.text2commandInstance, 'send', payload, async (responseObj) => {
          // Response object from text2command is the message payload from the sendTo call with a `response` property set
          const response: string | undefined = (responseObj as unknown as Text2commandMessagePayload | undefined)?.response;
          try {
            if (!response) {
              this.log.debug(`Empty response from ${this.config.text2commandInstance}`);
              return;
            }
            this.log.debug(`Response from ${this.config.text2commandInstance}: ${response}`);
            switch (this.config.text2commandRespondWith) {
              case 'reply':
                await message.reply(response);
                break;
              case 'message':
                await message.channel.send(response);
                break;
              default:
                // no response needed
            }
          } catch (err) {
            this.log.warn(`Error while processing response "${response}" from ${this.config.text2commandInstance}! ${err}`);
          }
        });
      } else {
        // user NOT allowed to text2command
        this.log.debug(`User ${author.tag} (id:${author.id}) NOT allowed to use text2command`);
      }
    }

  }

  /**
   * Handler for user voice state changes.
   */
  @boundMethod
  private async onClientVoiceStateUpdate (oldState: VoiceState, newState: VoiceState): Promise<void> {
    if (!newState.member?.id) {
      return;
    }

    if (!this.knownUsers.has(newState.member.id)) {
      this.log.debug(`Can't update user voice state for unknown user ${newState.member.id}`);
      return;
    }

    const proms: Promise<any>[] = [];
    const json: JsonServersMembersObj = {
      ...this.jsonStateCache.get(`${this.namespace}.servers.${newState.guild.id}.members.${newState.member.id}.json`) as JsonServersMembersObj,
    };

    let update: boolean = false;

    if (oldState.channelId !== newState.channelId) {
      proms.push(this.setStateAsync(`servers.${newState.guild.id}.members.${newState.member.id}.voiceChannel`, newState.channel?.name || '', true));
      json.voiceChannel = newState.channel?.name || '';
      update = true;
    }
    if (oldState.serverDeaf !== newState.serverDeaf) {
      proms.push(this.setStateAsync(`servers.${newState.guild.id}.members.${newState.member.id}.voiceServerDeaf`, !!newState.serverDeaf, true));
      json.voiceSelfDeaf = !!newState.selfDeaf;
      update = true;
    }
    if (oldState.selfDeaf !== newState.selfDeaf) {
      proms.push(this.setStateAsync(`servers.${newState.guild.id}.members.${newState.member.id}.voiceSelfDeaf`, !!newState.selfDeaf, true));
      json.voiceServerDeaf = !!newState.serverDeaf;
      update = true;
    }
    if (oldState.serverMute !== newState.serverMute) {
      proms.push(this.setStateAsync(`servers.${newState.guild.id}.members.${newState.member.id}.voiceServerMute`, !!newState.serverMute, true));
      json.voiceSelfMute = !!newState.selfMute;
      update = true;
    }
    if (oldState.selfMute !== newState.selfMute) {
      proms.push(this.setStateAsync(`servers.${newState.guild.id}.members.${newState.member.id}.voiceSelfMute`, !!newState.selfMute, true));
      json.voiceServerMute = !!newState.serverMute;
      update = true;
    }

    // json state update
    if (update) {
      proms.push(this.setStateAsync(`servers.${newState.guild.id}.members.${newState.member.id}.json`, JSON.stringify(json), true));
      this.jsonStateCache.set(`${this.namespace}.servers.${newState.guild.id}.members.${newState.member.id}.json`, json);
    }

    await Promise.all(proms);
  }

  /**
   * Setup for objects custom config related to the adapter instance.
   * E.g. text2command enabled or state availability for commands.
   * @param objId The object ID.
   * @param customCfg The custom config part of the object for this adapter instance.
   */
  private async setupObjCustom (objId: string, customCfg: ioBroker.CustomConfig | null | undefined, objCommon?: ioBroker.StateCommon): Promise<void> {
    // own .message objects - enableText2command
    if (objId.startsWith(`${this.namespace}.`) && objId.endsWith('.message')) {
      if (customCfg?.enabled && customCfg.enableText2command) {
        this.log.debug(`Custom option text2command enabled for ${objId}`);
        this.text2commandObjects.add(objId);
      } else if (this.text2commandObjects.has(objId)) {
        this.log.debug(`Custom option text2command disabled for ${objId}`);
        this.text2commandObjects.delete(objId);
      }
    }

    if (customCfg?.enableCommands) {
      // commands enabled

      // load objCommon if not provided
      if (!objCommon) {
        const obj = await this.getForeignObjectAsync(objId);
        if (obj?.type === 'state') {
          objCommon = obj.common;
        } else {
          this.log.warn(`Object ${objId} has commands enabled but this seams to be an error because it is not a state object!`);
        }
      }

      // try to get the name
      let name = customCfg.commandsName;
      if (!name && objCommon) {
        if (typeof objCommon.name === 'object') {
          name = objCommon.name[i18n.language] || objCommon.name.en;
        } else {
          name = objCommon.name;
        }
      }

      const cfg: CommandObjectConfig = {
        id: objId,
        alias: customCfg.commandsAlias || objId,
        name: name || objId,
        get: !!customCfg.commandsAllowGet,
        set: !!customCfg.commandsAllowSet,
      };

      // do some checks
      let cfgOk: boolean = true;
      if (cfg.name.length > 100) {
        this.log.warn(`Command name for ${objId} exceeds the limit of 100 chars! This object will be ignored.`);
        cfgOk = false;
      }
      if (!cfg.alias.match(/^[0-9a-zA-Z._-]{0,100}$/)) {
        this.log.warn(`Command alias for ${objId} includes invalid chars or exceeds the limit of 100 chars! This object will be ignored.`);
        cfgOk = false;
      }

      // setup command
      this.discordSlashCommands.setupCommandObject(objId, cfgOk ? cfg : null);

    } else {
      // commands not enabled
      this.discordSlashCommands.setupCommandObject(objId, null);
    }
  }

  /**
   * Is called if a subscribed object changes.
   */
  @boundMethod
  private onObjectChange (objId: string, obj: ioBroker.Object | null | undefined): void {
    if (obj) {
      // The object was changed
      if (obj.type === 'state') {
        this.log.silly(`Object ${objId} changed: ${JSON.stringify(obj)}`);
        this.setupObjCustom(objId, obj.common?.custom?.[this.namespace], obj.common);
      }
    } else {
      // The object was deleted
      this.log.silly(`Object ${objId} deleted`);
      this.setupObjCustom(objId, null);
    }
  }

  /**
   * Is called if a subscribed state changes
   */
  @boundMethod
  private async onStateChange(stateId: string, state: ioBroker.State | null | undefined): Promise<void> {
    this.log.silly(`State changed: ${stateId} ${state?.val} (ack=${state?.ack})`);

    if (!state || state.ack) return;

    let setAck = false;

    /*
     * Own states
     */
    if (stateId.startsWith(`${this.namespace}.`)) {

      switch (stateId) {
        case `${this.namespace}.bot.status`:
          await this.setBotPresence({ status: state.val as PresenceStatusData });
          setAck = true;
          break;
        case `${this.namespace}.bot.activityType`:
          await this.setBotPresence({ activityType: state.val as ValidActivityType });
          setAck = true;
          break;
        case `${this.namespace}.bot.activityName`:
          await this.setBotPresence({ activityName: state.val as string });
          setAck = true;
          break;

        default: // other own states
          // custom slash command reply
          if (stateId.match(/^discord\.\d+\.slashCommands\..*\.sendReply/)) {
            setAck = await this.onCustomCommandSendReplyStateChange(stateId, state);

          // .send / .sendFile / .sendReply
          } else if (stateId.endsWith('.send') || stateId.endsWith('.sendFile') || stateId.endsWith('.sendReply') || stateId.endsWith('.sendReaction')) {
            setAck = await this.onSendStateChange(stateId, state);

          // voice disconnect, mute/unmute, deafen/undeafen
          } else if (stateId.endsWith('.voiceDisconnect') || stateId.endsWith('.voiceServerMute') || stateId.endsWith('.voiceServerDeaf')) {
            setAck = await this.onVoiceStateChange(stateId, state);

          }
      }

    }

    if (setAck) {
      await this.setStateAsync(stateId, {
        ...state,
        ack: true,
      });
    }

  }

  /**
   * Handler for changes on own .send or .sendFile states.
   * Sends the given text, json or file to the corresponding discord channel.
   * @returns `true` if the message is send.
   */
  private async onSendStateChange (stateId: string, state: ioBroker.State): Promise<boolean> {

    if (!this.client?.isReady()) {
      this.log.warn(`State ${stateId} changed but client is not ready!`);
      return false;
    }

    if (typeof state.val !== 'string') {
      this.log.warn(`State ${stateId} changed but value if not a string!`);
      return false;
    }

    if (state.val.length === 0) {
      this.log.debug(`State ${stateId} changed but value is empty`);
      return false;
    }

    let action: string;
    let target: NonThreadGuildBasedChannel | User;
    let targetName: string = '';
    let targetStateIdBase: string;

    // channel or user?
    let m = stateId.match(/^(discord\.\d+\.servers\.(\d+)\.channels\.(\d+)(\.channels\.(\d+))?)\.(send|sendFile|sendReaction|sendReply)$/);
    if (m) {
      const guildId = m[2];
      const channelId = m[5] || m[3];
      targetStateIdBase = m[1];
      action = m[6];

      const channel = this.client.guilds.cache.get(guildId)?.channels.cache.get(channelId);
      if (!channel?.isText() || channel.isThread()) {
        this.log.warn(`State ${stateId} changed but target is not a valid text channel!`);
        return false;
      }

      target = channel;
      targetName = channel.parent ? `${channel.guild.name}/${channel.parent.name}/${channel.name}` : `${channel.guild.name}/${channel.name}`;

    } else {
      m = stateId.match(/^(discord\.\d+\.users\.(\d+))\.(send|sendFile|sendReaction|sendReply)$/);
      if (!m) {
        this.log.warn(`State ${stateId} changed but could not determine target to send message to!`);
        return false;
      }
      const userId = m[2];
      targetStateIdBase = m[1];
      action = m[3];

      const user = this.client.users.cache.get(userId);
      if (!user) {
        this.log.warn(`State ${stateId} changed but target is not a valid user!`);
        return false;
      }

      target = user;
      targetName = user.tag;
    }

    let mo: MessageOptions;

    /*
     * Special case .sendFile state
     */
    if (action === 'sendFile') {
      const idx = state.val.indexOf('|');
      let file: string;
      let content: string | undefined = undefined;
      if (idx > 0) {
        file = state.val.slice(0, idx);
        content = state.val.slice(idx + 1);
      } else {
        file = state.val;
      }

      // check for base64 encoded data
      const b64data = getBufferAndNameFromBase64String(file);
      if (b64data) {
        // base64 encoded content
        mo = {
          content,
          files: [{
            attachment: b64data.buffer,
            name: b64data.name,
          }],
        };

      } else {
        // not base64 encoded content
        const name = getBasenameFromFilePathOrUrl(file);

        // remove file:// prefix
        if (file.startsWith('file://')) {
          file = file.slice(7);
        }

        mo = {
          content,
          files: [{
            attachment: file,
            name,
          }],
        };
      }


    /*
      * Special case .sendReply state
      */
    } else if (action === 'sendReply' || action === 'sendReaction') {
      const idx = state.val.indexOf('|');
      let messageReference: string;
      let content: string;
      if (idx > 0) {
        messageReference = state.val.slice(0, idx);
        content = state.val.slice(idx + 1);
      } else {
        // use id from last received message
        this.log.debug(`Get reply message reference from last received message for ${targetStateIdBase}`);
        messageReference = (await this.getForeignStateAsync(`${targetStateIdBase}.messageId`))?.val as string;
        content = state.val;
      }

      if (action === 'sendReply') {
        // reply
        if (!messageReference || !content) {
          this.log.warn(`No message reference or no content for reply for ${stateId}!`);
          return false;
        }

        try {
          mo = this.parseStringifiedMessageOptions(state.val);
        } catch (err) {
          this.log.debug(`State ${stateId} value is invalid: ${err}`);
          return false;
        }

        // add the message reference if it is not already set
        if (!mo.reply) {
          mo.reply = {
            messageReference,
          };
        } else if (!mo.reply.messageReference) {
          mo.reply.messageReference = messageReference;
        }

      } else {
        // reaction
        if (!messageReference || !content) {
          this.log.warn(`No message reference or no/invalid content for reaction for ${stateId}!`);
          return false;
        }

        const channel = target instanceof User ? target.dmChannel || await target.createDM() : target;
        if (!channel || !channel.isText()) {
          this.log.warn(`Could not determine target channel for reaction ${stateId}!`);
          return false;
        }

        // get the message from cache or try to fetch the message
        const message: Message<boolean> | undefined = channel.messages.cache.get(messageReference) || await channel.messages.fetch(messageReference);
        if (!message) {
          this.log.warn(`Could not determine target message for reaction ${stateId}!`);
          return false;
        }

        try {
          await message.react(content);
          return true;
        } catch (err) {
          this.log.warn(`Message reaction ${stateId} failed: ${err}`);
          return false;
        }
      }


    /*
     * `state.val` may be JSON for .send states
     * Try to parse the JSON as MessageOptions object to allow sending of files, embeds, ...
     */
    } else {
      try {
        mo = this.parseStringifiedMessageOptions(state.val);
      } catch (err) {
        this.log.debug(`State ${stateId} value is invalid: ${err}`);
        return false;
      }
    }

    this.log.debug(`Send to ${targetName}: ${JSON.stringify(mo)}`);
    try {
      const msg = await target.send(mo);
      this.log.debug(`Sent with message ID ${msg.id}`);
      return true;
    } catch (err) {
      this.log.warn(`Error sending value of ${stateId} to ${targetName}: ${err}`);
      return false;
    }
  }

  /**
   * Handler for changes on own custom commands .sendReply states.
   * Sends the given text, json or file to the corresponding discord channel.
   * @returns `true` if the reply is send.
   */
  private async onCustomCommandSendReplyStateChange (stateId: string, state: ioBroker.State): Promise<boolean> {

    if (!this.client?.isReady()) {
      this.log.warn(`State ${stateId} changed but client is not ready!`);
      return false;
    }

    if (typeof state.val !== 'string') {
      this.log.warn(`State ${stateId} changed but value if not a string!`);
      return false;
    }

    if (state.val.length === 0) {
      this.log.debug(`State ${stateId} changed but value is empty`);
      return false;
    }

    const targetStateIdBase = stateId.replace(/\.\w+$/, '');

    const idx = state.val.indexOf('|');
    let interactionId: Snowflake;
    let content: string;
    if (idx > 0) {
      interactionId = state.val.slice(0, idx);
      content = state.val.slice(idx + 1);
    } else {
      // use id from last received command
      this.log.debug(`Get reply interaction reference from last received interaction for ${targetStateIdBase}`);
      interactionId = (await this.getForeignStateAsync(`${targetStateIdBase}.interactionId`))?.val as string;
      content = state.val;
    }

    if (!interactionId || !content) {
      this.log.warn(`No interaction reference or no content for reply for ${stateId}!`);
      return false;
    }

    try {
      await this.discordSlashCommands.sendCmdCustomReply(interactionId, content);
      return true;
    } catch (err) {
      this.log.warn(`Error while replying to interaction ${interactionId} of custom slash command! ${err}`);
      return false;
    }
  }

  /**
   * Handler for changes of own .voiceDisconnect, .voiceServerMute or .voiceServerDeaf states.
   * @returns `true` if successfull.
   */
  private async onVoiceStateChange (stateId: string, state: ioBroker.State): Promise<boolean> {
    const m = stateId.match(/^discord\.\d+\.servers\.(\d+)\.members\.(\d+)\.voice(Disconnect|ServerMute|ServerDeaf)$/);
    if (!m) {
      this.log.debug(`Voice state ${stateId} changed but could not get serverID and memberID!`);
      return false;
    }
    const [, guildId, memberId, action] = m;

    const guild = this.client?.guilds.cache.get(guildId);
    const member = guild?.members.cache.get(memberId);
    if (!guild || !member) {
      this.log.warn(`Voice state ${stateId} changed but could not get the server member!`);
      return false;
    }

    try {
      switch (action) {
        case 'Disconnect':
          if (!state.val) {
            return false;
          }
          await member.voice.disconnect();
          this.log.debug(`Voice member ${member.user.tag} of server ${guild.name} disconnected.`);
          break;

        case 'ServerDeaf':
          await member.voice.setDeaf(!!state.val);
          this.log.debug(`Voice server deafen of member ${member.user.tag} of server ${guild.name} set to ${!!state.val}.`);
          break;

        case 'ServerMute':
          await member.voice.setMute(!!state.val);
          this.log.debug(`Voice server mute of member ${member.user.tag} of server ${guild.name} set to ${!!state.val}.`);
          break;

        default:
          // should never happen...
          return false;
      }
      return true;
    } catch (err) {
      this.log.warn(`Voice server action of member ${member.user.tag} of server ${guild.name} can't be done! ${err}`);
      return false;
    }
  }

  /**
   * Handle messages send to the adapter.
   */
  @boundMethod
  private async onMessage (obj: ioBroker.Message): Promise<void> {
    if (typeof obj !== 'object') return;
    this.log.debug(`Got message: ${JSON.stringify(obj)}`);

    // channel and msg are needed in some switch cases...
    let channel: GuildBasedChannel | undefined;
    let msg: Message<boolean>;
    let user: User | undefined;

    switch (obj.command) {
      case 'getText2commandInstances':
        if (!obj.callback) {
          this.log.warn(`Message '${obj.command}' called without callback!`);
          return;
        }
        const view = await this.getObjectViewAsync('system', 'instance', {
          startkey: 'system.adapter.text2command.',
          endkey: 'system.adapter.text2command.\u9999',
        });
        const text2commandInstances = view.rows.map((r) => {
          const id = r.id.slice(15);
          return {
            label: id,
            value: id,
          };
        });
        this.log.debug(`Found text2command instances: ${text2commandInstances.map((i) => i.value)}`);
        this.sendTo(obj.from, obj.command, [{value: '', label: '---'}, ...text2commandInstances], obj.callback);
        break;

      case 'getUsers':
        if (!obj.callback) {
          this.log.warn(`Message '${obj.command}' called without callback!`);
          return;
        }

        const users = this.client?.users.cache.map((u) => ({ label: u.tag, value: u.id })) || [];
        this.log.debug(`Users: ${users.map((i) => i.value)}`);
        this.sendTo(obj.from, obj.command, users, obj.callback);
        break;

      case 'getServers':
        if (!obj.callback) {
          this.log.warn(`Message '${obj.command}' called without callback!`);
          return;
        }

        const servers = this.client?.guilds.cache.map((g) => ({ label: g.name, value: g.id })) || [];
        this.log.debug(`Servers: ${servers.map((i) => i.value)}`);
        this.sendTo(obj.from, obj.command, servers, obj.callback);
        break;

      case 'getServerRoles':
        if (!obj.callback) {
          this.log.warn(`Message '${obj.command}' called without callback!`);
          return;
        }

        if (!this.client) {
          this.sendTo(obj.from, obj.command, [], obj.callback);
          return;
        }

        const guildRolesWithLabel = [];
        for (const [, guild] of this.client.guilds.cache) {
          for (const [, role] of guild.roles.cache) {
            guildRolesWithLabel.push({
              label: `${guild.name} - ${role.name}`,
              value: `${guild.id}|${role.id}`,
            });
          }
        }

        this.log.debug(`Server roles: ${guildRolesWithLabel.map((i) => i.value)}`);
        this.sendTo(obj.from, obj.command, guildRolesWithLabel, obj.callback);

        break;

      case 'getAddToServerLink':
        if (!obj.callback) {
          this.log.warn(`Message '${obj.command}' called without callback!`);
          return;
        }
        if (this.client?.user?.id) {
          const perms = new Permissions([
            Permissions.FLAGS.CHANGE_NICKNAME,
            Permissions.FLAGS.VIEW_CHANNEL,
            Permissions.FLAGS.MODERATE_MEMBERS,
            Permissions.FLAGS.SEND_MESSAGES,
            Permissions.FLAGS.EMBED_LINKS,
            Permissions.FLAGS.ATTACH_FILES,
            Permissions.FLAGS.READ_MESSAGE_HISTORY,
            Permissions.FLAGS.MENTION_EVERYONE,
            Permissions.FLAGS.ADD_REACTIONS,
            Permissions.FLAGS.MUTE_MEMBERS,
            Permissions.FLAGS.DEAFEN_MEMBERS,
            Permissions.FLAGS.MOVE_MEMBERS,
          ]);
          this.sendTo(obj.from, obj.command, `https://discord.com/api/oauth2/authorize?client_id=${this.client.user.id}&permissions=${perms.bitfield}&scope=bot%20applications.commands`, obj.callback);
        } else {
          this.sendTo(obj.from, obj.command, `- ${i18n.getString('Error: The Bot is not connected to Discord!')} -`, obj.callback);
        }
        break;

      case 'logConfiguredCommandObjects':
        this.discordSlashCommands.logConfiguredCommandObjects();
        this.sendToIfCb(obj.from, obj.command, { result: 'ok' }, obj.callback);
        break;

      case 'send':
      case 'sendMessage':
        /*
         * send a message
         */
        if (typeof obj.message !== 'object') {
          this.sendToIfCb(obj.from, obj.command, { error: 'sendTo message needs to be an object' }, obj.callback);
          return;
        }

        const sendPayload = obj.message as SendToActionSendPayload;

        // check payload
        if (!sendPayload.content || (typeof sendPayload.content !== 'string' && typeof sendPayload.content !== 'object')) {
          this.sendToIfCb(obj.from, obj.command, { error: 'content needs to be a string or a MessageOptions object', ...sendPayload }, obj.callback);
          return;
        }

        if (sendPayload.userId || sendPayload.userTag) {
          // send to a user
          if (sendPayload.userId) {
            // by userId
            user = this.client?.users.cache.get(sendPayload.userId);
            if (!user) {
              this.sendToIfCb(obj.from, obj.command, { error: `No user with userId ${sendPayload.userId} found`, ...sendPayload }, obj.callback);
              return;
            }
          } else {
            // by userTag
            user = this.client?.users.cache.find((u) => u.tag === sendPayload.userTag);
            if (!user) {
              this.sendToIfCb(obj.from, obj.command, { error: `No user with userTag ${sendPayload.userTag} found`, ...sendPayload }, obj.callback);
              return;
            }
          }
          try {
            msg = await user.send(sendPayload.content);
            this.sendToIfCb(obj.from, obj.command, { result: `Message sent to user ${user.tag}`, ...sendPayload, messageId: msg.id }, obj.callback);
          } catch (err) {
            this.sendToIfCb(obj.from, obj.command, { error: `Error sending message to user ${user.tag}: ${err}`, ...sendPayload }, obj.callback);
          }

        } else if (sendPayload.serverId && sendPayload.channelId) {
          // send to a channel
          channel = this.client?.guilds.cache.get(sendPayload.serverId)?.channels.cache.get(sendPayload.channelId);
          if (!channel?.isText()) {
            this.sendToIfCb(obj.from, obj.command, { error: `No text channel with channelId ${sendPayload.channelId} on server ${sendPayload.serverId} found`, ...sendPayload }, obj.callback);
            return;
          }
          try {
            msg = await channel.send(sendPayload.content);
            this.sendToIfCb(obj.from, obj.command, { result: `Message sent to channel ${channel.name}`, ...sendPayload, messageId: msg.id }, obj.callback);
          } catch (err) {
            this.sendToIfCb(obj.from, obj.command, { error: `Error sending message to channel ${channel.name}: ${err}`, ...sendPayload }, obj.callback);
          }

        } else {
          // missing arguments
          this.sendToIfCb(obj.from, obj.command, { error: 'userId, userTag or serverId and channelId needs to be set', ...sendPayload }, obj.callback);
        }

        break; // send / sendMessage

      case 'editMessage':
        /*
         * edit a message
         */
        if (typeof obj.message !== 'object') {
          this.sendToIfCb(obj.from, obj.command, { error: 'sendTo message needs to be an object' }, obj.callback);
          return;
        }

        const editMessagePayload = obj.message as SendToActionEditMessagePayload;

        // check payload
        if (!editMessagePayload.content || (typeof editMessagePayload.content !== 'string' && typeof editMessagePayload.content !== 'object')) {
          this.sendToIfCb(obj.from, obj.command, { error: 'content needs to be a string or a MessageOptions object', ...editMessagePayload }, obj.callback);
          return;
        }

        // try to get the message
        try {
          msg = await this.getPreviousMessage(editMessagePayload);
        } catch (err) {
          if (err instanceof Error && err.message) {
            this.sendToIfCb(obj.from, obj.command, { error: err.message, ...editMessagePayload }, obj.callback);
          } else {
            this.sendToIfCb(obj.from, obj.command, { error: err, ...editMessagePayload }, obj.callback);
          }
          return;
        }

        // try to edit the message
        try {
          if (!msg.editable) {
            this.sendToIfCb(obj.from, obj.command, { error: `Message with messageId ${editMessagePayload.messageId} is not editable`, ...editMessagePayload }, obj.callback);
            return;
          }
          await msg.edit(editMessagePayload.content);
          this.sendToIfCb(obj.from, obj.command, { result: `Message edited`, ...editMessagePayload }, obj.callback);
        } catch (err) {
          this.sendToIfCb(obj.from, obj.command, { error: `Error editing message: ${err}`, ...editMessagePayload }, obj.callback);
        }

        break; // editMessage

      case 'deleteMessage':
        /*
         * delete a message
         */
        if (typeof obj.message !== 'object') {
          this.sendToIfCb(obj.from, obj.command, { error: 'sendTo message needs to be an object' }, obj.callback);
          return;
        }

        const deleteMessagePayload = obj.message as MessageIdentifier;

        // try to get the message
        try {
          msg = await this.getPreviousMessage(deleteMessagePayload);
        } catch (err) {
          if (err instanceof Error && err.message) {
            this.sendToIfCb(obj.from, obj.command, { error: err.message, ...deleteMessagePayload }, obj.callback);
          } else {
            this.sendToIfCb(obj.from, obj.command, { error: err, ...deleteMessagePayload }, obj.callback);
          }
          return;
        }

        // try to delete the message
        try {
          if (!msg.deletable) {
            this.sendToIfCb(obj.from, obj.command, { error: `Message with messageId ${deleteMessagePayload.messageId} is not deletable`, ...deleteMessagePayload }, obj.callback);
            return;
          }
          await msg.delete();
          this.sendToIfCb(obj.from, obj.command, { result: `Message deleted`, ...deleteMessagePayload }, obj.callback);
        } catch (err) {
          this.sendToIfCb(obj.from, obj.command, { error: `Error deleting message: ${err}`, ...deleteMessagePayload }, obj.callback);
        }

        break; // deleteMessage

      case 'addReaction':
        /*
         * add a reaction emoji to a message
         */
        if (typeof obj.message !== 'object') {
          this.sendToIfCb(obj.from, obj.command, { error: 'sendTo message needs to be an object' }, obj.callback);
          return;
        }

        const addReactionPayload = obj.message as SendToActionAddReactionPayload;

        // check payload
        if (typeof addReactionPayload.emoji !== 'string') {
          this.sendToIfCb(obj.from, obj.command, { error: 'emoji needs to be a string', ...addReactionPayload }, obj.callback);
          return;
        }

        // try to get the message
        try {
          msg = await this.getPreviousMessage(addReactionPayload);
        } catch (err) {
          if (err instanceof Error && err.message) {
            this.sendToIfCb(obj.from, obj.command, { error: err.message, ...addReactionPayload }, obj.callback);
          } else {
            this.sendToIfCb(obj.from, obj.command, { error: err, ...addReactionPayload }, obj.callback);
          }
          return;
        }

        // try to add the reaction to the message
        try {
          await msg.react(addReactionPayload.emoji);
          this.sendToIfCb(obj.from, obj.command, { result: `Reaction added to message`, ...addReactionPayload }, obj.callback);
        } catch (err) {
          this.sendToIfCb(obj.from, obj.command, { error: `Error adding reaction to message: ${err}`, ...addReactionPayload }, obj.callback);
        }

        break; // addReaction

      case 'awaitMessageReaction':
        /*
         * wait for a message reaction
         */
        if (!obj.callback) {
          this.log.warn(`Message '${obj.command}' called without callback!`);
          return;
        }

        if (typeof obj.message !== 'object') {
          this.sendTo(obj.from, obj.command, { error: 'sendTo message needs to be an object' }, obj.callback);
          return;
        }

        const awaitMessageReactionPayload = obj.message as SendToActionAwaitMessageReactionPayload;

        // check payload
        if (typeof awaitMessageReactionPayload.timeout !== 'number' || awaitMessageReactionPayload.timeout < 100 || awaitMessageReactionPayload.timeout > 60000) {
          this.sendTo(obj.from, obj.command, { error: 'timeout needs to be a number between 100 and 60000', ...awaitMessageReactionPayload }, obj.callback);
          return;
        }
        if (typeof awaitMessageReactionPayload.max !== 'number' || awaitMessageReactionPayload.max < 1) {
          awaitMessageReactionPayload.max = 1;
        }

        // try to get the message
        try {
          msg = await this.getPreviousMessage(awaitMessageReactionPayload);
        } catch (err) {
          if (err instanceof Error && err.message) {
            this.sendTo(obj.from, obj.command, { error: err.message, ...awaitMessageReactionPayload }, obj.callback);
          } else {
            this.sendTo(obj.from, obj.command, { error: err, ...awaitMessageReactionPayload }, obj.callback);
          }
          return;
        }

        // collect reactions
        const reactionCollector = msg.createReactionCollector({
          filter: (_reaction, user) => user.id !== this.client?.user?.id,
          max: awaitMessageReactionPayload.max,
          time: awaitMessageReactionPayload.timeout,
        });
        reactionCollector.on('end', (collected) => {
          const reactions = collected.map((r) => ({ emoji: r.emoji.name, emojiId: r.emoji.id, users: r.users.cache.map((u) => ({ id: u.id, tag: u.tag })) }));
          this.sendTo(obj.from, obj.command, { reactions, ...awaitMessageReactionPayload }, obj.callback);
        });

        break; // awaitMessageReaction

      case 'sendCustomCommandReply':
        /*
         * send a reply to a custom slash command
         */
        if (typeof obj.message !== 'object') {
          this.sendToIfCb(obj.from, obj.command, { error: 'sendTo message needs to be an object' }, obj.callback);
          return;
        }

        const sendCustomCommandReplyPayload = obj.message as SendToActionSendCustomCommandReplyPayload;

        // check payload
        if (typeof sendCustomCommandReplyPayload.interactionId !== 'string') {
          this.sendToIfCb(obj.from, obj.command, { error: 'interactionId needs to be a string', ...sendCustomCommandReplyPayload }, obj.callback);
          return;
        }
        if (!sendCustomCommandReplyPayload.content || (typeof sendCustomCommandReplyPayload.content !== 'string' && typeof sendCustomCommandReplyPayload.content !== 'object')) {
          this.sendToIfCb(obj.from, obj.command, { error: 'content needs to be a string or a MessageOptions object', ...sendCustomCommandReplyPayload }, obj.callback);
          return;
        }

        // send the reply
        try {
          const messageId = await this.discordSlashCommands.sendCmdCustomReply(sendCustomCommandReplyPayload.interactionId, sendCustomCommandReplyPayload.content);
          this.sendToIfCb(obj.from, obj.command, { result: `Reply sent`, ...sendCustomCommandReplyPayload, messageId }, obj.callback);
        } catch (err) {
          this.sendToIfCb(obj.from, obj.command, { error: `Error sending reply: ${err}`, ...sendCustomCommandReplyPayload }, obj.callback);
        }

        break; // sendCustomCommandReply

      case 'leaveServer':
        /*
         * let the bot leave a server
         */
        if (typeof obj.message !== 'object') {
          this.sendToIfCb(obj.from, obj.command, { error: 'sendTo message needs to be an object' }, obj.callback);
          return;
        }

        const leaveServerPayload = obj.message as SendToActionServerIdentifier;

        // check payload
        if (!leaveServerPayload.serverId) {
          this.sendToIfCb(obj.from, obj.command, { error: 'serverId needs to be set', ...leaveServerPayload }, obj.callback);
          return;
        }

        const guildToLeave = this.client?.guilds.cache.get(leaveServerPayload.serverId);
        if (!guildToLeave) {
          this.sendToIfCb(obj.from, obj.command, { error: `No server with ID ${leaveServerPayload.serverId} found` }, obj.callback);
          return;
        }

        try {
          await guildToLeave.leave();
          this.log.info(`Left server ${guildToLeave.name} (${guildToLeave.id})`);

          this.sendToIfCb(obj.from, obj.command, { result: 'ok' }, obj.callback);
        } catch (err) {
          this.sendToIfCb(obj.from, obj.command, { error: `Error leaving server ${leaveServerPayload.serverId}: ${err}`, ...leaveServerPayload }, obj.callback);
        }

        break;

      case 'getServerInfo':
        /*
         * get information about a server
         */
        if (!obj.callback) {
          this.log.warn(`Message '${obj.command}' called without callback!`);
          return;
        }

        if (typeof obj.message !== 'object') {
          this.sendTo(obj.from, obj.command, { error: 'sendTo message needs to be an object' }, obj.callback);
          return;
        }

        const getServerInfoPayload = obj.message as SendToActionServerIdentifier;

        // check payload
        if (!getServerInfoPayload.serverId) {
          this.sendTo(obj.from, obj.command, { error: 'serverId needs to be set', ...getServerInfoPayload }, obj.callback);
          return;
        }

        const server = this.client?.guilds.cache.get(getServerInfoPayload.serverId);
        if (!server) {
          this.sendTo(obj.from, obj.command, { error: `No server with ID ${getServerInfoPayload.serverId} found`, ...getServerInfoPayload }, obj.callback);
          return;
        }

        this.sendTo(obj.from, obj.command, {
          id: server.id,
          name: server.name,
          description: server.description,
          members: server.members.cache.map((m) => ({
            id: m.id,
            tag: m.user.tag,
            displayName: m.displayName,
          })),
          roles: server.roles.cache.map((r) => ({
            id: r.id,
            name: r.name,
            color: r.hexColor,
          })),
          channels: server.channels.cache.map((c) => ({
            id: c.id,
            parentId: c.parentId,
            name: c.name,
            type: c.type,
          })),
        }, obj.callback);

        break; // getServerInfo

      case 'getChannelInfo':
        /*
         * get information about a channel
         */
        if (!obj.callback) {
          this.log.warn(`Message '${obj.command}' called without callback!`);
          return;
        }

        if (typeof obj.message !== 'object') {
          this.sendTo(obj.from, obj.command, { error: 'sendTo message needs to be an object' }, obj.callback);
          return;
        }

        const getChannelInfoPayload = obj.message as SendToActionChannelIdentifier;

        // check payload
        if (!getChannelInfoPayload.serverId || !getChannelInfoPayload.channelId) {
          this.sendTo(obj.from, obj.command, { error: 'serverId and channelId need to be set', ...getChannelInfoPayload }, obj.callback);
          return;
        }

        channel = this.client?.guilds.cache.get(getChannelInfoPayload.serverId)?.channels.cache.get(getChannelInfoPayload.channelId);
        if (!channel) {
          this.sendTo(obj.from, obj.command, { error: `No channel with ID ${getChannelInfoPayload.channelId} for server with ID ${getChannelInfoPayload.serverId} found`, ...getChannelInfoPayload }, obj.callback);
          return;
        }

        this.sendTo(obj.from, obj.command, {
          id: channel.id,
          parentId: channel.parentId,
          name: channel.name,
          type: channel.type,
          members: !channel.isThread() && channel.members.map((m) => ({
            id: m.id,
            tag: m.user.tag,
            displayName: m.displayName,
          })),
        }, obj.callback);

        break; // getChannelInfo

      case 'getServerMemberInfo':
        /*
         * get information about a server member
         */
        if (!obj.callback) {
          this.log.warn(`Message '${obj.command}' called without callback!`);
          return;
        }

        if (typeof obj.message !== 'object') {
          this.sendTo(obj.from, obj.command, { error: 'sendTo message needs to be an object' }, obj.callback);
          return;
        }

        const getServerMemberInfoPayload = obj.message as SendToActionServerMemberIdentifier;

        // check payload
        if (!getServerMemberInfoPayload.serverId || (!getServerMemberInfoPayload.userId && !getServerMemberInfoPayload.userTag)) {
          this.sendTo(obj.from, obj.command, { error: 'serverId and userlId or userTag need to be set', ...getServerMemberInfoPayload }, obj.callback);
          return;
        }

        let member: GuildMember | undefined;
        if (getServerMemberInfoPayload.userId) {
          member = this.client?.guilds.cache.get(getServerMemberInfoPayload.serverId)?.members.cache.get(getServerMemberInfoPayload.userId);
          if (!member) {
            this.sendTo(obj.from, obj.command, { error: `No member with ID ${getServerMemberInfoPayload.userId} for server with ID ${getServerMemberInfoPayload.serverId} found`, ...getServerMemberInfoPayload }, obj.callback);
            return;
          }
        } else {
          member = this.client?.guilds.cache.get(getServerMemberInfoPayload.serverId)?.members.cache.find((m) => m.user.tag === getServerMemberInfoPayload.userTag);
          if (!member) {
            this.sendTo(obj.from, obj.command, { error: `No member with tag ${getServerMemberInfoPayload.userTag} for server with ID ${getServerMemberInfoPayload.serverId} found`, ...getServerMemberInfoPayload }, obj.callback);
            return;
          }
        }

        this.sendTo(obj.from, obj.command, {
          id: member.id,
          tag: member.user.tag,
          displayName: member.displayName,
          displayColor: member.displayHexColor,
          displayAvatarUrl: member.displayAvatarURL(),
          roles: member.roles.cache.map((r) => ({
            id: r.id,
            name: r.name,
            color: r.hexColor,
          })),
          joinedAt: member.joinedTimestamp,
          voiceChannelId: member.voice.channelId,
          voiceMuted: member.voice.mute,
          voiceDeaf: member.voice.deaf,
        }, obj.callback);

        break; // getServerMemberInfo

      case 'getUserInfo':
        /*
         * get information about a user
         */
        if (!obj.callback) {
          this.log.warn(`Message '${obj.command}' called without callback!`);
          return;
        }

        if (typeof obj.message !== 'object') {
          this.sendTo(obj.from, obj.command, { error: 'sendTo message needs to be an object' }, obj.callback);
          return;
        }

        const getUserInfoPayload = obj.message as SendToActionUserIdentifier;

        // check payload
        if (!getUserInfoPayload.userId && !getUserInfoPayload.userTag) {
          this.sendTo(obj.from, obj.command, { error: 'userlId needs to be set', ...getUserInfoPayload }, obj.callback);
          return;
        }

        if (getUserInfoPayload.userId) {
          user = this.client?.users.cache.get(getUserInfoPayload.userId);
          if (!user) {
            this.sendTo(obj.from, obj.command, { error: `No user with ID ${getUserInfoPayload.userId} found`, ...getUserInfoPayload }, obj.callback);
            return;
          }
        } else {
          user = this.client?.users.cache.find((u) => u.tag === getUserInfoPayload.userTag);
          if (!user) {
            this.sendTo(obj.from, obj.command, { error: `No user with tag ${getUserInfoPayload.userTag} found`, ...getUserInfoPayload }, obj.callback);
            return;
          }
        }

        this.sendTo(obj.from, obj.command, {
          id: user.id,
          tag: user.tag,
          avatarUrl: user.avatarURL(),
          bot: user.bot,
          accentColor: user.hexAccentColor,
        }, obj.callback);

        break; // getUserInfo

      case 'getMessageInfo':
        /*
         * get information about a message
         */
        if (!obj.callback) {
          this.log.warn(`Message '${obj.command}' called without callback!`);
          return;
        }

        if (typeof obj.message !== 'object') {
          this.sendTo(obj.from, obj.command, { error: 'sendTo message needs to be an object' }, obj.callback);
          return;
        }

        const getMessageInfoPayload = obj.message as MessageIdentifier;

        try {
          msg = await this.getPreviousMessage(getMessageInfoPayload);
        } catch (err) {
          if (err instanceof Error && err.message) {
            this.sendTo(obj.from, obj.command, { error: err.message, ...getMessageInfoPayload }, obj.callback);
          } else {
            this.sendTo(obj.from, obj.command, { error: err, ...getMessageInfoPayload }, obj.callback);
          }
          return;
        }

        this.sendTo(obj.from, obj.command, {
          id: msg.id,
          author: {
            id: msg.author.id,
            tag: msg.author.tag,
          },
          content: msg.content,
          embeds: msg.embeds.map((e) => e.toJSON()),
          attachments: msg.attachments.map((a) => a.toJSON()),
          reactions: msg.reactions.cache.map((r) => r.toJSON()),
          createdTimestamp: msg.createdTimestamp,
          editedTimestamp: msg.editedTimestamp,
          reference: msg.reference,
        }, obj.callback);

        break; // getMessageInfo

      default:
        /*
         * unknown command
         */
        this.log.warn(`Got message with unknown command: ${obj.command}`);
        if (obj.callback) {
          this.sendTo(obj.from, obj.command, { error: `Unknown command: ${obj.command}` }, obj.callback);
        }

    }
  }

  /**
   * Like `sendTo(...)` but only sends if a callback is given.
   *
   * If no callback given, but `message.error` is defined, the error will be
   * logged as a warning.
   * @see sendTo
   */
  private sendToIfCb (instanceName: string, command: string, message: ioBroker.MessagePayload, callback: ioBroker.MessageCallback | ioBroker.MessageCallbackInfo | undefined): void {
    if (callback) {
      this.sendTo(instanceName, command, message, callback);
    } else if (typeof message === 'object' && message.error) {
      this.log.warn(message.error);
    }
  }

  /**
   * Try to detect and parse stringified JSON MessageOptions.
   *
   * If the `content` starts/ends with curly braces if will be treated as
   * stringified JSON. Then the JSON will be parsed and some basic checks will
   * be run against the parsed object.
   *
   * Otherwise the content will be treated as a simple string and wrapped into
   * a `MessageOptions` object.
   * @param content The stringified content to be parsed.
   * @returns A `MessageOptions` object.
   * @throws An error if parsing JSON or a check failed.
   */
  public parseStringifiedMessageOptions (content: string): MessageOptions {
    let mo: MessageOptions;

    if (content.startsWith('{') && content.endsWith('}')) {
      // seams to be json
      this.log.debug(`Content seams to be json`);

      try {
        mo = JSON.parse(content) as MessageOptions;
      } catch (err) {
        throw new Error(`Content seams to be json but cannot be parsed!`);
      }

      // do some basic checks against the parsed object
      if ((!mo?.files && !mo.content) || (mo.files && !Array.isArray(mo.files)) || (mo.embeds && !Array.isArray(mo.embeds))) {
        throw new Error(`Content is json but seams to be invalid!`);
      }

    } else {
      // just a string... create MessageOptions object
      mo = {
        content,
      };
    }

    return mo;
  }

  /**
   * Find a previous message from/to a user or in a server text channel.
   * @param identifier Parameters to find the message.
   * @throws An error if some parameters are missing or the message could not be found.
   */
  private async getPreviousMessage (identifier: MessageIdentifier): Promise<Message<boolean>> {
    if (!identifier.messageId) {
      throw new Error('messageId needs to be set');
    }

    if (identifier.userId || identifier.userTag) {
      // a user
      let user: User | undefined;
      if (identifier.userId) {
        // by userId
        user = this.client?.users.cache.get(identifier.userId);
        if (!user) {
          throw new Error(`No user with userId ${identifier.userId} found`);
        }
      } else {
        // by userTag
        user = this.client?.users.cache.find((u) => u.tag === identifier.userTag);
        if (!user) {
          throw new Error(`No user with userTag ${identifier.userTag} found`);
        }
      }
      try {
        if (!user.dmChannel) {
          await user.createDM();
        }
        const msg = user.dmChannel?.messages.cache.get(identifier.messageId) || await user.dmChannel?.messages.fetch(identifier.messageId);
        if (!msg) {
          throw new Error(`No message with messageId ${identifier.messageId} for user ${user.tag} found`);
        }
        return msg;
      } catch (err) {
        throw new Error(`Error finding message for user ${user.tag}: ${err}`);
      }

    } else if (identifier.serverId && identifier.channelId) {
      // a channel
      const channel = this.client?.guilds.cache.get(identifier.serverId)?.channels.cache.get(identifier.channelId);
      if (!channel?.isText()) {
        throw new Error(`No text channel with channelId ${identifier.channelId} on server ${identifier.serverId} found`);
      }
      try {
        const msg = channel.messages.cache.get(identifier.messageId) || await channel.messages.fetch(identifier.messageId);
        if (!msg) {
          throw new Error(`No message with messageId ${identifier.messageId} for channel ${channel.name} found`);
        }
        return msg;
      } catch (err) {
        throw new Error(`Error finding message in channel ${channel.name}: ${err}`);
      }

    } else {
      // missing arguments
      throw new Error('userId, userTag or serverId and channelId needs to be set');
    }
  }

  /**
   * Check if a user or guild member is authorized to do something.
   * For guild members their roles will also be checked.
   * @param user The User or GuildMember to check.
   * @param required Object containing the required flags. If not provided the check returns if the user in the list of authorized users.
   * @returns `true` if the user is authorized or authorization is not enabled, `false` otherwise
   */
  public checkUserAuthorization (user: User | GuildMember, required?: CheckAuthorizationOpts): boolean {
    if (!this.config.enableAuthorization) {
      return true;
    }

    // get direct user flags
    let given: ioBroker.AdapterConfigAuthorizedFlags | undefined = this.config.authorizedUsers.find((au) => au.userId === user.id);

    // for guild members find role flags and merge them all together
    if (this.config.authorizedServerRoles.length > 0 && user instanceof GuildMember) {
      for (const [, role] of user.roles.cache) {
        const roleGiven = this.config.authorizedServerRoles.find((ar) => ar.serverAndRoleId === `${user.guild.id}|${role.id}`);
        if (roleGiven) {
          if (!given) {
            given = roleGiven;
          } else {
            given = {
              getStates:  given.getStates || roleGiven.getStates,
              setStates:  given.setStates || roleGiven.setStates,
              useCustomCommands:  given.useCustomCommands || roleGiven.useCustomCommands,
              useText2command:  given.useText2command || roleGiven.useText2command,
            };
          }
        }
      }
    }

    // nothing found?
    if (!given) {
      return false;
    }

    // if no required flags given just return true if something found
    if (!required) {
      return true;
    }

    if ((required.getStates && !given.getStates)
        || (required.setStates && !given.setStates)
        || (required.useCustomCommands && !given.useCustomCommands)
        || (required.useText2command && !given.useText2command)) {
      return false;
    }

    return true;
  }

  /**
   * Awaitable function to just wait some time.
   *
   * Uses `Adapter.setTimeout(...)` internally to make sure the timeout is cleared on adapter unload.
   * @param time Time to wait in ms.
   */
  public wait (time: number): Promise<void> {
    return new Promise((resolve) => this.setTimeout(resolve, time));
  }

  /**
   * Set the `info.connection` state if changed.
   * @param connected If connected.
   * @param force `true` to skip local cache check and always set the state.
   */
  private async setInfoConnectionState (connected: boolean, force: boolean = false): Promise<void> {
    if (force || connected !== this.infoConnected) {
      await this.setStateAsync('info.connection', connected, true);
      this.infoConnected = connected;
    }
  }

  /**
   * Internal replacemend for `extendObjectAsync(...)` which compares the given
   * object for each `id` against a cached version and only calls na original
   * `extendObjectAsync(...)` if the object changed.
   * Using this, the object gets only updated if
   *  a) it's the first call for this `id` or
   *  b) the object needs to be changed.
   */
  public async extendObjectAsyncCached (id: string, objPart: ioBroker.PartialObject, options?: ioBroker.ExtendObjectOptions): ioBroker.SetObjectPromise {
    const cachedObj: ioBroker.PartialObject | undefined = this.extendObjectCache.get(id);

    if (isDeepStrictEqual(cachedObj, objPart)) {
      return { id };
    }

    const ret = await this.extendObjectAsync(id, objPart, options);
    this.extendObjectCache.set(id, objPart);
    return ret;
  }

  /**
   * Internal replacement for `delObjectAsync(...)` which also removes the local
   * cache entry for the given `id`.
   */
  public async delObjectAsyncCached (id: string, options?: ioBroker.DelObjectOptions): Promise<void> {
    if (options?.recursive) {
      this.extendObjectCache.filter((_obj, id2) => id2.startsWith(id)).each((_obj, id2) => this.extendObjectCache.delete(id2));
    } else {
      this.extendObjectCache.delete(id);
    }

    return this.delObjectAsync(id, options);
  }

  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances!
   */
  @boundMethod
  private async onUnload (callback: () => void): Promise<void> {
    try {
      this.unloaded = true;

      await this.setInfoConnectionState(false, true);

      if (this.client) {
        this.client.destroy();
      }

      callback();
    } catch (e) {
      callback();
    }
  }

}

if (require.main !== module) {
  // Export the constructor in compact mode
  module.exports = (options: Partial<AdapterOptions> | undefined) => new DiscordAdapter(options);
} else {
  // otherwise start the instance directly
  (() => new DiscordAdapter())();
}

// export the type of the adapter class to use it in other files
export type { DiscordAdapter };
