import axios from 'axios';
import urljoin from 'url-join';

const instance = axios.create();

instance.interceptors.request.use((config) => {
  const corsPrefix = 'https://cors-anywhere.herokuapp.com';
  const patchedURL = urljoin(corsPrefix, config.url);
  return ({
    ...config,
    url: patchedURL,
  });
});

export default instance;
