export function getCountryCode(): string {
  // Try to get country from user's timezone
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Example: "Europe/Amsterdam" => "NL", "America/New_York" => "US"
    if (tz) {
      const parts = tz.split("/");
      if (parts.length === 2) {
        const region = parts[0].toLowerCase();
        const city = parts[1].toLowerCase();
        // Simple mapping for common regions
        if (region === "america") return "US";
        if (region === "europe") {
          // Map some major cities to country codes
          if (city.includes("amsterdam")) return "NL";
          if (city.includes("berlin")) return "DE";
          if (city.includes("paris")) return "FR";
          if (city.includes("london")) return "GB";
          if (city.includes("madrid")) return "ES";
          if (city.includes("rome")) return "IT";
        }
      }
    }
  } catch {}
  // Fallback to browser language
  if (navigator.languages && navigator.languages.length > 0) {
    for (const lang of navigator.languages) {
      const match = lang.match(/-([A-Z]{2})$/i);
      if (match) return match[1].toUpperCase();
    }
  }
  if (navigator.language) {
    const match = navigator.language.match(/-([A-Z]{2})$/i);
    if (match) return match[1].toUpperCase();
  }
  return "US";
}
