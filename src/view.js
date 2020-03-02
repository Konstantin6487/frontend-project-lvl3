import { watch } from 'melanke-watchjs';
import { last, isEmpty, get } from 'lodash-es';
import i18n from 'i18next';
import getSelectors from './selectors';

const selectors = getSelectors(document);

export default (state) => {
  const handleItemsUIStateChange = () => {
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
      return;
    }
    const errorMessage = i18n.t(
      'log.unknown_itemsUIState_viewDescriptionState',
      { state: viewDescriptionState },
    );
    throw new Error(errorMessage);
  };

  const handleChannelsStateChange = () => {
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

  const handleChannelItemsStateChange = () => {
    const { channels, items, itemsUIState } = state;
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
          li.innerHTML = `<div><button type="button" class="mr-3 btn btn-info btn-sm">${i18n.t('template.channel_item.preview')}</button><a href=${item.link} target="_blank">${item.title}</a></div>`;
          li.querySelector('button').addEventListener('click', () => {
            itemsUIState.viewDescriptionState = 'show';
            itemsUIState.activeItem = item.id;
          });
          ul.appendChild(li);
        });
        section.appendChild(ul);
        itemsContainer.appendChild(section);
      });
  };

  const handleAddingChannelProcessStateChange = () => {
    const { connectionErrors } = state;
    const { form, input } = selectors;
    const addingChannelProcessState = get(state, ['addingChannelProcess', 'state']);
    const { submitBtn } = selectors;
    const alert = document.createElement('div');
    const formAlert = form.querySelector('.alert');
    const errorMessage = i18n.t(
      'log.unknown_addingchannel_process_state',
      { state: addingChannelProcessState },
    );

    switch (addingChannelProcessState) {
      case 'successed':
        input.removeAttribute('disabled');
        input.value = '';
        submitBtn.innerHTML = '';
        submitBtn.textContent = `${i18n.t('template.submit_btn.sync')}`;
        return;
      case 'rejected':
        input.removeAttribute('disabled');
        input.value = '';
        submitBtn.innerHTML = '';
        submitBtn.textContent = `${i18n.t('template.submit_btn.sync')}`;

        alert.setAttribute('role', 'alert');
        alert.classList.add('alert', 'alert-danger');
        alert.textContent = i18n.t(last(connectionErrors));
        form.appendChild(alert);
        return;
      case 'processing':
        input.setAttribute('disabled', '');
        submitBtn.setAttribute('disabled', '');
        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        ${i18n.t('template.submit_btn.loading')}`;
        return;
      case 'idle':
        if (formAlert) { form.removeChild(formAlert); }
        return;
      case 'editing':
        return;
      default:
        throw new Error(errorMessage);
    }
  };

  const handleValidationStateChange = () => {
    const validationState = get(state, ['addingChannelProcess', 'validationState']);
    const { input } = selectors;
    const errors = get(state, ['addingChannelProcess', 'errors']);
    const { feedback, submitBtn } = selectors;
    if (validationState === 'invalid') {
      feedback.className = 'feedback invalid-feedback font-weight-bold';
      const error = last(errors);
      feedback.textContent = i18n.t(error);
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
      if (state.addingChannelProcess.state === 'processing') {
        submitBtn.setAttribute('disabled', '');
      } else { submitBtn.removeAttribute('disabled'); }
      return;
    }
    const errorMessage = i18n.t(
      'log.unknown_addingChannelProcess_validationState',
      { state: validationState },
    );
    throw new Error(errorMessage);
  };

  watch(state, 'itemsUIState', () => {
    try { handleItemsUIStateChange(); } catch (e) { console.error(e); }
  });

  watch(state, 'channels', () => {
    try { handleChannelsStateChange(); } catch (e) { console.error(e); }
  });

  watch(state, ['channels', 'items'], () => {
    try { handleChannelItemsStateChange(); } catch (e) { console.error(e); }
  });

  watch(state, 'addingChannelProcess', () => {
    try { handleAddingChannelProcessStateChange(); } catch (e) { console.error(e); }
  });

  watch(state, 'addingChannelProcess', () => {
    try { handleValidationStateChange(); } catch (e) { console.error(e); }
  });
};
