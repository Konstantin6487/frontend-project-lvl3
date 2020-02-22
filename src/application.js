import {
  delay,
  differenceBy,
  isEmpty,
  uniqueId,
} from 'lodash-es';
import i18n from 'i18next';
import { isURL } from 'validator';
import getSelectors from './selectors';
import initWatchers from './view';
import parse from './parsers';
import buildUrl from './utils';

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

  initWatchers(state);

  const selectors = getSelectors(document);
  const { form, modal, input } = selectors;

  const processChannelContent = (content, { maxId, feedURL, channelId }) => {
    const channel = content.querySelector('channel');
    if (!channel) {
      const errorMessage = i18n.t('alert.error.parsing_error');
      throw new Error(errorMessage);
    }
    const channelTitle = content.querySelector('channel > title').textContent;
    const channelDescription = content.querySelector('channel > description').textContent;
    const channelData = {
      link: feedURL,
      title: channelTitle,
      description: channelDescription,
      id: channelId || maxId + Number(uniqueId()),
    };

    const channelItemsList = content.querySelectorAll('channel > item');

    const channelItems = Array
      .from(channelItemsList)
      .map((item) => {
        const channelItemLink = item.querySelector('link').textContent;
        const channelItemTitle = item.querySelector('title').textContent;
        const channelItemDescription = item.querySelector('description').textContent;
        const itemData = {
          link: channelItemLink,
          title: channelItemTitle,
          description: channelItemDescription,
          channelId: channelData.id,
          id: channelData.id + Number(uniqueId()),
        };
        return itemData;
      });
    return ({ channelItems, channelData });
  };

  const updateChannel = (url) => {
    const { items, maxId, channels } = state;
    const buildedUrl = buildUrl(url);
    return axios(buildedUrl)
      .then((response) => {
        const parsed = parse(response.data, 'application/xml');
        const channelToUpdate = channels.find((channel) => channel.link === url);
        const { id: channelId } = channelToUpdate;

        const oldChannelItems = items.filter((item) => item.channelId === channelId);
        const channelUpdatedContent = processChannelContent(
          parsed,
          { maxId, channelId, feedURL: url },
        );
        const { channelItems: updatedChannelItems } = channelUpdatedContent;
        const diff = differenceBy(updatedChannelItems, oldChannelItems, 'title');
        if (isEmpty(diff)) {
          return;
        }
        items.unshift(...diff);
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
    const { addingChannelProcess } = state;
    if (isEmpty(value)) {
      addingChannelProcess.state = 'idle';
      return;
    }
    addingChannelProcess.state = 'editing';
  });

  form.elements['feed-url'].addEventListener('input', (e) => {
    const { target: { value } } = e;
    const { channels, addingChannelProcess } = state;

    addingChannelProcess.form.data['feed-url'] = value;
    const formInputValue = addingChannelProcess.form.data['feed-url'];
    if (isEmpty(formInputValue)) {
      addingChannelProcess.validationState = '';
      return;
    }
    if (!isURL(formInputValue, { require_protocol: true })) {
      addingChannelProcess.validationState = 'invalid';
      const errorMessage = i18n.t('validation.error.invalid_url');
      addingChannelProcess.errors.push(errorMessage);
      return;
    }
    const isChannelUrlExist = channels.some(({ link }) => link === formInputValue);
    if (isChannelUrlExist) {
      addingChannelProcess.validationState = 'invalid';
      const errorMessage = i18n.t('validation.error.already_exists');
      addingChannelProcess.errors.push(errorMessage);
      return;
    }
    addingChannelProcess.validationState = 'valid';
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
      maxId,
    } = state;

    addingChannelProcess.state = 'processing';
    addingChannelProcess.validationState = '';

    const feedURL = addingChannelProcess.form.data['feed-url'];

    const buildedUrl = buildUrl(feedURL);

    axios(buildedUrl).then((response) => {
      const parsed = parse(response.data, 'application/xml');
      const channelUpdatedContent = processChannelContent(
        parsed,
        { maxId, feedURL },
      );
      const { channelData, channelItems: updatedChannelItems } = channelUpdatedContent;

      addingChannelProcess.state = 'successed';
      channels.push(channelData);
      items.push(...updatedChannelItems);
    })
      .then(() => delay(updateChannel, 5000, feedURL))
      .catch((error) => {
        console.error(error);
        const errorMessage = error.message || i18n.t('alert.error.connection_error');
        addingChannelProcess.state = 'rejected';
        connectionErrors.push(errorMessage);
      });
  });
};
