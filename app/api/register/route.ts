import User from "@/models/User";
import dbConnect from "@/utils/mongodb";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export async function POST(request: any) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    if (!email || !password || !username) {
      return new Response(
        JSON.stringify({ message: "Faltan datos necesarios" }),
        {
          status: 400,
        }
      );
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return new Response(JSON.stringify({ message: "El usuario ya existe" }), {
        status: 409,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    return new Response(
      JSON.stringify({ message: "El usuario se ha registrado correctamente" }),
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Error saving data:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Error saving data", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "An unknown error occurred" },
      { status: 500 }
    );
  }
}
