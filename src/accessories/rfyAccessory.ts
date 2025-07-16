import {
  Service,
  PlatformAccessory,
  CharacteristicValue,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  API,
} from 'homebridge';
import rfxcom from 'rfxcom';
import { Device } from '../device';

import { RFXCOMAccessories } from '../platform';
export class RFYDevice extends Device {
  constructor(
    public readonly api: API,
    public readonly id: string,
    public readonly name: string,
    public readonly reversed: boolean,
    public readonly openDurationSeconds: number,
    public readonly closeDurationSeconds: number,
    public readonly forceCloseAtStartup: boolean,
  ) {
    super(api, 'RFYDevice', id, name);
  }
}

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class RFYAccessory {
  private static readonly MIN_POSITION = 0;
  private static readonly MAX_POSITION = 100;

  private service: Service;

  private rfy: typeof rfxcom.Rfy;

  private stopTimer?: NodeJS.Timeout;

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
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'loick111')
      .setCharacteristic(this.platform.Characteristic.Model, 'RFY Somfy RTS')
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        this.accessory.UUID,
      );

    // get the WindowCovering service if it exists, otherwise create a new WindowCovering service
    // you can create multiple services for each accessory
    this.service =
      this.accessory.getService(this.platform.Service.WindowCovering) ||
      this.accessory.addService(this.platform.Service.WindowCovering);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/WindowCovering
    this.service.setCharacteristic(
      this.platform.Characteristic.Name,
      this.accessory.displayName,
    );
    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentPosition)
      .on('get', this.getCurrentPosition.bind(this));

    this.service
      .getCharacteristic(this.platform.Characteristic.PositionState)
      .on('get', this.getPositionState.bind(this));

    this.service
      .getCharacteristic(this.platform.Characteristic.TargetPosition)
      .on('get', this.getTargetPosition.bind(this))
      .on('set', this.setTargetPosition.bind(this));

    // setup RFXCOM protocol
    this.rfy = new rfxcom.Rfy(this.platform.rfxcom, rfxcom.rfy.RFY);

    // make sure that accessory is closed by default if forceCloseAtStartup is true
    this.platform.rfxcom.on('ready', () => {
      if (this.accessory.context.device.forceCloseAtStartup) {
        try {
          this.platform.log.info(`Force closing blind ${this.accessory.context.device.name} at startup`);
          this.executeCommand(this.accessory.context.device.id, 'up');
        } catch (error) {
          this.platform.log.error('Failed to force close blind at startup:', error);
        }
      }
    });
  }

  /**
   * Handle requests to get the current value of the "Current Position" characteristic
   */
  getCurrentPosition(callback: CharacteristicGetCallback) {
    this.platform.log.debug('Triggered GET CurrentPosition');
    callback(null, this.context.currentPosition);
  }

  private setCurrentPosition(value: number) {
    this.platform.log.debug('setCurrentPosition: ', value);
    this.context.currentPosition = value;
    this.syncContext();
  }

  /**
   * Handle requests to get the current value of the "Position State" characteristic
   */
  getPositionState(callback: CharacteristicGetCallback) {
    this.platform.log.debug('Triggered GET PositionState');
    callback(null, this.context.positionState);
  }

  private setPositionState(state: number) {
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

    this.platform.log.debug('setPositionState', stateName);
    this.syncContext();
  }

  /**
   * Handle requests to get the current value of the "Target Position" characteristic
   */
  getTargetPosition(callback: CharacteristicGetCallback) {
    this.platform.log.debug('Triggered GET TargetPosition');
    callback(null, this.context.targetPosition);
  }

  /**
   * Determine the action and duration for moving between positions
   */
  private calculateMoveAction(currentPos: number, targetPos: number): { action: string; duration: number } {
    const device = this.accessory.context.device;

    let pos1 = currentPos;
    let pos2 = targetPos;

    if (device.reversed) {
      const tmp = pos1;
      pos1 = pos2;
      pos2 = tmp;
    }

    if (pos1 > pos2) {
      return {
        action: 'down',
        duration: device.openDurationSeconds,
      };
    } else {
      return {
        action: 'up',
        duration: device.closeDurationSeconds,
      };
    }
  }

  /**
   * Execute a command to the RFY device with error handling
   */
  private executeCommand(deviceId: string, command: string): void {
    try {
      this.platform.log.debug(`Executing command: ${command} for device: ${deviceId}`);
      this.rfy.doCommand(deviceId, command);
    } catch (error) {
      this.platform.log.error(`Failed to execute command ${command} for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Set up a timer to stop movement at a specific position
   */
  private scheduleStopTimer(deviceId: string, moveTimeMs: number): void {
    this.platform.log.debug('moveTimeMs: ' + moveTimeMs);

    // Clear any existing timer
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
    }

    this.stopTimer = setTimeout(() => {
      this.executeCommand(deviceId, 'stop');
      this.setPositionState(this.platform.Characteristic.PositionState.STOPPED);
      this.stopTimer = undefined;
    }, moveTimeMs);
  }

  /**
   * Handle requests to set the "Target Position" characteristic
   */
  setTargetPosition(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ) {
    this.platform.log.debug('Triggered SET TargetPosition: ' + value);

    const targetPosition = +value;

    // Validate input
    if (targetPosition < RFYAccessory.MIN_POSITION || targetPosition > RFYAccessory.MAX_POSITION) {
      this.platform.log.warn(
        `Invalid target position: ${targetPosition}. Must be between ${RFYAccessory.MIN_POSITION} and ${RFYAccessory.MAX_POSITION}`,
      );
      return callback(new Error('Invalid target position'));
    }

    this.context.targetPosition = targetPosition;

    // Check if already at target position
    if (this.context.currentPosition === this.context.targetPosition) {
      this.setPositionState(this.platform.Characteristic.PositionState.STOPPED);
      this.platform.log.debug('Already in this position, no change to perform!');
      return callback();
    }

    this.syncContext();

    try {
      const device = this.accessory.context.device;
      const { action, duration } = this.calculateMoveAction(this.context.currentPosition, this.context.targetPosition);

      // Update position state
      if (action === 'down') {
        this.setPositionState(this.platform.Characteristic.PositionState.DECREASING);
      } else {
        this.setPositionState(this.platform.Characteristic.PositionState.INCREASING);
      }

      // Execute movement command
      this.executeCommand(device.id, action);

      // Schedule stop timer for partial positions
      if (
        this.context.targetPosition !== RFYAccessory.MIN_POSITION &&
        this.context.targetPosition !== RFYAccessory.MAX_POSITION
      ) {
        const moveTimeMs = (Math.round(duration * 1000) *
          Math.abs(this.context.currentPosition - this.context.targetPosition)) / 100;

        this.scheduleStopTimer(device.id, moveTimeMs);
      }

      // Update current position
      this.setCurrentPosition(targetPosition);
      callback();

    } catch (error) {
      this.platform.log.error('Error setting target position:', error);
      callback(error as Error);
    }
  }

  private syncContext() {
    this.service.updateCharacteristic(
      this.platform.Characteristic.PositionState,
      this.context.positionState,
    );
    this.service.updateCharacteristic(
      this.platform.Characteristic.TargetPosition,
      this.context.targetPosition,
    );
    this.service.updateCharacteristic(
      this.platform.Characteristic.CurrentPosition,
      this.context.currentPosition,
    );
  }

  /**
   * Cleanup method to clear any pending timers
   */
  public cleanup() {
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = undefined;
    }
  }
}
