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

const getParser = (mimeType) => {
  const createParseFn = parsers[mimeType];
  if (!createParseFn) {
    throw new Error(`unknown mime type: ${mimeType}`);
  }
  return createParseFn();
};

export default (data, mimeType) => {
  const parse = getParser(mimeType);
  const parsed = parse(data, mimeType);
  return parsed;
};
