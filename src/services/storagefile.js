// storage.js
import { Preferences } from '@capacitor/preferences';

const storage =
 {

    async set(key1, value) {
        await Preferences.set({
          key: key1,
          value: JSON.stringify(value)
        });
    },

    async get(key1) {
        try {
            const item = await Preferences.get({ key: key1 });
            if (!item || item.value === null || item.value === undefined) return null;
            return JSON.parse(item.value);
        } catch (e) {
            return null;
        }
    },

    async remove(key1) {
        await Preferences.remove({ key: key1 });
    },

    async clear() {
        await Preferences.clear();
        try {
            const deviceToken = localStorage.getItem('deviceToken');
            const hasSeenPrivacyPolicy = localStorage.getItem('RhasSeenPrivacyPolicy');
            localStorage.clear();
            sessionStorage.clear();
            if (deviceToken) localStorage.setItem('deviceToken', deviceToken);
            if (hasSeenPrivacyPolicy) localStorage.setItem('RhasSeenPrivacyPolicy', hasSeenPrivacyPolicy);
        } catch (e) {
            console.error('Error clearing browser storage:', e);
        }
    }
};

export default storage;
