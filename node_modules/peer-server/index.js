'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.startServer = startServer;
exports.connectToPeer = connectToPeer;
exports.sendRequest = sendRequest;
exports.on = on;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _peerjs = require('peerjs');

var _peerjs2 = _interopRequireDefault(_peerjs);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var peer = null;
var connections = {};
var callbacks = {};
var handlers = {};

function setUpListeners(connection) {
  return new Promise(function (resolve, reject) {
    connection.on('open', function () {
      console.log('Connection established with %s', connection.peer);
      setupReceiver(connection);
      resolve(connection);
    });
    connection.on('close', function () {
      delete connections[connection.peer];
      handlers['close'](connection.peer);
    });
    connection.on('error', function (err) {
      console.error('There was an error connecting to %s', connection.peer, err);
      reject(err);
    });
  });
}

function setupReceiver(connection) {
  connection.on('data', function (data) {
    if (data.type === 'request') {
      console.log('Received request from %s for', connection.peer, data.request);
      var request = Object.keys(data.request)[0];
      handlers[request](data.request[request], sendResponse.bind(null, data.id, connection));
    } else if (data.type === 'response') {
      console.log('Recieved response from %s', connection.peer, data.response);
      callbacks[data.id](data.response.errors, data.response);
      delete callbacks[data.id];
    }
  });
}

function sendResponse(id, connection, data) {
  var response = {
    id: id,
    type: 'response',
    response: data
  };
  console.log('Sending response to %s', connection.peer, response);
  connection.send(response);
}

var peerId;

exports.peerId = peerId;

function startServer() {
  var peerId = typeof arguments[0] === 'string' ? arguments[0] : null;
  var options = typeof arguments[0] === 'object' ? arguments[0] : arguments[1];

  options = _extends({
    host: 'localhost',
    port: '9000'
  }, options);

  peer = new _peerjs2['default'](peerId, options);

  peer.on('connection', function (connection) {
    setUpListeners(connection);
  });

  return new Promise(function (resolve, reject) {
    peer.on('open', function (id) {
      console.log('peer js setup with peerId %s', id);
      peerId = id;
      resolve(id);
    });
  });
}

function connectToPeer(peerId) {
  if (connections[peerId]) {
    console.log('Connection already established for peer %s', peerId);
  } else {
    console.log('Creating connection to %s', peerId);
    var connection = peer.connect(peerId);
    connections[connection.peer] = setUpListeners(connection);
  }
  return connections[peerId];
}

function sendRequest(peerId, request, cb) {
  connectToPeer(peerId).then(function (connection) {
    var req = {
      id: _nodeUuid2['default'].v1(),
      type: 'request',
      request: request
    };
    console.log('making request to %s for', peerId, req);
    connection.send(req);
    callbacks[req.id] = cb;
  });
}

function on(requestName, func) {
  console.log('Handler setup for %s', requestName);
  handlers[requestName] = func;
}
