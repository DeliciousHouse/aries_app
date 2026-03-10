import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { OnboardingProvider, OnboardingStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const META_REQUIRED_PERMISSIONS = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
] as const;

type MetaPermissionStatus = {
  permission: string;
  status: string;
};

type MetaPage = {
  id: string;
  name: string;
  access_token?: string;
  instagram_business_account?: {
    id: string;
    username?: string;
  };
};

type OAuthSessionMetadata = {
  pages?: MetaPage[];
};

function getMetaAppId() {
  return process.env.META_APP_ID?.trim();
}

function getMetaAppSecret() {
  return process.env.META_APP_SECRET?.trim();
}

function getBaseUrl(request: NextRequest) {
  const envBase = process.env.NEXTAUTH_URL?.trim();
  if (envBase) {
    return envBase.replace(/\/$/, "");
  }
  return request.nextUrl.origin.replace(/\/$/, "");
}

function getRedirectUri(request: NextRequest) {
  return `${getBaseUrl(request)}/api/platforms/onboarding/meta/callback`;
}

async function graphGet(path: string, params: Record<string, string>) {
  const url = new URL(`https://graph.facebook.com/v21.0/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url);
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const error = (json.error ?? {}) as Record<string, unknown>;
    throw new Error(
      typeof error.message === "string"
        ? error.message
        : `Meta request failed (${response.status})`,
    );
  }
  return json;
}

function validatePermissions(permissions: MetaPermissionStatus[]) {
  const granted = permissions
    .filter((entry) => entry.status === "granted")
    .map((entry) => entry.permission);

  const denied = permissions
    .filter((entry) => entry.status !== "granted")
    .map((entry) => entry.permission);

  const missing = META_REQUIRED_PERMISSIONS.filter((permission) => !granted.includes(permission));
  return { granted, denied, missing };
}

export async function startMetaOnboarding(request: NextRequest) {
  const appId = getMetaAppId();
  if (!appId) {
    throw new Error("META_APP_ID is not configured");
  }

  const state = crypto.randomBytes(16).toString("hex");
  const redirectUri = getRedirectUri(request);

  const session = await prisma.platformOnboardingSession.create({
    data: {
      provider: OnboardingProvider.META,
      status: OnboardingStatus.STARTED,
      state,
    },
  });

  const oauthUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  oauthUrl.searchParams.set("client_id", appId);
  oauthUrl.searchParams.set("redirect_uri", redirectUri);
  oauthUrl.searchParams.set("state", state);
  oauthUrl.searchParams.set("response_type", "code");
  oauthUrl.searchParams.set("scope", META_REQUIRED_PERMISSIONS.join(","));

  return {
    sessionId: session.id,
    authUrl: oauthUrl.toString(),
  };
}

export async function handleMetaCallback(request: NextRequest) {
  const url = request.nextUrl;
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const errorReason = url.searchParams.get("error_reason");
  const errorDescription = url.searchParams.get("error_description");

  if (!state) {
    throw new Error("Missing OAuth state");
  }

  const session = await prisma.platformOnboardingSession.findUnique({
    where: { state },
  });

  if (!session) {
    throw new Error("Invalid onboarding session state");
  }

  if (errorReason || errorDescription) {
    await prisma.platformOnboardingSession.update({
      where: { id: session.id },
      data: {
        status: OnboardingStatus.FAILED,
        error: `${errorReason ?? "oauth_error"}: ${errorDescription ?? "authorization denied"}`,
      },
    });
    return { sessionId: session.id, success: false };
  }

  if (!code) {
    throw new Error("Missing OAuth authorization code");
  }

  const appId = getMetaAppId();
  const appSecret = getMetaAppSecret();
  if (!appId || !appSecret) {
    throw new Error("META_APP_ID and META_APP_SECRET are required");
  }

  const redirectUri = getRedirectUri(request);
  const tokenResponse = await graphGet("oauth/access_token", {
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });

  const shortToken =
    typeof tokenResponse.access_token === "string" ? tokenResponse.access_token : null;
  if (!shortToken) {
    throw new Error("Meta did not return an access token");
  }

  const exchangeResponse = await graphGet("oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortToken,
  });

  const accessToken =
    (typeof exchangeResponse.access_token === "string" && exchangeResponse.access_token) || shortToken;
  const expiresIn =
    typeof exchangeResponse.expires_in === "number"
      ? exchangeResponse.expires_in
      : typeof tokenResponse.expires_in === "number"
        ? tokenResponse.expires_in
        : 0;
  const tokenExpiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000) : null;

  const permissionsResponse = await graphGet("me/permissions", { access_token: accessToken });
  const permissions = Array.isArray(permissionsResponse.data)
    ? (permissionsResponse.data as MetaPermissionStatus[])
    : [];
  const { granted, denied } = validatePermissions(permissions);

  const accountsResponse = await graphGet("me/accounts", {
    access_token: accessToken,
    fields: "id,name,access_token,instagram_business_account{id,username}",
    limit: "200",
  });
  const pages = Array.isArray(accountsResponse.data) ? (accountsResponse.data as MetaPage[]) : [];
  const metadata: OAuthSessionMetadata = { pages };

  await prisma.platformOnboardingSession.update({
    where: { id: session.id },
    data: {
      status: OnboardingStatus.CALLBACK_RECEIVED,
      accessToken,
      tokenExpiresAt,
      grantedPermissions: granted,
      deniedPermissions: denied,
      metadata: metadata as unknown as Prisma.InputJsonValue,
      error: null,
    },
  });

  return { sessionId: session.id, success: true };
}

export async function completeMetaOnboarding(sessionId: string, selectedPageId: string) {
  const session = await prisma.platformOnboardingSession.findUnique({
    where: { id: sessionId },
  });
  if (!session) {
    throw new Error("Onboarding session not found");
  }
  if (session.provider !== OnboardingProvider.META) {
    throw new Error("Unsupported onboarding provider");
  }
  if (!session.accessToken) {
    throw new Error("Onboarding session has no access token");
  }

  const permissionStatus = validatePermissions(
    session.grantedPermissions
      .map((permission) => ({ permission, status: "granted" }))
      .concat(session.deniedPermissions.map((permission) => ({ permission, status: "declined" }))),
  );
  if (permissionStatus.missing.length > 0) {
    throw new Error(`Missing required permissions: ${permissionStatus.missing.join(", ")}`);
  }

  const metadata = (session.metadata ?? {}) as OAuthSessionMetadata;
  const pages = metadata.pages ?? [];
  const selectedPage = pages.find((page) => page.id === selectedPageId);
  if (!selectedPage) {
    throw new Error("Selected page is not available in the onboarding session");
  }

  const pageToken = selectedPage.access_token || session.accessToken;
  const pageMetadata: Prisma.InputJsonValue = {
    pageId: selectedPage.id,
    appId: getMetaAppId() ?? null,
  };
  const igAccount = selectedPage.instagram_business_account;

  await prisma.platformConnection.upsert({
    where: {
      platform_accountId: {
        platform: "FACEBOOK",
        accountId: selectedPage.id,
      },
    },
    create: {
      platform: "FACEBOOK",
      accountName: selectedPage.name,
      accountId: selectedPage.id,
      accessToken: pageToken,
      tokenType: "LONG_LIVED",
      tokenExpiresAt: session.tokenExpiresAt,
      metadata: pageMetadata,
      status: "ACTIVE",
    },
    update: {
      accountName: selectedPage.name,
      accessToken: pageToken,
      tokenExpiresAt: session.tokenExpiresAt,
      metadata: pageMetadata,
      status: "ACTIVE",
    },
  });

  if (igAccount?.id) {
    const igMetadata: Prisma.InputJsonValue = {
      igAccountId: igAccount.id,
      linkedPageId: selectedPage.id,
      appId: getMetaAppId() ?? null,
    };
    await prisma.platformConnection.upsert({
      where: {
        platform_accountId: {
          platform: "INSTAGRAM",
          accountId: igAccount.id,
        },
      },
      create: {
        platform: "INSTAGRAM",
        accountName: igAccount.username || `${selectedPage.name} Instagram`,
        accountId: igAccount.id,
        accessToken: pageToken,
        tokenType: "LONG_LIVED",
        tokenExpiresAt: session.tokenExpiresAt,
        metadata: igMetadata,
        status: "ACTIVE",
      },
      update: {
        accountName: igAccount.username || `${selectedPage.name} Instagram`,
        accessToken: pageToken,
        tokenExpiresAt: session.tokenExpiresAt,
        metadata: igMetadata,
        status: "ACTIVE",
      },
    });
  }

  await prisma.platformOnboardingSession.update({
    where: { id: sessionId },
    data: {
      status: OnboardingStatus.COMPLETED,
      completedAt: new Date(),
      error: null,
    },
  });

  return {
    sessionId,
    connectedPageId: selectedPage.id,
    connectedInstagramId: igAccount?.id ?? null,
  };
}
