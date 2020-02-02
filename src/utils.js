import urljoin from 'url-join';

export default (url) => {
  const corsPrefix = 'https://cors-anywhere.herokuapp.com';
  return urljoin(corsPrefix, url);
};
