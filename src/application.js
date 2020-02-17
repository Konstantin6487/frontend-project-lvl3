import {
  delay,
  differenceBy,
  isEmpty,
} from 'lodash-es';
import { isURL } from 'validator';
import getSelectors from './selectors';
import view from './view';
import {
  parse,
  selectChannelContent,
} from './parsers';
import buildUrl from './utils';

import httpClient from './lib/axios';

export default () => {
  const state = {
    connectionErrors: [],
    addingChannelProcess: {
      errors: [],
      state: 'idle', // idle | editing | processing | successed | rejected
      validationState: '', // invalid | valid
    },
    itemsUIState: {
      viewDescriptionState: 'hide', // hide | show
      activeItem: '',
    },
    channels: [],
    items: [],
    maxId: 0,
  };

  view(state);

  const selectors = getSelectors();

  const { form, modal, input } = selectors;

  const updateChannel = (url) => {
    const buildedUrl = buildUrl(url);
    return httpClient(buildedUrl)
      .then((response) => {
        const { items, maxId, channels } = state;

        const model = parse(response.data, 'application/xml');
        const channelToUpdate = channels.find((channel) => channel.link === url);
        const { id: channelId } = channelToUpdate;

        const prevChannelItems = items.filter((item) => item.channelId === channelId);
        const channelContent = selectChannelContent(model, { maxId, channelId, feedURL: url });
        const { channelItems: newChannelItems } = channelContent;
        const diff = differenceBy(newChannelItems, prevChannelItems, 'title');
        if (isEmpty(diff)) {
          return;
        }
        state.items.unshift(...diff);
      })
      .catch(console.error)
      .finally(() => delay(updateChannel, 5000, url));
  };

  input.addEventListener('focus', (e) => {
    state.addingChannelProcess.state = 'idle';
    e.target.select();
  });

  input.addEventListener('input', (e) => {
    const { target: { value } } = e;
    if (isEmpty(value)) {
      state.addingChannelProcess.state = 'idle';
      return;
    }
    state.addingChannelProcess.state = 'editing';
  });

  input.addEventListener('input', (e) => {
    const { channels } = state;
    const { target: { value } } = e;
    if (isEmpty(value)) {
      state.addingChannelProcess.validationState = '';
      return;
    }
    if (!isURL(value, { require_protocol: true })) {
      state.addingChannelProcess.validationState = 'invalid';
      state.addingChannelProcess.errors.push('Invalid URL');
      return;
    }
    const isChannelUrlExist = channels.some(({ link }) => link === value);
    if (isChannelUrlExist) {
      state.addingChannelProcess.validationState = 'invalid';
      state.addingChannelProcess.errors.push('This channel is already exists');
      return;
    }
    state.addingChannelProcess.validationState = 'valid';
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

    state.addingChannelProcess.state = 'processing';
    state.addingChannelProcess.validationState = '';

    const formData = new FormData(e.target);
    const feedURL = formData.get('feed-url');

    const buildedUrl = buildUrl(feedURL);

    httpClient(buildedUrl).then((response) => {
      const {
        addingChannelProcess,
        items,
        channels,
        maxId,
      } = state;

      const model = parse(response.data, 'application/xml');
      const channelContent = selectChannelContent(model, { maxId, feedURL });
      const { channelData, channelItems: newChannelItems } = channelContent;

      addingChannelProcess.state = 'successed';
      channels.push(channelData);
      items.push(...newChannelItems);
    })
      .then(() => delay(updateChannel, 5000, feedURL))
      .catch((error) => {
        console.error(error);
        const errorMessage = error.message || 'Connection error';
        state.addingChannelProcess.state = 'rejected';
        state.connectionErrors.push(errorMessage);
      });
  });
};
