export type Airport = { code: string; name: string; city: string; country: string };

const RAW: [string, string, string, string][] = [
  // United Kingdom and Ireland
  ["LHR", "London Heathrow", "London", "United Kingdom"],
  ["LGW", "London Gatwick", "London", "United Kingdom"],
  ["STN", "London Stansted", "London", "United Kingdom"],
  ["LTN", "London Luton", "London", "United Kingdom"],
  ["LCY", "London City", "London", "United Kingdom"],
  ["MAN", "Manchester Airport", "Manchester", "United Kingdom"],
  ["BHX", "Birmingham Airport", "Birmingham", "United Kingdom"],
  ["EDI", "Edinburgh Airport", "Edinburgh", "United Kingdom"],
  ["GLA", "Glasgow Airport", "Glasgow", "United Kingdom"],
  ["BRS", "Bristol Airport", "Bristol", "United Kingdom"],
  ["NCL", "Newcastle Airport", "Newcastle", "United Kingdom"],
  ["LPL", "Liverpool John Lennon", "Liverpool", "United Kingdom"],
  ["LBA", "Leeds Bradford", "Leeds", "United Kingdom"],
  ["EMA", "East Midlands", "East Midlands", "United Kingdom"],
  ["ABZ", "Aberdeen Airport", "Aberdeen", "United Kingdom"],
  ["BFS", "Belfast International", "Belfast", "United Kingdom"],
  ["CWL", "Cardiff Airport", "Cardiff", "United Kingdom"],
  ["DUB", "Dublin Airport", "Dublin", "Ireland"],
  // Pakistan
  ["LHE", "Allama Iqbal International", "Lahore", "Pakistan"],
  ["ISB", "Islamabad International", "Islamabad", "Pakistan"],
  ["KHI", "Jinnah International", "Karachi", "Pakistan"],
  ["PEW", "Bacha Khan International", "Peshawar", "Pakistan"],
  ["MUX", "Multan International", "Multan", "Pakistan"],
  ["SKT", "Sialkot International", "Sialkot", "Pakistan"],
  ["LYP", "Faisalabad International", "Faisalabad", "Pakistan"],
  ["UET", "Quetta International", "Quetta", "Pakistan"],
  // South Asia
  ["DEL", "Indira Gandhi International", "Delhi", "India"],
  ["BOM", "Chhatrapati Shivaji Maharaj International", "Mumbai", "India"],
  ["AMD", "Sardar Vallabhbhai Patel International", "Ahmedabad", "India"],
  ["BLR", "Kempegowda International", "Bengaluru", "India"],
  ["DAC", "Hazrat Shahjalal International", "Dhaka", "Bangladesh"],
  ["ZYL", "Osmani International", "Sylhet", "Bangladesh"],
  ["CMB", "Bandaranaike International", "Colombo", "Sri Lanka"],
  ["MLE", "Velana International", "Male", "Maldives"],
  ["KTM", "Tribhuvan International", "Kathmandu", "Nepal"],
  // Middle East
  ["DXB", "Dubai International", "Dubai", "United Arab Emirates"],
  ["AUH", "Zayed International", "Abu Dhabi", "United Arab Emirates"],
  ["SHJ", "Sharjah International", "Sharjah", "United Arab Emirates"],
  ["DOH", "Hamad International", "Doha", "Qatar"],
  ["JED", "King Abdulaziz International", "Jeddah", "Saudi Arabia"],
  ["MED", "Prince Mohammad bin Abdulaziz", "Madinah", "Saudi Arabia"],
  ["RUH", "King Khalid International", "Riyadh", "Saudi Arabia"],
  ["DMM", "King Fahd International", "Dammam", "Saudi Arabia"],
  ["KWI", "Kuwait International", "Kuwait City", "Kuwait"],
  ["BAH", "Bahrain International", "Manama", "Bahrain"],
  ["MCT", "Muscat International", "Muscat", "Oman"],
  ["AMM", "Queen Alia International", "Amman", "Jordan"],
  ["CAI", "Cairo International", "Cairo", "Egypt"],
  ["IST", "Istanbul Airport", "Istanbul", "Turkey"],
  ["SAW", "Sabiha Gokcen International", "Istanbul", "Turkey"],
  // Europe
  ["CDG", "Charles de Gaulle", "Paris", "France"],
  ["AMS", "Amsterdam Schiphol", "Amsterdam", "Netherlands"],
  ["FRA", "Frankfurt Airport", "Frankfurt", "Germany"],
  ["MUC", "Munich Airport", "Munich", "Germany"],
  ["MAD", "Adolfo Suarez Madrid-Barajas", "Madrid", "Spain"],
  ["BCN", "Barcelona-El Prat", "Barcelona", "Spain"],
  ["AGP", "Malaga-Costa del Sol", "Malaga", "Spain"],
  ["PMI", "Palma de Mallorca", "Palma", "Spain"],
  ["ALC", "Alicante-Elche", "Alicante", "Spain"],
  ["FCO", "Leonardo da Vinci-Fiumicino", "Rome", "Italy"],
  ["MXP", "Milan Malpensa", "Milan", "Italy"],
  ["ZRH", "Zurich Airport", "Zurich", "Switzerland"],
  ["VIE", "Vienna International", "Vienna", "Austria"],
  ["BRU", "Brussels Airport", "Brussels", "Belgium"],
  ["CPH", "Copenhagen Airport", "Copenhagen", "Denmark"],
  ["ARN", "Stockholm Arlanda", "Stockholm", "Sweden"],
  ["OSL", "Oslo Gardermoen", "Oslo", "Norway"],
  ["LIS", "Humberto Delgado", "Lisbon", "Portugal"],
  ["ATH", "Athens Eleftherios Venizelos", "Athens", "Greece"],
  // Americas
  ["JFK", "John F. Kennedy International", "New York", "United States"],
  ["EWR", "Newark Liberty International", "Newark", "United States"],
  ["LAX", "Los Angeles International", "Los Angeles", "United States"],
  ["ORD", "O'Hare International", "Chicago", "United States"],
  ["MIA", "Miami International", "Miami", "United States"],
  ["ATL", "Hartsfield-Jackson Atlanta", "Atlanta", "United States"],
  ["SFO", "San Francisco International", "San Francisco", "United States"],
  ["IAD", "Washington Dulles International", "Washington", "United States"],
  ["BOS", "Logan International", "Boston", "United States"],
  ["YYZ", "Toronto Pearson International", "Toronto", "Canada"],
  ["YVR", "Vancouver International", "Vancouver", "Canada"],
  ["MEX", "Benito Juarez International", "Mexico City", "Mexico"],
  // Asia Pacific
  ["SIN", "Singapore Changi", "Singapore", "Singapore"],
  ["BKK", "Suvarnabhumi", "Bangkok", "Thailand"],
  ["KUL", "Kuala Lumpur International", "Kuala Lumpur", "Malaysia"],
  ["HKG", "Hong Kong International", "Hong Kong", "Hong Kong"],
  ["NRT", "Narita International", "Tokyo", "Japan"],
  ["HND", "Haneda", "Tokyo", "Japan"],
  ["ICN", "Incheon International", "Seoul", "South Korea"],
  ["PEK", "Beijing Capital", "Beijing", "China"],
  ["PVG", "Shanghai Pudong", "Shanghai", "China"],
  ["CGK", "Soekarno-Hatta", "Jakarta", "Indonesia"],
  ["MNL", "Ninoy Aquino International", "Manila", "Philippines"],
  ["SYD", "Sydney Kingsford Smith", "Sydney", "Australia"],
  ["MEL", "Melbourne Tullamarine", "Melbourne", "Australia"],
  ["AKL", "Auckland Airport", "Auckland", "New Zealand"],
  // Africa
  ["JNB", "O. R. Tambo International", "Johannesburg", "South Africa"],
  ["CPT", "Cape Town International", "Cape Town", "South Africa"],
  ["NBO", "Jomo Kenyatta International", "Nairobi", "Kenya"],
  ["ADD", "Bole International", "Addis Ababa", "Ethiopia"],
  ["LOS", "Murtala Muhammed International", "Lagos", "Nigeria"],
  ["CMN", "Mohammed V International", "Casablanca", "Morocco"],
  ["ACC", "Kotoka International", "Accra", "Ghana"],
];

