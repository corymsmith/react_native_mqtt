# React Native Mqtt

This project is a wrapper around the javascript implementation of the [paho mqtt client library](https://eclipse.org/paho/clients/js/) to provide drop in compatibility with react native. If you happen to be running your own mqtt broker, it must support websockets for a connection to be possible. [Mosquitto](https://mosquitto.org/) does not support websockets out of the box and will require some extra work. Another broker that does have support for websockets is [aedes](https://github.com/mcollina/aedes), which is the broker I use personally.

# Install

To install, use npm:

```
npm install react_native_mqtt --save
```

# Usage

To use the library just pass in the options for the local storage module ([react-native-storage](https://github.com/sunnylqm/react-native-storage)) and the paho object will be attached to global scope.

```
import { initMqtt } from 'react_native_mqtt';
import { AsyncStorage } from 'react-native';

initMqtt({
    size: 10000,
    storageBackend: AsyncStorage,
    defaultExpires: 1000 * 3600 * 24,
    enableCache: true,
    sync : {
    }
});

function onConnect() {
  console.log("onConnect");
  var message = new Paho.MQTT.Message("Hello");
  message.destinationName = "/World";
  client.send(message);
}

function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log("onConnectionLost:"+responseObject.errorMessage);
  }
}

function onMessageArrived(message) {
  console.log("onMessageArrived:"+message.payloadString);
}

var client = new Paho.MQTT.Client('test.mosquitto.org', 8080, 'unique_client_name');
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;
client.connect({onSuccess:onConnect});
```

# Examples

- Using the [aedes](https://github.com/mcollina/aedes) broker to handle websocket and standard connections: [link](https://github.com/Introvertuous/smart_home/blob/master/hub/lib/mqtt.js)
- Usage of this package within a react native application via [redux sagas](https://github.com/yelouafi/redux-saga): [TODO]()
