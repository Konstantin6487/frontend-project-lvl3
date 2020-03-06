export default (rss) => {
  const instance = new DOMParser();
  const content = instance.parseFromString(rss, 'application/xml');

  const channel = content.querySelector('channel');
  if (!channel) {
    const errorMessage = 'alert.error.parsing_error';
    throw new Error(errorMessage);
  }
  const channelLink = content.querySelector('channel > link').textContent;
  const channelTitle = content.querySelector('channel > title').textContent;
  const channelDescription = content.querySelector('channel > description').textContent;
  const channelData = {
    link: channelLink,
    title: channelTitle,
    description: channelDescription,
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
      };
      return itemData;
    });
  return ({ channelItems, channelData });
};
