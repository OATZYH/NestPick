import { NextRequest, NextResponse } from "next/server";
import { parseLocationInput, isValidLatLng } from "@/lib/geo-utils";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid URL string is required" },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();

    // First try standard regex in case it's already an expanded URL
    const immediateCoords = parseLocationInput(trimmedUrl);
    if (immediateCoords) {
      return NextResponse.json(immediateCoords);
    }

    // Follow redirect to retrieve final URL
    // Mobile links like https://maps.app.goo.gl/xxx redirect to full google.com/maps/... URL
    const response = await fetch(trimmedUrl, {
      method: "HEAD",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const finalUrl = response.url || "";
    const parsedFromRedirect = parseLocationInput(finalUrl);

    if (parsedFromRedirect && isValidLatLng(parsedFromRedirect.lat, parsedFromRedirect.lng)) {
      return NextResponse.json(parsedFromRedirect);
    }

    // If HEAD didn't expand or didn't contain coordinates in final URL, try GET to inspect body/meta
    const getRes = await fetch(trimmedUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const getFinalUrl = getRes.url || "";
    const parsedFromGetUrl = parseLocationInput(getFinalUrl);
    if (parsedFromGetUrl) {
      return NextResponse.json(parsedFromGetUrl);
    }

    // Attempt to parse og:image or meta tags from HTML body
    const htmlText = await getRes.text();
    const metaRegex = /content="[^"]*@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)[^"]*"/;
    const metaMatch = htmlText.match(metaRegex);
    if (metaMatch) {
      const lat = parseFloat(metaMatch[1]);
      const lng = parseFloat(metaMatch[2]);
      if (isValidLatLng(lat, lng)) {
        return NextResponse.json({
          lat,
          lng,
          sourceType: "google-maps-url",
        });
      }
    }

    // Fallback search for center=lat,lng in google static map or og:image
    const centerRegex = /center=(-?\d{1,2}\.\d+)%2C(-?\d{1,3}\.\d+)/;
    const centerMatch = htmlText.match(centerRegex);
    if (centerMatch) {
      const lat = parseFloat(centerMatch[1]);
      const lng = parseFloat(centerMatch[2]);
      if (isValidLatLng(lat, lng)) {
        return NextResponse.json({
          lat,
          lng,
          sourceType: "google-maps-url",
        });
      }
    }

    return NextResponse.json(
      {
        error:
          "Could not extract coordinates from this link. Try copying the full Google Maps browser URL or pasting raw coordinates (e.g. 13.7554, 100.5658).",
      },
      { status: 422 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: `Failed to resolve link: ${message}` },
      { status: 500 }
    );
  }
}
