import * as ExpoLocation from "expo-location";

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
  return status === "granted";
}

export async function getCurrentPosition(): Promise<{
  latitude: number;
  longitude: number;
}> {
  const location = await ExpoLocation.getCurrentPositionAsync({
    accuracy: ExpoLocation.Accuracy.High,
  });
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}
