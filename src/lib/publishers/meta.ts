import type { PlatformConnection, Post } from "@prisma/client";

type PublishSuccess = {
  success: true;
  attempts: number;
  externalId: string;
  permalinkUrl: string | null;
  endpoint: string;
};

type PublishFailure = {
  success: false;
  attempts: number;
  error: string;
  endpoint: string;
};

export type PublishResult = PublishSuccess | PublishFailure;

type RequestOptions = {
  endpoint: string;
  params: Record<string, string>;
  retries?: number;
};

function getMetadataValue(connection: PlatformConnection, key: string) {
  const metadata = (connection.metadata ?? {}) as Record<string, unknown>;
  const value = metadata[key];
  return typeof value === "string" ? value : null;
}

function isTransientStatus(status: number) {
  return status === 429 || status >= 500;
}

function isTransientMessage(message: string) {
  return /(temporar|timeout|rate limit|try again|transient)/i.test(message);
}

async function callGraphApiWithRetry({
  endpoint,
  params,
  retries = 3,
}: RequestOptions): Promise<{ ok: true; data: Record<string, unknown>; attempts: number } | { ok: false; error: string; attempts: number }> {
  let attempts = 0;
  let lastError = "Unknown error";

  while (attempts < retries) {
    attempts += 1;
    try {
      const response = await fetch(`https://graph.facebook.com/v21.0/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(params).toString(),
      });

      const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;

      if (response.ok) {
        return { ok: true, data: json, attempts };
      }

      const errorObj = (json.error ?? {}) as Record<string, unknown>;
      const message =
        typeof errorObj.message === "string"
          ? errorObj.message
          : `Graph API returned HTTP ${response.status}`;
      lastError = message;

      if (!isTransientStatus(response.status) && !isTransientMessage(message)) {
        return { ok: false, error: message, attempts };
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Network request failed";
    }

    await new Promise((resolve) => setTimeout(resolve, attempts * 800));
  }

  return { ok: false, error: lastError, attempts };
}

async function fetchPermalink(objectId: string, accessToken: string, fields: string) {
  const url = new URL(`https://graph.facebook.com/v21.0/${objectId}`);
  url.searchParams.set("fields", fields);
  url.searchParams.set("access_token", accessToken);
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return typeof json.permalink_url === "string" ? json.permalink_url : null;
}

export async function publishToFacebook(
  post: Post,
  connection: PlatformConnection,
  mediaUrl: string | null,
): Promise<PublishResult> {
  const pageId = getMetadataValue(connection, "pageId") || connection.accountId;
  if (!pageId) {
    return { success: false, attempts: 0, error: "Missing Facebook page ID", endpoint: "facebook/page" };
  }

  const endpoint = mediaUrl ? `${pageId}/photos` : `${pageId}/feed`;
  const params: Record<string, string> = {
    access_token: connection.accessToken,
    caption: post.content,
    message: post.content,
  };

  if (mediaUrl) {
    params.url = mediaUrl;
    delete params.message;
  }

  const result = await callGraphApiWithRetry({ endpoint, params });
  if (!result.ok) {
    return { success: false, attempts: result.attempts, error: result.error, endpoint };
  }

  const externalId =
    (typeof result.data.post_id === "string" && result.data.post_id) ||
    (typeof result.data.id === "string" && result.data.id);
  if (!externalId) {
    return { success: false, attempts: result.attempts, error: "No post ID returned from Facebook", endpoint };
  }

  const permalink = await fetchPermalink(externalId, connection.accessToken, "permalink_url");
  return {
    success: true,
    attempts: result.attempts,
    externalId,
    permalinkUrl: permalink,
    endpoint,
  };
}

export async function publishToInstagram(
  post: Post,
  connection: PlatformConnection,
  mediaUrl: string | null,
): Promise<PublishResult> {
  const igAccountId = getMetadataValue(connection, "igAccountId") || connection.accountId;
  if (!igAccountId) {
    return { success: false, attempts: 0, error: "Missing Instagram account ID", endpoint: "instagram/account" };
  }
  if (!mediaUrl || !/^https?:\/\//i.test(mediaUrl)) {
    return {
      success: false,
      attempts: 0,
      error: "Instagram publish requires a public media URL",
      endpoint: `${igAccountId}/media`,
    };
  }

  const containerResult = await callGraphApiWithRetry({
    endpoint: `${igAccountId}/media`,
    params: {
      image_url: mediaUrl,
      caption: post.content,
      access_token: connection.accessToken,
    },
  });

  if (!containerResult.ok) {
    return {
      success: false,
      attempts: containerResult.attempts,
      error: containerResult.error,
      endpoint: `${igAccountId}/media`,
    };
  }

  const creationId =
    (typeof containerResult.data.id === "string" && containerResult.data.id) ||
    (typeof containerResult.data.creation_id === "string" && containerResult.data.creation_id);
  if (!creationId) {
    return {
      success: false,
      attempts: containerResult.attempts,
      error: "No creation ID returned for Instagram media container",
      endpoint: `${igAccountId}/media`,
    };
  }

  const publishResult = await callGraphApiWithRetry({
    endpoint: `${igAccountId}/media_publish`,
    params: {
      creation_id: creationId,
      access_token: connection.accessToken,
    },
  });

  if (!publishResult.ok) {
    return {
      success: false,
      attempts: containerResult.attempts + publishResult.attempts,
      error: publishResult.error,
      endpoint: `${igAccountId}/media_publish`,
    };
  }

  const mediaId = typeof publishResult.data.id === "string" ? publishResult.data.id : null;
  if (!mediaId) {
    return {
      success: false,
      attempts: containerResult.attempts + publishResult.attempts,
      error: "No media ID returned after Instagram publish",
      endpoint: `${igAccountId}/media_publish`,
    };
  }

  const permalink = await fetchPermalink(mediaId, connection.accessToken, "permalink_url");
  return {
    success: true,
    attempts: containerResult.attempts + publishResult.attempts,
    externalId: mediaId,
    permalinkUrl: permalink,
    endpoint: `${igAccountId}/media_publish`,
  };
}
