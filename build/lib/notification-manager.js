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
var notification_manager_exports = {};
__export(notification_manager_exports, {
  getNewestDate: () => getNewestDate
});
module.exports = __toCommonJS(notification_manager_exports);
function getNewestDate(messages, locale) {
  messages.sort((a, b) => a.ts < b.ts ? 1 : -1);
  return new Date(messages[0].ts).toLocaleString(locale);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getNewestDate
});
//# sourceMappingURL=notification-manager.js.map
