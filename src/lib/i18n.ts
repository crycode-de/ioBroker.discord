import de from '../../admin/i18n/de.json';
import en from '../../admin/i18n/en.json';
import es from '../../admin/i18n/es.json';
import fr from '../../admin/i18n/fr.json';
import it from '../../admin/i18n/it.json';
import nl from '../../admin/i18n/nl.json';
import pl from '../../admin/i18n/pl.json';
import pt from '../../admin/i18n/pt.json';
import ru from '../../admin/i18n/ru.json';
import zhCn from '../../admin/i18n/zh-cn.json';

type I18nObj = Partial<typeof en>;
type I18nKey = keyof I18nObj;

/**
 * Internationalization class to handle translations.
 */
class I18n {

  /**
   * Language configured in `system.config` object.
   */
  public language: ioBroker.Languages = 'en';

  /**
   * If float numbers should be displayed using a comma instead of a dot.
   */
  public isFloatComma: boolean = false;

  /**
   * Get a translation object or a single string for a given translation key.
   * Uses the i18n files in `admin/i18n`.
   * @param key The key from `en.json`.
   * @param args Array of strings to be inserted at `%s` in the translated strings.
   */
  public getStringOrTranslated (key: I18nKey, ...args: string[]): ioBroker.StringOrTranslated {
    if (en[key]) {
      return {
        de: this.replacePlaceholders((de as I18nObj)[key] ?? key, ...args),
        en: this.replacePlaceholders((en as I18nObj)[key] ?? key, ...args),
        es: this.replacePlaceholders((es as I18nObj)[key] ?? key, ...args),
        fr: this.replacePlaceholders((fr as I18nObj)[key] ?? key, ...args),
        it: this.replacePlaceholders((it as I18nObj)[key] ?? key, ...args),
        nl: this.replacePlaceholders((nl as I18nObj)[key] ?? key, ...args),
        pl: this.replacePlaceholders((pl as I18nObj)[key] ?? key, ...args),
        pt: this.replacePlaceholders((pt as I18nObj)[key] ?? key, ...args),
        ru: this.replacePlaceholders((ru as I18nObj)[key] ?? key, ...args),
        'zh-cn': this.replacePlaceholders((zhCn as I18nObj)[key] ?? key, ...args),
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
  public getString (key: I18nKey, ...args: string[]): string {
    let str: string;
    switch (this.language) {
      case 'de': str = (de as I18nObj)[key] ?? key; break;
      case 'en': str = (en as I18nObj)[key] ?? key; break;
      case 'es': str = (es as I18nObj)[key] ?? key; break;
      case 'fr': str = (fr as I18nObj)[key] ?? key; break;
      case 'it': str = (it as I18nObj)[key] ?? key; break;
      case 'nl': str = (nl as I18nObj)[key] ?? key; break;
      case 'pl': str = (pl as I18nObj)[key] ?? key; break;
      case 'pt': str = (pt as I18nObj)[key] ?? key; break;
      case 'ru': str = (ru as I18nObj)[key] ?? key; break;
      case 'zh-cn': str = (zhCn as I18nObj)[key] ?? key; break;
      default: str = key;
    }

    return this.replacePlaceholders(str, ...args);
  }

  /**
   * Replace `%s` placeholders in the given text.
   * @param text The text.
   * @param args Array of strings to be inserted at `%s` in the text.
   */
  private replacePlaceholders (text: string, ...args: string[]) : string {
    for (const s of args) {
      text = text.replace('%s', s);
    }

    return text;
  }
}

/**
 * Singleton instance of the I18n class.
 */
export const i18n = new I18n();
