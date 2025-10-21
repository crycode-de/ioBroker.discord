import 'source-map-support/register';

import { setTimeout } from 'node:timers/promises';
import { isDeepStrictEqual } from 'node:util';

import { boundMethod } from 'autobind-decorator';

import {
  Adapter,
  AdapterOptions,
  EXIT_CODES,
} from '@iobroker/adapter-core';

import {
  ActivityType,
  APIEmbed,
  ChannelType,
  Client,
  Collection,
  CloseEvent as DjsCloseEvent,
  version as djsVersion,
  DMChannel,
  GatewayIntentBits,
  Guild,
  GuildBasedChannel,
  GuildMember,
  HexColorString,
  Message,
  MessageCreateOptions,
  MessageEditOptions,
  NonThreadGuildBasedChannel,
  Partials,
  PermissionsBitField,
  Presence,
  PresenceData,
  PresenceStatusData,
  resolveColor,
  Snowflake,
  TextChannel,
  User,
  VoiceState,
} from 'discord.js';

import {
  CommandObjectConfig,
  DiscordAdapterSlashCommands,
} from './commands';
import {
  ACTIVITY_TYPES,
  ActivityTypeNames,
  ChannelTypeNames,
  CheckAuthorizationOpts,
  JsonMessageObj,
  JsonServersChannelsObj,
  JsonServersMembersObj,
  JsonUsersObj,
  MessageIdentifier,
  SendToActionAddReactionPayload,
  SendToActionAwaitMessageReactionPayload,
  SendToActionChannelIdentifier,
  SendToActionEditMessagePayload,
  SendToActionSendCustomCommandReplyPayload,
  SendToActionSendPayload,
  SendToActionServerIdentifier,
  SendToActionServerMemberIdentifier,
  SendToActionUserIdentifier,
  SetBotPresenceOptions,
  Text2commandMessagePayload,
  UpdateUserPresenceResult,
  VALID_PRESENCE_STATUS_DATA,
} from './lib/definitions';
import { i18n } from './lib/i18n';
import {
  getBasenameFromFilePathOrUrl,
  getBufferAndNameFromBase64String,
  getObjName,
  userNameOrTag,
} from './lib/utils';
import { getNewestDate, LocalizedNotification } from './lib/notification-manager';

const LOGIN_WAIT_TIMES = [
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
] as const;

/**
 * ioBroker.discord adapter
 */
class DiscordAdapter extends Adapter {

  /**
   * Instance of the discord client.
   */
  public client: Client | null = null;

  /**
   * Flag if the adapter is unloaded or is unloading.
   * Used to check this in some async operations.
   */
  public unloaded: boolean = false;

  /**
   * Flag if the initial setup of the custom object configurations is done or not.
   * While not done, custom object configuration changes will not trigger a
   * slash commands registration automatically.
   */
  public initialCustomObjectSetupDone: boolean = false;

  /**
   * Local cache for `info.connection` state.
   */
  private infoConnected: boolean = false;

  /**
   * Set of state IDs where received discord messages will be stored to.
   * Used to identify target states for received discord messages.
   */
  private messageReceiveStates: Set<string> = new Set<string>();

  /**
   * Set user IDs known to set up.
   * Used to check if the user objects are created on some events.
   */
  private knownUsers: Set<Snowflake> = new Set<Snowflake>();

  /**
   * Set of objects from this instance with text2command enabled.
   */
  private text2commandObjects: Set<string> = new Set<string>();

  /**
   * Cache for `extendObjectCache(...)` calls to extend objects only when changed.
   */
  private extendObjectCache: Collection<string, ioBroker.PartialObject> = new Collection<string, ioBroker.PartialObject>();

  /**
   * Cache for `.json` states.
   */
  private jsonStateCache: Collection<string, JsonServersMembersObj | JsonServersChannelsObj | JsonUsersObj | JsonMessageObj> = new Collection<string, JsonServersMembersObj | JsonServersChannelsObj | JsonUsersObj | JsonMessageObj>();

  /**
   * Instance of the slash commands handler class.
   */
  private discordSlashCommands: DiscordAdapterSlashCommands;

  /**
   * Flag if we are currently in shard error state from discord.js.
   * `false` currently not on error state, A `string` containing the error name in
   * case of en error.
   */
  private isShardError: false | string = false;

