# Testing the RFXCOM Homebridge Plugin

This guide explains how to test the homebridge-rfxcom-accessories plugin with and without physical hardware.

## Summary

✅ **Plugin Status**: Successfully updated for Node.js 22+ compatibility  
✅ **Dependencies**: All updated to latest versions with security fixes  
✅ **Build**: Compiles successfully with TypeScript 5.6.0  
✅ **Testing**: Jest-based test suite with mock capabilities  

## Running Tests

### Basic Test Commands

```bash
# Run all tests (unit tests)
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run mock hardware testing
npm run test:mock
```

### Test Structure

The test suite includes:

- **Unit Tests** (`test/basic.test.ts`): 18 tests covering module loading, configuration validation, and build verification
- **Mock Testing** (`test-with-mock.js`): Interactive testing with simulated RFXCOM hardware
- **Test Setup** (`test/setup.ts`): Global mocks and utilities for Jest

## Mock Testing for Development

### Quick Mock Test

The easiest way to test without hardware:

```bash
npm run test:mock
```

This will:

- Create a mock RFXCOM device
- Test RFY blind commands (up/down/stop)
- Test Lighting1 switch commands (on/off)
- Start sensor event simulation
- Show real-time sensor events (temperature, humidity)

### Mock RFXCOM Library

The plugin includes comprehensive mock capabilities in `mock-rfxcom.js`:

- **MockRfxCom**: Simulates the main RFXCOM device
- **MockRfy**: RFY blind/shade controller simulation
- **MockLighting1**: Lighting1 switch controller simulation
- **Sensor Events**: Automatic temperature/humidity sensor events

### Using Mock in Your Code

```javascript
// Mocking is now handled automatically by Jest
// No need to set environment variables or manually load mock files

// In your Jest tests, simply import and use the modules normally:
import { RFYAccessory } from '../src/accessories/rfyAccessory';

// Jest will automatically use the mocked rfxcom module
const accessory = new RFYAccessory(mockPlatform, mockPlatformAccessory);
```

## Integration with Homebridge

### Test Configuration

```json
{
  "platforms": [
    {
      "name": "RFXCOM Test",
      "platform": "RFXCOMAccessories",
      "tty": "/dev/ttyUSB0",
      "debug": true,
      "devices": {
        "rfy": [
          {
            "name": "Living Room Blind",
            "deviceId": "0x123456/1",
            "reversed": false,
            "openDurationSeconds": 30,
            "closeDurationSeconds": 30,
            "forceCloseAtStartup": false
          }
        ],
        "switch": [
          {
            "name": "Living Room Switch",
            "type": "Lighting1",
            "subtype": "ARC",
            "id": "0xABCD/1",
            "forceOffAtStartup": false
          }
        ],
        "weatherSensors": [
          {
            "name": "Temperature Sensor",
            "type": "temperature1",
            "id": "0x1234"
          }
        ]
      }
    }
  ]
}
```

### Development Workflow

1. **Build the plugin**: `npm run build`
2. **Run unit tests**: `npm test`
3. **Test with mock**: `npm run test:mock`
4. **Test coverage**: `npm run test:coverage`
5. **Link locally**: `npm link` (for local Homebridge testing)

## Current Test Status

- **18 Unit Tests**: All passing ✅
- **Type Safety**: Full TypeScript support ✅
- **Mock Hardware**: Complete simulation ✅
- **Coverage Reports**: Available in `/coverage` directory ✅

## Mock Features in Detail

### Device Types Supported

- **RFY Blinds/Shades**: Up, down, stop commands
- **Lighting1 Switches**: On/off commands
- **Temperature Sensors**: Automatic events every 30 seconds
- **Humidity Sensors**: Automatic events every 45 seconds
- **Combined Sensors**: Temperature+humidity events every 60 seconds

### Event Simulation

The mock automatically generates:

- Temperature readings (20-30°C)
- Humidity readings (40-80%)
- Battery levels (1-10 scale)
- Command acknowledgments
- Connection status events

### Debug Output

All mock operations are logged with emojis:

- 🎭 Mock RFXCOM operations
- 🎮 RFY commands
- 💡 Lighting commands
- 🌡️ Temperature events
- 💧 Humidity events

## Troubleshooting

### Common Issues

1. **Unit test failures**: Check `npm test` output for specific errors
2. **Build errors**: Run `npm run build` to check TypeScript compilation
3. **Coverage issues**: Use `npm run test:coverage` for detailed reports
4. **Timer leaks**: Tests now properly clean up timers using Jest fake timers

### Getting Help

- Review test output for detailed error messages
- Check the coverage report to identify untested areas
- Verify all dependencies are installed with `npm install`
- Use `npm run test:mock` for interactive testing

## Files Structure

```text
test/
├── basic.test.ts        # Unit tests (18 tests)
├── setup.ts            # Jest configuration and mocks
test-with-mock.js       # Interactive mock testing
mock-rfxcom.js         # Mock RFXCOM library
jest.config.js         # Jest configuration
```

## Contributing

When adding new features:

1. Write unit tests for new functionality
2. Test with mock hardware using `npm run test:mock`
3. Ensure all existing tests pass: `npm test`
4. Maintain TypeScript type safety
5. Update documentation as needed

The plugin is ready for both development testing and production use with real RFXCOM hardware.
