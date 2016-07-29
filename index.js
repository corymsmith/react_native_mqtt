
import Storage from 'react-native-storage';

export const initMqtt = function(opts) {
  var storage = new Storage(opts);
  window.localStorage = storage;
  require('./mqttws31');
}
