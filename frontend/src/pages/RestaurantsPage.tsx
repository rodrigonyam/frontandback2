import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Divider,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { MyLocation, OpenInNew, Room, Search } from '@mui/icons-material';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

type Cuisine =
  | 'Fast Food'
  | 'Burgers'
  | 'Chicken'
  | 'Mexican'
  | 'Local';

type DistanceBucket = 'Walking' | 'Short ride' | 'Farther';

interface DiningSpot {
  id: string;
  name: string;
  cuisines: Cuisine[];
  shortDescription: string;
  officialUrl: string;
  photoUrl: string;
  lat: number;
  lng: number;
  neighborhood?: string;
}

const DEFAULT_ACCOMMODATION = {
  // Downtown Miami (approx). Users can override via “Use my location”.
  lat: 25.7617,
  lng: -80.1918,
};

type FeaturedBrandKey = 'mcdonalds' | 'burgerking' | 'kfc' | 'chipotle';

const FEATURED_BRANDS: Array<{
  key: FeaturedBrandKey;
  displayName: string;
  match: RegExp;
  cuisines: Cuisine[];
  officialUrl: string;
  photoUrl: string;
}> = [
  {
    key: 'mcdonalds',
    displayName: "McDonald's",
    match: /mcdonald'?s|mcdonalds/i,
    cuisines: ['Fast Food', 'Burgers'],
    officialUrl: 'https://www.mcdonalds.com/us/en-us.html',
    photoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'burgerking',
    displayName: 'Burger King',
    match: /burger\s*king/i,
    cuisines: ['Fast Food', 'Burgers'],
    officialUrl: 'https://www.bk.com/',
    photoUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'kfc',
    displayName: 'KFC',
    match: /\bkfc\b|kentucky\s+fried\s+chicken/i,
    cuisines: ['Fast Food', 'Chicken'],
    officialUrl: 'https://www.kfc.com/',
    photoUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc5001?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'chipotle',
    displayName: 'Chipotle',
    match: /\bchipotle\b/i,
    cuisines: ['Fast Food', 'Mexican'],
    officialUrl: 'https://www.chipotle.com/',
    photoUrl: 'https://images.unsplash.com/photo-1604908177522-040d2d5e2fc5?auto=format&fit=crop&w=1200&q=80',
  },
];

type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements: OverpassElement[];
};

const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const x = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * (sinDLng * sinDLng);
  return 2 * R * Math.asin(Math.sqrt(x));
};

const bucketDistance = (km: number): DistanceBucket => {
  if (km <= 1.5) return 'Walking';
  if (km <= 5) return 'Short ride';
  return 'Farther';
};

const toGoogleMapsDirectionsUrl = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
  const origin = `${from.lat},${from.lng}`;
  const destination = `${to.lat},${to.lng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=walking`;
};

