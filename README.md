<p align="center">
    <img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">
</p>

# Homebridge RFXCOM Accessories

This Homebridge plugin allows to control devices compatible with RFXCOM.\
Here is the list of implemented devices:

- RFY (Somfy RTS)
- Weather sensors

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
        "openCloseDurationSeconds": "20",
        "forceCloseAtStartup": true
      }
    ]
  }
}
```

#### Weather sensors

RFXCOM can receive broadcast values by sensors.\
You can find supported devices [here](http://www.rfxcom.com/oregon/en).

You need to discover devices by cheking Homebridge logs.\
You will see an info log `WeatherSensor event received:` followed by event values.\
Finally, you'll be able to configure in plugin `Settings` the wanted `WeatherSensor` device with name and id.

```json
{
  "devices": {
    "weatherSensors": [
      {
        "name": "Salon",
        "id": "0x7201"
      }
    ]
  }
}
```

#### Switch on/off

You can create a switch for devices that supports on/off commands.\
Supported devices are [here](https://github.com/rfxcom/node-rfxcom/blob/master/DeviceCommands.md) (needs switchOn and switchOff commands).

You can find type and subtype [here](https://github.com/rfxcom/node-rfxcom/blob/master/lib/index.js#L148).\
The subtype is the index of your device in the array.\
For example, with ELRO AB400D device, the right configuration will be:

- type `Lighting1`
- subtype `2`

For id, you'll find all the documentation [here](http://www.rfxcom.com/WebRoot/StoreNL2/Shops/78165469/MediaGallery/Downloads/RFXtrx_User_Guide.pdf).

```json
{
  "devices": {
    "switch": [
      {
        "name": "Fan",
        "type": "Lighting1",
        "subtype": "2",
        "id": "A 1",
        "forceOffAtStartup": true
      }
    ]
  }
}
```
