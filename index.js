'use strict';

const _ = require('lodash');

const serialport = require('serialport');
const client = require('rotonde-client/node/rotonde-client')('ws://rotonde:4224');

const openned = [];

client.addLocalDefinition('action', 'SERIAL_LIST', []);

client.addLocalDefinition('action', 'SERIAL_OPEN', [
  {
    name: 'port',
    type: 'string',
    units: '',
  },
  {
    name: 'baud',
    type: 'number',
    units: 'baud',
  },
]);

client.addLocalDefinition('action', 'SERIAL_CLOSE', [
  {
    name: 'port',
    type: 'string',
    units: '',
  },
]);

const portFields = [
  {
    name: 'comName',
    type: 'string',
    units: '',
  },
  {
    name: 'locationId',
    type: 'number',
    units: ''
  },
  {
    name: 'manufacturer',
    type: 'string',
    units: ''
  },
  {
    name: 'pnpId',
    type: 'string',
    units: ''
  },
  {
    name: 'productId',
    type: 'number',
    units: ''
  },
  {
    name: 'serialNumber',
    type: 'number',
    units: ''
  },
  {
    name: 'vendorId',
    type: 'number',
    units: ''
  }
];
client.addLocalDefinition('event', 'SERIAL_PORTS_AVAILABLE', portFields, true);
client.addLocalDefinition('event', 'SERIAL_PORT_DISCOVERED', portFields);
client.addLocalDefinition('event', 'SERIAL_PORT_LOST', portFields);

client.addLocalDefinition('action', 'SERIAL_OPEN', [
  {
    name: 'port',
    type: 'string',
    units: '',
  },
  {
    name: 'parser',
    type: 'string',
    units: 'RAW,READLINE',
  },
  {
    name: 'separator',
    type: 'string',
    units: 'used for READLINE parser separator',
  },
  {
    name: 'isBinary',
    type: 'bool',
    units: 'if set to true, all exchanges are encoded in base 64',
  },
  {
    name: 'response',
    type: 'string',
    units: 'event name used for response',
  },
]);

client.addLocalDefinition('action', 'SERIAL_WRITE', [
  {
    name: 'port',
    type: 'string',
    units: '',
  },
  {
    name: 'data',
    type: 'string',
    units: '',
  },
  {
    name: 'response',
    type: 'string',
    units: 'event name used for response',
  },
]);

client.addLocalDefinition('event', 'SERIAL_READ', [
  {
    name: 'port',
    type: 'string',
    units: '',
  },
  {
    name: 'data',
    type: 'string',
    units: '',
  }
]);

client.actionHandlers.attach('SERIAL_LIST', () => {
  serialport.list(function (err, ports) {
    ports = _.differenceWith(ports, openned, (p, o) => o == p.comName);
    client.sendEvent('SERIAL_PORTS_AVAILABLE', {
      ports: _.map(ports, p => fixPortTypes(p)),
    });
  });
});

const sendError = (event, err) => {
  client.sendEvent(event, {
    status: 'FAILED',
    err,
  });
};

client.actionHandlers.attach('SERIAL_OPEN', (open) => {
  open = open.data;
  console.log(open);
  if (_.includes(openned, open.port)) {
    client.sendEvent(open.response, {
      status: 'ALREADY_OPENNED',
    });
    return;
  }
  const parser = open.parser == 'RAW' ? serialport.parsers.raw : serialport.parsers.readline(open.separator || '\r');

  const serialPort = new serialport.SerialPort('/dev/' + open.port, {
    parser,
    baudrate: open.baud || 9600,
  });

  const index = openned.length;
  openned.push(open.port);
  const removeOpenned = () => openned.splice(index, 1);

  serialPort.on('error', (err) => {
    sendError(open.response, err);
    removeOpenned();
  });

  serialPort.on('open', () => {
    serialPort.on('data', (data) => {
      data = open.isBinary ? atob(data) : data;
      client.sendEvent('SERIAL_READ', {
        port: open.port,
        data,
      });
    });

    client.sendEvent(open.response, {
      status: 'OK',
    });
  });

  const writeHandler = (a) => {
    if (a.data.port != open.port) {
      return;
    }
    const data = open.isBinary ? btoa(a.data.data) : a.data.data;
    serialPort.write(data, (err) => {
      if (err) {
        sendError(a.data.response, err);
      } else {
        serialPort.drain((err) => {
          if (err) {
            sendError(a.data.response, err);
          } else {
            client.sendEvent(a.data.response, {
              status: 'OK',
            });
          }
        });
      }
    });
  };
  client.actionHandlers.attach('SERIAL_WRITE', writeHandler);

  const closeHandler = (a) => {
     if (a.data.port != open.port) {
      return;
    }

    serialPort.close();
  };
  client.actionHandlers.attach('SERIAL_CLOSE', closeHandler);

  serialPort.on('close', () => {
    client.actionHandlers.detach('SERIAL_WRITE', writeHandler);
    client.actionHandlers.detach('SERIAL_CLOSE', closeHandler);
    client.sendEvent(open.response, {
      status: 'CLOSED',
    });
    removeOpenned();
  });
});

let lastPorts = [];
const monitorPorts = () => {
  serialport.list((err, ports) => {
    if (err) {
      console.log(err);
      return;
    }
    const newOnes = _.differenceWith(ports, lastPorts, _.isEqual);
    const remOnes = _.differenceWith(lastPorts, ports, _.isEqual);

    _.forEach(newOnes, (p) => {
      client.sendEvent('SERIAL_PORT_DISCOVERED', fixPortTypes(p));
    });
    _.forEach(remOnes, (p) => {
      client.sendEvent('SERIAL_PORT_LOST', fixPortTypes(p));
    });
    lastPorts = ports;

    setTimeout(monitorPorts, 1000);
  });
};

client.onReady(() => {
  monitorPorts();
});

client.connect();

const fixPortTypes = (port) => {
  return _.reduce(_.keys(port), (p, k) => {
    const value = p[k] || port[k];
    p[k] = parseInt(value) || value;
    return p;
  }, {comName: port.comName.replace('/dev/', '')});
}
