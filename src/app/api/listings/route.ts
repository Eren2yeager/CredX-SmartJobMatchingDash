import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import * as Listing_Service from "@/modules/listings/listing.service";

export async function GET(req: NextRequest) {
  await connectDB();

  const { searchParams } = req.nextUrl;
  const workMode    = searchParams.get("workMode") ?? undefined;
  const sponsorship = searchParams.get("sponsorship");
  const location    = searchParams.get("location") ?? undefined;
  const page        = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize    = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));

  const filters: Listing_Service.ListingFilters = {
    workMode: workMode as Listing_Service.ListingFilters["workMode"],
    sponsorship: sponsorship !== null ? sponsorship === "true" : undefined,
    location,
  };

  const listings = await Listing_Service.list(filters, page, pageSize);
  return Response.json(listings);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json().catch(() => ({}));

  try {
    const listing = await Listing_Service.create(session.user.id, body);
    return Response.json(listing, { status: 201 });
  } catch (err) {
    if (err instanceof Listing_Service.ListingValidationError)
      return Response.json({ error: "Validation failed", fields: err.fields }, { status: 400 });
    throw err;
  }
}
