import { RadioBrowserApi, StationSearchType } from "radio-browser-api";

const api = new RadioBrowserApi("OpenMusic App");

export async function getStationsByCountry(countryCode: string, limit: number = 8) {
  return await api.searchStations({ countryCode, limit });
}

export async function searchStations(query: string, limit: number = 20) {
  return await api.searchStations({ name: query, limit });
}

export async function getStationsByTag(tag: string, limit: number = 20) {
  return await api.searchStations({ tag, limit });
}

export async function getStationsByLanguage(language: string, limit: number = 20) {
  return await api.searchStations({ language, limit });
}

export async function getCountries() {
  return await api.getCountries();
}
