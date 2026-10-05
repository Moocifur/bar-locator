import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const barsToGeocode = [
    { name: "Flamingo", address: " 338 Orange St suite b, Redlands, CA" },
    { name: "Septembers Taproom", address: "515 Orange St suite b, Redlands, CA" },
    { name: "Henry's Bar and Grill", address: "501 W Redlands Blvd Ste K, Redlands, CA" },
    { name: "The Three Stags Irish Pub and Restaurant", address: "328 Orange St, Redlands, CA" },
    { name: "Whiskey Republic Spirit & Kitchen", address: "101 E Redlands Blvd #108, Redlands, CA" },
    { name: "The Industry Redlands Bar & Bistro", address: "110 Orange St, Redlands, CA" },
    { name: "The State", address: "22 E State St, Redlands, CA" },
    { name: "Darby's American Cantina", address: "1 E State St, Redlands, CA" },
    { name: "Falconer of Redlands", address: "106 Orange St, Redlands, CA" },
    { name: "Copehouse Bar & Bistro", address: "19 E Citrus Ave, Redlands, CA" },
    { name: "Finney's Crafthouse", address: "4 W Redlands Blvd, Redlands, CA" },
    { name: "Tartan of Redlands", address: "24 E Redlands Blvd, Redlands, CA" },
    { name: "Espace Craft Brewery", address: "Downtown Redlands, CA" },
    { name: "The Overland", address: "347 Orange St, Redlands, CA" },
    { name: "PROJEKT Redlands", address: "345 N 5th St C, Redlands, CA" },
];

async function geoCodeAddress(address) {
    const url = new URL(
        "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates"
    );
    url.searchParams.set("SingleLine", address);
    url.searchParams.set("f", "json");
    url.searchParams.set("token", process.env.ARCGIS_API_KEY);
    console.log("Using token:", process.env.ARCGIS_API_KEY);
    url.searchParams.set("maxLocations", "1");

    const response = await fetch(url);
    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
        console.warn(`No match found for: ${address}`);
        return null;
    }

    const best = data.candidates[0];
    return {
        latitude: best.location.y,
        longitude: best.location.x,
    };
}

async function main() {
    for (const bar of barsToGeocode) {
        const coords = await geoCodeAddress(bar.address);

        if (!coords) continue;
        
        await prisma.bar.create({ 
            data: {
                name: bar.name,
                address: bar.address,
                latitude: coords.latitude,
                longitude: coords.longitude,
            },
        });

        console.log(`Seeded: ${bar.name} → (${coords.latitude}, ${coords.longitude})`);
    }

    console.log("Done seeding real bars.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });