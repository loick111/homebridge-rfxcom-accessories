import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import rfxcom from 'rfxcom';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { RFYAccessory, RFYAccessoryConfig } from './accessories/rfyAccessory';
import { WeatherSensorAccessory } from './accessories/weatherSensorAccessory';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class RFXCOMAccessories implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  // rfxcom
  public readonly rfxcom: typeof rfxcom.RfxCom;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    // rfxcom init
    this.rfxcom = new rfxcom.RfxCom(this.config.tty, { debug: this.config.debug });

    this.rfxcom.on('disconnect', () => this.log.error('ERROR: RFXtrx disconnect'));
    this.rfxcom.on('connectfailed', () => this.log.error('ERROR: RFXtrx connect fail'));

    this.rfxcom.initialise(() => {
      this.log.info('RFXtrx initialized!');
    });

    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * Discover all devices
   */
  discoverDevices() {
    this.discoverRFYDevices();
    this.discoverWeatherSensorDevices();
  }

  /**
   * Register RFY Somfy devices
   */
  private discoverRFYDevices() {

    // Load devices from configuration
    const devices = this.config.devices.rfy?.map((device) => ({
      name: device.name,
      config: new RFYAccessoryConfig(
        device.deviceId,
        device.openCloseDurationSeconds,
      ),
    }));

    // loop over the discovered devices and register each one if it has not already been registered
    for (const device of devices) {
      const uuid = this.api.hap.uuid.generate(device.name);
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory already exists
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
        existingAccessory.context.device = device;
        this.api.updatePlatformAccessories([existingAccessory]);
        new RFYAccessory(this, existingAccessory);
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', device.name);
        const accessory = new this.api.platformAccessory(device.name, uuid);
        accessory.context.device = device;
        new RFYAccessory(this, accessory);

        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }

  /**
   * Register weather sensors
   */
  private discoverWeatherSensorDevices() {
    // listen on sensor events
    this.rfxcom.on('temperature1', (e) => handleEvent(e));
    this.rfxcom.on('humidity1', (e) => handleEvent(e));
    this.rfxcom.on('temperaturehumidity1', (e) => handleEvent(e));

    // Load devices from configuration
    const devices = this.config.devices.weatherSensors?.map((device) => ({
      id: device.id,
      name: device.name,
    }));

    const handleEvent = (event) => {
      this.log.info('WeatherSensor event received:', event);

      // handle only configured devices
      const device = devices.find(device => device.id === event.id);
      if (device !== undefined) {
        handleDevice({
          id: event.id,
          name: device.name,
          temperature: event.temperature,
          humidity: event.humidity,
          batteryLevel: event.batteryLevel,
        });
      }
    };

    const handleDevice = (device) => {
      const uuid = this.api.hap.uuid.generate(device.id);
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory already exists
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        existingAccessory.context.device = device;
        new WeatherSensorAccessory(this, existingAccessory);
        this.api.updatePlatformAccessories([existingAccessory]);
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', device.name);

        const accessory = new this.api.platformAccessory(device.name, uuid);
        accessory.context.device = device;
        new WeatherSensorAccessory(this, accessory);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    };
  }
}
