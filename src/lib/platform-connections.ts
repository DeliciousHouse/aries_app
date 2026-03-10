import { ConnectionStatus, Platform, TokenType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PlatformMetadata = {
  pageId?: string;
  igAccountId?: string;
  linkedPageId?: string;
  appId?: string;
  adAccountId?: string;
};

function compactMetadata(metadata: PlatformMetadata) {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value && value.length > 0),
  );
}

function resolveAccountNames() {
  const brandName = process.env.PLATFORM_BRAND_NAME?.trim();

  return {
    facebook:
      process.env.FACEBOOK_ACCOUNT_NAME?.trim() ||
      (brandName ? `${brandName} Facebook` : "Facebook Page"),
    instagram:
      process.env.INSTAGRAM_ACCOUNT_NAME?.trim() ||
      (brandName ? `${brandName} Instagram` : "Instagram Account"),
  };
}

function resolveExpiryDate() {
  const ttlDays = Number(process.env.PLATFORM_TOKEN_TTL_DAYS || 60);
  const msInDay = 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ttlDays * msInDay);
}

export async function syncPlatformConnectionsFromEnv() {
  if (process.env.PLATFORM_ENV_SYNC_ENABLED !== "true") {
    return;
  }

  const accessToken = process.env.META_ACCESS_TOKEN?.trim();
  const pageId = process.env.META_PAGE_ID?.trim();
  const instagramAccountId = process.env.INSTAGRAM_ACCOUNT_ID?.trim();

  if (!accessToken) {
    return;
  }

  const appId = process.env.META_APP_ID?.trim();
  const adAccountId = process.env.META_AD_ACCOUNT_ID?.trim();
  const expiresAt = resolveExpiryDate();
  const accountNames = resolveAccountNames();

  const writes: Promise<unknown>[] = [];

  if (pageId) {
    writes.push(
      prisma.platformConnection.upsert({
        where: {
          platform_accountId: {
            platform: Platform.FACEBOOK,
            accountId: pageId,
          },
        },
        create: {
          platform: Platform.FACEBOOK,
          accountName: accountNames.facebook,
          accountId: pageId,
          accessToken,
          tokenType: TokenType.LONG_LIVED,
          tokenExpiresAt: expiresAt,
          metadata: compactMetadata({ pageId, appId, adAccountId }),
          status: ConnectionStatus.ACTIVE,
        },
        update: {
          accountName: accountNames.facebook,
          accessToken,
          tokenType: TokenType.LONG_LIVED,
          tokenExpiresAt: expiresAt,
          metadata: compactMetadata({ pageId, appId, adAccountId }),
          status: ConnectionStatus.ACTIVE,
        },
      }),
    );
  }

  if (instagramAccountId) {
    writes.push(
      prisma.platformConnection.upsert({
        where: {
          platform_accountId: {
            platform: Platform.INSTAGRAM,
            accountId: instagramAccountId,
          },
        },
        create: {
          platform: Platform.INSTAGRAM,
          accountName: accountNames.instagram,
          accountId: instagramAccountId,
          accessToken,
          tokenType: TokenType.LONG_LIVED,
          tokenExpiresAt: expiresAt,
          metadata: compactMetadata({
            igAccountId: instagramAccountId,
            linkedPageId: pageId,
            appId,
          }),
          status: ConnectionStatus.ACTIVE,
        },
        update: {
          accountName: accountNames.instagram,
          accessToken,
          tokenType: TokenType.LONG_LIVED,
          tokenExpiresAt: expiresAt,
          metadata: compactMetadata({
            igAccountId: instagramAccountId,
            linkedPageId: pageId,
            appId,
          }),
          status: ConnectionStatus.ACTIVE,
        },
      }),
    );
  }

  if (writes.length === 0) {
    return;
  }

  await Promise.all(writes);
}
