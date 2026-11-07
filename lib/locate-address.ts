export async function locateDeliveryAddress() {
  if (!navigator.geolocation) {
    throw new Error("This browser cannot read location.");
  }

  const position = await readPosition();
  const params = new URLSearchParams({
    lat: String(position.coords.latitude),
    lng: String(position.coords.longitude),
    accuracy: String(position.coords.accuracy),
  });
  const response = await fetch(`/api/address?${params}`);
  const json = (await response.json()) as {
    error?: string;
    city?: string;
    region?: string;
    address_line?: string;
    approximate?: boolean;
  };
  if (!response.ok) throw new Error(json.error ?? "Could not find an address for this location.");
  return {
    city: json.city ?? "",
    region: json.region ?? "",
    address_line: json.address_line ?? "",
    approximate: Boolean(json.approximate),
  };
}

function readPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    let best: GeolocationPosition | null = null;
    let timer = 0;
    const finish = (position: GeolocationPosition) => {
      navigator.geolocation.clearWatch(watch);
      window.clearTimeout(timer);
      resolve(position);
    };
    const watch = navigator.geolocation.watchPosition(
      (position) => {
        if (!best || position.coords.accuracy < best.coords.accuracy) best = position;
        if (position.coords.accuracy <= 60) finish(position);
      },
      (error) => {
        navigator.geolocation.clearWatch(watch);
        window.clearTimeout(timer);
        if (best) resolve(best);
        else if (error.code === error.PERMISSION_DENIED) reject(new Error("Allow location to fill the address."));
        else reject(new Error("Location is unavailable."));
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
    timer = window.setTimeout(() => {
      navigator.geolocation.clearWatch(watch);
      if (best) resolve(best);
      else reject(new Error("Location is unavailable."));
    }, 12000);
  });
}
