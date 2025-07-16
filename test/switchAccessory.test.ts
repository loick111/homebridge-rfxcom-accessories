/**
 * Unit Tests for Switch Accessory
 * 
 * Tests the Switch accessory functionality including:
 * - Device initialization
 * - Switch state management
 * - RFXCOM protocol setup
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SwitchAccessory, SwitchDevice } from '../src/accessories/switchAccessory';
import { mockLogger, mockAPI, mockPlatformAccessory } from './setup';

describe('Switch Accessory', () => {
  let switchDevice: SwitchDevice;
  let mockPlatform: any;
  let mockRfxcom: any;
  let mockAccessory: any;

  beforeEach(() => {
    mockRfxcom = {
      on: jest.fn(),
      emit: jest.fn(),
      initialise: jest.fn(),
      close: jest.fn(),
      delay: jest.fn()
    };

    mockPlatform = {
      Service: mockAPI.hap.Service,
      Characteristic: mockAPI.hap.Characteristic,
      api: mockAPI,
      log: mockLogger,
      config: {
        debug: false
      },
      rfxcom: mockRfxcom
    };

    switchDevice = new SwitchDevice(
      mockAPI as any,
      '0xABCD/1',
      'Test Switch',
      'Lighting1',
      'ARC',
      false // forceOffAtStartup
    );

    mockAccessory = {
      ...mockPlatformAccessory,
      context: {
        device: switchDevice
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Switch Device', () => {
    it('should create switch device with correct properties', () => {
      expect(switchDevice.id).toBe('0xABCD/1');
      expect(switchDevice.name).toBe('Test Switch');
      expect(switchDevice.type).toBe('Lighting1');
      expect(switchDevice.subtype).toBe('ARC');
      expect(switchDevice.forceOffAtStartup).toBe(false);
    });

    it('should inherit from Device base class', () => {
      expect(switchDevice.kind).toBe('SwitchDevice');
      expect(switchDevice.uuid).toBeDefined();
    });

    it('should create device with force off at startup', () => {
      const forceOffDevice = new SwitchDevice(
        mockAPI as any,
        '0xABCD/1',
        'Force Off Switch',
        'Lighting1',
        'ARC',
        true // forceOffAtStartup
      );

      expect(forceOffDevice.forceOffAtStartup).toBe(true);
    });

    it('should support different switch types', () => {
      const lighting2Device = new SwitchDevice(
        mockAPI as any,
        '0xABCD/2',
        'Lighting2 Switch',
        'Lighting2',
        'AC',
        false
      );

      expect(lighting2Device.type).toBe('Lighting2');
      expect(lighting2Device.subtype).toBe('AC');
    });
  });

  describe('Switch Accessory Initialization', () => {
    it('should create switch accessory without errors', () => {
      expect(() => {
        new SwitchAccessory(mockPlatform, mockAccessory);
      }).not.toThrow();
    });

    it('should set up accessory information', () => {
      const accessory = new SwitchAccessory(mockPlatform, mockAccessory);
      
      // Verify accessory information was set
      expect(mockAccessory.getService).toHaveBeenCalledWith(mockAPI.hap.Service.AccessoryInformation);
    });

    it('should set up switch service', () => {
      const accessory = new SwitchAccessory(mockPlatform, mockAccessory);
      
      // Verify switch service was set up
      expect(mockAccessory.getService).toHaveBeenCalledWith(mockAPI.hap.Service.Switch);
    });

    it('should set up RFXCOM protocol for Lighting1', () => {
      const rfxcom = require('rfxcom');
      const accessory = new SwitchAccessory(mockPlatform, mockAccessory);
      
      // Verify Lighting1 was instantiated
      expect(rfxcom.Lighting1).toHaveBeenCalledWith(mockRfxcom, 'ARC');
    });

    it('should set up RFXCOM protocol for Lighting2', () => {
      const lighting2Device = new SwitchDevice(
        mockAPI as any,
        '0xABCD/2',
        'Lighting2 Switch',
        'Lighting2',
        'AC',
        false
      );

      const lighting2Accessory = {
        ...mockPlatformAccessory,
        context: {
          device: lighting2Device
        }
      };

      const rfxcom = require('rfxcom');
      const accessory = new SwitchAccessory(mockPlatform, lighting2Accessory);
      
      // Verify Lighting2 was instantiated
      expect(rfxcom.Lighting2).toHaveBeenCalledWith(mockRfxcom, 'AC');
    });

    it('should throw error for unknown device type', () => {
      const unknownDevice = new SwitchDevice(
        mockAPI as any,
        '0xABCD/3',
        'Unknown Switch',
        'UnknownType',
        'Unknown',
        false
      );

      const unknownAccessory = {
        ...mockPlatformAccessory,
        context: {
          device: unknownDevice
        }
      };

      expect(() => {
        new SwitchAccessory(mockPlatform, unknownAccessory);
      }).toThrow("Device type 'UnknownType' is unknown");
    });

    it('should register ready event handler', () => {
      const accessory = new SwitchAccessory(mockPlatform, mockAccessory);
      
      // Verify ready event handler was registered
      expect(mockRfxcom.on).toHaveBeenCalledWith('ready', expect.any(Function));
    });
  });

  describe('Switch State Management', () => {
    let accessory: SwitchAccessory;
    let mockSwitch: any;

    beforeEach(() => {
      const rfxcom = require('rfxcom');
      mockSwitch = {
        switchOn: jest.fn(),
        switchOff: jest.fn()
      };
      
      // Mock the switch constructor to return our mock
      (rfxcom.Lighting1 as jest.Mock).mockReturnValue(mockSwitch);
      
      accessory = new SwitchAccessory(mockPlatform, mockAccessory);
    });

    it('should get current state (default false)', () => {
      const callback = jest.fn();
      accessory.getValue(callback);
      
      expect(callback).toHaveBeenCalledWith(null, false);
    });

    it('should turn switch on', () => {
      const callback = jest.fn();
      accessory.setValue(true, callback);
      
      expect(mockSwitch.switchOn).toHaveBeenCalledWith('0xABCD/1');
      expect(callback).toHaveBeenCalledWith();
    });

    it('should turn switch off', () => {
      const callback = jest.fn();
      accessory.setValue(false, callback);
      
      expect(mockSwitch.switchOff).toHaveBeenCalledWith('0xABCD/1');
      expect(callback).toHaveBeenCalledWith();
    });

    it('should maintain state after setting value', () => {
      const callback = jest.fn();
      
      // Turn on
      accessory.setValue(true, callback);
      
      // Check state
      const getCallback = jest.fn();
      accessory.getValue(getCallback);
      
      expect(getCallback).toHaveBeenCalledWith(null, true);
    });

    it('should handle multiple state changes', () => {
      const callback = jest.fn();
      
      // Turn on
      accessory.setValue(true, callback);
      expect(mockSwitch.switchOn).toHaveBeenCalledWith('0xABCD/1');
      
      // Turn off
      accessory.setValue(false, callback);
      expect(mockSwitch.switchOff).toHaveBeenCalledWith('0xABCD/1');
      
      // Turn on again
      accessory.setValue(true, callback);
      expect(mockSwitch.switchOn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Force Off at Startup', () => {
    it('should force off switch at startup when configured', () => {
      const forceOffDevice = new SwitchDevice(
        mockAPI as any,
        '0xABCD/1',
        'Force Off Switch',
        'Lighting1',
        'ARC',
        true // forceOffAtStartup
      );

      const forceOffAccessory = {
        ...mockPlatformAccessory,
        context: {
          device: forceOffDevice
        }
      };

      const rfxcom = require('rfxcom');
      const mockSwitch = {
        switchOn: jest.fn(),
        switchOff: jest.fn()
      };
      
      (rfxcom.Lighting1 as jest.Mock).mockReturnValue(mockSwitch);

      const accessory = new SwitchAccessory(mockPlatform, forceOffAccessory);
      
      // Simulate the ready event
      const readyHandler = mockRfxcom.on.mock.calls.find(
        call => call[0] === 'ready'
      )?.[1];
      
      expect(readyHandler).toBeDefined();
      
      if (readyHandler) {
        readyHandler();
        expect(mockSwitch.switchOff).toHaveBeenCalledWith('0xABCD/1');
      }
    });

    it('should not force off when not configured', () => {
      const rfxcom = require('rfxcom');
      const mockSwitch = {
        switchOn: jest.fn(),
        switchOff: jest.fn()
      };
      
      (rfxcom.Lighting1 as jest.Mock).mockReturnValue(mockSwitch);

      const accessory = new SwitchAccessory(mockPlatform, mockAccessory);
      
      // Simulate the ready event
      const readyHandler = mockRfxcom.on.mock.calls.find(
        call => call[0] === 'ready'
      )?.[1];
      
      if (readyHandler) {
        readyHandler();
        expect(mockSwitch.switchOff).not.toHaveBeenCalled();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization without throwing', () => {
      expect(() => {
        new SwitchAccessory(mockPlatform, mockAccessory);
      }).not.toThrow();
    });

    it('should handle callback errors gracefully', () => {
      const accessory = new SwitchAccessory(mockPlatform, mockAccessory);
      
      const errorCallback = jest.fn();
      
      expect(() => {
        accessory.getValue(errorCallback);
        accessory.setValue(true, errorCallback);
        accessory.setValue(false, errorCallback);
      }).not.toThrow();
    });

    it('should throw error for invalid device type', () => {
      const invalidDevice = new SwitchDevice(
        mockAPI as any,
        '0xABCD/1',
        'Invalid Switch',
        'InvalidType',
        'Invalid',
        false
      );

      const invalidAccessory = {
        ...mockPlatformAccessory,
        context: {
          device: invalidDevice
        }
      };

      expect(() => {
        new SwitchAccessory(mockPlatform, invalidAccessory);
      }).toThrow("Device type 'InvalidType' is unknown");
    });
  });
});
