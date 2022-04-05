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

type I18nObj = typeof en;
type I18nKey = keyof I18nObj;

/**
 * Get a translation object or a single string for a given translation key.
 * Uses the i18n files in `admin/i18n`.
 * @param key The key from `en.json`.
 */
export function getI18nStringOrTranslated (key: I18nKey): ioBroker.StringOrTranslated {
  if (en[key]) {
    return {
      de: (de as I18nObj)[key] || key,
      en: en[key] || key,
      es: (es as I18nObj)[key] || key,
      fr: (fr as I18nObj)[key] || key,
      it: (it as I18nObj)[key] || key,
      nl: (nl as I18nObj)[key] || key,
      pl: (pl as I18nObj)[key] || key,
      pt: (pt as I18nObj)[key] || key,
      ru: (ru as I18nObj)[key] || key,
      'zh-cn': (zhCn as I18nObj)[key] || key,
    };
  } else {
    return key;
  }
}