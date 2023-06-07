/**
 * Types from the notification-manager adapter to get correct typings for the message object.
 * https://github.com/foxriver76/ioBroker.notification-manager/blob/main/src/main.ts
 */

type Severity = 'alert' | 'info' | 'notify';

interface NotificationCategory {
  instances: {
    [adapterInstance: string]: {
      messages: NotificationInstanceMessage[];
    };
  };
  /** i18n description of category */
  description: Record<string, string>;
  /** i18n name of category */
  name: Record<string, string>;
  severity: Severity;
}

/** Notifications category where i18n objects are already translated */
interface LocalizedNotificationCategory extends Omit<NotificationCategory, 'description' | 'name'> {
  description: string;
  name: string;
}

interface NotificationScope {
  /** i18n description of scope */
  description: Record<string, string>;
  /** i18n name of scope */
  name: Record<string, string>;
  categories: {
    [category: string]: NotificationCategory;
  };
}

/** Notifications scope where i18n objects are already translated */
interface LocalizedNotificationScope extends Omit<NotificationScope, 'description' | 'name'> {
  description: string;
  name: string;
}

interface NotificationInstanceMessage {
  message: string;
  ts: number;
}

export interface LocalizedNotification {
  /** host where the notification belongs too */
  host: string;
  /** The localized scope of the notification */
  scope: Omit<LocalizedNotificationScope, 'categories'>;
  /** The localized category of the notification */
  category: LocalizedNotificationCategory;
}

/**
 * Extract the newest date out of a notification messages array as local date
 */
export function getNewestDate (messages: NotificationInstanceMessage[], locale?: string): string {
  messages.sort((a, b) => a.ts < b.ts ? 1 : -1);
  return new Date(messages[0].ts).toLocaleString(locale);
}