const MapFlyTo: React.FC<{ center: { lat: number; lng: number } | null }> = ({ center }) => {
  const map = useMap();

  useMemo(() => {
    if (!center) return;
    map.flyTo([center.lat, center.lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
  }, [center, map]);

  return null;
};

// Fix Leaflet default marker icons under CRA/Webpack
// (Leaflet expects images at specific URLs; bundlers change that.)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const RestaurantsPage: React.FC = () => {
  const [accommodation, setAccommodation] = useState(DEFAULT_ACCOMMODATION);
  const [selectedCuisine, setSelectedCuisine] = useState<Cuisine | 'All'>('All');
  const [distanceFilter, setDistanceFilter] = useState<DistanceBucket | 'All'>('All');
  const [groupBy, setGroupBy] = useState<'None' | 'Cuisine' | 'Distance'>('Cuisine');
  const [query, setQuery] = useState('');
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const [spots, setSpots] = useState<DiningSpot[]>([]);
  const [spotsStatus, setSpotsStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [spotsError, setSpotsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setSpotsStatus('loading');
      setSpotsError(null);

      const brandRegex = "(McDonald's|McDonalds|Burger\\s*King|KFC|Kentucky\\s+Fried\\s+Chicken|Chipotle)";
      const aroundMeters = 9000;
      const query = `
[out:json][timeout:25];
(
  node["amenity"="fast_food"]["name"~"${brandRegex}",i](around:${aroundMeters},${accommodation.lat},${accommodation.lng});
  way["amenity"="fast_food"]["name"~"${brandRegex}",i](around:${aroundMeters},${accommodation.lat},${accommodation.lng});
  relation["amenity"="fast_food"]["name"~"${brandRegex}",i](around:${aroundMeters},${accommodation.lat},${accommodation.lng});
  node["amenity"="fast_food"]["brand"~"${brandRegex}",i](around:${aroundMeters},${accommodation.lat},${accommodation.lng});
  way["amenity"="fast_food"]["brand"~"${brandRegex}",i](around:${aroundMeters},${accommodation.lat},${accommodation.lng});
  relation["amenity"="fast_food"]["brand"~"${brandRegex}",i](around:${aroundMeters},${accommodation.lat},${accommodation.lng});
);
out center;
`;

      try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: query,
        });
        if (!res.ok) {
          throw new Error(`Overpass request failed (${res.status})`);
        }
        const json = (await res.json()) as OverpassResponse;

        const byKey = new Map<string, DiningSpot>();

        for (const el of json.elements || []) {
          const lat = el.lat ?? el.center?.lat;
          const lng = el.lon ?? el.center?.lon;
          if (typeof lat !== 'number' || typeof lng !== 'number') continue;

          const tags = el.tags || {};
          const rawName = tags.name || tags.brand || 'Fast Food';
          const brandKey = FEATURED_BRANDS.find((b) => b.match.test(rawName) || b.match.test(tags.brand || ''));
          if (!brandKey) continue;

          const placeName = tags.name && tags.name.trim() ? tags.name : brandKey.displayName;
          const neighborhood = tags['addr:suburb'] || tags['addr:city'] || tags['addr:neighbourhood'] || tags['addr:street'];

          const id = `${el.type}-${el.id}`;
          const key = `${brandKey.key}-${placeName}-${lat.toFixed(5)}-${lng.toFixed(5)}`;

          if (!byKey.has(key)) {
            byKey.set(key, {
              id,
              name: placeName,
              cuisines: brandKey.cuisines,
              shortDescription: `${brandKey.displayName} in Miami (fast food).`,
              officialUrl: brandKey.officialUrl,
              photoUrl: brandKey.photoUrl,
              lat,
              lng,
              neighborhood,
            });
          }
        }

        const list = Array.from(byKey.values());
        // Keep it snappy: prioritize nearest pins.
        list.sort(
          (a, b) =>
            haversineKm(accommodation, { lat: a.lat, lng: a.lng }) - haversineKm(accommodation, { lat: b.lat, lng: b.lng })
        );

        if (!cancelled) {
          setSpots(list.slice(0, 40));
          setSpotsStatus('loaded');
        }
      } catch (e: any) {
        if (cancelled) return;
        setSpots([]);
        setSpotsStatus('error');
        setSpotsError(e?.message || 'Failed to load restaurant pins');
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [accommodation]);

  const allCuisines = useMemo(() => {
    const s = new Set<Cuisine>();
    for (const spot of spots) {
      for (const c of spot.cuisines) s.add(c);
    }
    return Array.from(s).sort();
  }, [spots]);

  const enriched = useMemo(() => {
    return spots
      .map((spot) => {
        const km = haversineKm(accommodation, { lat: spot.lat, lng: spot.lng });
        return {
          ...spot,
          distanceKm: km,
          distanceBucket: bucketDistance(km),
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [spots, accommodation]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched.filter((spot) => {
      const cuisineOk = selectedCuisine === 'All' || spot.cuisines.includes(selectedCuisine);
      const distanceOk = distanceFilter === 'All' || spot.distanceBucket === distanceFilter;
      const queryOk =
        !q ||
        spot.name.toLowerCase().includes(q) ||
        spot.shortDescription.toLowerCase().includes(q) ||
        spot.cuisines.some((c) => c.toLowerCase().includes(q)) ||
        (spot.neighborhood || '').toLowerCase().includes(q);
      return cuisineOk && distanceOk && queryOk;
    });
  }, [enriched, selectedCuisine, distanceFilter, query]);

  const selectedSpot = useMemo(() => filtered.find((s) => s.id === selectedSpotId) || null, [filtered, selectedSpotId]);

  const grouped = useMemo(() => {
    if (groupBy === 'None') {
      return [{ title: 'Best Places to Eat', items: filtered }];
    }

    if (groupBy === 'Distance') {
      const order: DistanceBucket[] = ['Walking', 'Short ride', 'Farther'];
      return order
        .map((bucket) => ({
          title: bucket === 'Walking' ? 'Walking Distance' : bucket === 'Short ride' ? 'Short Ride' : 'Farther Away',
          items: filtered.filter((s) => s.distanceBucket === bucket),
        }))
        .filter((g) => g.items.length > 0);
    }

    // groupBy Cuisine
    const map = new Map<string, typeof filtered>();
    for (const spot of filtered) {
      for (const c of spot.cuisines) {
        if (!map.has(c)) map.set(c, []);
        map.get(c)!.push(spot);
      }
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cuisine, items]) => ({ title: cuisine, items }));
  }, [filtered, groupBy]);

  const handleUseMyLocation = async () => {
    if (!('geolocation' in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAccommodation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h3" sx={{ fontWeight: 700 }}>
          Local Dining
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Miami, Florida — featuring fast food favorites (KFC, McDonald’s, Burger King, Chipotle) with official-site links
          and an interactive map. Pins are loaded from OpenStreetMap.
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
        {FEATURED_BRANDS.map((b) => (
          <Chip
            key={b.key}
            label={b.displayName}
            clickable
            onClick={() => {
              setQuery(b.displayName);
            }}
          />
        ))}
        <Chip
          label={spotsStatus === 'loading' ? 'Loading pins…' : spotsStatus === 'error' ? 'Pins failed to load' : `${spots.length} pins`}
          color={spotsStatus === 'error' ? 'warning' : 'default'}
          variant="outlined"
        />
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={8}>
          <Box
            sx={{
              height: 420,
              borderRadius: 2,
              overflow: 'hidden',
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <MapContainer center={[accommodation.lat, accommodation.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapFlyTo center={selectedSpot ? { lat: selectedSpot.lat, lng: selectedSpot.lng } : null} />

              <CircleMarker center={[accommodation.lat, accommodation.lng]} radius={10} pathOptions={{ color: '#1976d2' }}>
                <Popup>
                  <Typography variant="subtitle2">Your accommodation</Typography>
                  <Typography variant="body2" color="text.secondary">
                    ({accommodation.lat.toFixed(5)}, {accommodation.lng.toFixed(5)})
                  </Typography>
                </Popup>
              </CircleMarker>

              {filtered.map((spot) => (
                <Marker key={spot.id} position={[spot.lat, spot.lng]} eventHandlers={{ click: () => setSelectedSpotId(spot.id) }}>
                  <Popup>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2">{spot.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {spot.distanceKm.toFixed(1)} km • {spot.distanceBucket}
                      </Typography>
                      <Link href={spot.officialUrl} target="_blank" rel="noreferrer" underline="hover">
                        Official site
                      </Link>
                    </Stack>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Distance from accommodation
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Set the location to compute walking/ride distance buckets.
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<MyLocation />}
                  disabled={locating || !('geolocation' in navigator)}
                  onClick={handleUseMyLocation}
                >
                  {locating ? 'Locating…' : 'Use my location'}
                </Button>
                <Button size="small" variant="outlined" onClick={() => setAccommodation(DEFAULT_ACCOMMODATION)}>
                  Reset
                </Button>
              </Stack>

              {spotsStatus === 'error' ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {spotsError || 'Could not load map pins.'} You can still use the official links.
                </Typography>
              ) : null}
            </Box>

            <TextField
              label="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pizza, sushi, neighborhood…"
              InputProps={{ startAdornment: <Search sx={{ mr: 1 }} /> }}
            />

            <FormControl fullWidth>
              <InputLabel id="cuisine-filter">Cuisine</InputLabel>
              <Select
                labelId="cuisine-filter"
                label="Cuisine"
                value={selectedCuisine}
                onChange={(e) => setSelectedCuisine(e.target.value as Cuisine | 'All')}
              >
                <MenuItem value="All">All</MenuItem>
                {allCuisines.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="distance-filter">Distance</InputLabel>
              <Select
                labelId="distance-filter"
                label="Distance"
                value={distanceFilter}
                onChange={(e) => setDistanceFilter(e.target.value as DistanceBucket | 'All')}
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Walking">Walking Distance</MenuItem>
                <MenuItem value="Short ride">Short Ride</MenuItem>
                <MenuItem value="Farther">Farther Away</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="group-by">Group by</InputLabel>
              <Select labelId="group-by" label="Group by" value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)}>
                <MenuItem value="Cuisine">Cuisine</MenuItem>
                <MenuItem value="Distance">Distance</MenuItem>
                <MenuItem value="None">None</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Stack spacing={3}>
        {grouped.map((group) => (
          <Box key={group.title}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              {group.title}
            </Typography>

            {group.items.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No matches.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {group.items.map((spot) => (
                  <Grid key={spot.id} item xs={12} sm={6} md={4}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardActionArea onClick={() => setSelectedSpotId(spot.id)}>
                        <CardMedia component="img" height={170} image={spot.photoUrl} alt={spot.name} loading="lazy" />
                        <CardContent>
                          <Stack spacing={1}>
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                              <Link
                                href={spot.officialUrl}
                                target="_blank"
                                rel="noreferrer"
                                underline="hover"
                                sx={{ fontWeight: 800, fontSize: 16 }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {spot.name}
                              </Link>
                              <OpenInNew fontSize="small" color="action" />
                            </Stack>

                            <Typography variant="body2" color="text.secondary">
                              {spot.shortDescription}
                            </Typography>

                            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                              <Chip size="small" icon={<Room />} label={`${spot.distanceKm.toFixed(1)} km`} />
                              <Chip size="small" label={spot.distanceBucket} />
                              {spot.neighborhood ? <Chip size="small" label={spot.neighborhood} /> : null}
                            </Stack>

                            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                              {spot.cuisines.map((c) => (
                                <Chip
                                  key={`${spot.id}-${c}`}
                                  size="small"
                                  label={c}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCuisine(c);
                                  }}
                                />
                              ))}
                            </Stack>

                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                variant="contained"
                                href={toGoogleMapsDirectionsUrl(accommodation, { lat: spot.lat, lng: spot.lng })}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Directions
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                href={spot.officialUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Official site
                              </Button>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        ))}
      </Stack>
    </Container>
  );
};

export default RestaurantsPage;