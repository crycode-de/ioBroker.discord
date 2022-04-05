export const VALID_PRESENCE_STATUS_DATA = <const>['online', 'idle', 'dnd', 'invisible'];

export const VALID_ACTIVITY_TYPES = <const>['', 'PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'COMPETING'];
export type ValidActivityType = typeof VALID_ACTIVITY_TYPES[number];

import { Guild, NonThreadGuildBasedChannel, PresenceStatus, PresenceStatusData, Snowflake, User } from 'discord.js';

export interface SendTargetInfo {
  guild?: Guild;
  channel?: NonThreadGuildBasedChannel;
  user?: User;
}

export type StateId2SendTargetInfo = Map<string, SendTargetInfo>;

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
  displayName: string,
  roles: string[],
  joined: number | null,
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