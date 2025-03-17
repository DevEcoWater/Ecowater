import { NextResponse } from "next/server";
import Meter from "@/models/Meter";
import dbConnect from "@/utils/mongodb";
import Client from "@/models/Client";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const { id } = params;

    const meter = await Meter.findById({ _id: id }).populate({
      path: "userId",
      model: Client,
    });

    return NextResponse.json(meter, {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching meter:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Error fetching meter", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "An unknown error occurred" },
      { status: 500 }
    );
  }
}
