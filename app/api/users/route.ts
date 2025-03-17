import { NextResponse } from "next/server";
import dbConnect from "@/utils/mongodb";
import User from "@/models/Client";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    const user = await User.create(body);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Error creating a user:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Error creating a user", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "An unknown error occurred" },
      { status: 500 }
    );
  }
}
