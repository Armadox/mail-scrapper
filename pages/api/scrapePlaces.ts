import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

type Place = {
    name: string;
    formatted_address: string;
    place_id: string;
}

const fetchAllPlaces = async (url: string) => {
    let allResults: Place[] = [];
    let nextPageToken = '';

    do {
        const { data } = await axios.get(url + (nextPageToken ? `&pagetoken=${nextPageToken}` : ''));
        
        if (data.status === 'REQUEST_DENIED') {
            throw new Error("Please check API!");
        }

        allResults = allResults.concat(data.results);
        nextPageToken = data.next_page_token || '';
        
        if (nextPageToken) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    } while (nextPageToken);

    return allResults;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { apiKey, searchString } = req.body;

    if (!apiKey || !searchString) {
        res.status(501).json("ApiKey or SearchString missing!");
        return;
    }

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchString)}&key=${apiKey}`;

    try {
        const placesData = await fetchAllPlaces(url);
        const places = await Promise.all(
            placesData.map(async (place) => {
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${apiKey}`;
                const details = await axios.get(detailsUrl);
                return {
                    name: place.name,
                    address: place.formatted_address,
                    website: details.data.result.website || null,
                };
            })
        );

        res.status(200).json(places);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "Failed to fetch data" });
    }
}