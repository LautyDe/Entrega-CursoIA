import { NextResponse } from "next/server";
import { authCapabilities } from "../../../lib/auth";

export async function GET() {
  return NextResponse.json(authCapabilities());
}
