import {
  isEmpty,
  head,
  get,
  uniqueId,
  last,
} from 'lodash-es';
import * as jquery from 'jquery';
// eslint-disable-next-line no-unused-vars
import * as bootstrap from 'bootstrap';
import { watch } from 'melanke-watchjs';
import { isURL } from 'validator';
import BaseLayout from './BaseLayout';
import template from './template';
import httpClient from './configHttpClient';
import '../scss/app.scss';

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

  const renderChannelList = () => {
    const ul = document.getElementsByClassName('nav-tabs')[0];
    ul.innerHTML = '';
    state.channels.forEach((channel) => {
      const li = document.createElement('li');
      li.classList.add('nav-item', 'pl-3');
      li.innerHTML = `<a href="#${channel.id}" class="nav-link font-weight-bold text-light shadow-lg border-0">#${channel.title}</a>`;
      ul.appendChild(li);
    });
  };

  const renderChannelTape = () => {
    const itemsContainer = document.querySelector('.items-container > ul');
    itemsContainer.innerHTML = '';
    state.channels
      .forEach((channel) => {
        const items = state.items.filter((item) => item.channelId === channel.id);
        const section = document.createElement('section');
        section.classList.add('mb-4');
        section.innerHTML = `<dl class="p-2 bg-dark text-white border"><dt id=${channel.id}>${channel.title}</dt><dd class="font-italic">${channel.description}</dl>`;

        const ul = document.createElement('ul');
        items.forEach((item) => {
          const li = document.createElement('li');
          li.classList.add('list-group-item', 'mb-2');
          li.innerHTML = `<div><button type="button" class="mr-3 btn btn-info btn-sm">Show</button><a href=${item.link} target="_blank">${item.title}</a></div>`;
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

  const root = document.getElementById('root');
  const layout = new BaseLayout(root);
  layout.init(template);

  const [form] = document.getElementsByTagName('form');
  const input = document.getElementById('feedUrl');

  watch(state, 'itemsUIState', () => {
    const modal = jquery('#exampleModal');
    const viewDescriptionState = get(state, ['itemsUIState', 'viewDescriptionState']);
    const activeItem = get(state, ['itemsUIState', 'activeItem']);
    if (viewDescriptionState === 'show') {
      const activeItemData = state.items.find((item) => item.id === activeItem);
      if (!activeItemData) { return; }
      modal.find('.modal-title').text(activeItemData.title);
      modal.find('.modal-body').text(activeItemData.description);
      modal.modal('show');
      return;
    }
    if (viewDescriptionState === 'hide') {
      modal.modal('hide');
    }
  });

  watch(state, 'channels', renderChannelList);
  watch(state, 'channels', renderChannelTape);

  watch(state, 'addingChannelProcess', () => {
    const btn = form.querySelector('#button-submit');
    if (state.addingChannelProcess.state === 'successed') {
      input.removeAttribute('disabled');
      input.value = '';
      btn.innerHTML = '';
      btn.textContent = 'Sync';
      return;
    }
    if (state.addingChannelProcess.state === 'rejected') {
      input.removeAttribute('disabled');
      input.value = '';
      btn.innerHTML = '';
      btn.textContent = 'Sync';

      const alert = document.createElement('div');
      alert.setAttribute('role', 'alert');
      alert.classList.add('alert', 'alert-danger');
      alert.textContent = last(state.connectionErrors);
      form.appendChild(alert);
      return;
    }
    if (state.addingChannelProcess.state === 'processing') {
      input.setAttribute('disabled', '');
      btn.setAttribute('disabled', '');
      btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      Loading...`;
      return;
    }
    if (state.addingChannelProcess.state === 'idle') {
      const alert = form.querySelector('.alert');
      if (alert) { form.removeChild(alert); }
    }
  });

  watch(state, 'addingChannelProcess', () => {
    const btn = form.querySelector('#button-submit');
    const feedback = form.querySelector('.feedback');
    if (state.addingChannelProcess.validationState === 'invalid') {
      feedback.className = 'feedback invalid-feedback font-weight-bold';
      feedback.textContent = last(state.addingChannelProcess.errors);
      input.classList.remove('is-valid');
      input.classList.add('is-invalid');
      btn.setAttribute('disabled', '');
      return;
    }
    if (state.addingChannelProcess.validationState === 'valid') {
      feedback.className = 'feedback is-valid';
      feedback.textContent = '';
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
      btn.removeAttribute('disabled');
      return;
    }
    feedback.className = 'feedback';
    feedback.innerHTML = '';
    input.classList.remove('is-valid', 'is-invalid');
    btn.setAttribute('disabled', '');
  });

  input.addEventListener('focus', (e) => {
    state.addingChannelProcess.state = 'idle';
    e.target.select();
  });

  document
    .getElementsByClassName('modal')[0]
    .querySelectorAll('[data-dismiss="modal"]')
    .forEach((closeBtn) => {
      closeBtn.addEventListener('click', () => {
        state.itemsUIState.viewDescriptionState = 'hide';
        state.itemsUIState.activeItem = '';
      });
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
    if (state.channels.some((channel) => channel.link === value)) {
      state.addingChannelProcess.validationState = 'invalid';
      state.addingChannelProcess.errors = [...state.addingChannelProcess.errors, 'This channel is already exists'];
      return;
    }
    state.addingChannelProcess.validationState = 'valid';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (state.addingChannelProcess.validationState !== 'valid') {
      return;
    }
    state.addingChannelProcess.state = 'processing';
    state.addingChannelProcess.validationState = '';

    const formData = new FormData(e.target);
    const feedURL = formData.get('feed-url');
    httpClient.get(feedURL).then((response) => {
      state.addingChannelProcess.state = 'successed';

      const contentTypeHeader = get(response, ['headers', 'content-type']);
      const contentType = head(contentTypeHeader.split(';'));
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.data, contentType === 'application/rss+xml' ? 'application/xml' : contentType);
      const title = doc
        .querySelector('channel > title')
        .textContent;
      const description = doc
        .querySelector('channel > description')
        .textContent;
      const channelId = state.maxId + uniqueId();
      const channelData = {
        link: feedURL,
        title,
        description,
        id: channelId,
      };
      state.channels = [...state.channels, channelData];
      const items = Array.from(doc.querySelectorAll('channel > item'));
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
    }).catch((error) => {
      const errorMessage = error.message || 'Connection error';
      state.addingChannelProcess.state = 'rejected';
      state.connectionErrors = [
        ...state.connectionErrors,
        errorMessage,
      ];
    });
  });
};
