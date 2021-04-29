import { Service, PlatformAccessory, CharacteristicValue, CharacteristicGetCallback, CharacteristicSetCallback } from 'homebridge';
import rfxcom from 'rfxcom';

import { RFXCOMAccessories } from '../platform';

/**
 * Platform Accessory Config
 */
export class RFYAccessoryConfig {
  constructor(
    public readonly deviceId: string,
    public readonly openCloseDurationSeconds: number,
  ) {
    this.deviceId = deviceId;
    this.openCloseDurationSeconds = openCloseDurationSeconds;
  }
}

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class RFYAccessory {
  private service: Service;

  private rfy;

  /**
   * Accessory context
   */
  private context = {
    positionState: this.platform.Characteristic.PositionState.STOPPED,
    targetPosition: 0,
    currentPosition: 0,
  };

  constructor(
    private readonly platform: RFXCOMAccessories,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'loick111')
      .setCharacteristic(this.platform.Characteristic.Model, 'RFY Somfy RTS')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.UUID);

    // get the WindowCovering service if it exists, otherwise create a new WindowCovering service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.WindowCovering)
      || this.accessory.addService(this.platform.Service.WindowCovering);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/WindowCovering
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.accessory.displayName);
    this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition)
      .on('get', this.getCurrentPosition.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.PositionState)
      .on('get', this.getPositionState.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetPosition)
      .on('get', this.getTargetPosition.bind(this))
      .on('set', this.setTargetPosition.bind(this));

    // setup RFXCOM protocol
    this.rfy = new rfxcom.Rfy(this.platform.rfxcom, rfxcom.rfy.RFY);

    // make sure that accessory is closed by default
    this.platform.rfxcom.on('ready', () => {
      this.rfy.doCommand(this.accessory.context.device.config.deviceId, 'up');
    });
  }

  /**
   * Handle requests to get the current value of the "Current Position" characteristic
   */
  getCurrentPosition(callback: CharacteristicGetCallback) {
    this.platform.log.info('Triggered GET CurrentPosition');
    callback(null, this.context.currentPosition);
  }

  private setCurrentPosition(value) {
    this.platform.log.debug('setCurrentPosition: ', value);
    this.context.currentPosition = value;
    this.syncContext();
  }

  /**
   * Handle requests to get the current value of the "Position State" characteristic
   */
  getPositionState(callback: CharacteristicGetCallback) {
    this.platform.log.info('Triggered GET PositionState');
    callback(null, this.context.positionState);
  }

  private setPositionState(state) {
    this.context.positionState = state;

    let stateName = '';
    switch (state) {
      case this.platform.Characteristic.PositionState.DECREASING:
        stateName = 'DECREASING';
        break;
      case this.platform.Characteristic.PositionState.INCREASING:
        stateName = 'INCREASING';
        break;
      case this.platform.Characteristic.PositionState.STOPPED:
        stateName = 'STOPPED';
        break;
      default:
        stateName = 'UNKNOWN -> ' + state;
        break;
    }

    this.platform.log.debug('setTargetPosition', stateName);
    this.syncContext();
  }

  /**
   * Handle requests to get the current value of the "Target Position" characteristic
   */
  getTargetPosition(callback: CharacteristicGetCallback) {
    this.platform.log.info('Triggered GET TargetPosition');
    callback(null, this.context.targetPosition);
  }

  /**
   * Handle requests to set the "Target Position" characteristic
   */
  setTargetPosition(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.platform.log.info('Triggered SET TargetPosition: ' + value);

    if (this.context.currentPosition === this.context.targetPosition) {
      this.setPositionState(this.platform.Characteristic.PositionState.STOPPED);
      this.platform.log.info('Already in this position, no change to perform!');
      return callback();
    }

    this.context.targetPosition = +value;
    this.syncContext();

    // Action to perform
    let action = '';
    if (this.context.currentPosition > this.context.targetPosition) {
      this.setPositionState(this.platform.Characteristic.PositionState.DECREASING);
      action = 'up';
    } else {
      this.setPositionState(this.platform.Characteristic.PositionState.INCREASING);
      action = 'down';
    }

    // Action
    this.platform.log.debug('action: ' + action);
    this.platform.log.debug('deviceId: ' + this.accessory.context.device.config.deviceId);
    this.rfy.doCommand(this.accessory.context.device.config.deviceId, action);

    // Wait targetState and stop
    if (this.context.targetPosition !== 0 && this.context.targetPosition !== 100) {
      const moveTimeMs = (
        Math.round(this.accessory.context.device.config.openCloseDurationSeconds * 1000)
        * Math.abs(this.context.currentPosition - this.context.targetPosition) / 100
      );

      this.platform.log.debug('moveTimeMs: ' + moveTimeMs);
      setTimeout(() => {
        this.rfy.doCommand(this.accessory.context.device.config.deviceId, 'stop');
        this.setPositionState(this.platform.Characteristic.PositionState.STOPPED);
      }, moveTimeMs);
    }

    this.setCurrentPosition(+value);
    callback();
  }

  private syncContext() {
    this.service.updateCharacteristic(this.platform.Characteristic.PositionState, this.context.positionState);
    this.service.updateCharacteristic(this.platform.Characteristic.TargetPosition, this.context.targetPosition);
    this.service.updateCharacteristic(this.platform.Characteristic.CurrentPosition, this.context.currentPosition);
  }
}
