![Logo](admin/discord.png)

# ioBroker.discord

[![NPM version](https://img.shields.io/npm/v/iobroker.discord.svg)](https://www.npmjs.com/package/iobroker.discord)
[![Downloads](https://img.shields.io/npm/dm/iobroker.discord.svg)](https://www.npmjs.com/package/iobroker.discord)
![Number of Installations](https://iobroker.live/badges/discord-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/discord-stable.svg)
[![Dependency Status](https://img.shields.io/david/crycode-de/iobroker.discord.svg)](https://david-dm.org/crycode-de/iobroker.discord)

[![NPM](https://nodei.co/npm/iobroker.discord.png?downloads=true)](https://nodei.co/npm/iobroker.discord/)

**Tests:** ![Test and Release](https://github.com/crycode-de/ioBroker.discord/workflows/Test%20and%20Release/badge.svg)

## Discord adapter for ioBroker

ioBroker Discord bot integration

**This adapter uses Sentry libraries to automatically report exceptions and code errors to the developers.** For more details and for information how to disable the error reporting see [Sentry-Plugin Documentation](https://github.com/ioBroker/plugin-sentry#plugin-sentry)! Sentry reporting is used starting with js-controller 3.0.

## Documentation

A detailed documentation is available in the `docs` directory of the repository:

* [English documentation](./docs/en/README.md)
* [Deutsche Dokumentation](./docs/de/README.md)

## Requirements

* Node.js >= 16.6
* js-controller >= 4.0
* admin >= 5.3

Node.js 16 is required by the underlaying [discord.js](https://github.com/discordjs) library.

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
* Send, edit and delete messages, add and await message reactions using Scripts

## Planned features

See [GitHub issue](https://github.com/crycode-de/ioBroker.discord/issues/1).

## Changelog

### 0.0.x

* (crycode-de) development

## License

MIT License

Copyright (c) 2022 Peter Müller <peter@crycode.de>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
