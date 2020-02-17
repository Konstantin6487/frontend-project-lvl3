import i18n from 'i18next';
import enTranslation from '../../locales/en/translation.json';

const resources = {
  en: {
    translation: enTranslation,
  },
};

i18n.init({
  lng: 'en',
  debug: true,
  resources,
});

export default i18n;
