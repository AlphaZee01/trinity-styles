import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

type NominatimAddress = {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city_district?: string;
  town?: string;
  city?: string;
  village?: string;
  municipality?: string;
  state?: string;
  state_district?: string;
  region?: string;
  postcode?: string;
};

type NominatimBody = {
  name?: string;
  address?: NominatimAddress;
};

function unique(parts: Array<string | undefined>) {
  const seen = new Set<string>();
  const values: string[] = [];
  for (const part of parts) {
    const value = part?.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    values.push(value);
  }
  return values;
}

function ghanaPost(postcode: string | undefined) {
  if (!postcode || !/^[A-Z]{2}-\d{2,4}-\d{3,5}$/i.test(postcode.trim())) return "";
  return `GhanaPost ${postcode.trim().toUpperCase()}`;
}

function place(body: NominatimBody, lat: number, lng: number, trustDoor: boolean) {
  const address = body.address ?? {};
  const city = address.city || address.town || address.village || address.municipality || "";
  const region = (address.state || address.region || address.state_district || "").replace(/ Region$/i, "");
  const street = [trustDoor ? address.house_number : "", address.road || address.pedestrian].filter(Boolean).join(" ");
  const landmark = body.name && body.name !== address.road && body.name !== address.pedestrian ? body.name : "";
  const digital = trustDoor ? ghanaPost(address.postcode) : "";
  const pin = `Pin ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  const addressLine = unique([
    landmark,
    street,
    address.neighbourhood,
    address.quarter,
    address.suburb,
    address.city_district,
    address.town !== city ? address.town : "",
    digital,
    digital ? "" : pin,
  ]).join(", ");
  return { city, region, address_line: addressLine };
}

export async function GET(request: Request) {
  const { userId } = await getAuthContext();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to fill an address." }, { status: 401 });
  }
  if (!rateLimit(`address:${userId}`, 20, 60_000).ok) {
    return NextResponse.json({ error: "Too many location lookups. Wait a moment." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const accuracy = Number(searchParams.get("accuracy"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "Location is invalid." }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "18");
  url.searchParams.set("layer", "address");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "TrinityStyles/1.0 (checkout shipping)",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    return NextResponse.json({ error: "Could not find an address for this location." }, { status: 502 });
  }

  const body = (await response.json()) as NominatimBody;
  const trustDoor = !Number.isFinite(accuracy) || accuracy <= 60;
  const address = place(body, lat, lng, trustDoor);
  if (!address.city && !address.region && !address.address_line) {
    return NextResponse.json({ error: "Could not find an address for this location." }, { status: 422 });
  }

  return NextResponse.json({ ...address, approximate: Number.isFinite(accuracy) && accuracy > 60 });
}
