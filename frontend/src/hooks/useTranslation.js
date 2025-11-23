import { useSettings } from 'context/SettingsContext';
import { translations } from '../translations';

export function useTranslation() {
    const { settings } = useSettings();
    const lang = settings?.language || 'en';

    const t = (key) => {
        const keys = key.split('.');
        let value = translations[lang] || translations['en'];
        for (const k of keys) {
            value = value?.[k];
        }
        if (value) return value;

        // Fallback to English
        let fallback = translations['en'];
        for (const k of keys) {
            fallback = fallback?.[k];
        }
        return fallback || key;
    };

    return { t, lang };
}
