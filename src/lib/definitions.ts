export const VALID_PRESENCE_STATUS_DATA = [ 'online', 'idle', 'dnd', 'invisible' ] as const;

export const ACTIVITY_TYPES = [ '', 'Playing', 'Streaming', 'Listening', 'Watching', 'Custom', 'Competing' ] as const;
export type ActivityTypeNames = typeof ACTIVITY_TYPES[number];

// export const VALID_ACTIVITY_TYPES = <const>['', 'Playing', 'Streaming', 'Listening', 'Watching', 'Competing'];
// export type ValidActivityTypeNames = typeof VALID_ACTIVITY_TYPES[number];

/**
 * Valid channel types.
 * @see discord-api-types/payloads/v10/channel.d.ts#304
 */
export type ChannelTypeNames = 'GuildText' | 'DM' | 'GuildVoice' | 'GroupDM' | 'GuildCategory' | 'GuildAnnouncement' | 'AnnouncementThread' | 'PublicThread' | 'PrivateThread' | 'GuildStageVoice' | 'GuildDirectory' | 'GuildForum' | 'GuildNews' | 'GuildNewsThread' | 'GuildPublicThread' | 'GuildPrivateThread';

import {
  MessageCreateOptions,
  MessageEditOptions,
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
  activityType?: ActivityTypeNames;
  activityName?: string;
}

export interface JsonServersMembersObj {
  id: Snowflake;
  tag: string;
  name: string;
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
    name: string;
    displayName: string;
  }[];
  type: ChannelTypeNames;
}

export interface JsonUsersObj {
  id: Snowflake;
  tag: string;
  name: string;
  activityName: string;
  activityType: ActivityTypeNames;
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
    name: string;
    displayName: string;
  }[];
  mentioned: boolean;
  timestamp: number;
  authorized: boolean;

  author?: {
    id: Snowflake;
    tag: string;
    name: string;
    displayName: string;
  };
}

export interface JsonSlashCommandObj {
  interactionId: Snowflake;
  commandName: string;
  user: {
    id: Snowflake;
    tag: string;
    name: string;
    displayName: string;
  };
  channelId: Snowflake;
  serverId: Snowflake | null;
  timestamp: number;
  options: Record<string, JsonSlashCommandObjOption>;
}

export interface JsonSlashCommandObjOption {
  value: string | number | boolean | null;
  type: string | null;
  user?: {
    id: Snowflake;
    tag: string;
    name: string;
    bot: boolean;
  };
  member?: {
    id: Snowflake;
    tag: string;
    name: string;
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
    type: ChannelTypeNames;
    lastMessageId: Snowflake | null;
  };
}

export interface UpdateUserPresenceResult {
  status: PresenceStatus | '';
  activityType: ActivityTypeNames;
  activityName: string;
}

export type CheckAuthorizationOpts = Partial<ioBroker.AdapterConfigAuthorizedFlags>;

/**
 * Parameters needed to identify a message target.
 * One of the following is needed:
 * - `userId`
 * - `userTag`
 * - `userName`
 * - `serverId` and `channelId`
 */
export interface MessageTargetIdentifier {
  serverId?: Snowflake;
  channelId?: Snowflake;

  userId?: Snowflake;
  userTag?: Snowflake;
  userName?: Snowflake;
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
  content: string | MessageCreateOptions;
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
  userTag?: string;
  userName?: string;
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
  content: string | MessageCreateOptions;
}
