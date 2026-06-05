export const SHIPPING_ZONES = {
  DOMESTIC: {
    name: 'Domestic',
    countries: ['IN'],
    estimatedDelivery: '3–7 days',
  },
  SOUTH_ASIA: {
    name: 'South Asia',
    countries: ['BD', 'LK', 'NP', 'PK'],
    estimatedDelivery: '7–14 days',
  },
  SOUTHEAST_ASIA: {
    name: 'Southeast Asia',
    countries: ['SG', 'MY', 'TH', 'ID', 'PH'],
    estimatedDelivery: '10–18 days',
  },
  MIDDLE_EAST: {
    name: 'Middle East',
    countries: ['AE', 'SA', 'QA', 'KW'],
    estimatedDelivery: '10–18 days',
  },
  EUROPE: {
    name: 'Europe',
    countries: ['GB', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'],
    estimatedDelivery: '14–21 days',
  },
  NORTH_AMERICA: {
    name: 'North America',
    countries: ['US', 'CA'],
    estimatedDelivery: '14–21 days',
  },
  OCEANIA: {
    name: 'Oceania',
    countries: ['AU', 'NZ'],
    estimatedDelivery: '14–21 days',
  },
  REST_OF_WORLD: {
    name: 'Rest of World',
    countries: [], // wildcard — all others
    estimatedDelivery: 'Variable',
    quoteOnly: true,
  },
};

/** Returns the zone key for a given ISO 3166-1 alpha-2 country code. */
export const getZoneForCountry = (countryCode) => {
  for (const [key, zone] of Object.entries(SHIPPING_ZONES)) {
    if (key === 'REST_OF_WORLD') continue;
    if (zone.countries.includes(countryCode)) return key;
  }
  return 'REST_OF_WORLD';
};
