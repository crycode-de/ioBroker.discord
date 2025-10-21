"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var i18n_exports = {};
__export(i18n_exports, {
  i18n: () => i18n
});
module.exports = __toCommonJS(i18n_exports);
var import_de = __toESM(require("../../admin/i18n/de.json"));
var import_en = __toESM(require("../../admin/i18n/en.json"));
var import_es = __toESM(require("../../admin/i18n/es.json"));
var import_fr = __toESM(require("../../admin/i18n/fr.json"));
var import_it = __toESM(require("../../admin/i18n/it.json"));
var import_nl = __toESM(require("../../admin/i18n/nl.json"));
var import_pl = __toESM(require("../../admin/i18n/pl.json"));
var import_pt = __toESM(require("../../admin/i18n/pt.json"));
var import_ru = __toESM(require("../../admin/i18n/ru.json"));
var import_zh_cn = __toESM(require("../../admin/i18n/zh-cn.json"));
class I18n {
  /**
   * Language configured in `system.config` object.
   */
  language = "en";
  /**
   * If float numbers should be displayed using a comma instead of a dot.
   */
  isFloatComma = false;
  /**
   * Get a translation object or a single string for a given translation key.
   * Uses the i18n files in `admin/i18n`.
   * @param key The key from `en.json`.
   * @param args Array of strings to be inserted at `%s` in the translated strings.
   */
  getStringOrTranslated(key, ...args) {
    if (import_en.default[key]) {
      return {
        de: this.replacePlaceholders(import_de.default[key] ?? key, ...args),
        en: this.replacePlaceholders(import_en.default[key] ?? key, ...args),
        es: this.replacePlaceholders(import_es.default[key] ?? key, ...args),
        fr: this.replacePlaceholders(import_fr.default[key] ?? key, ...args),
        it: this.replacePlaceholders(import_it.default[key] ?? key, ...args),
        nl: this.replacePlaceholders(import_nl.default[key] ?? key, ...args),
        pl: this.replacePlaceholders(import_pl.default[key] ?? key, ...args),
        pt: this.replacePlaceholders(import_pt.default[key] ?? key, ...args),
        ru: this.replacePlaceholders(import_ru.default[key] ?? key, ...args),
        "zh-cn": this.replacePlaceholders(import_zh_cn.default[key] ?? key, ...args)
      };
    } else {
      return key;
    }
  }
  /**
   * Get a translated string string for a given translation key and language.
   * Uses the i18n files in `admin/i18n`.
   * @param key The key from `en.json`.
   * @param args Array of strings to be inserted at `%s` in the translated string.
   */
  getString(key, ...args) {
    let str;
    switch (this.language) {
      /* eslint-disable @stylistic/max-statements-per-line */
      case "de":
        str = import_de.default[key] ?? key;
        break;
      case "en":
        str = import_en.default[key] ?? key;
        break;
      case "es":
        str = import_es.default[key] ?? key;
        break;
      case "fr":
        str = import_fr.default[key] ?? key;
        break;
      case "it":
        str = import_it.default[key] ?? key;
        break;
      case "nl":
        str = import_nl.default[key] ?? key;
        break;
      case "pl":
        str = import_pl.default[key] ?? key;
        break;
      case "pt":
        str = import_pt.default[key] ?? key;
        break;
      case "ru":
        str = import_ru.default[key] ?? key;
        break;
      case "zh-cn":
        str = import_zh_cn.default[key] ?? key;
        break;
      /* eslint-enable @stylistic/max-statements-per-line */
      default:
        str = key;
    }
    return this.replacePlaceholders(str, ...args);
  }
  /**
   * Replace `%s` placeholders in the given text.
   * @param text The text.
   * @param args Array of strings to be inserted at `%s` in the text.
   */
  replacePlaceholders(text, ...args) {
    for (const s of args) {
      text = text.replace("%s", s);
    }
    return text;
  }
}
const i18n = new I18n();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  i18n
});
//# sourceMappingURL=i18n.js.map
