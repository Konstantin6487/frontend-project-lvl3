import { uniqueId } from 'lodash-es';

export default (data, { maxId, feedURL, channelId }) => {
  const instance = new DOMParser();
  const content = instance.parseFromString(data, 'application/xml');

  const channel = content.querySelector('channel');
  if (!channel) {
    const errorMessage = 'alert.error.parsing_error';
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
