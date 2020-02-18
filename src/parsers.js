export default (data, mimeType) => {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(data, mimeType);
  return parsed;
};
