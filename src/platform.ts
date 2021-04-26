import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import rfxcom from 'rfxcom';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { RFYAccessory, RFYAccessoryConfig } from './accessories/rfyAccessory';

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
  public readonly rfxtrx;
  public readonly rfy;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    // rfxcom init
    this.rfxtrx = new rfxcom.RfxCom(this.config.tty, { debug: this.config.debug });
    this.rfy = new rfxcom.Rfy(this.rfxtrx, rfxcom.rfy.RFY);

    this.rfxtrx.on('disconnect', () => this.log.error('ERROR: RFXtrx disconnect'));
    this.rfxtrx.on('connectfailed', () => this.log.error('ERROR: RFXtrx connect fail'));

    this.rfxtrx.initialise(() => {
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
  }

  /**
   * Register RFY Somfy devices
   */
  private discoverRFYDevices() {

    // Load devices from configuration
    const devices = this.config.devices.rfy.map((device) => ({
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
}
