"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var utils_exports = {};
__export(utils_exports, {
  getBasenameFromFilePathOrUrl: () => getBasenameFromFilePathOrUrl,
  getBufferAndNameFromBase64String: () => getBufferAndNameFromBase64String,
  getObjName: () => getObjName,
  userNameOrTag: () => userNameOrTag
});
module.exports = __toCommonJS(utils_exports);
var import_node_path = require("node:path");
var import_node_url = require("node:url");
function getBufferAndNameFromBase64String(base64String, name) {
  const b64match = /^data:([^/]+)\/([^;]+);base64,([a-zA-Z0-9+/]+=*)$/.exec(base64String);
  if (!b64match) {
    return null;
  }
  const buffer = Buffer.from(b64match[3], "base64");
  if (!name) {
    name = `${b64match[1].replace(/\W/g, "_")}.${b64match[2].replace(/\W/g, "_")}`;
  }
  return {
    buffer,
    name
  };
}
function getBasenameFromFilePathOrUrl(file) {
  if (/^\w+:\/\//.exec(file)) {
    try {
      const url = new import_node_url.URL(file);
      return (0, import_node_path.basename)(url.pathname);
    } catch (_err) {
      return (0, import_node_path.basename)(file);
    }
  } else {
    return (0, import_node_path.basename)(file);
  }
}
function getObjName(common) {
  if (typeof common.name === "string") {
    return common.name;
  }
  return common.name.en;
}
function userNameOrTag(user) {
  return user.discriminator === "0" ? user.username : user.tag;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getBasenameFromFilePathOrUrl,
  getBufferAndNameFromBase64String,
  getObjName,
  userNameOrTag
});
//# sourceMappingURL=utils.js.map
