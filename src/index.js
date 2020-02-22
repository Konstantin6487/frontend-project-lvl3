import 'core-js/stable';
import 'regenerator-runtime/runtime';
import i18n from 'i18next';

import 'bootstrap';
import '../scss/app.scss';

import run from './application';

import enTranslation from '../locales/en/translation.json';

i18n.init({
  lng: 'en',
  debug: true,
  resources: {
    en: {
      translation: enTranslation,
    },
  },
}).then(run);
