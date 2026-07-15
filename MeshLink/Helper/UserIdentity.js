// mesh/identity.js
//
// Every phone needs a permanent "who am I" ID so other phones can address
// messages to it. This is generated ONCE on first launch and saved locally
// with expo-secure-store (encrypted local storage — still no internet).

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const DEVICE_ID_KEY = 'meshlink_device_id';
const DISPLAY_NAME_KEY = 'meshlink_display_name';
const PIN_KEY = 'meshlink_pin';

// Generates a random unique ID, e.g. "a1b2c3d4-...."
function generateUUID() {
  return Crypto.randomUUID();
}

// Call this once when the app first loads. If an ID already exists,
// it just returns the existing one instead of making a new one.
export async function getOrCreateDeviceId() {
  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) {
    id = generateUUID();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  }
  return id;
}

export async function getDisplayName() {
  return (await SecureStore.getItemAsync(DISPLAY_NAME_KEY)) || 'Unnamed Device';
}

export async function setDisplayName(name) {
  await SecureStore.setItemAsync(DISPLAY_NAME_KEY, name);
}

export async function getPin() {
  return await SecureStore.getItemAsync(PIN_KEY);
}

export async function setPin(pin) {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function isSignedUp() {
  const pin = await getPin();
  const name = await SecureStore.getItemAsync(DISPLAY_NAME_KEY);
  return !!(pin && name);
}

// Used during Sign Up — wipes and creates a brand new identity
export async function resetIdentity() {
  await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
  await SecureStore.deleteItemAsync(PIN_KEY);
  await SecureStore.deleteItemAsync(DISPLAY_NAME_KEY);
  return getOrCreateDeviceId();
}