import { NextResponse, type NextRequest } from "next/server";
import { META_REQUIRED_PERMISSIONS } from "@/lib/meta-oauth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await prisma.platformOnboardingSession.findUnique({
    where: { id },
  });

  if (!session) {
    return NextResponse.json({ error: "Onboarding session not found" }, { status: 404 });
  }

  const missingPermissions = META_REQUIRED_PERMISSIONS.filter(
    (permission) => !session.grantedPermissions.includes(permission),
  );

  return NextResponse.json({
    data: {
      id: session.id,
      status: session.status,
      error: session.error,
      tokenExpiresAt: session.tokenExpiresAt,
      grantedPermissions: session.grantedPermissions,
      deniedPermissions: session.deniedPermissions,
      missingPermissions,
      metadata: session.metadata,
    },
  });
}
