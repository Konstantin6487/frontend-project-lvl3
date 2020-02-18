export default (root) => ({
  sidebar: root.querySelector('#sidebar'),
  navTabs: root.querySelector('.nav-tabs'),
  itemsContainer: root.querySelector('.items-container > ul'),
  form: root.querySelector('form'),
  input: root.querySelector('#feedUrl'),
  submitBtn: root.querySelector('#button-submit'),
  modal: root.querySelector('#channelItemModal'),
  feedback: root.querySelector('.feedback'),
});
