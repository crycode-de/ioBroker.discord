# ioBroker.discord

![Logo](../../admin/discord.png)

This ioBroker adapter integrates a discord bot into ioBroker.

The adapter will create an object tree including objects and states for server and channel where the bot is on.
Also an object tree with all users seen by the bot will be created.  
Using this states it's possible to receive and send messages and files on discord.

Additionally the adapter can register discord slash commands to get and set ioBroker state values.

## Features

* ioBroker states for all servers of the bot to receive and send messages
* ioBroker states for all users seen by the bot to receive and send messages
* Set the bot status including actions
* Optional observe user presence status
* Optional observe server member voice status
* Server member voice actions (mute, deafen, disconnect)
* Handle all messages or only messages with bot mentions on server channels
* Handle direct messages
* Optional automatic react with a emoji on mentions
* `.json` states for channel, user and message data
* Send messages, send files, send reactions (emojis), send reply messages, or send custom json-formated message contents
* List server and channel members including member roles
* Support for discord slash commands to get and set state values
* Support for [text2command](https://github.com/ioBroker/ioBroker.text2command) (has to enabled for each `.message` state where it should be used)

Missing some feature? Feel free to submit a feature request on [GitHub](https://github.com/crycode-de/ioBroker.discord/issues/new/choose).

## Adding the bot to a server

To add the bot to a server, you need to go to the adapter instance configuration to the tab _Add bot to server_.
There you get a link which you can use to add the bot to a server, while setting the correct scopes and permissions.

## States

Each server, channel and user is identified by it's unique numeric ID.  
Because names may change, the object tree created by the adapter uses these IDs to create a reliable structure.

The whole object tree is build from what bot can see. So it is possible, for example, that a server has more channels as displayed.

### discord.0.bot.*

| Name | Description |
|---|---|
| `activityType` | The type of the bot activity. One of `PLAYING`, `STREAMING`, `LISTENING`, `WATCHING`, `COMPETING` or an empty string. |
| `activityName` | The name of the bot activity. Only used if a type is set. |
| `status` | The presence status of the bot. One of `online`, `idle`, `dnd` and `invisible`. |

This is used to set the presence status and activity of the bot which should be displayed to users.

### discord.0.servers.\<server-id\>.*

| Name | Description |
|---|---|
| `channels.*` | Channels of the server. |
| `members.*` | Members of the server. |

### discord.0.servers.\<server-id\>.channels.\<channel-id\>.*

| Name | Description |
|---|---|
| `channels.*` | Only present if the channel is a category. Structure is the same as in server channels. |
| `memberCount` | Number of members in the channel. |
| `members` | Comma separated list of members (display names) in the channel. |
| `message` | Last received message in the channel. |
| `messageId` | The ID of the last received message. |
| `messageAuthor` | The author (tag) of the last received message. |
| `messageTimestamp` | Timestamp of the last received message. |
| `messageJson` | JSON data for the last received message. |
| `send` | Send some text or JSON formated message. |
| `sendFile` | Send a File. |
| `sendReply` | Send a reply to a received message. |
| `sendReaction` | Send a reaction (emoji) to a received message. |
| `json` | JSON data of the channel information. |

For all `message*` and `send*` states see messages section below.

### discord.0.servers.\<server-id\>.members.\<user-id\>.*

| Name | Description |
|---|---|
| `tag` | The unique tag of the user in discord. |
| `displayName` | The display name of the user on the server. |
| `roles` | Comma separated list of roles of this member on the server. |
| `joinedAt` | Time when the user joined the server. |
| `voiceChannel` | Currently connected voice channel of the user. Empty string if not connected. |
| `voiceDisconnect` | Button to disconnet the user from voice. |
| `voiceSelfDeaf` | Indicator if the users voice is deafened by the user. |
| `voiceSelfMute` | Indicator if the users voice is muted by the user. |
| `voiceServerDeaf` | Indicator if the users voice is deafened by the server. Can also be used to set the server deafen state. |
| `voiceServerMute` | Indicator if the users voice is muted by the server. Can also be used to set the server mute state. |
| `json` | JSON data of the member information. |

For the `voice*` states to be up to date, the option _Observe user voice state_ in the instance configuration must be enabled.  
To use the `voiceDisconnect`, `voiceServerDeaf` and `voiceServerMute` actions, the bot needs to have the related permissions on the server.

### discord.0.users.\<user-id\>.*

| Name | Description |
|---|---|
| `tag` | The unique tag of the user in discord. |
| `status` | The presence status of the user. One of `online`, `offline`, `idle`, `dnd` |
| `activityType` | The type of the current user activity. One of `PLAYING`, `STREAMING`, `LISTENING`, `WATCHING`, `COMPETING`, `CUSTOM` or an empty string. |
| `activityName` | The name of the current user activity. E.g. the name of a game while `PLAYING`. |
| `avatarUrl` | URL to the avatar of the user. |
| `bot` | Indicator if the user is a bot. |
| `message` | Last received direct message from the user. |
| `messageId` | The ID of the last received direct message from the user. |
| `messageTimestamp` | Timestamp of the last received direct message from the user. |
| `messageJson` | JSON data for the last received direct message from the user. |
| `send` | Send some text or JSON formated message. |
| `sendFile` | Send a File. |
| `sendReply` | Send a reply to a received message. |
| `sendReaction` | Send a reaction (emoji) to a received message. |
| `json` | JSON data of the channel information. |

For the `status` and `activity*` states to be up to date, the option _Observe user presence_ in the instance configuration must be enabled.

For all `message*` and `send*` states see messages section below.

## Authorization

By default, authorization is enabled and only authorized users are able to
interact with the adapter.

The authorized users can be configured in the adapter configuration including
some per-user permissions.  
The users are identified by their internal user ID, so changes of the user tag
don't affect the authorized users list.

It's possible to disable the authorization, but this should be done only if any
user on any server of the bot can be trusted!

## Messages

The adapter is able to receive and send messages from/to discord text channels and users.

By default, in channels only messages with mentions of the bot are processed.
To process messages without mentions too, the option _Process all messages in server channels_ needs to be enabled in the configuration.

When a messages with a bot mention is received, the adapter will react to the message with an emoji.
This can be customized in the adapter configuration.  
If authorization is enabled, the bot will only react on mentions of authorized users.

### Receiving messages

Received messages will be stored in the `.message*` states of the channel object
for server channel messages or of the user object for direct messages.

If authorization is enabled, by default only messages from authorized users will be stored.
This can be configured using the _Process messages from unauthorized users_ option
in the adapter configuration to strore all received messages, even from unauthorized users.

The last received message per channel/user is always stored in the `.message` state.
The timestamp, author and ID of the last received message is stored in the appropriate states.  
Additionally all these information are stored in json format in the `.messageJson` state.

#### Using text2command

To use text2command, a text2command instance must be selected in the adapter configuration.

For each `.message` state the custom option _Enable text2command for this state_ can be activated.  
When activated, each received message will be send to the selected text2command instance.

The response from text2command is send as a reply, send as a normal message or
not send, depending on the adapter configuration.

### Sending messages

_TODO_

## Slash commands

_TODO_
