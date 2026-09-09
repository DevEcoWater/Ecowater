import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { meter_id, user_id, force = false } = body;

    // Check if the meter is already assigned to someone
    const existingMeterAssignment = await prisma.userMeter.findFirst({
      where: { meter_id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const isAssignedToOtherUser =
      existingMeterAssignment &&
      existingMeterAssignment.user_id !== user_id;

    // If already assigned to another user and not forcing, return conflict
    if (isAssignedToOtherUser && !force) {
      return NextResponse.json(
        {
          conflict: true,
          assignedTo: {
            id: existingMeterAssignment.user.id,
            name: `${existingMeterAssignment.user.firstName} ${existingMeterAssignment.user.lastName}`,
          },
        },
        { status: 409 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Remove the user's current meter (if any)
      const existingUserMeter = await tx.userMeter.findFirst({
        where: { user_id },
      });
      if (existingUserMeter) {
        await tx.userMeter.delete({ where: { id: existingUserMeter.id } });
      }

      // Remove this meter from the other user (force reassign)
      if (isAssignedToOtherUser && force && existingMeterAssignment) {
        await tx.userMeter.delete({
          where: { id: existingMeterAssignment.id },
        });
      }

      return tx.userMeter.create({
        data: { meter_id, user_id },
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("[POST USER METER]", error);
    return NextResponse.json(
      {
        error: "Failed to assign meter",
        description: error.message,
      },
      { status: 400 }
    );
  }
}