export const AIRPORTS: Airport[] = RAW.map(([code, name, city, country]) => ({ code, name, city, country }));

const BY_CODE = new Map(AIRPORTS.map((a) => [a.code, a]));

export const airportByCode = (code: string) => BY_CODE.get(code.toUpperCase());
export const airportLabel = (a: Airport) => `${a.code} - ${a.name}`;

// Ranks matches: exact code, code prefix, city prefix, name contains, city/country contains
export function searchAirports(query: string, limit = 8): Airport[] {
  const q = query.trim().toLowerCase();
  if (!q) return AIRPORTS.slice(0, limit); // nothing typed yet: show the first (busiest) airports

  const scored: { a: Airport; score: number }[] = [];
  for (const a of AIRPORTS) {
    const code = a.code.toLowerCase();
    const name = a.name.toLowerCase();
    const city = a.city.toLowerCase();
    const country = a.country.toLowerCase();

    let score = -1;
    if (code === q) score = 0;
    else if (code.startsWith(q)) score = 1;
    else if (city.startsWith(q)) score = 2;
    else if (name.includes(q)) score = 3;
    else if (city.includes(q) || country.includes(q)) score = 4;

    if (score >= 0) scored.push({ a, score });
  }
  return scored.sort((x, y) => x.score - y.score).slice(0, limit).map((s) => s.a);
}