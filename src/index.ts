import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import { WindowCoveringPlatform } from './platform';

/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, WindowCoveringPlatform);
};
