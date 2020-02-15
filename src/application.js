import {
  delay,
  differenceBy,
  isEmpty,
  get,
  last,
} from 'lodash-es';
import { watch } from 'melanke-watchjs';
import { isURL } from 'validator';
import {
  parseDOMStr,
  parseToChannelData,
  parseToChannelItems,
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

  const selectors = {
    sidebar: document.querySelector('#sidebar'),
    navTabs: document.querySelector('.nav-tabs'),
    itemsContainer: document.querySelector('.items-container > ul'),
    form: document.querySelector('form'),
    input: document.querySelector('#feedUrl'),
    submitBtn: document.querySelector('#button-submit'),
    modal: document.querySelector('#channelItemModal'),
    feedback: document.querySelector('.feedback'),
  };

  const { form, modal, input } = selectors;

  const updateChannel = (url) => {
    const buildedUrl = buildUrl(url);
    return httpClient(buildedUrl)
      .then((response) => {
        const { items, maxId, channels } = state;

        const dom = parseDOMStr(response.data, 'application/xml');
        const channelToUpdate = channels.find((channel) => channel.link === url);
        const { id: channelId } = channelToUpdate;

        const prevChannelItems = items.filter((item) => item.channelId === channelId);
        const newChannelItems = parseToChannelItems(dom, { maxId, channelId });
        const diff = differenceBy(newChannelItems, prevChannelItems, 'title');
        if (isEmpty(diff)) {
          return;
        }
        state.items.unshift(...diff);
      })
      .catch(console.error)
      .finally(() => delay(updateChannel, 5000, url));
  };

  const renderChannelList = () => {
    const { channels } = state;
    const { navTabs, sidebar } = selectors;
    if (isEmpty(channels)) { return; }
    if (channels.length === 1) {
      sidebar.classList.remove('d-none');
    }
    navTabs.innerHTML = '';
    channels.forEach(({ id, title }) => {
      const li = document.createElement('li');
      li.classList.add('nav-item', 'pl-3');
      li.innerHTML = `<a href="#${id}" class="nav-link font-weight-bold text-light shadow-lg border-0">#${title}</a>`;
      navTabs.appendChild(li);
    });
  };

  const renderChannelTape = () => {
    const { channels, items } = state;
    const { itemsContainer } = selectors;
    itemsContainer.innerHTML = '';
    channels
      .forEach(({ id, title, description }) => {
        const channelItems = items.filter(({ channelId }) => channelId === id);
        const section = document.createElement('section');
        section.classList.add('mb-5');
        section.innerHTML = `<dl class="p-2 bg-dark text-white border"><dt id=${id}>${title}</dt><dd class="font-italic">${description}</dl>`;

        const ul = document.createElement('ul');
        channelItems.forEach((item) => {
          const li = document.createElement('li');
          li.classList.add('list-group-item', 'mb-2');
          li.innerHTML = `<div><button type="button" class="mr-3 btn btn-info btn-sm">Preview</button><a href=${item.link} target="_blank">${item.title}</a></div>`;
          li.querySelector('button').addEventListener('click', () => {
            state.itemsUIState.viewDescriptionState = 'show';
            state.itemsUIState.activeItem = item.id;
          });
          ul.appendChild(li);
        });
        section.appendChild(ul);
        itemsContainer.appendChild(section);
      });
  };

  watch(state, 'itemsUIState', () => {
    const { items } = state;
    const channelItemModal = jquery('#channelItemModal');
    const channelItemModalTitle = channelItemModal.find('.modal-title');
    const channelItemModalDescription = channelItemModal.find('.modal-body');
    const viewDescriptionState = get(state, ['itemsUIState', 'viewDescriptionState']);
    const activeItem = get(state, ['itemsUIState', 'activeItem']);
    if (viewDescriptionState === 'show') {
      const activeItemData = items.find(({ id }) => id === activeItem);
      if (!activeItemData) { return; }

      const { description, title } = activeItemData;
      channelItemModalTitle.text(title);
      channelItemModalDescription.text(description);
      channelItemModal.modal('show');
      return;
    }
    if (viewDescriptionState === 'hide') {
      channelItemModal.modal('hide');
      channelItemModalTitle.text('');
      channelItemModalDescription.text('');
    }
  });

  watch(state, 'channels', renderChannelList);
  watch(state, ['channels', 'items'], renderChannelTape);

  watch(state, 'addingChannelProcess', () => {
    const { connectionErrors } = state;
    const addingChannelProcessState = get(state, ['addingChannelProcess', 'state']);
    const { submitBtn } = selectors;
    const alert = document.createElement('div');
    const formAlert = form.querySelector('.alert');

    switch (addingChannelProcessState) {
      case 'successed':
        input.removeAttribute('disabled');
        input.value = '';
        submitBtn.innerHTML = '';
        submitBtn.textContent = 'Sync';
        return;
      case 'rejected':
        input.removeAttribute('disabled');
        input.value = '';
        submitBtn.innerHTML = '';
        submitBtn.textContent = 'Sync';

        alert.setAttribute('role', 'alert');
        alert.classList.add('alert', 'alert-danger');
        alert.textContent = last(connectionErrors);
        form.appendChild(alert);
        return;
      case 'processing':
        input.setAttribute('disabled', '');
        submitBtn.setAttribute('disabled', '');
        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Loading...`;
        return;
      case 'idle':
        if (formAlert) { form.removeChild(formAlert); }
        break;
      default:
        console.error('Invalid addingChannelProcess state');
        break;
    }
  });

  watch(state, 'addingChannelProcess', () => {
    const validationState = get(state, ['addingChannelProcess', 'validationState']);
    const errors = get(state, ['addingChannelProcess', 'errors']);
    const { feedback, submitBtn } = selectors;
    if (validationState === 'invalid') {
      feedback.className = 'feedback invalid-feedback font-weight-bold';
      feedback.textContent = last(errors);
      input.classList.remove('is-valid');
      input.classList.add('is-invalid');
      submitBtn.setAttribute('disabled', '');
      return;
    }
    if (validationState === 'valid') {
      feedback.className = 'feedback is-valid';
      feedback.textContent = '';
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
      submitBtn.removeAttribute('disabled');
      return;
    }
    if (validationState === '' && state.addingChannelProcess.state === 'processing') {
      submitBtn.setAttribute('disabled', '');
    } else { submitBtn.removeAttribute('disabled'); }
    feedback.className = 'feedback';
    feedback.innerHTML = '';
    input.classList.remove('is-valid', 'is-invalid');
  });

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

      const dom = parseDOMStr(response.data, 'application/xml');
      const channelData = parseToChannelData(dom, { maxId, feedURL });
      const newChannelItems = parseToChannelItems(
        dom,
        { maxId, channelId: channelData.id },
      );

      addingChannelProcess.state = 'successed';
      channels.push(channelData);
      items.push(...newChannelItems);
      return Promise.resolve();
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
