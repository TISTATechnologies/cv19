function loadConfig(callback) {
  console.log('%cLoading config.json', 'color: pink');
  if (!window.CONFIG_IS_FETCHED) {
    fetch('config.json')
      .then((r) => r.json())
      .then((data) => {
        window.CONFIG_IS_FETCHED = true;
        window.CONFIG = { ...window.CONFIG, ...data };
        console.log('%cLoaded config.json', 'color: orange');
      })
      .catch(() => {
        window.CONFIG_IS_FETCHED = false;
        console.log('Could not load config.json');
      })
      .finally(callback);
  } else {
    callback();
  }
}

export default loadConfig;
