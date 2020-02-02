import {
  delay,
  differenceBy,
  isEmpty,
  head,
  get,
  uniqueId,
  last,
  noop,
} from 'lodash-es';
import { watch } from 'melanke-watchjs';
import { isURL } from 'validator';
import parseData from './parsers';

import httpClient from './configHttpClient';

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

  const updateChannel = (url) => httpClient.get(url)
    .then((response) => {
      const contentTypeHeader = get(response, ['headers', 'content-type']);
      const contentType = head(contentTypeHeader.split(';'));
      const parsed = parseData(response.data, contentType);

      const channelToUpdate = state.channels.find((channel) => channel.link === url);
      const { id } = channelToUpdate;
      const prevChannelItems = state.items.filter((item) => item.channelId === id);

      const newChannelItems = Array
        .from(parsed.querySelectorAll('channel > item'))
        .map((item) => {
          const itemLink = item.querySelector('link').textContent;
          const itemTitle = item.querySelector('title').textContent;
          const itemDescription = item.querySelector('description').textContent;
          const itemId = state.maxId + uniqueId();
          const itemData = {
            link: itemLink,
            description: itemDescription,
            title: itemTitle,
            channelId: id,
            id: itemId,
          };
          return itemData;
        });
      const diff = differenceBy(newChannelItems, prevChannelItems, 'title');
      if (isEmpty(diff)) {
        return;
      }
      state.items = [...diff, ...state.items];
    })
    .catch(console.error)
    .finally(() => delay(updateChannel, 5000, url));

  const renderChannelList = (...args) => {
    const { channels } = state;
    const { navTabs, sidebar } = selectors;
    if (isEmpty(channels)) { return; }
    const [, , , oldList] = args;
    if (isEmpty(oldList)) {
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
    if (addingChannelProcessState === 'successed') {
      input.removeAttribute('disabled');
      input.value = '';
      submitBtn.innerHTML = '';
      submitBtn.textContent = 'Sync';
      return;
    }
    if (addingChannelProcessState === 'rejected') {
      input.removeAttribute('disabled');
      input.value = '';
      submitBtn.innerHTML = '';
      submitBtn.textContent = 'Sync';

      const alert = document.createElement('div');
      alert.setAttribute('role', 'alert');
      alert.classList.add('alert', 'alert-danger');
      alert.textContent = last(connectionErrors);
      form.appendChild(alert);
      return;
    }
    if (addingChannelProcessState === 'processing') {
      input.setAttribute('disabled', '');
      submitBtn.setAttribute('disabled', '');
      submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      Loading...`;
      return;
    }
    if (addingChannelProcessState === 'idle') {
      const alert = form.querySelector('.alert');
      if (alert) { form.removeChild(alert); }
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
      state.addingChannelProcess.errors = [...state.addingChannelProcess.errors, 'Invalid URL'];
      return;
    }
    const isChannelUrlExist = channels.some(({ link }) => link === value);
    if (isChannelUrlExist) {
      state.addingChannelProcess.validationState = 'invalid';
      state.addingChannelProcess.errors = [...state.addingChannelProcess.errors, 'This channel is already exists'];
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
    httpClient.get(feedURL).then((response) => {
      const contentTypeHeader = get(response, ['headers', 'content-type']);
      const contentType = head(contentTypeHeader.split(';'));
      const parsed = parseData(response.data, contentType);

      if (parsed.querySelector('channel') === null) {
        return Promise.reject(new Error('Parsing error'));
      }

      const title = parsed.querySelector('channel > title').textContent;
      const description = parsed.querySelector('channel > description').textContent;
      const channelId = state.maxId + uniqueId();
      const channelData = {
        link: feedURL,
        title,
        description,
        id: channelId,
      };

      state.addingChannelProcess.state = 'successed';
      state.channels = [...state.channels, channelData];

      const items = Array.from(parsed.querySelectorAll('channel > item'));
      items.forEach((item) => {
        const itemLink = item.querySelector('link').textContent;
        const itemTitle = item.querySelector('title').textContent;
        const itemDescription = item.querySelector('description').textContent;
        const itemId = state.maxId + uniqueId();
        const itemData = {
          link: itemLink,
          description: itemDescription,
          title: itemTitle,
          channelId: channelData.id,
          id: itemId,
        };
        state.items = [...state.items, itemData];
      });
      return Promise.resolve();
    }).then(() => delay(noop, 5000))
      .then(() => updateChannel(feedURL))
      .catch((error) => {
        console.error(error);
        const errorMessage = error.message || 'Connection error';
        state.addingChannelProcess.state = 'rejected';
        state.connectionErrors = [
          ...state.connectionErrors,
          errorMessage,
        ];
      });
  });
};
