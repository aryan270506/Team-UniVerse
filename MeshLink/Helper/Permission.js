import { PermissionsAndroid, Platform } from 'react-native';

export async function requestMeshPermissions() {
  if (Platform.OS !== 'android') return true;

  const permissions = [
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_WIFI_STATE,
    PermissionsAndroid.PERMISSIONS.CHANGE_WIFI_STATE,
  ];

  const granted = await PermissionsAndroid.requestMultiple(permissions);

  const allGranted = Object.values(granted).every(
    status => status === PermissionsAndroid.RESULTS.GRANTED
  );

  return allGranted;
}