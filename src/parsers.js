import { uniqueId } from 'lodash-es';

const getDOMParser = () => {
  const parser = new DOMParser();
  const { parseFromString } = parser;
  const parse = (data, mimeType) => {
    const type = mimeType === 'application/rss+xml'
      ? 'application/xml'
      : mimeType;
    const parseFn = parseFromString.bind(parser);
    return parseFn(data, type);
  };
  return parse;
};

const parsers = {
  'text/html': getDOMParser,
  'text/xml': getDOMParser,
  'application/xml': getDOMParser,
  'application/rss+xml': getDOMParser,
  'application/xhtml+xml': getDOMParser,
  'image/svg+xml': getDOMParser,
};

const getDOMStrParser = (mimeType) => {
  const createParseFn = parsers[mimeType];
  if (!createParseFn) {
    throw new Error(`unknown mime type: ${mimeType}`);
  }
  return createParseFn();
};

export const parseDOMStr = (data, mimeType) => {
  const parse = getDOMStrParser(mimeType);
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
