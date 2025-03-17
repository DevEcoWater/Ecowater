import { NextResponse } from "next/server";
import Meter from "@/models/Meter";
import dbConnect from "@/utils/mongodb";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await dbConnect();

    const meters = await Meter.find();

    // Return the users with their meters
    return NextResponse.json(meters, {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching users with meters:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Error fetching users with meters", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "An unknown error occurred" },
      { status: 500 }
    );
  }
}
