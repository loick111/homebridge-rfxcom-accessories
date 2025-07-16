/**
 * Unit Tests for Weather Sensor Accessory
 * 
 * Tests the Weather Sensor accessory functionality including:
 * - Device initialization
 * - Event handling
 * - Service setup for temperature, humidity, and battery
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  WeatherSensorAccessory, 
  WeatherSensorDevice, 
  WeatherSensorEvent 
} from '../src/accessories/weatherSensorAccessory';
import { mockLogger, mockAPI, mockPlatformAccessory } from './setup';

describe('Weather Sensor Accessory', () => {
  let weatherSensorDevice: WeatherSensorDevice;
  let mockPlatform: any;
  let mockAccessory: any;

  beforeEach(() => {
    mockPlatform = {
      Service: mockAPI.hap.Service,
      Characteristic: mockAPI.hap.Characteristic,
      api: mockAPI,
      log: mockLogger,
      config: {
        debug: false
      }
    };

    weatherSensorDevice = new WeatherSensorDevice(
      mockAPI as any,
      '0x1234',
      'Test Weather Sensor',
      'temperature1'
    );

    // Create a fresh mock accessory for each test
    mockAccessory = {
      displayName: 'Test Weather Sensor',
      UUID: 'test-uuid',
      context: {
        device: weatherSensorDevice
      },
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
      })
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Weather Sensor Device', () => {
    it('should create weather sensor device with correct properties', () => {
      expect(weatherSensorDevice.id).toBe('0x1234');
      expect(weatherSensorDevice.name).toBe('Test Weather Sensor');
      expect(weatherSensorDevice.type).toBe('temperature1');
    });

    it('should inherit from Device base class', () => {
      expect(weatherSensorDevice.kind).toBe('WeatherSensorDevice');
      expect(weatherSensorDevice.uuid).toBeDefined();
    });

    it('should support different sensor types', () => {
      const humiditySensor = new WeatherSensorDevice(
        mockAPI as any,
        '0x5678',
        'Humidity Sensor',
        'humidity1'
      );

      expect(humiditySensor.type).toBe('humidity1');
      expect(humiditySensor.id).toBe('0x5678');
    });

    it('should support combined sensor types', () => {
      const combinedSensor = new WeatherSensorDevice(
        mockAPI as any,
        '0x9ABC',
        'Combined Sensor',
        'temperaturehumidity1'
      );

      expect(combinedSensor.type).toBe('temperaturehumidity1');
    });
  });

  describe('Weather Sensor Event', () => {
    it('should create event with all properties', () => {
      const event = new WeatherSensorEvent(8, 23.5, 65);
      
      expect(event.battery).toBe(8);
      expect(event.temperature).toBe(23.5);
      expect(event.humidity).toBe(65);
    });

    it('should create event with undefined values', () => {
      const event = new WeatherSensorEvent(undefined, undefined, undefined);
      
      expect(event.battery).toBeUndefined();
      expect(event.temperature).toBeUndefined();
      expect(event.humidity).toBeUndefined();
    });

    it('should create event with partial data', () => {
      const temperatureOnlyEvent = new WeatherSensorEvent(9, 22.1, undefined);
      
      expect(temperatureOnlyEvent.battery).toBe(9);
      expect(temperatureOnlyEvent.temperature).toBe(22.1);
      expect(temperatureOnlyEvent.humidity).toBeUndefined();
    });
  });

  describe('Weather Sensor Accessory Initialization', () => {
    it('should create weather sensor accessory without errors', () => {
      const event = new WeatherSensorEvent(8, 23.5, 65);
      
      expect(() => {
        new WeatherSensorAccessory(mockPlatform, mockAccessory, event);
      }).not.toThrow();
    });

    it('should set up accessory information', () => {
      const event = new WeatherSensorEvent(8, 23.5, 65);
      const accessory = new WeatherSensorAccessory(mockPlatform, mockAccessory, event);
      
      // Verify accessory information was set
      expect(mockAccessory.getService).toHaveBeenCalledWith(mockAPI.hap.Service.AccessoryInformation);
    });

    it('should set up temperature service when temperature data is available', () => {
      const event = new WeatherSensorEvent(8, 23.5, undefined);
      const accessory = new WeatherSensorAccessory(mockPlatform, mockAccessory, event);
      
      // Verify temperature service was set up
      expect(mockAccessory.getService).toHaveBeenCalledWith(mockAPI.hap.Service.TemperatureSensor);
    });

    it('should set up humidity service when humidity data is available', () => {
      const event = new WeatherSensorEvent(8, undefined, 65);
      const accessory = new WeatherSensorAccessory(mockPlatform, mockAccessory, event);
      
      // Verify humidity service was set up
      expect(mockAccessory.getService).toHaveBeenCalledWith(mockAPI.hap.Service.HumiditySensor);
    });

    it('should set up battery service when battery data is available', () => {
      const event = new WeatherSensorEvent(8, undefined, undefined);
      const accessory = new WeatherSensorAccessory(mockPlatform, mockAccessory, event);
      
      // Verify battery service was set up
      expect(mockAccessory.getService).toHaveBeenCalledWith(mockAPI.hap.Service.Battery);
    });

    it('should set up all services when all data is available', () => {
      const event = new WeatherSensorEvent(8, 23.5, 65);
      const accessory = new WeatherSensorAccessory(mockPlatform, mockAccessory, event);
      
      // Verify all services were set up
      expect(mockAccessory.getService).toHaveBeenCalledWith(mockAPI.hap.Service.AccessoryInformation);
      expect(mockAccessory.getService).toHaveBeenCalledWith(mockAPI.hap.Service.TemperatureSensor);
      expect(mockAccessory.getService).toHaveBeenCalledWith(mockAPI.hap.Service.HumiditySensor);
      expect(mockAccessory.getService).toHaveBeenCalledWith(mockAPI.hap.Service.Battery);
    });

    it('should not set up services when data is undefined', () => {
      const event = new WeatherSensorEvent(undefined, undefined, undefined);
      
      // Reset the mock to track only this accessory's calls
      jest.clearAllMocks();
      
      const accessory = new WeatherSensorAccessory(mockPlatform, mockAccessory, event);
      
      // Should only call getService for AccessoryInformation
      expect(mockAccessory.getService).toHaveBeenCalledWith(mockAPI.hap.Service.AccessoryInformation);
      expect(mockAccessory.getService).not.toHaveBeenCalledWith(mockAPI.hap.Service.TemperatureSensor);
      expect(mockAccessory.getService).not.toHaveBeenCalledWith(mockAPI.hap.Service.HumiditySensor);
      expect(mockAccessory.getService).not.toHaveBeenCalledWith(mockAPI.hap.Service.Battery);
    });
  });

  describe('Service Configuration', () => {
    it('should configure temperature service with correct value', () => {
      const event = new WeatherSensorEvent(8, 23.5, undefined);
      const mockTemperatureService = {
        setCharacteristic: jest.fn().mockReturnThis()
      };
      
      mockAccessory.getService.mockImplementation((serviceName) => {
        if (serviceName === 'AccessoryInformation') {
          return { setCharacteristic: jest.fn().mockReturnThis() };
        }
        if (serviceName === 'TemperatureSensor') {
          return mockTemperatureService;
        }
        return null;
      });

      const accessory = new WeatherSensorAccessory(mockPlatform, mockAccessory, event);
      
      // Verify temperature service was configured
      expect(mockTemperatureService.setCharacteristic).toHaveBeenCalledWith(
        mockAPI.hap.Characteristic.CurrentTemperature,
        23.5
      );
    });

    it('should configure humidity service with correct value', () => {
      const event = new WeatherSensorEvent(8, undefined, 65);
      const mockHumidityService = {
        setCharacteristic: jest.fn().mockReturnThis()
      };
      
      mockAccessory.getService.mockImplementation((serviceName) => {
        if (serviceName === 'AccessoryInformation') {
          return { setCharacteristic: jest.fn().mockReturnThis() };
        }
        if (serviceName === 'HumiditySensor') {
          return mockHumidityService;
        }
        return null;
      });

      const accessory = new WeatherSensorAccessory(mockPlatform, mockAccessory, event);
      
      // Verify humidity service was configured
      expect(mockHumidityService.setCharacteristic).toHaveBeenCalledWith(
        mockAPI.hap.Characteristic.CurrentRelativeHumidity,
        65
      );
    });

    it('should configure battery service with correct value', () => {
      const event = new WeatherSensorEvent(8, undefined, undefined);
      const mockBatteryService = {
        setCharacteristic: jest.fn().mockReturnThis()
      };
      
      mockAccessory.getService.mockImplementation((serviceName) => {
        if (serviceName === 'AccessoryInformation') {
          return { setCharacteristic: jest.fn().mockReturnThis() };
        }
        if (serviceName === 'Battery') {
          return mockBatteryService;
        }
        return null;
      });

      const accessory = new WeatherSensorAccessory(mockPlatform, mockAccessory, event);
      
      // Verify battery service was configured
      expect(mockBatteryService.setCharacteristic).toHaveBeenCalledWith(
        mockAPI.hap.Characteristic.BatteryLevel,
        8
      );
    });

    it('should add services when they do not exist', () => {
      const event = new WeatherSensorEvent(8, 23.5, 65);
      const mockService = {
        setCharacteristic: jest.fn().mockReturnThis()
      };
      
      // Mock getService to return null for sensor services but still return AccessoryInformation
      mockAccessory.getService.mockImplementation((serviceName) => {
        if (serviceName === 'AccessoryInformation') {
          return { setCharacteristic: jest.fn().mockReturnThis() };
        }
        return null; // All other services don't exist
      });
      // Mock addService to return our mock service
      mockAccessory.addService.mockReturnValue(mockService);

      const accessory = new WeatherSensorAccessory(mockPlatform, mockAccessory, event);
      
      // Verify services were added
      expect(mockAccessory.addService).toHaveBeenCalledWith(mockAPI.hap.Service.TemperatureSensor);
      expect(mockAccessory.addService).toHaveBeenCalledWith(mockAPI.hap.Service.HumiditySensor);
      expect(mockAccessory.addService).toHaveBeenCalledWith(mockAPI.hap.Service.Battery);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero values correctly', () => {
      const event = new WeatherSensorEvent(0, 0, 0);
      
      expect(() => {
        new WeatherSensorAccessory(mockPlatform, mockAccessory, event);
      }).not.toThrow();
    });

    it('should handle negative temperature values', () => {
      const event = new WeatherSensorEvent(5, -10.5, 45);
      
      expect(() => {
        new WeatherSensorAccessory(mockPlatform, mockAccessory, event);
      }).not.toThrow();
    });

    it('should handle extreme values', () => {
      const event = new WeatherSensorEvent(10, 100, 100);
      
      expect(() => {
        new WeatherSensorAccessory(mockPlatform, mockAccessory, event);
      }).not.toThrow();
    });

    it('should handle initialization without throwing', () => {
      const event = new WeatherSensorEvent(8, 23.5, 65);
      
      expect(() => {
        new WeatherSensorAccessory(mockPlatform, mockAccessory, event);
      }).not.toThrow();
    });

    it('should handle service creation failures gracefully', () => {
      const event = new WeatherSensorEvent(8, 23.5, 65);
      
      // Mock service creation to potentially fail
      mockAccessory.getService.mockImplementation((serviceName) => {
        if (serviceName === 'AccessoryInformation') {
          return { setCharacteristic: jest.fn().mockReturnThis() };
        }
        return null; // All other services don't exist
      });
      mockAccessory.addService.mockImplementation(() => {
        throw new Error('Service creation failed');
      });

      // Should throw when service creation fails
      expect(() => {
        new WeatherSensorAccessory(mockPlatform, mockAccessory, event);
      }).toThrow('Service creation failed');
    });
  });

  describe('Different Sensor Types', () => {
    it('should handle temperature-only sensor', () => {
      const tempSensor = new WeatherSensorDevice(
        mockAPI as any,
        '0x1111',
        'Temperature Only',
        'temperature1'
      );

      const tempAccessory = {
        ...mockPlatformAccessory,
        context: { device: tempSensor }
      };

      const event = new WeatherSensorEvent(9, 25.0, undefined);
      
      expect(() => {
        new WeatherSensorAccessory(mockPlatform, tempAccessory, event);
      }).not.toThrow();
    });

    it('should handle humidity-only sensor', () => {
      const humidSensor = new WeatherSensorDevice(
        mockAPI as any,
        '0x2222',
        'Humidity Only',
        'humidity1'
      );

      const humidAccessory = {
        ...mockPlatformAccessory,
        context: { device: humidSensor }
      };

      const event = new WeatherSensorEvent(7, undefined, 70);
      
      expect(() => {
        new WeatherSensorAccessory(mockPlatform, humidAccessory, event);
      }).not.toThrow();
    });

    it('should handle combined temperature/humidity sensor', () => {
      const combinedSensor = new WeatherSensorDevice(
        mockAPI as any,
        '0x3333',
        'Combined Sensor',
        'temperaturehumidity1'
      );

      const combinedAccessory = {
        ...mockPlatformAccessory,
        context: { device: combinedSensor }
      };

      const event = new WeatherSensorEvent(6, 22.5, 68);
      
      expect(() => {
        new WeatherSensorAccessory(mockPlatform, combinedAccessory, event);
      }).not.toThrow();
    });
  });
});
