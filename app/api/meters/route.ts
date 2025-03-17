import { NextResponse } from "next/server";
import dbConnect from "@/utils/mongodb";
import Meter from "@/models/Meter";
import User from "@/models/Client"; // Ensure you have the User model imported

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { userId, status, address, coordinates } = body;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const meter = await Meter.create({
      userId: user._id,
      status,
      address,
      coordinates,
    });

    return NextResponse.json(
      { meter },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
        status: 201,
      }
    );
  } catch (error) {
    console.error("Error creating a meter:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Error creating a meter", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "An unknown error occurred" },
      { status: 500 }
    );
  }
}
