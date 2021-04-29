import { PlatformAccessory } from 'homebridge';

import { RFXCOMAccessories } from '../platform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class WeatherSensorAccessory {
  constructor(
    private readonly platform: RFXCOMAccessories,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'loick111')
      .setCharacteristic(this.platform.Characteristic.Model, 'WeatherSensor')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.UUID);

    // battery
    const battery = this.accessory.context.device.batteryLevel;
    if (battery !== undefined) {
      const batteryService = this.accessory.getService(this.platform.Service.Battery)
      || this.accessory.addService(this.platform.Service.Battery);

      batteryService.setCharacteristic(this.platform.Characteristic.Name, this.accessory.displayName);
      batteryService.setCharacteristic(this.platform.Characteristic.BatteryLevel, battery);
    }

    // temperature
    const temperature = this.accessory.context.device.temperature;
    if (temperature !== undefined) {
      const temperatureService = this.accessory.getService(this.platform.Service.TemperatureSensor)
      || this.accessory.addService(this.platform.Service.TemperatureSensor);

      temperatureService.setCharacteristic(this.platform.Characteristic.Name, this.accessory.displayName);
      temperatureService.setCharacteristic(this.platform.Characteristic.CurrentTemperature, temperature);
    }

    // humidity
    const humidity = this.accessory.context.device.humidity;
    if (humidity !== undefined) {
      const humidityService = this.accessory.getService(this.platform.Service.HumiditySensor)
      || this.accessory.addService(this.platform.Service.HumiditySensor);

      humidityService.setCharacteristic(this.platform.Characteristic.Name, this.accessory.displayName);
      humidityService.setCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, humidity);
    }
  }
}
