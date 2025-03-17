import { NextResponse } from "next/server";
import Users from "@/models/Client";
import Meter from "@/models/Meter";
import dbConnect from "@/utils/mongodb";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Connect to the database
    await dbConnect();

    // Fetch users and populate their associated meters
    const users = await Users.find().lean(); // Fetch users as plain objects
    const userIds = users.map((user) => user._id);

    // Fetch all meters linked to these users
    const meters = await Meter.find({ userId: { $in: userIds } }).lean();

    // Map meters to their corresponding users
    const usersWithMeters = users.map((user) => ({
      ...user,
      meter:
        meters.find(
          (meter) => meter.userId.toString() === user._id.toString()
        ) || null,
    }));

    if (usersWithMeters.length === 0) {
      return NextResponse.json(
        { message: "No users or meters found" },
        { status: 404 }
      );
    }

    // Return the users with their meters
    return NextResponse.json(usersWithMeters, { status: 200 });
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
