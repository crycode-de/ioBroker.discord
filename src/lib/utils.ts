import { User } from 'discord.js';
import { basename } from 'node:path';
import { URL } from 'node:url';

interface BufferAndName {
  buffer: Buffer;
  name: string;
}

/**
 * Get a buffer and a file name from a possibly base64 encoded string.
 * @param base64String The possibly bas64 encoded data string.
 * @param name An optional file name.
 * @returns Object of `buffer` and `name` from the base64 string or null if no base64 string.
 */
export function getBufferAndNameFromBase64String (base64String: string, name?: string): BufferAndName | null {
  // check for base64 encoded data
  const b64match = base64String.match(/^data:([^/]+)\/([^;]+);base64,([a-zA-Z0-9+/]+=*)$/);
  if (!b64match) {
    return null;
  }

  // base64 encoded content
  const buffer = Buffer.from(b64match[3], 'base64');

  // guess a generic name from the mime type if no name provided
  if (!name) {
    name = `${b64match[1].replace(/\W/g, '_')}.${b64match[2].replace(/\W/g, '_')}`;
  }

  return {
    buffer,
    name,
  };
}

/**
 * Get the basename of a path or URL to a file.
 * @param file Path or URL to a file.
 * @returns The basename of the file.
 */
export function getBasenameFromFilePathOrUrl (file: string): string {
  if (file.match(/^\w+:\/\//)) {
    try {
      const url = new URL(file);
      return basename(url.pathname);
    } catch (err) {
      return basename(file);
    }
  } else {
    return basename(file);
  }
}

/**
 * Get the name of an ioBroker object.
 * The name in the common object may be a single string or an object containing
 * the translations. If it's an object, the 'en' translation will be used.
 * @param common The common object of an ioBroker object.
 * @returns The object name.
 */
export function getObjName (common: ioBroker.ObjectCommon): string {
  if (typeof common.name === 'string') {
    return common.name;
  }

  return common.name['en'];
}

/**
 * Get the unique username of a discord user or the tag if no unique name is set.
 * @param user The discord user.
 * @returns The username or tag.
 */
export function userNameOrTag (user: User): string {
  return user.discriminator === '0' ? user.username : user.tag;
}
