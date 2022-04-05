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
      enableAuthentication: boolean;
      authenticatedUsers: AdapterConfigAuthenticatedUser[];
    }

    interface AdapterConfigAuthenticatedUser {
      userId: Snowflake;
      getStates: boolean;
      setStates: boolean;
      useText2command: boolean;
    }

    interface CustomConfig {
      enabled: boolean;
      enableText2command?: boolean;
      // TODO: add all
    }
  }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};