  public constructor (options: Partial<AdapterOptions> = {}) {
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
  public parseStringifiedMessageOptions<T extends MessageEditOptions | MessageCreateOptions> (content: string): T {
    let mo: T;

    if (content.startsWith('{') && content.endsWith('}')) {
      // seems to be json
      this.log.debug(`Content seems to be json`);

      try {
        mo = JSON.parse(content) as T;
      } catch (_err) {
        throw new Error(`Content seems to be json but cannot be parsed!`);
      }

      // do some basic checks against the parsed object
      if ((!mo?.files && !mo.content) || (mo.files && !Array.isArray(mo.files)) || (mo.embeds && !Array.isArray(mo.embeds))) {
        throw new Error(`Content is json but seems to be invalid!`);
      }

    } else {
      // just a string... create MessageOptions object
      mo = {
        content,
      } as T;
    }

    return mo;
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
      for (const [ , role ] of user.roles.cache) {
        const roleGiven = this.config.authorizedServerRoles.find((ar) => ar.serverAndRoleId === `${user.guild.id}|${role.id}`);
        if (roleGiven) {
          if (!given) {
            given = roleGiven;
          } else {
            given = {
              getStates: given.getStates || roleGiven.getStates,
              setStates: given.setStates || roleGiven.setStates,
              useCustomCommands: given.useCustomCommands || roleGiven.useCustomCommands,
              useText2command: given.useText2command || roleGiven.useText2command,
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
   * Internal replacemend for `extendObject(...)` which compares the given
   * object for each `id` against a cached version and only calls na original
   * `extendObject(...)` if the object changed.
   * Using this, the object gets only updated if
   *  a) it's the first call for this `id` or
   *  b) the object needs to be changed.
   */
  public async extendObjectCached (id: string, objPart: ioBroker.PartialObject, options?: ioBroker.ExtendObjectOptions): ioBroker.SetObjectPromise {
    const cachedObj: ioBroker.PartialObject | undefined = this.extendObjectCache.get(id);

    if (isDeepStrictEqual(cachedObj, objPart)) {
      return { id };
    }
    let ret: ioBroker.NonNullCallbackReturnTypeOf<ioBroker.SetObjectCallback>;
    if (options) {
      ret = await this.extendObject(id, objPart, options);
    } else {
      ret = await this.extendObject(id, objPart);
    }
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

    return await this.delObjectAsync(id, options);
  }

  /**
   * Is called when databases are connected and adapter received configuration.
   */
  @boundMethod
  private async onReady (): Promise<void> {

    // Reset the connection indicator during startup
    await this.setInfoConnectionState(false, true);

    // log version of discord.js
    this.log.debug(`Version of discord.js: ${djsVersion}`);

    // try to get the system language
    const systemConfig = await this.getForeignObjectAsync('system.config');
    i18n.language = systemConfig?.common.language ?? 'en';
    i18n.isFloatComma = systemConfig?.common.isFloatComma ?? false;

    // validate config
    if (typeof this.config.token !== 'string' || !(/^[0-9a-zA-Z-_]{24,}\.[0-9a-zA-Z-_]{6}\.[0-9a-zA-Z-_]{27,}$/.exec(this.config.token))) {
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

    // setup/fix native objects from older adapter versions
    const botActivityTypeObj = await this.getObjectAsync('bot.activityType');
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    if (botActivityTypeObj?.common?.states?.PLAYING) {
      // TODO: use extendObject with null values when issue https://github.com/ioBroker/ioBroker.js-controller/issues/1735 is resolved
      delete botActivityTypeObj.common.states.PLAYING;
      delete botActivityTypeObj.common.states.STREAMING;
      delete botActivityTypeObj.common.states.LISTENING;
      delete botActivityTypeObj.common.states.WATCHING;
      delete botActivityTypeObj.common.states.COMPETING;
      await this.setObjectAsync('bot.activityType', botActivityTypeObj);
    }
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */

    // setup generic dynamic objects (most objects will be set up in `updateGuilds` method)
    if (this.config.enableRawStates) {
      await this.extendObject('raw', {
        type: 'channel',
        common: {
          name: i18n.getStringOrTranslated('Raw data'),
        },
        native: {},
      });
      await Promise.all([
        this.extendObject('raw.interactionJson', {
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
        this.extendObject('raw.messageJson', {
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
      await this.extendObject('slashCommands', {
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
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
      ],
      partials: [
        Partials.Channel, // needed for DMs
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
      void this.setInfoConnectionState(false);
    });

    this.client.on('shardError', (err: Error, shardId: number) => {
      // discord.js internally handles websocket errors and reconnects
      // this is just for some logging and setting the connection state

      // just handle the error if it's not the already handled error
      let errorMsg: string;
      if (err instanceof AggregateError) {
        // create a list of unique error code entries
        errorMsg = Array.from(new Set(err.errors.map((e: NodeJS.ErrnoException) => e.code))).join(', ');
      } else {
        errorMsg = err.toString();
      }

      if (this.isShardError !== errorMsg) {
        this.isShardError = errorMsg;
        this.log.warn(`Discord client websocket error (shardId:${shardId}): ${errorMsg}`);
        void this.setInfoConnectionState(false);
      } else {
        this.log.debug(`Discord client websocket error (shardId:${shardId}): ${errorMsg}`);
      }
    });

    this.client.on('shardReady', (shardId: number) => {
      // discord.js websocket is ready (connected)
      this.isShardError = false;
      this.log.info(`Discord client websocket connected (shardId:${shardId})`);
      void this.setInfoConnectionState(true);
      void this.setBotPresence();
    });

    this.client.on('shardResume', (shardId: number, replayedEvents: number) => this.log.debug(`Discord client websocket resume (shardId:${shardId} replayedEvents:${replayedEvents})`));
    this.client.on('shardDisconnect', (event: DjsCloseEvent, shardId: number) => this.log.debug(`Discord client websocket disconnect (shardId:${shardId} code:${event.code})`));
    this.client.on('shardReconnecting', (shardId: number) => this.log.debug(`Discord client websocket reconnecting (shardId:${shardId})`));

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
      this.client.on('presenceUpdate', (_oldPresence, newPresence) => this.updateUserPresence(newPresence.userId, newPresence));
    }

    if (this.config.observeUserVoiceState) {
      this.client.on('voiceStateUpdate', this.onClientVoiceStateUpdate);
    }

    // init commands instance - need to be done after discord client setup
    await this.discordSlashCommands.onReady();

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
    this.subscribeStates('slashCommands.*.option-*.choices');
    this.subscribeStates('bot.*');
    this.subscribeForeignObjects('*'); // needed to handle custom object configs

    // initially get all objects with custom config
    this.log.debug('Get all objects with custom config ...');
    const view = await this.getObjectViewAsync('system', 'custom', {});
    if (view?.rows) {
      for (const item of view.rows) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await this.setupObjCustom(item.id, item.value?.[this.namespace]);
      }
    }
    this.log.debug('Getting all objects with custom config done');

    // remember that the initial setup of the custom objects is done
    this.initialCustomObjectSetupDone = true;

    // try to log in the client, terminate if this was not successfull
    const loginResult = await this.loginClient();
    if (loginResult !== true) {
      if (loginResult.includes('TOKEN_INVALID')) {
        this.terminate('Invalid token, please check your configuration!', EXIT_CODES.ADAPTER_REQUESTED_TERMINATION);
      } else {
        this.terminate('No connection to Discord', EXIT_CODES.START_IMMEDIATELY_AFTER_STOP);
      }
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
   * @returns Promise which resolves to `true` if logged in, or an error name/message otherwise.
   */
  private async loginClient (tryNr: number = 0): Promise<true | string> {
    if (!this.client || this.unloaded) {
      return 'No Client';
    }

    try {
      await this.client.login(this.config.token);
      return true;
    } catch (err) {
      if (err instanceof Error) {
        let errorMsg: string;
        if (err instanceof AggregateError) {
          // create a list of unique error code entries
          errorMsg = Array.from(new Set(err.errors.map((e: NodeJS.ErrnoException) => e.code))).join(', ');
        } else {
          errorMsg = err.toString();
        }
        // log first 4 errors as info, then as warning
        if (tryNr < 4) {
          this.log.info(`Discord login error: ${errorMsg}`);
        } else {
          this.log.warn(`Discord login error: ${errorMsg}`);
        }
        if (err.name === 'AbortError' || err.name === 'ConnectTimeoutError' || (err as NodeJS.ErrnoException).code === 'EAI_AGAIN'
          || (err instanceof AggregateError && err.errors.map((e: NodeJS.ErrnoException) => e.code).includes('ENETUNREACH'))) {
          // AbortError and ConnectTimeoutError are results of network errors
          // EAI_AGAIN is a result of DNS errors
          // AggregateError containing ENETUNREACH occurs in case routing problems
          // ... retry
          tryNr++;
          if (tryNr >= LOGIN_WAIT_TIMES.length) {
            tryNr = LOGIN_WAIT_TIMES.length - 1;
          }

          this.log.info(`Wait ${LOGIN_WAIT_TIMES[tryNr] / 1000} seconds before next login try (#${tryNr + 1}) ...`);
          await setTimeout(LOGIN_WAIT_TIMES[tryNr], undefined, { ref: false });

          return await this.loginClient(tryNr);
        }
        return err.name;
      } else {
        this.log.error('Unknown Discord login error');
        return 'Unknown Discord login error';
      }
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
          const proms: Promise<unknown>[] = [];
          proms.push(this.client.user.setUsername(this.config.botName));

          for (const [ , guild ] of this.client.guilds.cache) {
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
    const allServersUsers: Collection<Snowflake, { user: User, presence: Presence | null }> = new Collection<Snowflake, { user: User, presence: Presence | null }>();

    /**
     * Set of object IDs for all known servers and channels.
     * Used to detect server/channel objects which have be deleted.
     */
    const knownServersAndChannelsIds: Set<string> = new Set<string>();

    if (this.unloaded) return;
    const guilds = await this.client.guilds.fetch();
    if (this.unloaded) return;

    for (const [ , guildBase ] of guilds) {

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
      await this.extendObjectCached(`servers.${guild.id}`, {
        type: 'channel',
        common: {
          name: guild.name,
        },
        native: {},
      });

      await Promise.all([
        this.extendObjectCached(`servers.${guild.id}.members`, {
          type: 'channel',
          common: {
            name: i18n.getStringOrTranslated('Members'),
          },
          native: {},
        }),
        this.extendObjectCached(`servers.${guild.id}.channels`, {
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

      for (const [ , member ] of guildMembers) {
        // remember user if not the bot itself
        if (member.user.id !== this.client.user.id) {
          allServersUsers.set(member.user.id, { user: member.user, presence: member.presence });
        }

        await this.extendObjectCached(`servers.${guild.id}.members.${member.id}`, {
          type: 'channel',
          common: {
            name: `${member.displayName} (${userNameOrTag(member.user)})`,
          },
          native: {},
        });

        await Promise.all([
          this.extendObjectCached(`servers.${guild.id}.members.${member.id}.tag`, {
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
          this.extendObjectCached(`servers.${guild.id}.members.${member.id}.name`, {
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
          this.extendObjectCached(`servers.${guild.id}.members.${member.id}.displayName`, {
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
          this.extendObjectCached(`servers.${guild.id}.members.${member.id}.roles`, {
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

          this.extendObjectCached(`servers.${guild.id}.members.${member.id}.joinedAt`, {
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

          this.extendObjectCached(`servers.${guild.id}.members.${member.id}.voiceChannel`, {
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
          this.extendObjectCached(`servers.${guild.id}.members.${member.id}.voiceDisconnect`, {
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
          this.extendObjectCached(`servers.${guild.id}.members.${member.id}.voiceSelfDeaf`, {
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
          this.extendObjectCached(`servers.${guild.id}.members.${member.id}.voiceServerDeaf`, {
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
          this.extendObjectCached(`servers.${guild.id}.members.${member.id}.voiceSelfMute`, {
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
          this.extendObjectCached(`servers.${guild.id}.members.${member.id}.voiceServerMute`, {
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

          this.extendObjectCached(`servers.${guild.id}.members.${member.id}.json`, {
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
          this.setState(`servers.${guild.id}.members.${member.id}.tag`, member.user.tag, true),
          this.setState(`servers.${guild.id}.members.${member.id}.name`, member.user.username, true),
          this.setState(`servers.${guild.id}.members.${member.id}.displayName`, member.displayName, true),
          this.setState(`servers.${guild.id}.members.${member.id}.roles`, memberRoles.join(', '), true),
          this.setState(`servers.${guild.id}.members.${member.id}.joinedAt`, member.joinedTimestamp, true),
          this.setState(`servers.${guild.id}.members.${member.id}.voiceChannel`, member.voice.channel?.name ?? '', true),
          this.setState(`servers.${guild.id}.members.${member.id}.voiceSelfDeaf`, !!member.voice.selfDeaf, true),
          this.setState(`servers.${guild.id}.members.${member.id}.voiceServerDeaf`, !!member.voice.serverDeaf, true),
          this.setState(`servers.${guild.id}.members.${member.id}.voiceSelfMute`, !!member.voice.selfMute, true),
          this.setState(`servers.${guild.id}.members.${member.id}.voiceServerMute`, !!member.voice.serverMute, true),
        ]);

        const json: JsonServersMembersObj = {
          tag: member.user.tag,
          name: member.user.username,
          id: member.id,
          displayName: member.displayName,
          roles: memberRoles,
          joined: member.joinedTimestamp,
          voiceChannel: member.voice.channel?.name ?? '',
          voiceChannelId: member.voice.channel?.id ?? '',
          voiceSelfDeaf: !!member.voice.selfDeaf,
          voiceServerDeaf: !!member.voice.serverDeaf,
          voiceSelfMute: !!member.voice.selfMute,
          voiceServerMute: !!member.voice.serverMute,
        };
        if (!isDeepStrictEqual(json, this.jsonStateCache.get(`${this.namespace}.servers.${guild.id}.members.${member.id}.json`))) {
          await this.setState(`servers.${guild.id}.members.${member.id}.json`, JSON.stringify(json), true);
          this.jsonStateCache.set(`${this.namespace}.servers.${guild.id}.members.${member.id}.json`, json);
        }

      }

      // guild channels
      if (this.unloaded) return;
      const channels = await guild.channels.fetch();
      if (this.unloaded) return;

      // loop over all channels twice to setup the parent channel objects first and afterwards the child channel objects
      for (const parents of [ true, false ]) {
        for (const [ , channel ] of channels) {
          if (!channel || (parents && channel.parentId) || (!parents && !channel.parentId)) {
            continue;
          }
          const channelIdPrefix = parents ? `servers.${guild.id}.channels.${channel.id}` : `servers.${guild.id}.channels.${channel.parentId}.channels.${channel.id}`;

          knownServersAndChannelsIds.add(`${this.namespace}.${channelIdPrefix}`);

          let icon: string | undefined;
          if (channel.type === ChannelType.GuildText) {
            icon = 'channel-text.svg';
          }
          if (channel.type === ChannelType.GuildVoice) {
            icon = 'channel-voice.svg';
          }
          await this.extendObjectCached(channelIdPrefix, {
            type: 'channel',
            common: {
              name: channel.parent ? `${channel.parent.name} / ${channel.name}` : channel.name,
              icon,
            },
            native: {
              channelId: channel.id,
            },
          });
          if (channel.type === ChannelType.GuildCategory) {
            await this.extendObjectCached(`${channelIdPrefix}.channels`, {
              type: 'channel',
              common: {
                name: i18n.getStringOrTranslated('Channels'),
              },
              native: {},
            });
          }

          await Promise.all([
            this.extendObjectCached(`${channelIdPrefix}.json`, {
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
            this.extendObjectCached(`${channelIdPrefix}.memberCount`, {
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
            this.extendObjectCached(`${channelIdPrefix}.members`, {
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

          if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildVoice) {
            await Promise.all([
              this.extendObjectCached(`${channelIdPrefix}.message`, {
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
              this.extendObjectCached(`${channelIdPrefix}.messageId`, {
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
              this.extendObjectCached(`${channelIdPrefix}.messageAuthor`, {
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
              this.extendObjectCached(`${channelIdPrefix}.messageTimestamp`, {
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
              this.extendObjectCached(`${channelIdPrefix}.messageJson`, {
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

              this.extendObjectCached(`${channelIdPrefix}.send`, {
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
              this.extendObjectCached(`${channelIdPrefix}.sendFile`, {
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
              this.extendObjectCached(`${channelIdPrefix}.sendReply`, {
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
              this.extendObjectCached(`${channelIdPrefix}.sendReaction`, {
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

          await this.updateChannelInfoStates(channel);
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
    for (const [ , { user, presence } ] of allServersUsers) {
      this.log.debug(`Known user: ${user.tag} id:${user.id}`);

      await this.extendObjectCached(`users.${user.id}`, {
        type: 'channel',
        common: {
          name: userNameOrTag(user),
        },
        native: {
          userId: user.id,
        },
      });

      await Promise.all([
        this.extendObjectCached(`users.${user.id}.json`, {
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

        this.extendObjectCached(`users.${user.id}.tag`, {
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

        this.extendObjectCached(`users.${user.id}.name`, {
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

        this.extendObjectCached(`users.${user.id}.message`, {
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
        this.extendObjectCached(`users.${user.id}.messageId`, {
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
        this.extendObjectCached(`users.${user.id}.messageTimestamp`, {
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
        this.extendObjectCached(`users.${user.id}.messageJson`, {
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

        this.extendObjectCached(`users.${user.id}.send`, {
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
        this.extendObjectCached(`users.${user.id}.sendFile`, {
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
        this.extendObjectCached(`users.${user.id}.sendReply`, {
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
        this.extendObjectCached(`users.${user.id}.sendReaction`, {
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

        this.extendObjectCached(`users.${user.id}.avatarUrl`, {
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

        this.extendObjectCached(`users.${user.id}.bot`, {
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

        this.extendObjectCached(`users.${user.id}.status`, {
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
        this.extendObjectCached(`users.${user.id}.activityType`, {
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
        this.extendObjectCached(`users.${user.id}.activityName`, {
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

      const proms: Promise<unknown>[] = [];
      const json: JsonUsersObj = {
        id: user.id,
        tag: user.tag,
        name: user.username,
        activityName: ps.activityName,
        activityType: ps.activityType,
        avatarUrl: user.displayAvatarURL(),
        bot: user.bot,
        status: ps.status,
      };
      if (!isDeepStrictEqual(json, this.jsonStateCache.get(`${this.namespace}.users.${user.id}.json`))) {
        proms.push(this.setState(`users.${user.id}.json`, JSON.stringify(json), true));
        this.jsonStateCache.set(`${this.namespace}.users.${user.id}.json`, json);
      }
      await Promise.all([
        this.setState(`users.${user.id}.tag`, user.tag, true),
        this.setState(`users.${user.id}.name`, user.username, true),
        this.setState(`users.${user.id}.avatarUrl`, json.avatarUrl, true),
        this.setState(`users.${user.id}.bot`, user.bot, true),
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
          this.log.debug(`Server/Channel ${idPath} "${getObjName(item.value.common)}" is no longer available - deleting objects`);
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
          this.log.debug(`User ${userId} "${getObjName(item.value.common)}" is no longer available - deleting objects`);
          this.knownUsers.delete(userId);
          this.messageReceiveStates.delete(`${this.namespace}.users.${userId}.message`);
          this.jsonStateCache.delete(`${this.namespace}.users.${userId}.json`);
          await this.delObjectAsyncCached(`users.${userId}`, { recursive: true });
        }
      }
    }
  }

  /**
   * Update the states containing basic information about a channel.
   *
   * This includes the following channel states: `.json`, `.memberCount`, `.members`
   * @param channel The channel to update the states for.
   */
  private async updateChannelInfoStates (channel: NonThreadGuildBasedChannel): Promise<void> {
    const channelIdPrefix = channel.parentId ? `servers.${channel.guildId}.channels.${channel.parentId}.channels.${channel.id}` : `servers.${channel.guild.id}.channels.${channel.id}`;

    const members = [ ...channel.members.values() ];
    const json: JsonServersChannelsObj = {
      id: channel.id,
      name: channel.name,
      type: ChannelType[channel.type] as ChannelTypeNames,
      memberCount: members.length,
      members: members.map((m) => ({
        id: m.user.id,
        tag: m.user.tag,
        name: m.user.username,
        displayName: m.displayName,
      })),
    };
    const proms: Promise<unknown>[] = [];
    if (!isDeepStrictEqual(json, this.jsonStateCache.get(`${this.namespace}.${channelIdPrefix}.json`))) {
      proms.push(this.setState(`${channelIdPrefix}.json`, JSON.stringify(json), true));
      this.jsonStateCache.set(`${this.namespace}.${channelIdPrefix}.json`, json);
    }
    await Promise.all([
      this.setState(`${channelIdPrefix}.memberCount`, members.length, true),
      this.setState(`${channelIdPrefix}.members`, members.map((m) => m.displayName).join(', '), true),
      ...proms,
    ]);
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
        status: presence?.status ?? '',
        activityName: (presence?.activities[0]?.type === ActivityType.Custom ? presence?.activities[0]?.state : presence?.activities[0]?.name) ?? '',
        activityType: (presence?.activities[0]?.type !== undefined ? ActivityType[presence.activities[0].type] as ActivityTypeNames : '') ?? '',
      };

      const proms: Promise<unknown>[] = [];
      if (!skipJsonStateUpdate) {
        const json = this.jsonStateCache.get(`${this.namespace}.users.${userId}.json`) as JsonUsersObj | undefined;
        if (json) {
          json.status = p.status;
          json.activityName = p.activityName;
          json.activityType = p.activityType;
          this.jsonStateCache.set(`${this.namespace}.users.${userId}.json`, json);
          proms.push(this.setState(`users.${userId}.json`, JSON.stringify(json), true));
        }
      }
      await Promise.all([
        this.setState(`users.${userId}.status`, p.status, true),
        this.setState(`users.${userId}.activityName`, p.activityName, true),
        this.setState(`users.${userId}.activityType`, p.activityType, true),
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

    opts ??= {};

    opts.status ??= ((await this.getStateAsync('bot.status'))?.val as PresenceStatusData | undefined) ?? 'online';
    if (!VALID_PRESENCE_STATUS_DATA.includes(opts.status)) {
      opts.status = 'online';
    }

    const presenceData: PresenceData = {
      status: opts.status,
      activities: [],
    };

    opts.activityType ??= ((await this.getStateAsync('bot.activityType'))?.val as ActivityTypeNames | undefined) ?? '';
    if (!ACTIVITY_TYPES.includes(opts.activityType)) {
      this.log.warn(`Invalid activityType! ${opts.activityType}`);
      opts.activityType = '';
    }
    opts.activityName ??= ((await this.getStateAsync('bot.activityName'))?.val as string | undefined) ?? '';
    if (opts.activityType && opts.activityName) {
      presenceData.activities = [ {
        type: ActivityType[opts.activityType],
        name: opts.activityName,
      } ];
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
      void this.setState('raw.messageJson', JSON.stringify(message.toJSON(), (_key, value: unknown) => typeof value === 'bigint' ? value.toString() : value), true);
    }

    if (!this.client?.user?.id) return;

    // don't process interactions here
    if (message.interactionMetadata) {
      return;
    }

    const { author, channel, content } = message;

    // don't process own messages
    if (author.id === this.client.user.id) {
      return;
    }

    const authCheckTarget = message.member ?? author;

    const isAuthorAuthorized = this.checkUserAuthorization(authCheckTarget);

    if (!this.config.processMessagesFromUnauthorizedUsers && !isAuthorAuthorized) {
      this.log.debug(`Ignore message from unauthorized user ${userNameOrTag(author)} (id:${author.id})`);
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

    if (!mentioned && (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildVoice) && !this.config.processAllMessagesInServerChannel) {
      this.log.debug('Server channel message without mention ignored');
      return;
    }

    let msgStateIdPrefix: string;
    if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildVoice) {
      msgStateIdPrefix = channel.parentId ? `${this.namespace}.servers.${message.guildId}.channels.${channel.parentId}.channels.${channel.id}` : `${this.namespace}.servers.${message.guildId}.channels.${channel.id}`;
    } else if (channel.type === ChannelType.DM) {
      msgStateIdPrefix = `${this.namespace}.users.${author.id}`;
    } else if (channel.isThread()) {
      this.log.debug('Thread message ignored');
      return;
    } else {
      this.log.warn(`Received message from unsupported channel type ${ChannelType[channel.type]}!`);
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
      attachments: message.attachments.map((att) => ({ attachment: att.url, name: att.name, description: att.description ?? '', size: att.size, contentType: att.contentType ?? '', id: att.id })),
      id: message.id,
      mentions: message.mentions.members?.map((m) => ({ id: m.id, tag: m.user.tag, name: m.user.username, displayName: m.displayName })) ?? [],
      mentioned,
      timestamp: message.createdTimestamp,
      authorized: isAuthorAuthorized,
    };
    const proms: Promise<unknown>[] = [];
    if (message.guildId) {
      json.author = {
        id: author.id,
        tag: author.tag,
        name: author.username,
        displayName: this.client.guilds.cache.get(message.guildId)?.members.cache.get(author.id)?.displayName ?? author.username,
      };
      proms.push(this.setState(`${msgStateIdPrefix}.messageAuthor`, userNameOrTag(author), true));
    }
    if (!isDeepStrictEqual(json, this.jsonStateCache.get(`${this.namespace}.${msgStateIdPrefix}.messageJson`))) {
      proms.push(this.setState(`${msgStateIdPrefix}.messageJson`, JSON.stringify(json), true));
      this.jsonStateCache.set(`${this.namespace}.${msgStateIdPrefix}.messageJson`, json);
    }
    await Promise.all([
      this.setState(`${msgStateIdPrefix}.message`, content, true),
      this.setState(`${msgStateIdPrefix}.messageId`, message.id, true),
      this.setState(`${msgStateIdPrefix}.messageTimestamp`, message.createdTimestamp, true),
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
                if (message.channel.isTextBased()) {
                  await (message.channel as DMChannel | TextChannel).send(response);
                }
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
        this.log.debug(`User ${userNameOrTag(author)} (id:${author.id}) NOT allowed to use text2command`);
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

    const proms: Promise<unknown>[] = [];

    // update channel states
    if (oldState.channelId !== newState.channelId) {
      if (oldState.channel) {
        proms.push(this.updateChannelInfoStates(oldState.channel));
      }
      if (newState.channel) {
        proms.push(this.updateChannelInfoStates(newState.channel));
      }
    }

    // update user states
    if (this.knownUsers.has(newState.member.id)) {
      const json: JsonServersMembersObj = {
        ...this.jsonStateCache.get(`${this.namespace}.servers.${newState.guild.id}.members.${newState.member.id}.json`) as JsonServersMembersObj,
      };

      let update: boolean = false;

      if (oldState.channelId !== newState.channelId) {
        proms.push(this.setState(`servers.${newState.guild.id}.members.${newState.member.id}.voiceChannel`, newState.channel?.name ?? '', true));
        json.voiceChannel = newState.channel?.name ?? '';
        json.voiceChannelId = newState.channel?.id ?? '';
        update = true;
      }
      if (oldState.serverDeaf !== newState.serverDeaf) {
        proms.push(this.setState(`servers.${newState.guild.id}.members.${newState.member.id}.voiceServerDeaf`, !!newState.serverDeaf, true));
        json.voiceSelfDeaf = !!newState.selfDeaf;
        update = true;
      }
      if (oldState.selfDeaf !== newState.selfDeaf) {
        proms.push(this.setState(`servers.${newState.guild.id}.members.${newState.member.id}.voiceSelfDeaf`, !!newState.selfDeaf, true));
        json.voiceServerDeaf = !!newState.serverDeaf;
        update = true;
      }
      if (oldState.serverMute !== newState.serverMute) {
        proms.push(this.setState(`servers.${newState.guild.id}.members.${newState.member.id}.voiceServerMute`, !!newState.serverMute, true));
        json.voiceSelfMute = !!newState.selfMute;
        update = true;
      }
      if (oldState.selfMute !== newState.selfMute) {
        proms.push(this.setState(`servers.${newState.guild.id}.members.${newState.member.id}.voiceSelfMute`, !!newState.selfMute, true));
        json.voiceServerMute = !!newState.serverMute;
        update = true;
      }

      // json state update
      if (update) {
        proms.push(this.setState(`servers.${newState.guild.id}.members.${newState.member.id}.json`, JSON.stringify(json), true));
        this.jsonStateCache.set(`${this.namespace}.servers.${newState.guild.id}.members.${newState.member.id}.json`, json);
      }

    } else {
      this.log.debug(`Can't update user voice state for unknown user ${newState.member.id}`);
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
          this.log.warn(`Object ${objId} has commands enabled but this seems to be an error because it is not a state object!`);
        }
      }

      // try to get the name
      let name = customCfg.commandsName;
      if (!name && objCommon) {
        if (typeof objCommon.name === 'object') {
          name = objCommon.name[i18n.language] ?? objCommon.name.en;
        } else {
          name = objCommon.name;
        }
      }

      const cfg: CommandObjectConfig = {
        id: objId,
        alias: customCfg.commandsAlias ?? objId,
        name: name ?? objId,
        get: !!customCfg.commandsAllowGet,
        set: !!customCfg.commandsAllowSet,
      };

      // do some checks
      let cfgOk: boolean = true;
      if (cfg.name.length > 100) {
        this.log.warn(`Command name for ${objId} exceeds the limit of 100 chars! This object will be ignored.`);
        cfgOk = false;
      }
      if (!(/^[0-9a-zA-Z._-]{0,100}$/.exec(cfg.alias))) {
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        void this.setupObjCustom(objId, obj.common?.custom?.[this.namespace], obj.common);
      }
    } else {
      // The object was deleted
      this.log.silly(`Object ${objId} deleted`);
      void this.setupObjCustom(objId, null);
    }
  }

  /**
   * Is called if a subscribed state changes
   */
  @boundMethod
  private async onStateChange (stateId: string, state: ioBroker.State | null | undefined): Promise<void> {
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
          await this.setBotPresence({ activityType: state.val as ActivityTypeNames });
          setAck = true;
          break;
        case `${this.namespace}.bot.activityName`:
          await this.setBotPresence({ activityName: state.val as string });
          setAck = true;
          break;

        default: // other own states
          // custom slash command reply
          if (/^discord\.\d+\.slashCommands\..*\.sendReply/.exec(stateId)) {
            setAck = await this.onCustomCommandSendReplyStateChange(stateId, state);

          // custom slash command option choices
          } else if (/^discord\.\d+\.slashCommands\..*\.option-[^.]+\.choices/.exec(stateId)) {
            // trigger delayed register slash commands to handle multiple changes of choices states together
            this.discordSlashCommands.triggerDelayedRegisterSlashCommands();
            setAck = true;

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
      await this.setState(stateId, {
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
    let m = /^(discord\.\d+\.servers\.(\d+)\.channels\.(\d+)(\.channels\.(\d+))?)\.(send|sendFile|sendReaction|sendReply)$/.exec(stateId);
    if (m) {
      const guildId = m[2];
      const channelId = m[5] || m[3];
      targetStateIdBase = m[1];
      action = m[6];

      const channel = this.client.guilds.cache.get(guildId)?.channels.cache.get(channelId);
      if (!channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildVoice) || channel.isThread()) {
        this.log.warn(`State ${stateId} changed but target is not a valid text channel!`);
        return false;
      }

      target = channel;
      targetName = channel.parent ? `${channel.guild.name}/${channel.parent.name}/${channel.name}` : `${channel.guild.name}/${channel.name}`;

    } else {
      m = /^(discord\.\d+\.users\.(\d+))\.(send|sendFile|sendReaction|sendReply)$/.exec(stateId);
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
      targetName = userNameOrTag(user);
    }

    let mo: MessageCreateOptions;

    /*
     * Special case .sendFile state
     */
    if (action === 'sendFile') {
      const idx = state.val.indexOf('|');
      let file: string;
      let content: string | undefined;
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
          files: [ {
            attachment: b64data.buffer,
            name: b64data.name,
          } ],
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
          files: [ {
            attachment: file,
            name,
          } ],
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

        const channel = target instanceof User ? target.dmChannel ?? await target.createDM() : target;
        if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildVoice && channel.type !== ChannelType.DM) {
          this.log.warn(`Could not determine target channel for reaction ${stateId}!`);
          return false;
        }

        // get the message from cache or try to fetch the message
        const message: Message<boolean> | undefined = channel.messages.cache.get(messageReference) ?? await channel.messages.fetch(messageReference);
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
      const msg = await target.send(this.prepareMessageForSend(mo));
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
    const m = /^discord\.\d+\.servers\.(\d+)\.members\.(\d+)\.voice(Disconnect|ServerMute|ServerDeaf)$/.exec(stateId);
    if (!m) {
      this.log.debug(`Voice state ${stateId} changed but could not get serverID and memberID!`);
      return false;
    }
    const [ , guildId, memberId, action ] = m;

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
          this.log.debug(`Voice member ${userNameOrTag(member.user)} of server ${guild.name} disconnected.`);
          break;

        case 'ServerDeaf':
          await member.voice.setDeaf(!!state.val);
          this.log.debug(`Voice server deafen of member ${userNameOrTag(member.user)} of server ${guild.name} set to ${!!state.val}.`);
          break;

        case 'ServerMute':
          await member.voice.setMute(!!state.val);
          this.log.debug(`Voice server mute of member ${userNameOrTag(member.user)} of server ${guild.name} set to ${!!state.val}.`);
          break;

        default:
          // should never happen...
          return false;
      }
      return true;
    } catch (err) {
      this.log.warn(`Voice server action of member ${userNameOrTag(member.user)} of server ${guild.name} can't be done! ${err}`);
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
      case 'getText2commandInstances': {
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
        this.sendTo(obj.from, obj.command, [ { value: '', label: '---' }, ...text2commandInstances ], obj.callback);
        break;
      } // getText2commandInstances

      case 'getNotificationTargets': {
        if (!obj.callback) {
          this.log.warn(`Message '${obj.command}' called without callback!`);
          return;
        }

        const targets: { label: string, value: string }[] = [ { value: '', label: '---' } ];

        // users
        this.client?.users.cache.forEach((u) => {
          targets.push({ label: userNameOrTag(u), value: u.id });
        });

        // server channels
        this.client?.guilds.cache.forEach((g) => {
          g.channels.cache.forEach((c) => {
            if (c.type === ChannelType.GuildText) {
              if (c.parent) {
                // channel has a parent
                targets.push({ label: `${g.name} » ${c.parent.name} » ${c.name}`, value: `${g.id}/${c.id}` });
              } else {
                // channel has no parent
                targets.push({ label: `${g.name} » ${c.name}`, value: `${g.id}/${c.id}` });
              }
            }
          });
        });

        this.log.debug(`Notification targets: ${targets.map((i) => i.value)}`);
        this.sendTo(obj.from, obj.command, targets, obj.callback);
        break;
      } // getNotificationTargets

      case 'getUsers': {
        if (!obj.callback) {
          this.log.warn(`Message '${obj.command}' called without callback!`);
          return;
        }

        const users = this.client?.users.cache.map((u) => ({ label: userNameOrTag(u), value: u.id })) ?? [];
        this.log.debug(`Users: ${users.map((i) => i.value)}`);
        this.sendTo(obj.from, obj.command, users, obj.callback);
        break;
      } // getUsers

      case 'getServers': {
        if (!obj.callback) {
          this.log.warn(`Message '${obj.command}' called without callback!`);
          return;
        }

        const servers = this.client?.guilds.cache.map((g) => ({ label: g.name, value: g.id })) ?? [];
        this.log.debug(`Servers: ${servers.map((i) => i.value)}`);
        this.sendTo(obj.from, obj.command, servers, obj.callback);
        break;
      } // getServers

      case 'getServerRoles': {
        if (!obj.callback) {
          this.log.warn(`Message '${obj.command}' called without callback!`);
          return;
        }

        if (!this.client) {
          this.sendTo(obj.from, obj.command, [], obj.callback);
          return;
        }

        const guildRolesWithLabel = [];
        for (const [ , guild ] of this.client.guilds.cache) {
          for (const [ , role ] of guild.roles.cache) {
            guildRolesWithLabel.push({
              label: `${guild.name} - ${role.name}`,
              value: `${guild.id}|${role.id}`,
            });
          }
        }

        this.log.debug(`Server roles: ${guildRolesWithLabel.map((i) => i.value)}`);
        this.sendTo(obj.from, obj.command, guildRolesWithLabel, obj.callback);

        break;
      } // getServerRoles

      case 'getAddToServerLink': {
        if (!obj.callback) {
          this.log.warn(`Message '${obj.command}' called without callback!`);
          return;
        }
        if (this.client?.user?.id) {
          const perms = new PermissionsBitField([
            PermissionsBitField.Flags.ChangeNickname,
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ModerateMembers,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.EmbedLinks,
            PermissionsBitField.Flags.AttachFiles,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.MentionEveryone,
            PermissionsBitField.Flags.AddReactions,
            PermissionsBitField.Flags.MuteMembers,
            PermissionsBitField.Flags.DeafenMembers,
            PermissionsBitField.Flags.MoveMembers,
          ]);
          this.sendTo(obj.from, obj.command, `https://discord.com/api/oauth2/authorize?client_id=${this.client.user.id}&permissions=${perms.bitfield}&scope=bot%20applications.commands`, obj.callback);
        } else {
          this.sendTo(obj.from, obj.command, `- ${i18n.getString('Error: The Bot is not connected to Discord!')} -`, obj.callback);
        }
        break;
      } // getAddToServerLink

      case 'logConfiguredCommandObjects': {
        this.discordSlashCommands.logConfiguredCommandObjects();
        this.sendToIfCb(obj.from, obj.command, { result: 'ok' }, obj.callback);
        break;
      } // logConfiguredCommandObjects

      case 'send':
      case 'sendMessage': {
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

        if (sendPayload.userId || sendPayload.userTag || sendPayload.userName) {
          // send to a user
          if (sendPayload.userId) {
            // by userId
            user = this.client?.users.cache.get(sendPayload.userId);
            if (!user) {
              this.sendToIfCb(obj.from, obj.command, { error: `No user with userId ${sendPayload.userId} found`, ...sendPayload }, obj.callback);
              return;
            }
          } else if (sendPayload.userTag) {
            // by userTag
            user = this.client?.users.cache.find((u) => u.tag === sendPayload.userTag);
            if (!user) {
              this.sendToIfCb(obj.from, obj.command, { error: `No user with userTag ${sendPayload.userTag} found`, ...sendPayload }, obj.callback);
              return;
            }
          } else {
            // by unique userName
            user = this.client?.users.cache.find((u) => u.discriminator === '0' && u.username === sendPayload.userName);
            if (!user) {
              this.sendToIfCb(obj.from, obj.command, { error: `No user with unique userName ${sendPayload.userName} found`, ...sendPayload }, obj.callback);
              return;
            }
          }
          try {
            msg = await user.send(this.prepareMessageForSend(sendPayload.content));
            this.sendToIfCb(obj.from, obj.command, { result: `Message sent to user ${userNameOrTag(user)}`, ...sendPayload, messageId: msg.id }, obj.callback);
          } catch (err) {
            this.sendToIfCb(obj.from, obj.command, { error: `Error sending message to user ${userNameOrTag(user)}: ${err}`, ...sendPayload }, obj.callback);
          }

        } else if (sendPayload.serverId && sendPayload.channelId) {
          // send to a channel
          channel = this.client?.guilds.cache.get(sendPayload.serverId)?.channels.cache.get(sendPayload.channelId);
          if (channel?.type !== ChannelType.GuildText && channel?.type !== ChannelType.GuildVoice) {
            this.sendToIfCb(obj.from, obj.command, { error: `No text channel with channelId ${sendPayload.channelId} on server ${sendPayload.serverId} found`, ...sendPayload }, obj.callback);
            return;
          }
          try {
            msg = await channel.send(this.prepareMessageForSend(sendPayload.content));
            this.sendToIfCb(obj.from, obj.command, { result: `Message sent to channel ${channel.name}`, ...sendPayload, messageId: msg.id }, obj.callback);
          } catch (err) {
            this.sendToIfCb(obj.from, obj.command, { error: `Error sending message to channel ${channel.name}: ${err}`, ...sendPayload }, obj.callback);
          }

        } else {
          // missing arguments
          this.sendToIfCb(obj.from, obj.command, { error: 'userId, userTag, userName or serverId and channelId needs to be set', ...sendPayload }, obj.callback);
        }

        break;
      } // send / sendMessage

      case 'editMessage': {
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

        break;
      } // editMessage

      case 'deleteMessage': {
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

        break;
      } // deleteMessage

      case 'addReaction': {
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

        break;
      } // addReaction

      case 'awaitMessageReaction': {
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
          filter: (_r, u) => u.id !== this.client?.user?.id,
          max: awaitMessageReactionPayload.max,
          time: awaitMessageReactionPayload.timeout,
        });
        reactionCollector.on('end', (collected) => {
          const reactions = collected.map((r) => ({ emoji: r.emoji.name, emojiId: r.emoji.id, users: r.users.cache.map((u) => ({ id: u.id, name: u.username, tag: u.tag })) }));
          this.sendTo(obj.from, obj.command, { reactions, ...awaitMessageReactionPayload }, obj.callback);
        });

        break;
      } // awaitMessageReaction

      case 'sendCustomCommandReply': {
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
          const messageId = await this.discordSlashCommands.sendCmdCustomReply(sendCustomCommandReplyPayload.interactionId, this.prepareMessageForSend(sendCustomCommandReplyPayload.content) as string | MessageEditOptions);
          this.sendToIfCb(obj.from, obj.command, { result: `Reply sent`, ...sendCustomCommandReplyPayload, messageId }, obj.callback);
        } catch (err) {
          this.sendToIfCb(obj.from, obj.command, { error: `Error sending reply: ${err}`, ...sendCustomCommandReplyPayload }, obj.callback);
        }

        break;
      } // sendCustomCommandReply

      case 'leaveServer': {
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
      } // leaveServer

      case 'getServerInfo': {
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
            name: m.user.username,
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

        break;
      } // getServerInfo

      case 'getChannelInfo': {
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
            name: m.user.username,
            displayName: m.displayName,
          })),
        }, obj.callback);

        break;
      } // getChannelInfo

      case 'getServerMemberInfo': {
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
        if (!getServerMemberInfoPayload.serverId || (!getServerMemberInfoPayload.userId && !getServerMemberInfoPayload.userTag && !getServerMemberInfoPayload.userName)) {
          this.sendTo(obj.from, obj.command, { error: 'serverId and userlId, userTag or userName need to be set', ...getServerMemberInfoPayload }, obj.callback);
          return;
        }

        let member: GuildMember | undefined;
        if (getServerMemberInfoPayload.userId) {
          member = this.client?.guilds.cache.get(getServerMemberInfoPayload.serverId)?.members.cache.get(getServerMemberInfoPayload.userId);
          if (!member) {
            this.sendTo(obj.from, obj.command, { error: `No member with ID ${getServerMemberInfoPayload.userId} for server with ID ${getServerMemberInfoPayload.serverId} found`, ...getServerMemberInfoPayload }, obj.callback);
            return;
          }
        } else if (getServerMemberInfoPayload.userTag) {
          member = this.client?.guilds.cache.get(getServerMemberInfoPayload.serverId)?.members.cache.find((m) => m.user.tag === getServerMemberInfoPayload.userTag);
          if (!member) {
            this.sendTo(obj.from, obj.command, { error: `No member with tag ${getServerMemberInfoPayload.userTag} for server with ID ${getServerMemberInfoPayload.serverId} found`, ...getServerMemberInfoPayload }, obj.callback);
            return;
          }
        } else {
          member = this.client?.guilds.cache.get(getServerMemberInfoPayload.serverId)?.members.cache.find((m) => m.user.discriminator === '0' && m.user.username === getServerMemberInfoPayload.userName);
          if (!member) {
            this.sendTo(obj.from, obj.command, { error: `No member with unique name ${getServerMemberInfoPayload.userName} for server with ID ${getServerMemberInfoPayload.serverId} found`, ...getServerMemberInfoPayload }, obj.callback);
            return;
          }
        }

        this.sendTo(obj.from, obj.command, {
          id: member.id,
          tag: member.user.tag,
          name: member.user.username,
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

        break;
      } // getServerMemberInfo

      case 'getUserInfo': {
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
        if (!getUserInfoPayload.userId && !getUserInfoPayload.userTag && !getUserInfoPayload.userName) {
          this.sendTo(obj.from, obj.command, { error: 'userId, userTag or userName need to be set', ...getUserInfoPayload }, obj.callback);
          return;
        }

        if (getUserInfoPayload.userId) {
          user = this.client?.users.cache.get(getUserInfoPayload.userId);
          if (!user) {
            this.sendTo(obj.from, obj.command, { error: `No user with ID ${getUserInfoPayload.userId} found`, ...getUserInfoPayload }, obj.callback);
            return;
          }
        } else if (getUserInfoPayload.userTag) {
          user = this.client?.users.cache.find((u) => u.tag === getUserInfoPayload.userTag);
          if (!user) {
            this.sendTo(obj.from, obj.command, { error: `No user with tag ${getUserInfoPayload.userTag} found`, ...getUserInfoPayload }, obj.callback);
            return;
          }
        } else {
          user = this.client?.users.cache.find((u) => u.discriminator === '0' && u.username === getUserInfoPayload.userName);
          if (!user) {
            this.sendTo(obj.from, obj.command, { error: `No user with unique name ${getUserInfoPayload.userName} found`, ...getUserInfoPayload }, obj.callback);
            return;
          }
        }

        this.sendTo(obj.from, obj.command, {
          id: user.id,
          tag: user.tag,
          name: user.username,
          avatarUrl: user.avatarURL(),
          bot: user.bot,
          accentColor: user.hexAccentColor,
        }, obj.callback);

        break;
      } // getUserInfo

      case 'getMessageInfo': {
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
            name: msg.author.username,
          },
          content: msg.content,
          embeds: msg.embeds.map((e) => e.toJSON()),
          attachments: msg.attachments.map((a) => a.toJSON()),
          reactions: msg.reactions.cache.map((r) => r.toJSON()),
          createdTimestamp: msg.createdTimestamp,
          editedTimestamp: msg.editedTimestamp,
          reference: msg.reference,
        }, obj.callback);

        break;
      } // getMessageInfo

      case 'sendNotification': {
        /*
         * notification from ioBrokers notification system
         * see https://github.com/foxriver76/ioBroker.notification-manager
         */
        if (!obj.callback) {
          this.log.warn(`Message '${obj.command}' called without callback!`);
          return;
        }

        if (!this.config.sendNotificationsTo) {
          this.log.debug(`New notification received from ${obj.from}, but sending notifications is not enabled in adapter config`);
          this.sendTo(obj.from, obj.command, { sent: false }, obj.callback);
          return;
        }

        this.log.info(`New notification received from ${obj.from.replace(/^system\.adapter\./, '')}`);

        let target: User | TextChannel | undefined;

        if (this.config.sendNotificationsTo.indexOf('/') > 0) {
          // server channel
          const [ serverId, channelId ] = this.config.sendNotificationsTo.split('/');
          const channel2 = this.client?.guilds.cache.get(serverId)?.channels.cache.get(channelId);
          if (channel2?.type === ChannelType.GuildText) {
            target = channel2;
          }
        } else {
          // user
          target = this.client?.users.cache.get(this.config.sendNotificationsTo);
        }

        if (!target) {
          this.log.error(`Cannot send notification because the configured target is invalid!`);
          this.sendTo(obj.from, obj.command, { sent: false }, obj.callback);
          return;
        }

        const message = obj.message as LocalizedNotification;

        // check the message object
        if (!message?.category?.instances || !message.category.name) {
          this.log.warn(`Cannot send notification because the received message object is invalid`);
          this.sendTo(obj.from, obj.command, { sent: false }, obj.callback);
          return;
        }

        const { instances, severity } = message.category;

        let icon: string = '';
        switch (severity) {
          case 'alert':
            icon = ':warning: ';
            break;
          case 'info':
            icon = ':information_source: ';
            break;
          case 'notify':
            icon = ':bell: ';
            break;
        }

        const readableInstances = Object.entries(instances).map(([ instance, entry ]) => `${instance.substring('system.adapter.'.length)}: ${getNewestDate(entry.messages, i18n.language)}`);

        const text = `${icon}**${message.category.name}**

${message.category.description ?? ''}

${message.host}:
${readableInstances.join('\n')}`;

        try {
          const msg2 = await target.send(text);
          this.log.debug(`Sent message from notification-manager adapter with message ID ${msg2.id}`);
          this.sendTo(obj.from, obj.command, { sent: true }, obj.callback);
        } catch (err) {
          this.log.warn(`Error sending message from notification-manager adapter: ${err}`);
          this.sendTo(obj.from, obj.command, { sent: false }, obj.callback);
        }

        break;
      } // sendNotification

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    } else if (typeof message === 'object' && message.error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      this.log.warn(message.error);
    }
  }

  /**
   * Prepare a message for sending.
   *
   * This some message parts to be valid discord message data.
   * @param msg The message as `string` or `MessageCreateOptions`.
   * @returns The prepared message.
   */
  private prepareMessageForSend<T extends string | MessageCreateOptions | MessageEditOptions> (msg: T): T {
    if (typeof msg === 'string') {
      return msg;
    }

    // replace hexo color codes in embeds
    if (msg.embeds) {
      for (const embed of msg.embeds) {
        // color codes may be given as string in user defined embeds
        if (typeof (embed as APIEmbed).color === 'string') {
          const colorStr: string = (embed as APIEmbed).color as unknown as string;
          if (/^\d+$/.exec(colorStr)) {
            // it's a number color given as string
            (embed as APIEmbed).color = parseInt(colorStr, 10);
          } else {
            // it's something else (maybe a color name or hexo color)
            // try to resolve the color
            try {
              (embed as APIEmbed).color = resolveColor(colorStr as HexColorString);
            } catch (err) {
              // color could not be resolved, use a default color
              (embed as APIEmbed).color = resolveColor('Greyple');
              this.log.warn(`Error embed color '${colorStr}': ${err}`);
            }
          }
        }
      }
    }

    return msg;
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

    if (identifier.userId || identifier.userTag || identifier.userName) {
      // a user
      let user: User | undefined;
      if (identifier.userId) {
        // by userId
        user = this.client?.users.cache.get(identifier.userId);
        if (!user) {
          throw new Error(`No user with userId ${identifier.userId} found`);
        }
      } else if (identifier.userTag) {
        // by userTag
        user = this.client?.users.cache.find((u) => u.tag === identifier.userTag);
        if (!user) {
          throw new Error(`No user with userTag ${identifier.userTag} found`);
        }
      } else {
        // by unique userName
        user = this.client?.users.cache.find((u) => u.discriminator === '0' && u.username === identifier.userName);
        if (!user) {
          throw new Error(`No user with unique userName ${identifier.userName} found`);
        }
      }
      try {
        if (!user.dmChannel) {
          await user.createDM();
        }
        const msg = user.dmChannel?.messages.cache.get(identifier.messageId) ?? await user.dmChannel?.messages.fetch(identifier.messageId);
        if (!msg) {
          throw new Error(`No message with messageId ${identifier.messageId} for user ${userNameOrTag(user)} found`);
        }
        return msg;
      } catch (err) {
        throw new Error(`Error finding message for user ${userNameOrTag(user)}: ${err}`);
      }

    } else if (identifier.serverId && identifier.channelId) {
      // a channel
      const channel = this.client?.guilds.cache.get(identifier.serverId)?.channels.cache.get(identifier.channelId);
      if (channel?.type !== ChannelType.GuildText && channel?.type !== ChannelType.GuildVoice) {
        throw new Error(`No text channel with channelId ${identifier.channelId} on server ${identifier.serverId} found`);
      }
      try {
        const msg = channel.messages.cache.get(identifier.messageId) ?? await channel.messages.fetch(identifier.messageId);
        if (!msg) {
          throw new Error(`No message with messageId ${identifier.messageId} for channel ${channel.name} found`);
        }
        return msg;
      } catch (err) {
        throw new Error(`Error finding message in channel ${channel.name}: ${err}`);
      }

    } else {
      // missing arguments
      throw new Error('userId, userTag, userName or serverId and channelId needs to be set');
    }
  }

  /**
   * Set the `info.connection` state if changed.
   * @param connected If connected.
   * @param force `true` to skip local cache check and always set the state.
   */
  private async setInfoConnectionState (connected: boolean, force: boolean = false): Promise<void> {
    if (force || connected !== this.infoConnected) {
      await this.setState('info.connection', connected, true);
      this.infoConnected = connected;
    }
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
        await this.client.destroy();
      }

      callback();
    } catch (_e) {
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
