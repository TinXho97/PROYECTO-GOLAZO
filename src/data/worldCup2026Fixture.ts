import type { WorldCupFixtureMetadata, WorldCupMatch } from '../types/worldCup';

export const worldCup2026FixtureMetadata: WorldCupFixtureMetadata = {
  sourceName: 'FIFA - Match schedule, fixtures, results, teams and stadiums',
  sourceUrl: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums',
  endpointUrl: 'https://api.fifa.com/api/v3/calendar/matches?language=en&count=500&idCompetition=17&idSeason=285023',
  lastVerifiedAt: '2026-06-11T01:29:35.945Z',
  timezonePolicy: 'Kickoffs are stored in UTC from FIFA data and rendered for users in es-AR with America/Argentina/Buenos_Aires.',
};

export const worldCup2026Matches: WorldCupMatch[] = [
  {
    "id": "400021443",
    "matchNumber": 1,
    "kickoffUtc": "2026-06-11T19:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "A",
    "groupLabel": "Grupo A",
    "home": {
      "code": "MEX",
      "name": "M\u00e9xico",
      "shortName": "M\u00e9xico"
    },
    "away": {
      "code": "RSA",
      "name": "Sud\u00e1frica",
      "shortName": "Sud\u00e1frica"
    },
    "city": "Mexico City",
    "stadium": "Mexico City Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021441",
    "matchNumber": 2,
    "kickoffUtc": "2026-06-12T02:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "A",
    "groupLabel": "Grupo A",
    "home": {
      "code": "KOR",
      "name": "Corea del Sur",
      "shortName": "Corea del Sur"
    },
    "away": {
      "code": "CZE",
      "name": "Chequia",
      "shortName": "Chequia"
    },
    "city": "Guadalajara",
    "stadium": "Guadalajara Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021449",
    "matchNumber": 3,
    "kickoffUtc": "2026-06-12T19:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "B",
    "groupLabel": "Grupo B",
    "home": {
      "code": "CAN",
      "name": "Canad\u00e1",
      "shortName": "Canad\u00e1"
    },
    "away": {
      "code": "BIH",
      "name": "Bosnia y Herzegovina",
      "shortName": "Bosnia y Herzegovina"
    },
    "city": "Toronto",
    "stadium": "Toronto Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021458",
    "matchNumber": 4,
    "kickoffUtc": "2026-06-13T01:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "D",
    "groupLabel": "Grupo D",
    "home": {
      "code": "USA",
      "name": "Estados Unidos",
      "shortName": "Estados Unidos"
    },
    "away": {
      "code": "PAR",
      "name": "Paraguay",
      "shortName": "Paraguay"
    },
    "city": "Los Angeles",
    "stadium": "Los Angeles Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021447",
    "matchNumber": 8,
    "kickoffUtc": "2026-06-13T19:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "B",
    "groupLabel": "Grupo B",
    "home": {
      "code": "QAT",
      "name": "Catar",
      "shortName": "Catar"
    },
    "away": {
      "code": "SUI",
      "name": "Suiza",
      "shortName": "Suiza"
    },
    "city": "San Francisco Bay Area",
    "stadium": "San Francisco Bay Area Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021456",
    "matchNumber": 7,
    "kickoffUtc": "2026-06-13T22:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "C",
    "groupLabel": "Grupo C",
    "home": {
      "code": "BRA",
      "name": "Brasil",
      "shortName": "Brasil"
    },
    "away": {
      "code": "MAR",
      "name": "Marruecos",
      "shortName": "Marruecos"
    },
    "city": "New Jersey",
    "stadium": "New York/New Jersey Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021453",
    "matchNumber": 5,
    "kickoffUtc": "2026-06-14T01:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "C",
    "groupLabel": "Grupo C",
    "home": {
      "code": "HAI",
      "name": "Hait\u00ed",
      "shortName": "Hait\u00ed"
    },
    "away": {
      "code": "SCO",
      "name": "Escocia",
      "shortName": "Escocia"
    },
    "city": "Boston",
    "stadium": "Boston Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021463",
    "matchNumber": 6,
    "kickoffUtc": "2026-06-14T04:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "D",
    "groupLabel": "Grupo D",
    "home": {
      "code": "AUS",
      "name": "Australia",
      "shortName": "Australia"
    },
    "away": {
      "code": "TUR",
      "name": "Turqu\u00eda",
      "shortName": "Turqu\u00eda"
    },
    "city": "Vancouver",
    "stadium": "BC Place Vancouver",
    "status": "scheduled"
  },
  {
    "id": "400021464",
    "matchNumber": 10,
    "kickoffUtc": "2026-06-14T17:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "E",
    "groupLabel": "Grupo E",
    "home": {
      "code": "GER",
      "name": "Alemania",
      "shortName": "Alemania"
    },
    "away": {
      "code": "CUW",
      "name": "Curazao",
      "shortName": "Curazao"
    },
    "city": "Houston",
    "stadium": "Houston Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021470",
    "matchNumber": 11,
    "kickoffUtc": "2026-06-14T20:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "F",
    "groupLabel": "Grupo F",
    "home": {
      "code": "NED",
      "name": "Pa\u00edses Bajos",
      "shortName": "Pa\u00edses Bajos"
    },
    "away": {
      "code": "JPN",
      "name": "Jap\u00f3n",
      "shortName": "Jap\u00f3n"
    },
    "city": "Dallas",
    "stadium": "Dallas Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021467",
    "matchNumber": 9,
    "kickoffUtc": "2026-06-14T23:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "E",
    "groupLabel": "Grupo E",
    "home": {
      "code": "CIV",
      "name": "Costa de Marfil",
      "shortName": "Costa de Marfil"
    },
    "away": {
      "code": "ECU",
      "name": "Ecuador",
      "shortName": "Ecuador"
    },
    "city": "Philadelphia",
    "stadium": "Philadelphia Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021474",
    "matchNumber": 12,
    "kickoffUtc": "2026-06-15T02:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "F",
    "groupLabel": "Grupo F",
    "home": {
      "code": "SWE",
      "name": "Suecia",
      "shortName": "Suecia"
    },
    "away": {
      "code": "TUN",
      "name": "T\u00fanez",
      "shortName": "T\u00fanez"
    },
    "city": "Monterrey",
    "stadium": "Monterrey Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021482",
    "matchNumber": 14,
    "kickoffUtc": "2026-06-15T16:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "H",
    "groupLabel": "Grupo H",
    "home": {
      "code": "ESP",
      "name": "Espa\u00f1a",
      "shortName": "Espa\u00f1a"
    },
    "away": {
      "code": "CPV",
      "name": "Cabo Verde",
      "shortName": "Cabo Verde"
    },
    "city": "Atlanta",
    "stadium": "Atlanta Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021478",
    "matchNumber": 16,
    "kickoffUtc": "2026-06-15T19:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "G",
    "groupLabel": "Grupo G",
    "home": {
      "code": "BEL",
      "name": "B\u00e9lgica",
      "shortName": "B\u00e9lgica"
    },
    "away": {
      "code": "EGY",
      "name": "Egipto",
      "shortName": "Egipto"
    },
    "city": "Seattle",
    "stadium": "Seattle Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021486",
    "matchNumber": 13,
    "kickoffUtc": "2026-06-15T22:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "H",
    "groupLabel": "Grupo H",
    "home": {
      "code": "KSA",
      "name": "Arabia Saudita",
      "shortName": "Arabia Saudita"
    },
    "away": {
      "code": "URU",
      "name": "Uruguay",
      "shortName": "Uruguay"
    },
    "city": "Miami",
    "stadium": "Miami Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021476",
    "matchNumber": 15,
    "kickoffUtc": "2026-06-16T01:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "G",
    "groupLabel": "Grupo G",
    "home": {
      "code": "IRN",
      "name": "Ir\u00e1n",
      "shortName": "Ir\u00e1n"
    },
    "away": {
      "code": "NZL",
      "name": "Nueva Zelanda",
      "shortName": "Nueva Zelanda"
    },
    "city": "Los Angeles",
    "stadium": "Los Angeles Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021490",
    "matchNumber": 17,
    "kickoffUtc": "2026-06-16T19:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "I",
    "groupLabel": "Grupo I",
    "home": {
      "code": "FRA",
      "name": "Francia",
      "shortName": "Francia"
    },
    "away": {
      "code": "SEN",
      "name": "Senegal",
      "shortName": "Senegal"
    },
    "city": "New Jersey",
    "stadium": "New York/New Jersey Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021488",
    "matchNumber": 18,
    "kickoffUtc": "2026-06-16T22:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "I",
    "groupLabel": "Grupo I",
    "home": {
      "code": "IRQ",
      "name": "Irak",
      "shortName": "Irak"
    },
    "away": {
      "code": "NOR",
      "name": "Noruega",
      "shortName": "Noruega"
    },
    "city": "Boston",
    "stadium": "Boston Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021496",
    "matchNumber": 19,
    "kickoffUtc": "2026-06-17T01:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "J",
    "groupLabel": "Grupo J",
    "home": {
      "code": "ARG",
      "name": "Argentina",
      "shortName": "Argentina"
    },
    "away": {
      "code": "ALG",
      "name": "Argelia",
      "shortName": "Argelia"
    },
    "city": "Kansas City",
    "stadium": "Kansas City Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021498",
    "matchNumber": 20,
    "kickoffUtc": "2026-06-17T04:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "J",
    "groupLabel": "Grupo J",
    "home": {
      "code": "AUT",
      "name": "Austria",
      "shortName": "Austria"
    },
    "away": {
      "code": "JOR",
      "name": "Jordania",
      "shortName": "Jordania"
    },
    "city": "San Francisco Bay Area",
    "stadium": "San Francisco Bay Area Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021502",
    "matchNumber": 23,
    "kickoffUtc": "2026-06-17T17:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "K",
    "groupLabel": "Grupo K",
    "home": {
      "code": "POR",
      "name": "Portugal",
      "shortName": "Portugal"
    },
    "away": {
      "code": "COD",
      "name": "RD Congo",
      "shortName": "RD Congo"
    },
    "city": "Houston",
    "stadium": "Houston Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021507",
    "matchNumber": 22,
    "kickoffUtc": "2026-06-17T20:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "L",
    "groupLabel": "Grupo L",
    "home": {
      "code": "ENG",
      "name": "Inglaterra",
      "shortName": "Inglaterra"
    },
    "away": {
      "code": "CRO",
      "name": "Croacia",
      "shortName": "Croacia"
    },
    "city": "Dallas",
    "stadium": "Dallas Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021510",
    "matchNumber": 21,
    "kickoffUtc": "2026-06-17T23:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "L",
    "groupLabel": "Grupo L",
    "home": {
      "code": "GHA",
      "name": "Ghana",
      "shortName": "Ghana"
    },
    "away": {
      "code": "PAN",
      "name": "Panam\u00e1",
      "shortName": "Panam\u00e1"
    },
    "city": "Toronto",
    "stadium": "Toronto Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021504",
    "matchNumber": 24,
    "kickoffUtc": "2026-06-18T02:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "K",
    "groupLabel": "Grupo K",
    "home": {
      "code": "UZB",
      "name": "Uzbekist\u00e1n",
      "shortName": "Uzbekist\u00e1n"
    },
    "away": {
      "code": "COL",
      "name": "Colombia",
      "shortName": "Colombia"
    },
    "city": "Mexico City",
    "stadium": "Mexico City Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021440",
    "matchNumber": 25,
    "kickoffUtc": "2026-06-18T16:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "A",
    "groupLabel": "Grupo A",
    "home": {
      "code": "CZE",
      "name": "Chequia",
      "shortName": "Chequia"
    },
    "away": {
      "code": "RSA",
      "name": "Sud\u00e1frica",
      "shortName": "Sud\u00e1frica"
    },
    "city": "Atlanta",
    "stadium": "Atlanta Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021446",
    "matchNumber": 26,
    "kickoffUtc": "2026-06-18T19:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "B",
    "groupLabel": "Grupo B",
    "home": {
      "code": "SUI",
      "name": "Suiza",
      "shortName": "Suiza"
    },
    "away": {
      "code": "BIH",
      "name": "Bosnia y Herzegovina",
      "shortName": "Bosnia y Herzegovina"
    },
    "city": "Los Angeles",
    "stadium": "Los Angeles Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021450",
    "matchNumber": 27,
    "kickoffUtc": "2026-06-18T22:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "B",
    "groupLabel": "Grupo B",
    "home": {
      "code": "CAN",
      "name": "Canad\u00e1",
      "shortName": "Canad\u00e1"
    },
    "away": {
      "code": "QAT",
      "name": "Catar",
      "shortName": "Catar"
    },
    "city": "Vancouver",
    "stadium": "BC Place Vancouver",
    "status": "scheduled"
  },
  {
    "id": "400021442",
    "matchNumber": 28,
    "kickoffUtc": "2026-06-19T01:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "A",
    "groupLabel": "Grupo A",
    "home": {
      "code": "MEX",
      "name": "M\u00e9xico",
      "shortName": "M\u00e9xico"
    },
    "away": {
      "code": "KOR",
      "name": "Corea del Sur",
      "shortName": "Corea del Sur"
    },
    "city": "Guadalajara",
    "stadium": "Guadalajara Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021462",
    "matchNumber": 32,
    "kickoffUtc": "2026-06-19T19:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "D",
    "groupLabel": "Grupo D",
    "home": {
      "code": "USA",
      "name": "Estados Unidos",
      "shortName": "Estados Unidos"
    },
    "away": {
      "code": "AUS",
      "name": "Australia",
      "shortName": "Australia"
    },
    "city": "Seattle",
    "stadium": "Seattle Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021454",
    "matchNumber": 30,
    "kickoffUtc": "2026-06-19T22:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "C",
    "groupLabel": "Grupo C",
    "home": {
      "code": "SCO",
      "name": "Escocia",
      "shortName": "Escocia"
    },
    "away": {
      "code": "MAR",
      "name": "Marruecos",
      "shortName": "Marruecos"
    },
    "city": "Boston",
    "stadium": "Boston Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021457",
    "matchNumber": 29,
    "kickoffUtc": "2026-06-20T00:30:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "C",
    "groupLabel": "Grupo C",
    "home": {
      "code": "BRA",
      "name": "Brasil",
      "shortName": "Brasil"
    },
    "away": {
      "code": "HAI",
      "name": "Hait\u00ed",
      "shortName": "Hait\u00ed"
    },
    "city": "Philadelphia",
    "stadium": "Philadelphia Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021460",
    "matchNumber": 31,
    "kickoffUtc": "2026-06-20T03:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "D",
    "groupLabel": "Grupo D",
    "home": {
      "code": "TUR",
      "name": "Turqu\u00eda",
      "shortName": "Turqu\u00eda"
    },
    "away": {
      "code": "PAR",
      "name": "Paraguay",
      "shortName": "Paraguay"
    },
    "city": "San Francisco Bay Area",
    "stadium": "San Francisco Bay Area Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021472",
    "matchNumber": 35,
    "kickoffUtc": "2026-06-20T17:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "F",
    "groupLabel": "Grupo F",
    "home": {
      "code": "NED",
      "name": "Pa\u00edses Bajos",
      "shortName": "Pa\u00edses Bajos"
    },
    "away": {
      "code": "SWE",
      "name": "Suecia",
      "shortName": "Suecia"
    },
    "city": "Houston",
    "stadium": "Houston Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021469",
    "matchNumber": 33,
    "kickoffUtc": "2026-06-20T20:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "E",
    "groupLabel": "Grupo E",
    "home": {
      "code": "GER",
      "name": "Alemania",
      "shortName": "Alemania"
    },
    "away": {
      "code": "CIV",
      "name": "Costa de Marfil",
      "shortName": "Costa de Marfil"
    },
    "city": "Toronto",
    "stadium": "Toronto Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021465",
    "matchNumber": 34,
    "kickoffUtc": "2026-06-21T00:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "E",
    "groupLabel": "Grupo E",
    "home": {
      "code": "ECU",
      "name": "Ecuador",
      "shortName": "Ecuador"
    },
    "away": {
      "code": "CUW",
      "name": "Curazao",
      "shortName": "Curazao"
    },
    "city": "Kansas City",
    "stadium": "Kansas City Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021475",
    "matchNumber": 36,
    "kickoffUtc": "2026-06-21T04:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "F",
    "groupLabel": "Grupo F",
    "home": {
      "code": "TUN",
      "name": "T\u00fanez",
      "shortName": "T\u00fanez"
    },
    "away": {
      "code": "JPN",
      "name": "Jap\u00f3n",
      "shortName": "Jap\u00f3n"
    },
    "city": "Monterrey",
    "stadium": "Monterrey Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021483",
    "matchNumber": 38,
    "kickoffUtc": "2026-06-21T16:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "H",
    "groupLabel": "Grupo H",
    "home": {
      "code": "ESP",
      "name": "Espa\u00f1a",
      "shortName": "Espa\u00f1a"
    },
    "away": {
      "code": "KSA",
      "name": "Arabia Saudita",
      "shortName": "Arabia Saudita"
    },
    "city": "Atlanta",
    "stadium": "Atlanta Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021477",
    "matchNumber": 39,
    "kickoffUtc": "2026-06-21T19:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "G",
    "groupLabel": "Grupo G",
    "home": {
      "code": "BEL",
      "name": "B\u00e9lgica",
      "shortName": "B\u00e9lgica"
    },
    "away": {
      "code": "IRN",
      "name": "Ir\u00e1n",
      "shortName": "Ir\u00e1n"
    },
    "city": "Los Angeles",
    "stadium": "Los Angeles Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021487",
    "matchNumber": 37,
    "kickoffUtc": "2026-06-21T22:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "H",
    "groupLabel": "Grupo H",
    "home": {
      "code": "URU",
      "name": "Uruguay",
      "shortName": "Uruguay"
    },
    "away": {
      "code": "CPV",
      "name": "Cabo Verde",
      "shortName": "Cabo Verde"
    },
    "city": "Miami",
    "stadium": "Miami Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021480",
    "matchNumber": 40,
    "kickoffUtc": "2026-06-22T01:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "G",
    "groupLabel": "Grupo G",
    "home": {
      "code": "NZL",
      "name": "Nueva Zelanda",
      "shortName": "Nueva Zelanda"
    },
    "away": {
      "code": "EGY",
      "name": "Egipto",
      "shortName": "Egipto"
    },
    "city": "Vancouver",
    "stadium": "BC Place Vancouver",
    "status": "scheduled"
  },
  {
    "id": "400021494",
    "matchNumber": 43,
    "kickoffUtc": "2026-06-22T17:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "J",
    "groupLabel": "Grupo J",
    "home": {
      "code": "ARG",
      "name": "Argentina",
      "shortName": "Argentina"
    },
    "away": {
      "code": "AUT",
      "name": "Austria",
      "shortName": "Austria"
    },
    "city": "Dallas",
    "stadium": "Dallas Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021492",
    "matchNumber": 42,
    "kickoffUtc": "2026-06-22T21:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "I",
    "groupLabel": "Grupo I",
    "home": {
      "code": "FRA",
      "name": "Francia",
      "shortName": "Francia"
    },
    "away": {
      "code": "IRQ",
      "name": "Irak",
      "shortName": "Irak"
    },
    "city": "Philadelphia",
    "stadium": "Philadelphia Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021491",
    "matchNumber": 41,
    "kickoffUtc": "2026-06-23T00:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "I",
    "groupLabel": "Grupo I",
    "home": {
      "code": "NOR",
      "name": "Noruega",
      "shortName": "Noruega"
    },
    "away": {
      "code": "SEN",
      "name": "Senegal",
      "shortName": "Senegal"
    },
    "city": "New Jersey",
    "stadium": "New York/New Jersey Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021499",
    "matchNumber": 44,
    "kickoffUtc": "2026-06-23T03:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "J",
    "groupLabel": "Grupo J",
    "home": {
      "code": "JOR",
      "name": "Jordania",
      "shortName": "Jordania"
    },
    "away": {
      "code": "ALG",
      "name": "Argelia",
      "shortName": "Argelia"
    },
    "city": "San Francisco Bay Area",
    "stadium": "San Francisco Bay Area Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021503",
    "matchNumber": 47,
    "kickoffUtc": "2026-06-23T17:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "K",
    "groupLabel": "Grupo K",
    "home": {
      "code": "POR",
      "name": "Portugal",
      "shortName": "Portugal"
    },
    "away": {
      "code": "UZB",
      "name": "Uzbekist\u00e1n",
      "shortName": "Uzbekist\u00e1n"
    },
    "city": "Houston",
    "stadium": "Houston Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021506",
    "matchNumber": 45,
    "kickoffUtc": "2026-06-23T20:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "L",
    "groupLabel": "Grupo L",
    "home": {
      "code": "ENG",
      "name": "Inglaterra",
      "shortName": "Inglaterra"
    },
    "away": {
      "code": "GHA",
      "name": "Ghana",
      "shortName": "Ghana"
    },
    "city": "Boston",
    "stadium": "Boston Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021511",
    "matchNumber": 46,
    "kickoffUtc": "2026-06-23T23:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "L",
    "groupLabel": "Grupo L",
    "home": {
      "code": "PAN",
      "name": "Panam\u00e1",
      "shortName": "Panam\u00e1"
    },
    "away": {
      "code": "CRO",
      "name": "Croacia",
      "shortName": "Croacia"
    },
    "city": "Toronto",
    "stadium": "Toronto Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021501",
    "matchNumber": 48,
    "kickoffUtc": "2026-06-24T02:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "K",
    "groupLabel": "Grupo K",
    "home": {
      "code": "COL",
      "name": "Colombia",
      "shortName": "Colombia"
    },
    "away": {
      "code": "COD",
      "name": "RD Congo",
      "shortName": "RD Congo"
    },
    "city": "Guadalajara",
    "stadium": "Guadalajara Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021451",
    "matchNumber": 51,
    "kickoffUtc": "2026-06-24T19:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "B",
    "groupLabel": "Grupo B",
    "home": {
      "code": "SUI",
      "name": "Suiza",
      "shortName": "Suiza"
    },
    "away": {
      "code": "CAN",
      "name": "Canad\u00e1",
      "shortName": "Canad\u00e1"
    },
    "city": "Vancouver",
    "stadium": "BC Place Vancouver",
    "status": "scheduled"
  },
  {
    "id": "400021448",
    "matchNumber": 52,
    "kickoffUtc": "2026-06-24T19:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "B",
    "groupLabel": "Grupo B",
    "home": {
      "code": "BIH",
      "name": "Bosnia y Herzegovina",
      "shortName": "Bosnia y Herzegovina"
    },
    "away": {
      "code": "QAT",
      "name": "Catar",
      "shortName": "Catar"
    },
    "city": "Seattle",
    "stadium": "Seattle Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021455",
    "matchNumber": 49,
    "kickoffUtc": "2026-06-24T22:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "C",
    "groupLabel": "Grupo C",
    "home": {
      "code": "SCO",
      "name": "Escocia",
      "shortName": "Escocia"
    },
    "away": {
      "code": "BRA",
      "name": "Brasil",
      "shortName": "Brasil"
    },
    "city": "Miami",
    "stadium": "Miami Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021452",
    "matchNumber": 50,
    "kickoffUtc": "2026-06-24T22:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "C",
    "groupLabel": "Grupo C",
    "home": {
      "code": "MAR",
      "name": "Marruecos",
      "shortName": "Marruecos"
    },
    "away": {
      "code": "HAI",
      "name": "Hait\u00ed",
      "shortName": "Hait\u00ed"
    },
    "city": "Atlanta",
    "stadium": "Atlanta Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021444",
    "matchNumber": 53,
    "kickoffUtc": "2026-06-25T01:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "A",
    "groupLabel": "Grupo A",
    "home": {
      "code": "CZE",
      "name": "Chequia",
      "shortName": "Chequia"
    },
    "away": {
      "code": "MEX",
      "name": "M\u00e9xico",
      "shortName": "M\u00e9xico"
    },
    "city": "Mexico City",
    "stadium": "Mexico City Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021445",
    "matchNumber": 54,
    "kickoffUtc": "2026-06-25T01:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "A",
    "groupLabel": "Grupo A",
    "home": {
      "code": "RSA",
      "name": "Sud\u00e1frica",
      "shortName": "Sud\u00e1frica"
    },
    "away": {
      "code": "KOR",
      "name": "Corea del Sur",
      "shortName": "Corea del Sur"
    },
    "city": "Monterrey",
    "stadium": "Monterrey Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021468",
    "matchNumber": 55,
    "kickoffUtc": "2026-06-25T20:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "E",
    "groupLabel": "Grupo E",
    "home": {
      "code": "CUW",
      "name": "Curazao",
      "shortName": "Curazao"
    },
    "away": {
      "code": "CIV",
      "name": "Costa de Marfil",
      "shortName": "Costa de Marfil"
    },
    "city": "Philadelphia",
    "stadium": "Philadelphia Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021466",
    "matchNumber": 56,
    "kickoffUtc": "2026-06-25T20:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "E",
    "groupLabel": "Grupo E",
    "home": {
      "code": "ECU",
      "name": "Ecuador",
      "shortName": "Ecuador"
    },
    "away": {
      "code": "GER",
      "name": "Alemania",
      "shortName": "Alemania"
    },
    "city": "New Jersey",
    "stadium": "New York/New Jersey Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021471",
    "matchNumber": 57,
    "kickoffUtc": "2026-06-25T23:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "F",
    "groupLabel": "Grupo F",
    "home": {
      "code": "JPN",
      "name": "Jap\u00f3n",
      "shortName": "Jap\u00f3n"
    },
    "away": {
      "code": "SWE",
      "name": "Suecia",
      "shortName": "Suecia"
    },
    "city": "Dallas",
    "stadium": "Dallas Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021473",
    "matchNumber": 58,
    "kickoffUtc": "2026-06-25T23:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "F",
    "groupLabel": "Grupo F",
    "home": {
      "code": "TUN",
      "name": "T\u00fanez",
      "shortName": "T\u00fanez"
    },
    "away": {
      "code": "NED",
      "name": "Pa\u00edses Bajos",
      "shortName": "Pa\u00edses Bajos"
    },
    "city": "Kansas City",
    "stadium": "Kansas City Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021459",
    "matchNumber": 59,
    "kickoffUtc": "2026-06-26T02:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "D",
    "groupLabel": "Grupo D",
    "home": {
      "code": "TUR",
      "name": "Turqu\u00eda",
      "shortName": "Turqu\u00eda"
    },
    "away": {
      "code": "USA",
      "name": "Estados Unidos",
      "shortName": "Estados Unidos"
    },
    "city": "Los Angeles",
    "stadium": "Los Angeles Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021461",
    "matchNumber": 60,
    "kickoffUtc": "2026-06-26T02:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "D",
    "groupLabel": "Grupo D",
    "home": {
      "code": "PAR",
      "name": "Paraguay",
      "shortName": "Paraguay"
    },
    "away": {
      "code": "AUS",
      "name": "Australia",
      "shortName": "Australia"
    },
    "city": "San Francisco Bay Area",
    "stadium": "San Francisco Bay Area Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021489",
    "matchNumber": 61,
    "kickoffUtc": "2026-06-26T19:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "I",
    "groupLabel": "Grupo I",
    "home": {
      "code": "NOR",
      "name": "Noruega",
      "shortName": "Noruega"
    },
    "away": {
      "code": "FRA",
      "name": "Francia",
      "shortName": "Francia"
    },
    "city": "Boston",
    "stadium": "Boston Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021493",
    "matchNumber": 62,
    "kickoffUtc": "2026-06-26T19:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "I",
    "groupLabel": "Grupo I",
    "home": {
      "code": "SEN",
      "name": "Senegal",
      "shortName": "Senegal"
    },
    "away": {
      "code": "IRQ",
      "name": "Irak",
      "shortName": "Irak"
    },
    "city": "Toronto",
    "stadium": "Toronto Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021485",
    "matchNumber": 65,
    "kickoffUtc": "2026-06-27T00:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "H",
    "groupLabel": "Grupo H",
    "home": {
      "code": "CPV",
      "name": "Cabo Verde",
      "shortName": "Cabo Verde"
    },
    "away": {
      "code": "KSA",
      "name": "Arabia Saudita",
      "shortName": "Arabia Saudita"
    },
    "city": "Houston",
    "stadium": "Houston Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021484",
    "matchNumber": 66,
    "kickoffUtc": "2026-06-27T00:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "H",
    "groupLabel": "Grupo H",
    "home": {
      "code": "URU",
      "name": "Uruguay",
      "shortName": "Uruguay"
    },
    "away": {
      "code": "ESP",
      "name": "Espa\u00f1a",
      "shortName": "Espa\u00f1a"
    },
    "city": "Guadalajara",
    "stadium": "Guadalajara Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021479",
    "matchNumber": 63,
    "kickoffUtc": "2026-06-27T03:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "G",
    "groupLabel": "Grupo G",
    "home": {
      "code": "EGY",
      "name": "Egipto",
      "shortName": "Egipto"
    },
    "away": {
      "code": "IRN",
      "name": "Ir\u00e1n",
      "shortName": "Ir\u00e1n"
    },
    "city": "Seattle",
    "stadium": "Seattle Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021481",
    "matchNumber": 64,
    "kickoffUtc": "2026-06-27T03:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "G",
    "groupLabel": "Grupo G",
    "home": {
      "code": "NZL",
      "name": "Nueva Zelanda",
      "shortName": "Nueva Zelanda"
    },
    "away": {
      "code": "BEL",
      "name": "B\u00e9lgica",
      "shortName": "B\u00e9lgica"
    },
    "city": "Vancouver",
    "stadium": "BC Place Vancouver",
    "status": "scheduled"
  },
  {
    "id": "400021508",
    "matchNumber": 67,
    "kickoffUtc": "2026-06-27T21:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "L",
    "groupLabel": "Grupo L",
    "home": {
      "code": "PAN",
      "name": "Panam\u00e1",
      "shortName": "Panam\u00e1"
    },
    "away": {
      "code": "ENG",
      "name": "Inglaterra",
      "shortName": "Inglaterra"
    },
    "city": "New Jersey",
    "stadium": "New York/New Jersey Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021509",
    "matchNumber": 68,
    "kickoffUtc": "2026-06-27T21:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "L",
    "groupLabel": "Grupo L",
    "home": {
      "code": "CRO",
      "name": "Croacia",
      "shortName": "Croacia"
    },
    "away": {
      "code": "GHA",
      "name": "Ghana",
      "shortName": "Ghana"
    },
    "city": "Philadelphia",
    "stadium": "Philadelphia Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021505",
    "matchNumber": 71,
    "kickoffUtc": "2026-06-27T23:30:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "K",
    "groupLabel": "Grupo K",
    "home": {
      "code": "COL",
      "name": "Colombia",
      "shortName": "Colombia"
    },
    "away": {
      "code": "POR",
      "name": "Portugal",
      "shortName": "Portugal"
    },
    "city": "Miami",
    "stadium": "Miami Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021500",
    "matchNumber": 72,
    "kickoffUtc": "2026-06-27T23:30:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "K",
    "groupLabel": "Grupo K",
    "home": {
      "code": "COD",
      "name": "RD Congo",
      "shortName": "RD Congo"
    },
    "away": {
      "code": "UZB",
      "name": "Uzbekist\u00e1n",
      "shortName": "Uzbekist\u00e1n"
    },
    "city": "Atlanta",
    "stadium": "Atlanta Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021497",
    "matchNumber": 69,
    "kickoffUtc": "2026-06-28T02:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "J",
    "groupLabel": "Grupo J",
    "home": {
      "code": "ALG",
      "name": "Argelia",
      "shortName": "Argelia"
    },
    "away": {
      "code": "AUT",
      "name": "Austria",
      "shortName": "Austria"
    },
    "city": "Kansas City",
    "stadium": "Kansas City Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021495",
    "matchNumber": 70,
    "kickoffUtc": "2026-06-28T02:00:00.000Z",
    "stage": "group",
    "stageLabel": "Fase de grupos",
    "group": "J",
    "groupLabel": "Grupo J",
    "home": {
      "code": "JOR",
      "name": "Jordania",
      "shortName": "Jordania"
    },
    "away": {
      "code": "ARG",
      "name": "Argentina",
      "shortName": "Argentina"
    },
    "city": "Dallas",
    "stadium": "Dallas Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021518",
    "matchNumber": 73,
    "kickoffUtc": "2026-06-28T19:00:00.000Z",
    "stage": "round-of-32",
    "stageLabel": "Dieciseisavos de final",
    "home": {
      "code": "2A",
      "name": "Segundo Grupo A",
      "shortName": "Segundo Grupo A",
      "isPlaceholder": true
    },
    "away": {
      "code": "2B",
      "name": "Segundo Grupo B",
      "shortName": "Segundo Grupo B",
      "isPlaceholder": true
    },
    "city": "Los Angeles",
    "stadium": "Los Angeles Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021516",
    "matchNumber": 76,
    "kickoffUtc": "2026-06-29T17:00:00.000Z",
    "stage": "round-of-32",
    "stageLabel": "Dieciseisavos de final",
    "home": {
      "code": "1C",
      "name": "Ganador Grupo C",
      "shortName": "Ganador Grupo C",
      "isPlaceholder": true
    },
    "away": {
      "code": "2F",
      "name": "Segundo Grupo F",
      "shortName": "Segundo Grupo F",
      "isPlaceholder": true
    },
    "city": "Houston",
    "stadium": "Houston Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021513",
    "matchNumber": 74,
    "kickoffUtc": "2026-06-29T20:30:00.000Z",
    "stage": "round-of-32",
    "stageLabel": "Dieciseisavos de final",
    "home": {
      "code": "1E",
      "name": "Ganador Grupo E",
      "shortName": "Ganador Grupo E",
      "isPlaceholder": true
    },
    "away": {
      "code": "3ABCDF",
      "name": "Mejor tercero (A/B/C/D/F)",
      "shortName": "Mejor tercero (A/B/C/D/F)",
      "isPlaceholder": true
    },
    "city": "Boston",
    "stadium": "Boston Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021522",
    "matchNumber": 75,
    "kickoffUtc": "2026-06-30T01:00:00.000Z",
    "stage": "round-of-32",
    "stageLabel": "Dieciseisavos de final",
    "home": {
      "code": "1F",
      "name": "Ganador Grupo F",
      "shortName": "Ganador Grupo F",
      "isPlaceholder": true
    },
    "away": {
      "code": "2C",
      "name": "Segundo Grupo C",
      "shortName": "Segundo Grupo C",
      "isPlaceholder": true
    },
    "city": "Monterrey",
    "stadium": "Monterrey Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021514",
    "matchNumber": 78,
    "kickoffUtc": "2026-06-30T17:00:00.000Z",
    "stage": "round-of-32",
    "stageLabel": "Dieciseisavos de final",
    "home": {
      "code": "2E",
      "name": "Segundo Grupo E",
      "shortName": "Segundo Grupo E",
      "isPlaceholder": true
    },
    "away": {
      "code": "2I",
      "name": "Segundo Grupo I",
      "shortName": "Segundo Grupo I",
      "isPlaceholder": true
    },
    "city": "Dallas",
    "stadium": "Dallas Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021523",
    "matchNumber": 77,
    "kickoffUtc": "2026-06-30T21:00:00.000Z",
    "stage": "round-of-32",
    "stageLabel": "Dieciseisavos de final",
    "home": {
      "code": "1I",
      "name": "Ganador Grupo I",
      "shortName": "Ganador Grupo I",
      "isPlaceholder": true
    },
    "away": {
      "code": "3CDFGH",
      "name": "Mejor tercero (C/D/F/G/H)",
      "shortName": "Mejor tercero (C/D/F/G/H)",
      "isPlaceholder": true
    },
    "city": "New Jersey",
    "stadium": "New York/New Jersey Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021520",
    "matchNumber": 79,
    "kickoffUtc": "2026-07-01T01:00:00.000Z",
    "stage": "round-of-32",
    "stageLabel": "Dieciseisavos de final",
    "home": {
      "code": "1A",
      "name": "Ganador Grupo A",
      "shortName": "Ganador Grupo A",
      "isPlaceholder": true
    },
    "away": {
      "code": "3CEFHI",
      "name": "Mejor tercero (C/E/F/H/I)",
      "shortName": "Mejor tercero (C/E/F/H/I)",
      "isPlaceholder": true
    },
    "city": "Mexico City",
    "stadium": "Mexico City Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021512",
    "matchNumber": 80,
    "kickoffUtc": "2026-07-01T16:00:00.000Z",
    "stage": "round-of-32",
    "stageLabel": "Dieciseisavos de final",
    "home": {
      "code": "1L",
      "name": "Ganador Grupo L",
      "shortName": "Ganador Grupo L",
      "isPlaceholder": true
    },
    "away": {
      "code": "3EHIJK",
      "name": "Mejor tercero (E/H/I/J/K)",
      "shortName": "Mejor tercero (E/H/I/J/K)",
      "isPlaceholder": true
    },
    "city": "Atlanta",
    "stadium": "Atlanta Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021525",
    "matchNumber": 82,
    "kickoffUtc": "2026-07-01T20:00:00.000Z",
    "stage": "round-of-32",
    "stageLabel": "Dieciseisavos de final",
    "home": {
      "code": "1G",
      "name": "Ganador Grupo G",
      "shortName": "Ganador Grupo G",
      "isPlaceholder": true
    },
    "away": {
      "code": "3AEHIJ",
      "name": "Mejor tercero (A/E/H/I/J)",
      "shortName": "Mejor tercero (A/E/H/I/J)",
      "isPlaceholder": true
    },
    "city": "Seattle",
    "stadium": "Seattle Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021524",
    "matchNumber": 81,
    "kickoffUtc": "2026-07-02T00:00:00.000Z",
    "stage": "round-of-32",
    "stageLabel": "Dieciseisavos de final",
    "home": {
      "code": "1D",
      "name": "Ganador Grupo D",
      "shortName": "Ganador Grupo D",
      "isPlaceholder": true
    },
    "away": {
      "code": "3BEFIJ",
      "name": "Mejor tercero (B/E/F/I/J)",
      "shortName": "Mejor tercero (B/E/F/I/J)",
      "isPlaceholder": true
    },
    "city": "San Francisco Bay Area",
    "stadium": "San Francisco Bay Area Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021519",
    "matchNumber": 84,
    "kickoffUtc": "2026-07-02T19:00:00.000Z",
    "stage": "round-of-32",
    "stageLabel": "Dieciseisavos de final",
    "home": {
      "code": "1H",
      "name": "Ganador Grupo H",
      "shortName": "Ganador Grupo H",
      "isPlaceholder": true
    },
    "away": {
      "code": "2J",
      "name": "Segundo Grupo J",
      "shortName": "Segundo Grupo J",
      "isPlaceholder": true
    },
    "city": "Los Angeles",
    "stadium": "Los Angeles Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021526",
    "matchNumber": 83,
    "kickoffUtc": "2026-07-02T23:00:00.000Z",
    "stage": "round-of-32",
    "stageLabel": "Dieciseisavos de final",
    "home": {
      "code": "2K",
      "name": "Segundo Grupo K",
      "shortName": "Segundo Grupo K",
      "isPlaceholder": true
    },
    "away": {
      "code": "2L",
      "name": "Segundo Grupo L",
      "shortName": "Segundo Grupo L",
      "isPlaceholder": true
    },
    "city": "Toronto",
    "stadium": "Toronto Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021527",
    "matchNumber": 85,
    "kickoffUtc": "2026-07-03T03:00:00.000Z",
    "stage": "round-of-32",
    "stageLabel": "Dieciseisavos de final",
    "home": {
      "code": "1B",
      "name": "Ganador Grupo B",
      "shortName": "Ganador Grupo B",
      "isPlaceholder": true
    },
    "away": {
      "code": "3EFGIJ",
      "name": "Mejor tercero (E/F/G/I/J)",
      "shortName": "Mejor tercero (E/F/G/I/J)",
      "isPlaceholder": true
    },
    "city": "Vancouver",
    "stadium": "BC Place Vancouver",
    "status": "scheduled"
  },
  {
    "id": "400021515",
    "matchNumber": 88,
    "kickoffUtc": "2026-07-03T18:00:00.000Z",
    "stage": "round-of-32",
    "stageLabel": "Dieciseisavos de final",
    "home": {
      "code": "2D",
      "name": "Segundo Grupo D",
      "shortName": "Segundo Grupo D",
      "isPlaceholder": true
    },
    "away": {
      "code": "2G",
      "name": "Segundo Grupo G",
      "shortName": "Segundo Grupo G",
      "isPlaceholder": true
    },
    "city": "Dallas",
    "stadium": "Dallas Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021521",
    "matchNumber": 86,
    "kickoffUtc": "2026-07-03T22:00:00.000Z",
    "stage": "round-of-32",
    "stageLabel": "Dieciseisavos de final",
    "home": {
      "code": "1J",
      "name": "Ganador Grupo J",
      "shortName": "Ganador Grupo J",
      "isPlaceholder": true
    },
    "away": {
      "code": "2H",
      "name": "Segundo Grupo H",
      "shortName": "Segundo Grupo H",
      "isPlaceholder": true
    },
    "city": "Miami",
    "stadium": "Miami Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021517",
    "matchNumber": 87,
    "kickoffUtc": "2026-07-04T01:30:00.000Z",
    "stage": "round-of-32",
    "stageLabel": "Dieciseisavos de final",
    "home": {
      "code": "1K",
      "name": "Ganador Grupo K",
      "shortName": "Ganador Grupo K",
      "isPlaceholder": true
    },
    "away": {
      "code": "3DEIJL",
      "name": "Mejor tercero (D/E/I/J/L)",
      "shortName": "Mejor tercero (D/E/I/J/L)",
      "isPlaceholder": true
    },
    "city": "Kansas City",
    "stadium": "Kansas City Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021530",
    "matchNumber": 90,
    "kickoffUtc": "2026-07-04T17:00:00.000Z",
    "stage": "round-of-16",
    "stageLabel": "Octavos de final",
    "home": {
      "code": "W73",
      "name": "Ganador partido 73",
      "shortName": "Ganador partido 73",
      "isPlaceholder": true
    },
    "away": {
      "code": "W75",
      "name": "Ganador partido 75",
      "shortName": "Ganador partido 75",
      "isPlaceholder": true
    },
    "city": "Houston",
    "stadium": "Houston Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021533",
    "matchNumber": 89,
    "kickoffUtc": "2026-07-04T21:00:00.000Z",
    "stage": "round-of-16",
    "stageLabel": "Octavos de final",
    "home": {
      "code": "W74",
      "name": "Ganador partido 74",
      "shortName": "Ganador partido 74",
      "isPlaceholder": true
    },
    "away": {
      "code": "W77",
      "name": "Ganador partido 77",
      "shortName": "Ganador partido 77",
      "isPlaceholder": true
    },
    "city": "Philadelphia",
    "stadium": "Philadelphia Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021532",
    "matchNumber": 91,
    "kickoffUtc": "2026-07-05T20:00:00.000Z",
    "stage": "round-of-16",
    "stageLabel": "Octavos de final",
    "home": {
      "code": "W76",
      "name": "Ganador partido 76",
      "shortName": "Ganador partido 76",
      "isPlaceholder": true
    },
    "away": {
      "code": "W78",
      "name": "Ganador partido 78",
      "shortName": "Ganador partido 78",
      "isPlaceholder": true
    },
    "city": "New Jersey",
    "stadium": "New York/New Jersey Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021531",
    "matchNumber": 92,
    "kickoffUtc": "2026-07-06T00:00:00.000Z",
    "stage": "round-of-16",
    "stageLabel": "Octavos de final",
    "home": {
      "code": "W79",
      "name": "Ganador partido 79",
      "shortName": "Ganador partido 79",
      "isPlaceholder": true
    },
    "away": {
      "code": "W80",
      "name": "Ganador partido 80",
      "shortName": "Ganador partido 80",
      "isPlaceholder": true
    },
    "city": "Mexico City",
    "stadium": "Mexico City Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021529",
    "matchNumber": 93,
    "kickoffUtc": "2026-07-06T19:00:00.000Z",
    "stage": "round-of-16",
    "stageLabel": "Octavos de final",
    "home": {
      "code": "W83",
      "name": "Ganador partido 83",
      "shortName": "Ganador partido 83",
      "isPlaceholder": true
    },
    "away": {
      "code": "W84",
      "name": "Ganador partido 84",
      "shortName": "Ganador partido 84",
      "isPlaceholder": true
    },
    "city": "Dallas",
    "stadium": "Dallas Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021534",
    "matchNumber": 94,
    "kickoffUtc": "2026-07-07T00:00:00.000Z",
    "stage": "round-of-16",
    "stageLabel": "Octavos de final",
    "home": {
      "code": "W81",
      "name": "Ganador partido 81",
      "shortName": "Ganador partido 81",
      "isPlaceholder": true
    },
    "away": {
      "code": "W82",
      "name": "Ganador partido 82",
      "shortName": "Ganador partido 82",
      "isPlaceholder": true
    },
    "city": "Seattle",
    "stadium": "Seattle Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021528",
    "matchNumber": 95,
    "kickoffUtc": "2026-07-07T16:00:00.000Z",
    "stage": "round-of-16",
    "stageLabel": "Octavos de final",
    "home": {
      "code": "W86",
      "name": "Ganador partido 86",
      "shortName": "Ganador partido 86",
      "isPlaceholder": true
    },
    "away": {
      "code": "W88",
      "name": "Ganador partido 88",
      "shortName": "Ganador partido 88",
      "isPlaceholder": true
    },
    "city": "Atlanta",
    "stadium": "Atlanta Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021535",
    "matchNumber": 96,
    "kickoffUtc": "2026-07-07T20:00:00.000Z",
    "stage": "round-of-16",
    "stageLabel": "Octavos de final",
    "home": {
      "code": "W85",
      "name": "Ganador partido 85",
      "shortName": "Ganador partido 85",
      "isPlaceholder": true
    },
    "away": {
      "code": "W87",
      "name": "Ganador partido 87",
      "shortName": "Ganador partido 87",
      "isPlaceholder": true
    },
    "city": "Vancouver",
    "stadium": "BC Place Vancouver",
    "status": "scheduled"
  },
  {
    "id": "400021536",
    "matchNumber": 97,
    "kickoffUtc": "2026-07-09T20:00:00.000Z",
    "stage": "quarter-final",
    "stageLabel": "Cuartos de final",
    "home": {
      "code": "W89",
      "name": "Ganador partido 89",
      "shortName": "Ganador partido 89",
      "isPlaceholder": true
    },
    "away": {
      "code": "W90",
      "name": "Ganador partido 90",
      "shortName": "Ganador partido 90",
      "isPlaceholder": true
    },
    "city": "Boston",
    "stadium": "Boston Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021538",
    "matchNumber": 98,
    "kickoffUtc": "2026-07-10T19:00:00.000Z",
    "stage": "quarter-final",
    "stageLabel": "Cuartos de final",
    "home": {
      "code": "W93",
      "name": "Ganador partido 93",
      "shortName": "Ganador partido 93",
      "isPlaceholder": true
    },
    "away": {
      "code": "W94",
      "name": "Ganador partido 94",
      "shortName": "Ganador partido 94",
      "isPlaceholder": true
    },
    "city": "Los Angeles",
    "stadium": "Los Angeles Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021539",
    "matchNumber": 99,
    "kickoffUtc": "2026-07-11T21:00:00.000Z",
    "stage": "quarter-final",
    "stageLabel": "Cuartos de final",
    "home": {
      "code": "W91",
      "name": "Ganador partido 91",
      "shortName": "Ganador partido 91",
      "isPlaceholder": true
    },
    "away": {
      "code": "W92",
      "name": "Ganador partido 92",
      "shortName": "Ganador partido 92",
      "isPlaceholder": true
    },
    "city": "Miami",
    "stadium": "Miami Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021537",
    "matchNumber": 100,
    "kickoffUtc": "2026-07-12T01:00:00.000Z",
    "stage": "quarter-final",
    "stageLabel": "Cuartos de final",
    "home": {
      "code": "W95",
      "name": "Ganador partido 95",
      "shortName": "Ganador partido 95",
      "isPlaceholder": true
    },
    "away": {
      "code": "W96",
      "name": "Ganador partido 96",
      "shortName": "Ganador partido 96",
      "isPlaceholder": true
    },
    "city": "Kansas City",
    "stadium": "Kansas City Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021541",
    "matchNumber": 101,
    "kickoffUtc": "2026-07-14T19:00:00.000Z",
    "stage": "semi-final",
    "stageLabel": "Semifinal",
    "home": {
      "code": "W97",
      "name": "Ganador partido 97",
      "shortName": "Ganador partido 97",
      "isPlaceholder": true
    },
    "away": {
      "code": "W98",
      "name": "Ganador partido 98",
      "shortName": "Ganador partido 98",
      "isPlaceholder": true
    },
    "city": "Dallas",
    "stadium": "Dallas Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021540",
    "matchNumber": 102,
    "kickoffUtc": "2026-07-15T19:00:00.000Z",
    "stage": "semi-final",
    "stageLabel": "Semifinal",
    "home": {
      "code": "W99",
      "name": "Ganador partido 99",
      "shortName": "Ganador partido 99",
      "isPlaceholder": true
    },
    "away": {
      "code": "W100",
      "name": "Ganador partido 100",
      "shortName": "Ganador partido 100",
      "isPlaceholder": true
    },
    "city": "Atlanta",
    "stadium": "Atlanta Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021542",
    "matchNumber": 103,
    "kickoffUtc": "2026-07-18T21:00:00.000Z",
    "stage": "third-place",
    "stageLabel": "Tercer puesto",
    "home": {
      "code": "RU101",
      "name": "Perdedor partido 101",
      "shortName": "Perdedor partido 101",
      "isPlaceholder": true
    },
    "away": {
      "code": "RU102",
      "name": "Perdedor partido 102",
      "shortName": "Perdedor partido 102",
      "isPlaceholder": true
    },
    "city": "Miami",
    "stadium": "Miami Stadium",
    "status": "scheduled"
  },
  {
    "id": "400021543",
    "matchNumber": 104,
    "kickoffUtc": "2026-07-19T19:00:00.000Z",
    "stage": "final",
    "stageLabel": "Final",
    "home": {
      "code": "W101",
      "name": "Ganador partido 101",
      "shortName": "Ganador partido 101",
      "isPlaceholder": true
    },
    "away": {
      "code": "W102",
      "name": "Ganador partido 102",
      "shortName": "Ganador partido 102",
      "isPlaceholder": true
    },
    "city": "New Jersey",
    "stadium": "New York/New Jersey Stadium",
    "status": "scheduled"
  }
];
