/**
 * Permission.js
 *
 * Requests all permissions required by MeshLink at first signup
 * using native Android system dialogs — exactly like any other app.
 *
 * Permissions requested:
 *  - Camera
 *  - Photos / Media Library / Storage
 *  - Location (foreground)
 *  - Bluetooth (Android 12+ runtime permissions)
 *  - Wi-Fi state
 */

import { PermissionsAndroid, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

// ─── Android fine-grained permission sets ─────────────────────────────────────

const ANDROID_BASE = [
  PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  PermissionsAndroid.PERMISSIONS.CAMERA,
];

// Android 12+ (API 31+): Bluetooth requires runtime permissions
const ANDROID_BLUETOOTH_31 = [
  PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
  PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
  PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
];

// Android 13+ (API 33+): Nearby Wi-Fi devices permission is required by
// modern Nearby/Wi-Fi discovery flows.
const ANDROID_NEARBY_WIFI_33 = [
  'android.permission.NEARBY_WIFI_DEVICES',
];

// Android 13+ (API 33+): granular media permissions replace READ_EXTERNAL_STORAGE
const ANDROID_MEDIA_33 = [
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  'android.permission.READ_MEDIA_AUDIO',
];

// Older Android (<33): classic storage permissions
const ANDROID_STORAGE_LEGACY = [
  PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
  PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
];

function isGranted(value) {
  return value === PermissionsAndroid.RESULTS.GRANTED || value === 'granted';
}

// ─── Core permission requester ────────────────────────────────────────────────
export async function requestAllPermissions() {
  try {
    if (Platform.OS === 'web') {
      console.log('[MeshLink Permissions] Web platform detected, bypassing native permissions.');
      return { status: 'web_bypass' };
    }

    if (Platform.OS === 'android') {
      const apiLevel = Platform.Version; // numeric e.g. 33

      // Build the full list based on OS version
      const toRequest = [...ANDROID_BASE];

      if (apiLevel >= 33) {
        toRequest.push(...ANDROID_NEARBY_WIFI_33);
      } else {
        toRequest.push(...ANDROID_STORAGE_LEGACY);
      }

      if (apiLevel >= 31) {
        toRequest.push(...ANDROID_BLUETOOTH_31);
      }

      // Request all at once — Android shows each dialog sequentially
      const granted = await PermissionsAndroid.requestMultiple(toRequest);
      console.log('[MeshLink Permissions] Android results:', granted);
      return granted;

    } else if (Platform.OS === 'ios') {
      // iOS — Expo APIs trigger native system dialogs
      let camera = null;
      let media = null;
      let location = null;

      try {
        camera = await ImagePicker.requestCameraPermissionsAsync();
      } catch (e) {
        console.warn('Failed to request iOS camera permission:', e);
      }

      try {
        media = await ImagePicker.requestMediaLibraryPermissionsAsync();
      } catch (e) {
        console.warn('Failed to request iOS media library permission:', e);
      }

      try {
        location = await Location.requestForegroundPermissionsAsync();
      } catch (e) {
        console.warn('Failed to request iOS location permission:', e);
      }

      console.log('[MeshLink Permissions] iOS results:', { camera, media, location });
      return { camera, media, location };
    } else {
      return { status: 'unsupported_platform' };
    }

  } catch (e) {
    console.error('[MeshLink Permissions] Error:', e);
    return null;
  }
}

export async function requestNearbyPermissions() {
  try {
    if (Platform.OS === 'web') {
      return { status: 'web_bypass' };
    }

    if (Platform.OS !== 'android') {
      return requestAllPermissions();
    }

    const apiLevel = Platform.Version;
    const toRequest = [
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ];

    if (apiLevel >= 31) {
      toRequest.push(...ANDROID_BLUETOOTH_31);
    }

    if (apiLevel >= 33) {
      toRequest.push(...ANDROID_NEARBY_WIFI_33);
    }

    const granted = await PermissionsAndroid.requestMultiple(toRequest);
    console.log('[MeshLink Permissions] Nearby Android results:', granted);
    return granted;
  } catch (e) {
    console.error('[MeshLink Permissions] requestNearbyPermissions failed:', e);
    return null;
  }
}

export function isNearbyPermissionResultGranted(result) {
  if (Platform.OS !== 'android' || !result) return true;

  const apiLevel = Platform.Version;
  const required = [
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  ];

  if (apiLevel >= 31) {
    required.push(...ANDROID_BLUETOOTH_31);
  }

  // NEARBY_WIFI_DEVICES is strictly required on Android 13+ (API 33+)
  // for Google Play Services Nearby Connections to function over Wi-Fi.
  if (apiLevel >= 33) {
    required.push('android.permission.NEARBY_WIFI_DEVICES');
  }

  return required.every((permission) => isGranted(result[permission]));
}

// ─── Called during signup — triggers native system dialogs directly ────────────
export async function requestPermissionsAtSignup() {
  try {
    return await requestAllPermissions();
  } catch (e) {
    console.error('[MeshLink Permissions] requestPermissionsAtSignup failed:', e);
    return null;
  }
}

export async function checkLocationServicesEnabled() {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch (e) {
    console.warn('[MeshLink Permissions] Failed to check if location services are enabled:', e);
    return false;
  }
}

export async function getMissingPermissions() {
  if (Platform.OS === 'web') return [];

  const missing = [];
  try {
    if (Platform.OS === 'android') {
      const apiLevel = Platform.Version;

      // Check Camera
      const camera = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      if (!camera) missing.push('Camera');

      // Check Location
      const location = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      if (!location) missing.push('Location');

      // Check Storage
      let storage = false;
      if (apiLevel >= 33) {
        storage = await PermissionsAndroid.check('android.permission.READ_MEDIA_IMAGES');
      } else {
        storage = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      }
      if (!storage) missing.push('Storage/Photos');

      // Check Bluetooth (Android 12+)
      if (apiLevel >= 31) {
        const scan = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
        const advertise = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE);
        const connect = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
        if (!scan || !advertise || !connect) {
          missing.push('Bluetooth (Nearby Devices)');
        }
      }

      if (apiLevel >= 33) {
        const nearbyWifi = await PermissionsAndroid.check('android.permission.NEARBY_WIFI_DEVICES');
        if (!nearbyWifi) missing.push('Nearby Wi-Fi Devices');
      }
    } else if (Platform.OS === 'ios') {
      const [camera, media, location] = await Promise.all([
        ImagePicker.getCameraPermissionsAsync(),
        ImagePicker.getMediaLibraryPermissionsAsync(),
        Location.getForegroundPermissionsAsync(),
      ]);
      if (!camera.granted) missing.push('Camera');
      if (!media.granted) missing.push('Photos/Storage');
      if (!location.granted) missing.push('Location');
    }
  } catch (e) {
    console.error('[MeshLink Permissions] Error checking permissions:', e);
  }
  return missing;
}
