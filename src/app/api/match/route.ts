import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import * as Match_Service from "@/modules/matching/match.service";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const matches = await Match_Service.getMatchesForStudent(session.user.id);
  return Response.json(matches);
}
