import { useState, useEffect } from "react";
import {
  requestLocationPermission,
  getCurrentPosition,
} from "../services/location";

export function useLocation() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initLocation();
  }, []);

  async function initLocation() {
    try {
      const granted = await requestLocationPermission();
      setPermissionGranted(granted);

      if (granted) {
        const pos = await getCurrentPosition();
        setLocation(pos);
      }
    } catch (err) {
      setError("Impossible d'accéder à la position");
      console.error("Location error:", err);
    }
  }

  async function refreshLocation() {
    try {
      const pos = await getCurrentPosition();
      setLocation(pos);
      return pos;
    } catch (err) {
      setError("Erreur de localisation");
      throw err;
    }
  }

  return { location, permissionGranted, error, refreshLocation };
}
