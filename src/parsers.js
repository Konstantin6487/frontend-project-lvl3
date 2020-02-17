import { uniqueId } from 'lodash-es';

export const parse = (data, mimeType) => {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(data, mimeType);
  return parsed;
};

export const selectChannelContent = (model, { maxId, feedURL, channelId }) => {
  const channel = model.querySelector('channel');
  if (!channel) {
    throw new Error('Parsing error');
  }
  const channelTitle = model.querySelector('channel > title').textContent;
  const channelDescription = model.querySelector('channel > description').textContent;
  const channelData = {
    link: feedURL,
    title: channelTitle,
    description: channelDescription,
    id: channelId || maxId + Number(uniqueId()),
  };

  const channelItemsList = model.querySelectorAll('channel > item');

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
