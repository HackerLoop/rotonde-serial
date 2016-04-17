# Description

Rotonde module for serial communications.

This module wraps [node-serialport](https://github.com/voodootikigod/node-serialport).

# Device compatibility

- RaspberryPI A/B/2/3
- MacOSX
- should work on all POSIX systems

# Installation

```sh

rotonde install rotonde-serial

```

[what is rotonde ?] (https://github.com/HackerLoop/rotonde)

# API

## Events

List of events, each events as:

### SERIAL_READ

Sent when something has been read on an openned serial port.

| *field name* | *type* | *units/example*           |
|--------------|--------|---------------------------|
| port         | string | contains the name of the serial port (ie. ttyAMA0) that received this message |
| data         | string | contains the data that was read. Encoded in base64 if the port was openned in binary mode |

### SERIAL_PORTS_AVAILABLE

Sent in response to a `SERIAL_LIST` action.
Contains the list of available serial ports on the system.

| *field name* | *type* | *units/example*           |
|--------------|--------|---------------------------|
| ports        | array  | list of serial ports, each serial ports in the form described below |

Each ports as follows:

_only comName is guaranteed_

| *field name* | *type* | *units/example*           |
|--------------|--------|---------------------------|
| comName      | string | name for the serial port, (ie. ttyAMA0) |
| locationId   | number | locationId reported the system |
| manufacturer | string | manufacturer name (ie. on arduino: Arduino (www.arduino.cc)) |
| pnpId        | string | Plug and play ID ? (looks like an identifier for plug&play mecanisms on windows) |
| productId    | number | ProductId for the device |
| vendorId     | number | VendorId for the device  |
| serialNumber | string | serial for the device (does not necessarily have to be a number)  |

### SERIAL_PORT_DISCOVERED

Sent when a new serial port has been discovered (ie. when you plug an arduino by usb)

_only comName is guaranteed_

| *field name* | *type* | *units/example*           |
|--------------|--------|---------------------------|
| comName      | string | name for the serial port, (ie. ttyAMA0) |
| locationId   | number | locationId reported the system |
| manufacturer | string | manufacturer name (ie. on arduino: Arduino (www.arduino.cc)) |
| pnpId        | string | Plug and play ID ? (looks like an identifier for plug&play mecanisms on windows) |
| productId    | number | ProductId for the device |
| vendorId     | number | VendorId for the device  |
| serialNumber | string | serial for the device (does not necessarily have to be a number)  |

### SERIAL_PORT_LOST

Sent when a serial port disappeared (ie. when you unplug the USB cable)

_only comName is guaranteed_

| *field name* | *type* | *units/example*           |
|--------------|--------|---------------------------|
| comName      | string | name for the serial port, (ie. ttyAMA0) |
| locationId   | number | locationId reported the system |
| manufacturer | string | manufacturer name (ie. on arduino: Arduino (www.arduino.cc)) |
| pnpId        | string | Plug and play ID ? (looks like an identifier for plug&play mecanisms on windows) |
| productId    | number | ProductId for the device |
| vendorId     | number | VendorId for the device  |
| serialNumber | string | serial for the device (does not necessarily have to be a number)  |

## Actions

### SERIAL_LIST

Requests rotonde-serial to list the available serial ports on the system.
rotonde-serial then responds with a SERIAL_PORT_AVAILABLE event.

### SERIAL_OPEN

Opens a serial port.
Once a serial port has been openned, rotonde-serial will send
SERIAL_READ events whenever something is read on this serial port.

| *field name* | *type* | *units/example*           |
|--------------|--------|---------------------------|
| port         | string | port name (ie. ttyAMA0), correspondes to the `comName` field in port descriptions |
| baud         | number | Baud rate                 |
| parser       | string | Two parser types, RAW send bytes as received, READLINE sends blocks of data delimited by the `separator` field value |
| separator    | string | The separator used to delimit blocks when reading. only used with parser == 'READLINE' |
| isBinary     | bool   | (not tested), if set to true, all exchanges are encoded in base 64 |
| response     | string | The name for the event used to report open result, this event will have a status field, which value will be either: ALREADY_OPENNED, FAILED (an err field reports the error) or OK |

### SERIAL_CLOSE

Closes a serial port

| *field name* | *type* | *units/example*           |
|--------------|--------|---------------------------|
| port         | string | port name (ie. ttyAMA0), correspondes to the `comName` field in port descriptions |

### SERIAL_WRITE

Writes data to an openned serial port

| *field name* | *type* | *units/example*           |
|--------------|--------|---------------------------|
| port         | string | port name (ie. ttyAMA0), correspondes to the `comName` field in port descriptions |
| data         | string | contains the data to send to the serial port. should be base64 encoded if the port has been openned with isBinary == true |
| response     | string | The name for the event used to report write result, this event will have a status field, which value will be either: FAILED (an err field reports the error) or OK |
