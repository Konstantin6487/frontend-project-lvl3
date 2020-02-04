import { uniqueId } from 'lodash-es';

const getDOMStrParser = () => {
  const parser = new DOMParser();
  const { parseFromString } = parser;
  const parseFn = parseFromString.bind(parser);
  return parseFn;
};

export const parseDOMStr = (data, mimeType) => {
  const parse = getDOMStrParser();
  const parsed = parse(data, mimeType);
  return parsed;
};

export const parseToChannelData = (model, { maxId, feedURL }) => {
  const channel = model.querySelector('channel');
  if (!channel) {
    throw new Error('Parsing error');
  }
  const title = model.querySelector('channel > title').textContent;
  const description = model.querySelector('channel > description').textContent;
  const channelId = maxId + +uniqueId();
  const channelData = {
    link: feedURL,
    title,
    description,
    id: channelId,
  };
  return channelData;
};

export const parseToChannelItems = (model, { maxId, channelId }) => Array
  .from(model.querySelectorAll('channel > item'))
  .map((item) => {
    const link = item.querySelector('link').textContent;
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const itemId = maxId + uniqueId();
    const itemData = {
      link,
      title,
      description,
      channelId,
      id: itemId,
    };
    return itemData;
  });
