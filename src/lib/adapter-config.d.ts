// This file extends the AdapterConfig type from "@types/iobroker"

import { EmojiIdentifierResolvable, Snowflake } from 'discord.js';

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
  namespace ioBroker {
    interface AdapterConfig {
      token: string;
      botName: string;
      processAllMessagesInServerChannel: boolean;
      reactOnMentions: boolean;
      reactOnMentionsEmoji: EmojiIdentifierResolvable;
      text2commandInstance: string;
      text2commandRespondWith: 'message' | 'reply' | 'none';
      dynamicServerUpdates: boolean;
      observeUserPresence: boolean;
      observeUserVoiceState: boolean;
      enableRawStates: boolean;
      enableAuthorization: boolean;
      authorizedUsers: AdapterConfigAuthorizedUser[];
      authorizedServerRoles: AdapterConfigAuthorizedServerRoles[];
      processMessagesFromUnauthorizedUsers: boolean;

      enableCommands: boolean;
      commandsGlobal: boolean;
      cmdGetStateName: string;
      cmdSetStateName: string;
    }

    interface AdapterConfigAuthorizedFlags {
      getStates: boolean;
      setStates: boolean;
      useText2command: boolean;
    }

    interface AdapterConfigAuthorizedUser extends AdapterConfigAuthorizedFlags {
      userId: Snowflake;
    }

    interface AdapterConfigAuthorizedServerRoles extends AdapterConfigAuthorizedFlags {
      serverAndRoleId: `${Snowflake}|${Snowflake}`;
    }

    interface CustomConfig {
      enabled?: boolean;
      enableText2command?: boolean;

      enableCommands?: boolean;
      commandsName?: string;
      commandsAlias?: string;
      commandsAllowGet?: boolean;
      commandsAllowSet?: boolean;

      commandsBooleanValueTrue?: string;
      commandsBooleanValueFalse?: string;
      commandsNumberDecimals?: number;
      commandsStringSendAsFile?: boolean;

      commandsShowAckFalse?: boolean;
      commandsSetWithAck?: boolean;
    }
  }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};