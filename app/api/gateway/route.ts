import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log(body, "body");
    return NextResponse.json(
      { body },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
        status: 200,
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
