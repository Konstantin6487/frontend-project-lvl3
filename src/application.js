import {
  differenceBy,
  isEmpty,
  uniqueId,
} from 'lodash-es';
import { isURL } from 'validator';
import getSelectors from './selectors';
import initWatchers from './view';
import parseRSS from './parsers';
import { buildUrl, validate } from './utils';

import axios from './lib/axios';

export default () => {
  const state = {
    connectionErrors: [],
    addingChannelProcess: {
      form: {
        data: {
          'feed-url': '',
        },
      },
      errors: [],
      state: 'idle', // idle | editing | processing | successed | rejected
      validationState: 'valid', // valid | invalid
    },
    itemsUIState: {
      viewDescriptionState: 'hide', // hide | show
      activeItem: '',
    },
    channels: [],
    items: [],
  };

  initWatchers(state);

  const selectors = getSelectors(document);
  const { form, modal, input } = selectors;

  const identifyChannelItems = (channelItems, channelId) => channelItems
    .map((item) => ({ ...item, channelId, id: Number(uniqueId()) }));

  const updateChannel = (url) => {
    const { items, channels } = state;
    return axios(url)
      .then((response) => {
        const parsed = parseRSS(response.data);
        const { channelData, channelItems: channelUpdatedItems } = parsed;

        const channelToUpdate = channels.find((channel) => channel.title === channelData.title);
        const channelOldItems = items.filter((item) => item.channelId === channelToUpdate.id);
        const channelNewItems = differenceBy(channelUpdatedItems, channelOldItems, 'title');
        if (isEmpty(channelNewItems)) {
          return;
        }
        const identifiedChannelNewItems = identifyChannelItems(channelNewItems, channelToUpdate.id);
        items.unshift(...identifiedChannelNewItems);
      })
      .finally(() => setTimeout(updateChannel, 5000, url));
  };

  input.addEventListener('focus', (e) => {
    state.addingChannelProcess.state = 'idle';
    e.target.select();
  });

  input.addEventListener('input', (e) => {
    const { target: { value } } = e;
    const { addingChannelProcess } = state;
    if (isEmpty(value)) {
      addingChannelProcess.state = 'idle';
      return;
    }
    addingChannelProcess.state = 'editing';
  });

  form.elements['feed-url'].addEventListener('input', (e) => {
    const { target: { value: fieldValue } } = e;
    const { channels, addingChannelProcess } = state;

    addingChannelProcess.form.data['feed-url'] = fieldValue;
    const formInputValue = addingChannelProcess.form.data['feed-url'];

    const validateConstraints = [
      {
        check: (val) => !isEmpty(val) && !isURL(val, { require_protocol: true }),
        message: 'validation.error.invalid_url',
      },
      {
        check: (val) => !isEmpty(val) && channels.some(({ feedURL }) => val === feedURL),
        message: 'validation.error.already_exists',
      },
    ];
    const validated = validate(formInputValue, validateConstraints);

    if (validated.isValid) {
      state.addingChannelProcess.validationState = 'valid';
    } else {
      const { message } = validated;
      addingChannelProcess.validationState = 'invalid';
      addingChannelProcess.errors.push(message);
    }
  });

  modal
    .querySelectorAll('[data-dismiss="modal"]')
    .forEach((closeBtn) => {
      closeBtn.addEventListener('click', () => {
        state.itemsUIState.viewDescriptionState = 'hide';
        state.itemsUIState.activeItem = '';
      });
    });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const {
      addingChannelProcess,
      connectionErrors,
      items,
      channels,
    } = state;

    addingChannelProcess.state = 'processing';
    addingChannelProcess.validationState = 'valid';

    const feedURL = addingChannelProcess.form.data['feed-url'];
    const buildedUrl = buildUrl(feedURL);

    axios(buildedUrl).then((response) => {
      const parsed = parseRSS(response.data);
      const { channelData, channelItems: channelUpdatedItems } = parsed;

      channelData.id = Number(uniqueId());
      channelData.feedURL = feedURL;

      const identifiedChannelUpdatedItems = identifyChannelItems(
        channelUpdatedItems,
        channelData.id,
      );

      addingChannelProcess.form.data['feed-url'] = '';
      addingChannelProcess.state = 'successed';
      channels.push(channelData);
      items.push(...identifiedChannelUpdatedItems);
    })
      .then(() => setTimeout(updateChannel, 5000, buildedUrl))
      .catch((error) => {
        const errorMessage = error.message || 'alert.error.connection_error';
        addingChannelProcess.state = 'rejected';
        connectionErrors.push(errorMessage);
      });
  });
};
