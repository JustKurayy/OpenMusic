import axios from "axios";

const BASE_URL = "https://de1.api.radio-browser.info/json";

export const getCountryRadios = async (countryCode: string, limit: number = 8) => {
  const res = await axios.get(`${BASE_URL}/stations/bycountrycodeexact/${countryCode}?limit=${limit}`);
  return res.data;
};

export const searchRadios = async (query: string, limit: number = 20) => {
  const res = await axios.get(`${BASE_URL}/stations/search`, {
    params: {
      name: query,
      limit,
    },
  });
  return res.data;
};

export const getCountries = async () => {
  const res = await axios.get(`${BASE_URL}/countries`);
  return res.data;
};
