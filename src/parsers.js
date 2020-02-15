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
    id: channelId || maxId + +uniqueId(),
  };

  const channelItems = Array
    .from(model.querySelectorAll('channel > item'))
    .map((item) => {
      const channelItemLink = item.querySelector('link').textContent;
      const channelItemTitle = item.querySelector('title').textContent;
      const channelItemDescription = item.querySelector('description').textContent;
      const itemData = {
        link: channelItemLink,
        title: channelItemTitle,
        description: channelItemDescription,
        channelId: channelData.id,
        id: channelData.id + uniqueId(),
      };
      return itemData;
    });
  return ({ channelItems, channelData });
};


// export const parseToChannelData = (model, { maxId, feedURL }) => {
//   const channel = model.querySelector('channel');
//   if (!channel) {
//     throw new Error('Parsing error');
//   }
//   const title = model.querySelector('channel > title').textContent;
//   const description = model.querySelector('channel > description').textContent;
//   const channelId = maxId + +uniqueId();
//   const channelData = {
//     link: feedURL,
//     title,
//     description,
//     id: channelId,
//   };
//   return channelData;
// };

// export const parseToChannelItems = (model, { maxId, channelId }) => Array
//   .from(model.querySelectorAll('channel > item'))
//   .map((item) => {
//     const link = item.querySelector('link').textContent;
//     const title = item.querySelector('title').textContent;
//     const description = item.querySelector('description').textContent;
//     const itemId = maxId + uniqueId();
//     const itemData = {
//       link,
//       title,
//       description,
//       channelId,
//       id: itemId,
//     };
//     return itemData;
//   });
