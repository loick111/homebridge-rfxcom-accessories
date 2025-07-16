/**
 * Jest Test Setup
 * 
 * This file sets up the testing environment with common mocks and utilities
 */

import { jest } from '@jest/globals';

// Mock the RFXCOM library globally
jest.mock('rfxcom', () => {
  const mockEventEmitter = {
    on: jest.fn(),
    emit: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn()
  };

  const mockDevice = () => ({
    switchOn: jest.fn(),
    switchOff: jest.fn(),
    stop: jest.fn(),
    doCommand: jest.fn(),
    on: jest.fn(),
    emit: jest.fn(),
  });

  const mockModule = {
    RfxCom: jest.fn().mockImplementation(() => ({
      ...mockEventEmitter,
      initialise: jest.fn(),
      close: jest.fn(),
      delay: jest.fn()
    })),
    Rfy: jest.fn().mockImplementation(mockDevice),
    Lighting1: jest.fn().mockImplementation(mockDevice),
    Lighting2: jest.fn().mockImplementation(mockDevice),
    Lighting5: jest.fn().mockImplementation(mockDevice),
    rfy: {
      RFY: 'RFY'
    }
  };

  // Add default export for ES6 import compatibility
  (mockModule as any).default = mockModule;
  
  return mockModule;
});

// Global test timeout
jest.setTimeout(10000);

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock Homebridge Logger
export const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  success: jest.fn(),
  log: jest.fn()
};

// Mock Homebridge API
export const mockAPI = {
  on: jest.fn(),
  hap: {
    Service: {
      AccessoryInformation: 'AccessoryInformation',
      WindowCovering: 'WindowCovering',
      Switch: 'Switch',
      TemperatureSensor: 'TemperatureSensor',
      HumiditySensor: 'HumiditySensor',
      Battery: 'Battery'
    },
    Characteristic: {
      Manufacturer: 'Manufacturer',
      Model: 'Model',
      SerialNumber: 'SerialNumber',
      Name: 'Name',
      On: 'On',
      CurrentPosition: 'CurrentPosition',
      TargetPosition: 'TargetPosition',
      PositionState: {
        DECREASING: 0,
        INCREASING: 1,
        STOPPED: 2
      },
      CurrentTemperature: 'CurrentTemperature',
      CurrentRelativeHumidity: 'CurrentRelativeHumidity',
      BatteryLevel: 'BatteryLevel',
      StatusLowBattery: 'StatusLowBattery'
    },
    uuid: {
      generate: jest.fn().mockImplementation((data: unknown) => `mock-uuid-${data}`)
    }
  },
  platformAccessory: jest.fn().mockImplementation((name: unknown, uuid: unknown) => ({
    displayName: name,
    UUID: uuid,
    context: {},
    getService: jest.fn().mockReturnValue(null),
    addService: jest.fn().mockReturnValue({
      setCharacteristic: jest.fn().mockReturnValue({
        setCharacteristic: jest.fn().mockReturnValue({})
      }),
      getCharacteristic: jest.fn().mockReturnValue({
        on: jest.fn().mockReturnValue({
          on: jest.fn().mockReturnValue({})
        }),
        setProps: jest.fn().mockReturnValue({}),
        updateValue: jest.fn().mockReturnValue({})
      }),
      updateCharacteristic: jest.fn().mockReturnValue({})
    })
  })),
  registerPlatformAccessories: jest.fn(),
  updatePlatformAccessories: jest.fn(),
  unregisterPlatformAccessories: jest.fn(),
  // Add missing API properties for type compatibility
  version: '1.0.0',
  serverVersion: '1.0.0',
  user: {
    configPath: jest.fn().mockReturnValue('/mock/path'),
    storagePath: jest.fn().mockReturnValue('/mock/storage'),
    persistPath: jest.fn().mockReturnValue('/mock/persist'),
    cachedAccessoriesPath: jest.fn().mockReturnValue('/mock/cache')
  },
  hapLegacyTypes: {},
  publishExternalAccessories: jest.fn(),
  signalUpgrade: jest.fn(),
  shutdown: jest.fn(),
  relaunched: false
} as any;

// Mock Platform Accessory
export const mockPlatformAccessory = {
  displayName: 'Test Accessory',
  UUID: 'test-uuid',
  context: {},
  getService: jest.fn().mockImplementation((serviceName: unknown) => {
    // Always return a mock service that chains setCharacteristic calls
    const service = {
      setCharacteristic: jest.fn().mockReturnThis(),
      getCharacteristic: jest.fn().mockReturnValue({
        on: jest.fn().mockReturnThis(),
        setProps: jest.fn().mockReturnThis(),
        updateValue: jest.fn().mockReturnThis(),
        updateCharacteristic: jest.fn().mockReturnThis()
      }),
      updateCharacteristic: jest.fn().mockReturnThis()
    };
    return service;
  }),
  addService: jest.fn().mockReturnValue({
    setCharacteristic: jest.fn().mockReturnThis(),
    getCharacteristic: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      setProps: jest.fn().mockReturnThis(),
      updateValue: jest.fn().mockReturnThis(),
      updateCharacteristic: jest.fn().mockReturnThis()
    }),
    updateCharacteristic: jest.fn().mockReturnThis()
  }),
  // Add missing PlatformAccessory properties for type compatibility
  on: jest.fn(),
  emit: jest.fn(),
  _associatedHAPAccessory: null,
  category: 14, // Category.WINDOW_COVERING
  services: [],
  reachable: true,
  removeService: jest.fn(),
  getServiceById: jest.fn(),
  getServiceByUUID: jest.fn(),
  configureController: jest.fn(),
  removeController: jest.fn(),
  setController: jest.fn(),
  bridged: false,
  bridge: null,
  _isBridge: false,
  _advertiser: null,
  _setupURI: null,
  _setupHash: null,
  _hapAccessory: null,
  _setupID: null,
  _bridgeService: null,
  _nextServiceId: 1,
  _nextCharacteristicId: 1
} as any;

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
