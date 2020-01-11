import {
  isEmpty,
  head,
  get,
  uniqueId,
  last,
} from 'lodash-es';
import { watch } from 'melanke-watchjs';
import { isURL } from 'validator';
import BaseLayout from './BaseLayout';
import httpClient from './configHttpClient';
import '../scss/app.scss';

export default () => {
  const state = {
    addingChannelProcess: {
      errors: [],
      state: 'idle', // idle | editing | processing | successed
      validationState: 'idle', // idle | invalid | valid
    },
    channels: [],
    items: [],
  };

  const root = document.getElementById('root');
  const layout = new BaseLayout(root);
  layout.init();

  const [form] = document.getElementsByTagName('form');

  watch(state, 'channels', () => {
    const ul = document.getElementsByClassName('nav-tabs')[0];
    ul.innerHTML = '';
    state.channels.forEach((channel) => {
      const li = document.createElement('li');
      li.classList.add('nav-item', 'pl-3');
      li.innerHTML = `<a href="#${channel.id}" class="nav-link font-weight-bold text-light shadow-lg border-0">#${channel.title}</a>`;
      ul.appendChild(li);
    });
  });

  watch(state, 'addingChannelProcess', (prop, _, value) => {
    console.log(`${prop}: ${value}`);
    const input = document.getElementById('feedUrl');
    const btn = form.querySelector('#button-submit');
    if (state.addingChannelProcess.state === 'successed') {
      input.removeAttribute('disabled');
      input.value = '';
      btn.innerHTML = '';
      btn.textContent = 'Sync';
      return;
    }
    if (state.addingChannelProcess.state === 'processing') {
      input.setAttribute('disabled', '');
      btn.setAttribute('disabled', '');
      btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      Loading...`;
    }
  }, 1);

  watch(state, 'addingChannelProcess', () => {
    const btn = form.querySelector('#button-submit');
    const input = form.querySelector('#feedUrl');
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
  }, 1);

  watch(state, 'channels', () => {
    const itemsContainer = document.querySelector('section > ul');
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
          li.innerHTML = `<a href=${item.link} target="_blank">${item.title}</a>`;
          ul.appendChild(li);
        });
        section.appendChild(ul);
        itemsContainer.appendChild(section);
      });
  });

  const input = document.getElementById('feedUrl');

  input.addEventListener('focus', (e) => {
    e.target.select();
  });

  input.addEventListener('input', (e) => {
    const { target: { value } } = e;
    if (isEmpty(value)) {
      state.addingChannelProcess.validationState = 'idle';
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

  input.addEventListener('input', (e) => {
    const { target: { value } } = e;
    if (isEmpty(value)) {
      state.addingChannelProcess.state = 'idle';
      return;
    }
    if (!isEmpty(value)) {
      state.addingChannelProcess.state = 'editing';
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (state.addingChannelProcess.validationState !== 'valid') {
      return;
    }
    state.addingChannelProcess.state = 'processing';
    state.addingChannelProcess.validationState = 'idle';

    const formData = new FormData(e.target);
    const feedURL = formData.get('feed-url');
    httpClient.get(feedURL).then((response) => {
      state.addingChannelProcess.state = 'successed';

      const contentTypeHeader = get(response, ['headers', 'content-type']);
      const contentType = head(contentTypeHeader.split(';'));
      console.log(contentType);
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.data, contentType === 'application/rss+xml' ? 'application/xml' : contentType);
      const title = doc
        .querySelector('channel > title')
        .textContent;
      const description = doc
        .querySelector('channel > description')
        .textContent;
      const channelData = {
        link: feedURL,
        title,
        description,
        id: uniqueId(),
      };
      state.channels = [...state.channels, channelData];
      console.log(state.channels);
      const items = Array.from(doc.querySelectorAll('channel > item'));
      items.forEach((item) => {
        const link = item.querySelector('link').textContent;
        const linkTitle = item.querySelector('title').textContent;
        const itemData = {
          link,
          title: linkTitle,
          channelId: channelData.id,
          id: uniqueId(),
        };
        state.items = [...state.items, itemData];
      });
    });
  });
};
