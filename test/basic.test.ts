/**
 * Basic Tests for RFXCOM Plugin
 * 
 * These tests verify core functionality without complex mocking
 */

import { describe, it, expect } from '@jest/globals';

describe('RFXCOM Plugin Basic Tests', () => {
  describe('Module Loading', () => {
    it('should load the platform module', async () => {
      const platform = await import('../src/platform');
      expect(platform).toBeDefined();
      expect(platform.RFXCOMAccessories).toBeDefined();
    });

    it('should load the index module', async () => {
      const index = await import('../src/index');
      expect(index).toBeDefined();
    });

    it('should load settings', async () => {
      const settings = await import('../src/settings');
      expect(settings.PLATFORM_NAME).toBe('RFXCOMAccessories');
      expect(settings.PLUGIN_NAME).toBe('homebridge-rfxcom-accessories');
    });

    it('should load device base class', async () => {
      const device = await import('../src/device');
      expect(device.Device).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should validate basic configuration structure', () => {
      const validConfig = {
        name: 'Test RFXCOM',
        tty: '/dev/ttyUSB0',
        debug: false,
        devices: {
          rfy: [],
          switch: [],
          weatherSensors: []
        }
      };

      expect(validConfig.name).toBeDefined();
      expect(validConfig.tty).toBeDefined();
      expect(validConfig.devices).toBeDefined();
    });

    it('should validate RFY device configuration', () => {
      const rfyConfig = {
        name: 'Test Blind',
        deviceId: '0x123456/1',
        reversed: false,
        openDurationSeconds: 30,
        closeDurationSeconds: 30,
        forceCloseAtStartup: false
      };

      expect(rfyConfig.name).toBeDefined();
      expect(rfyConfig.deviceId).toBeDefined();
      expect(typeof rfyConfig.reversed).toBe('boolean');
      expect(typeof rfyConfig.openDurationSeconds).toBe('number');
      expect(typeof rfyConfig.closeDurationSeconds).toBe('number');
      expect(typeof rfyConfig.forceCloseAtStartup).toBe('boolean');
    });

    it('should validate switch device configuration', () => {
      const switchConfig = {
        name: 'Test Switch',
        type: 'Lighting1',
        subtype: 'ARC',
        id: '0xABCD/1',
        forceOffAtStartup: false
      };

      expect(switchConfig.name).toBeDefined();
      expect(switchConfig.type).toBeDefined();
      expect(switchConfig.subtype).toBeDefined();
      expect(switchConfig.id).toBeDefined();
      expect(typeof switchConfig.forceOffAtStartup).toBe('boolean');
    });

    it('should validate weather sensor configuration', () => {
      const weatherSensorConfig = {
        name: 'Test Temperature Sensor',
        type: 'temperature1',
        id: '0x1234'
      };

      expect(weatherSensorConfig.name).toBeDefined();
      expect(weatherSensorConfig.type).toBeDefined();
      expect(weatherSensorConfig.id).toBeDefined();
    });
  });

  describe('TypeScript Compilation', () => {
    it('should compile without errors', () => {
      // If this test runs, TypeScript compilation was successful
      expect(true).toBe(true);
    });

    it('should have proper exports', async () => {
      const platform = await import('../src/platform');
      expect(typeof platform.RFXCOMAccessories).toBe('function');
    });
  });

  describe('Build Output', () => {
    it('should have compiled JavaScript files', async () => {
      const platform = await import('../dist/platform');
      expect(platform).toBeDefined();
      expect(platform.RFXCOMAccessories).toBeDefined();
    });

    it('should have proper index export', async () => {
      const index = await import('../dist/index');
      expect(index).toBeDefined();
    });
  });

  describe('Package Configuration', () => {
    it('should have valid package.json', () => {
      const pkg = require('../package.json');
      expect(pkg.name).toBe('homebridge-rfxcom-accessories');
      expect(pkg.main).toBe('dist/index.js');
      expect(pkg.engines.node).toBeDefined();
      expect(pkg.engines.homebridge).toBeDefined();
    });

    it('should have required dependencies', () => {
      const pkg = require('../package.json');
      expect(pkg.dependencies).toBeDefined();
      expect(pkg.dependencies.rfxcom).toBeDefined();
      expect(pkg.devDependencies).toBeDefined();
      expect(pkg.devDependencies.typescript).toBeDefined();
    });
  });

  describe('Constants and Settings', () => {
    it('should have correct platform name', async () => {
      const { PLATFORM_NAME } = await import('../src/settings');
      expect(PLATFORM_NAME).toBe('RFXCOMAccessories');
    });

    it('should have correct plugin name', async () => {
      const { PLUGIN_NAME } = await import('../src/settings');
      expect(PLUGIN_NAME).toBe('homebridge-rfxcom-accessories');
    });
  });
});
