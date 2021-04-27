<p align="center">
    <img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">
</p>

# Homebridge RFXCOM Accessories

This Homebridge plugin allows to control devices compatible with RFXCOM.\
Here is the list of implemented devices:

- RFY (Somfy RTS)

## How to use

You can add this plugin to your Homebridge instance by adding the following npm package:

```
npm install homebridge-rfxcom-accessories
```

## Configuration

Global configuration of this plugin containing Homebridge parameters and RFXCOM parameters.

```json
{
  "name": "Somfy RFXCOM",
  "platform": "RFXCOMAccessories",
  "tty": "/dev/ttyUSB0",
  "debug": false
}
```

### Devices

RFXCOM can handle multiple type of devices and each one have its own configuration.

#### RFY (Somfy RTS)

RFY Somfy RTS can control blinds, awning, ...\
You need to associate first your RFXCOM to the wanted device with an external tool.\
You can use Domoticz to setup your RFXCOM or the official tool `RFXMngr` running only on Windows.

```json
{
  "devices": {
    "rfy": [
      {
        "name": "Store",
        "deviceId": "0x000610/1",
        "openCloseDurationSeconds": "20"
      }
    ]
  }
}
```
