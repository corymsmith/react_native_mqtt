# React Native Mqtt

This package is a wrapper around the javascript implementation of the [paho mqtt client library](https://eclipse.org/paho/clients/js/) to provide drop in compatibility with react native. If you happen to be running your own mqtt broker, it must support websockets for a connection to be possible. [Mosquitto](https://mosquitto.org/) does not support websockets out of the box and will require some extra work. Another broker that does have support for websockets is [aedes](https://github.com/mcollina/aedes), which is the broker I use personally.

## Install

To install, use npm:

```
npm install react_native_mqtt --save
```

## Usage

To use the library just pass in the options for the local storage module ([react-native-storage](https://github.com/sunnylqm/react-native-storage)) and the paho object will be attached to global scope.

```
import init from 'react_native_mqtt';
import { AsyncStorage } from 'react-native';

init({
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

## Examples

- Using the [aedes](https://github.com/mcollina/aedes) broker to handle websocket and standard connections
```
var net = require('net');
var aedes = require('aedes');
var websocket = require('websocket-stream');

exports.listen = function() {
  aedes = aedes({
    concurrency: 1000
  });
  var server = net.createServer(aedes.handle);
  server.listen(1883);
  websocket.createServer({port: 8080}, aedes.handle);
}
```

- Usage of this package in a react native application using [redux sagas](https://github.com/yelouafi/redux-saga): 
```
import { take, call, put, select } from 'redux-saga/effects'
import Types from '../Actions/Types'
import Actions from '../Actions/Creators'
var DeviceInfo = require('react-native-device-info');

function promisifyConnect(client) {
  return new Promise(function(resolve, reject){
    client.connect({
      onSuccess: resolve,
      onFailure: (err) => {
        reject("mqtt failed to connect @ " + err.errorMessage);
      }
    });
  });
}

function promisifySubscribe(client, topic) {
  return new Promise(function(resolve, reject){
    client.subscribe(topic, {
      onSuccess: resolve,
      onFailure: (err) => {
        reject("mqtt failed to subscribe @ " + err.errorCode);
      }
    });
  });
}

function * publish(topic, payload){
  let client = yield select((state) => state.mqtt.client);
  if(client && client.isConnected()) {
    let message = new Paho.MQTT.Message(payload);
    message.destinationName = topic;
    yield call(client.send, message);
  }
}

function * subscribe(topic) {
  let client = yield select((state) => state.mqtt.client);
  if(client && client.isConnected()) {
    yield promisifySubscribe(client, topic).catch(function(err){
      console.log(err);
    });
  }
}

function * connect(ip, dispatch) {
  var client = new Paho.MQTT.Client(ip, 8080, "mobile @ " + DeviceInfo.getUniqueID());

  client.onConnectionLost = () => {
    console.log('lost connection');
  };

  client.onMessageArrived = (message) => {
    dispatch(Actions.recievedMqttMessage(message.payloadString));
  };

  yield promisifyConnect(client).catch(function(err){
    console.log(err);
  });

  if(client.isConnected()) {
    yield put(Actions.mqttConnected(client));
  }
  else {
    //yield put something else...
  }
}

function * connectWatcher(dispatch) {
  while (true) {
    const { ip } = yield take(Types.MQTT_CONNECT);
    yield call(connect, ip, dispatch);
  }
}

function * publishWatcher(dispatch) {
  while(true) {
    const { topic, payload } = yield take(Types.MQTT_SEND_MESSAGE);
    yield call(publish, topic, payload);
  }
}

function * subscribeWatcher(dispatch) {
  while(true) {
    const { topic } = yield take(Types.MQTT_SUBSCRIBE);
    yield call(subscribe, topic);
  }
}

export default watchers = [
  connectWatcher,
  connectAndPublishWatcher,
  publishWatcher,
  subscribeWatcher
];
```
