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
var definitions_exports = {};
__export(definitions_exports, {
  ACTIVITY_TYPES: () => ACTIVITY_TYPES,
  VALID_PRESENCE_STATUS_DATA: () => VALID_PRESENCE_STATUS_DATA
});
module.exports = __toCommonJS(definitions_exports);
const VALID_PRESENCE_STATUS_DATA = ["online", "idle", "dnd", "invisible"];
const ACTIVITY_TYPES = ["", "Playing", "Streaming", "Listening", "Watching", "Custom", "Competing"];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ACTIVITY_TYPES,
  VALID_PRESENCE_STATUS_DATA
});
//# sourceMappingURL=definitions.js.map
