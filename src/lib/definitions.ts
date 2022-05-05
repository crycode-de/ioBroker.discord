export const VALID_PRESENCE_STATUS_DATA = <const>['online', 'idle', 'dnd', 'invisible'];

export const VALID_ACTIVITY_TYPES = <const>['', 'PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'COMPETING'];
export type ValidActivityType = typeof VALID_ACTIVITY_TYPES[number];

import {
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

export interface UpdateUserPresenceResult {
  status: PresenceStatus | '';
  activityType: ValidActivityType | 'CUSTOM' | '';
  activityName: string;
}

export interface CheckAuthorizationOpts {
  getStates?: boolean;
  setStates?: boolean;
  useText2command?: boolean;
}

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
  content: string | MessageOptions;
}

/**
 * Payload for a `sentTo(...)` `awaitMessageReaction` action.
 */
export interface SendToActionAwaitMessageReactionPayload extends MessageIdentifier {
  timeout: number;
  max?: number;
}
