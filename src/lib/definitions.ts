export const VALID_PRESENCE_STATUS_DATA = <const>['online', 'idle', 'dnd', 'invisible'];

export const VALID_ACTIVITY_TYPES = <const>['', 'PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'COMPETING'];
export type ValidActivityType = typeof VALID_ACTIVITY_TYPES[number];

import {
  ApplicationCommandOptionType,
  MessageEditOptions,
  MessageOptions,
  PresenceStatus,
  PresenceStatusData,
  Snowflake,
} from 'discord.js';

export interface Text2commandMessagePayload {
  text: string;
  response?: string;
}

export interface SetBotPresenceOptions {
  status?: PresenceStatusData;
  activityType?: ValidActivityType;
  activityName?: string;
}

export interface JsonServersMembersObj {
  id: Snowflake;
  tag: string;
  displayName: string;
  roles: string[];
  joined: number | null;
  voiceChannel: string;
  voiceChannelId: Snowflake;
  voiceSelfDeaf: boolean;
  voiceServerDeaf: boolean;
  voiceSelfMute: boolean;
  voiceServerMute: boolean;
}

export interface JsonServersChannelsObj {
  id: Snowflake;
  name: string;
  memberCount: number;
  members: {
    id: Snowflake;
    tag: string;
    displayName: string;
  }[];
  type: string;
}

export interface JsonUsersObj {
  id: Snowflake;
  tag: string;
  activityName: string;
  activityType: ValidActivityType | 'CUSTOM' | '';
  avatarUrl: string;
  bot: boolean;
  status: PresenceStatus | '';
}

export interface JsonMessageObj {
  id: Snowflake;
  content: string;
  attachments: {
    attachment: string;
    name: string | null;
    size: number;
    id: Snowflake;
  }[];
  mentions: {
    id: Snowflake;
    tag: string;
    displayName: string;
  }[];
  mentioned: boolean;
  timestamp: number;
  authorized: boolean;

  author?: {
    id: Snowflake;
    tag: string;
    displayName: string;
  };
}

export interface JsonSlashCommandObj {
  interactionId: Snowflake;
  commandName: string;
  user: {
    id: Snowflake;
    tag: string;
    displayName: string;
  };
  channelId: Snowflake;
  serverId: Snowflake | null;
  timestamp: number;
  options: Record<string, JsonSlashCommandObjOption>;
}

export interface JsonSlashCommandObjOption {
  value: string | number | boolean | null;
  type: ApplicationCommandOptionType | null;
  user?: {
    id: Snowflake;
    tag: string;
    bot: boolean;
  };
  member?: {
    id: Snowflake;
    displayName: string;
    roles: { id: Snowflake, name: string }[];
  };
  role?: {
    id: Snowflake;
    name: string;
  };
  channel?: {
    id: Snowflake;
    name: string;
    type: 'GUILD_CATEGORY' | 'GUILD_NEWS' | 'GUILD_STAGE_VOICE' | 'GUILD_STORE' | 'GUILD_TEXT' | 'GUILD_VOICE';
    lastMessageId: Snowflake | null;
  };
}

export interface UpdateUserPresenceResult {
  status: PresenceStatus | '';
  activityType: ValidActivityType | 'CUSTOM' | '';
  activityName: string;
}

export type CheckAuthorizationOpts = Partial<ioBroker.AdapterConfigAuthorizedFlags>;

/**
 * Parameters needed to identify a message target.
 * One of the following is needed:
 * - `userId`
 * - `userTag`
 * - `serverId` and `channelId`
 */
export interface MessageTargetIdentifier {
  serverId?: Snowflake;
  channelId?: Snowflake;

  userId?: Snowflake;
  userTag?: Snowflake;
}

/**
 * Parameters needed to identify a message.
 */
export interface MessageIdentifier extends MessageTargetIdentifier {
  messageId: Snowflake;
}

/**
 * Payload for a `sentTo(...)` `sendMessage` action.
 */
export interface SendToActionSendPayload extends MessageTargetIdentifier {
  content: string | MessageOptions;
}

/**
 * Payload for a `sentTo(...)` `editMessage` action.
 */
export interface SendToActionEditMessagePayload extends MessageIdentifier {
  content: string | MessageEditOptions;
}

/**
 * Payload for a `sentTo(...)` `awaitMessageReaction` action.
 */
export interface SendToActionAwaitMessageReactionPayload extends MessageIdentifier {
  timeout: number;
  max?: number;
}

/**
 * Payload for a `sentTo(...)` `addReaction` action.
 */
export interface SendToActionAddReactionPayload extends MessageIdentifier {
  emoji: string;
}

/**
 * Payload for `sentTo(...)` actions requiring a server.
 */
export interface SendToActionServerIdentifier {
  serverId: Snowflake;
}

/**
 * Payload for `sentTo(...)` actions requiring a server channel.
 */
export interface SendToActionChannelIdentifier extends SendToActionServerIdentifier {
  channelId: Snowflake;
}

/**
 * Payload for `sentTo(...)` actions requiring a user.
 */
export interface SendToActionUserIdentifier {
  userId?: Snowflake;
  userTag?: Snowflake;
}

/**
 * Payload for `sentTo(...)` actions requiring a server member.
 */
export interface SendToActionServerMemberIdentifier extends SendToActionServerIdentifier, SendToActionUserIdentifier {
  // just extends
}

/**
 * Payload for a `sentTo(...)` `sendCustomCommandReply` action.
 */
export interface SendToActionSendCustomCommandReplyPayload {
  interactionId: Snowflake;
  content: string | MessageOptions;
}
