
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