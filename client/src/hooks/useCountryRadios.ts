import { useEffect, useState } from "react";
import { getCountryRadios } from "@/lib/radioApi";

export function useCountryRadios(countryCode: string, limit: number = 8) {
    const [radios, setRadios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!countryCode) return;
        setLoading(true);
        getCountryRadios(countryCode, limit)
            .then(setRadios)
            .finally(() => setLoading(false));
    }, [countryCode, limit]);

    return { radios, loading };
}
