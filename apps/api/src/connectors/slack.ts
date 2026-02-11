import type { ResultItem, ServiceResult, SearchRequest } from "../types/index.js";

const SLACK_SEARCH_URL = "https://slack.com/api/search.messages";

export async function searchSlack(
  accessToken: string,
  request: SearchRequest
): Promise<ServiceResult> {
  try {
    const params = new URLSearchParams({
      query: request.query,
      count: String(request.limit ?? 20),
      page: String(Math.floor((request.offset ?? 0) / (request.limit ?? 20)) + 1),
      sort: "timestamp",
      sort_dir: "desc",
    });

    const res = await fetch(`${SLACK_SEARCH_URL}?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      return {
        status: "error",
        total: null,
        items: [],
        error_code: "rate_limited",
        error_message: retryAfter
          ? `レートリミットに達しました。${retryAfter}秒後に再試行してください。`
          : "レートリミットに達しました。数分待って再試行してください。",
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        status: "error",
        total: null,
        items: [],
        error_code: "auth_required",
        error_message: "Slackの認証が無効です。設定画面で再接続してください。",
      };
    }

    const data = await res.json() as Record<string, unknown>;

    if (!data.ok) {
      const errorStr = (data.error as string) ?? "unknown";
      if (errorStr === "not_authed" || errorStr === "invalid_auth" || errorStr === "token_revoked") {
        return {
          status: "error",
          total: null,
          items: [],
          error_code: "auth_required",
          error_message: "Slackの認証が無効です。設定画面で再接続してください。",
        };
      }
      return {
        status: "error",
        total: null,
        items: [],
        error_code: "unknown_error",
        error_message: `Slack API error: ${errorStr}`,
      };
    }

    const messages = data.messages as Record<string, unknown> | undefined;
    const matches = (messages?.matches as Array<Record<string, unknown>>) ?? [];
    const total = (messages?.total as number) ?? 0;

    const items: ResultItem[] = matches.map((m, idx) => {
      const channel = m.channel as Record<string, unknown> | undefined;
      return {
        id: `slack-${(m.ts as string) ?? idx}`,
        service: "slack" as const,
        title: `#${channel?.name ?? "unknown"}`,
        snippet: (m.text as string) ?? null,
        updated_at: m.ts ? new Date(Number(m.ts) * 1000).toISOString() : null,
        author: (m.username as string) ?? (m.user as string) ?? null,
        url: (m.permalink as string) ?? "",
        kind: "message" as const,
        channel_name: (channel?.name as string) ?? undefined,
        raw_metadata: {
          type: (m.type as string) ?? null,
          ts: (m.ts as string) ?? null,
          team: (m.team as string) ?? null,
          channel_id: (channel?.id as string) ?? null,
          channel_name: (channel?.name as string) ?? null,
        },
      };
    });

    const filteredItems = applyLocalFilters(items, request);

    return {
      status: total > (request.offset ?? 0) + filteredItems.length ? "partial" : "success",
      total,
      items: filteredItems,
      error_code: null,
      error_message: null,
    };
  } catch (err) {
    return {
      status: "error",
      total: null,
      items: [],
      error_code: "network_error",
      error_message: `Slack接続エラー: ${err instanceof Error ? err.message : "不明なエラー"}`,
    };
  }
}

function applyLocalFilters(items: ResultItem[], request: SearchRequest): ResultItem[] {
  let filtered = items;
  if (request.date_from) {
    const from = new Date(request.date_from).getTime();
    filtered = filtered.filter((item) => item.updated_at && new Date(item.updated_at).getTime() >= from);
  }
  if (request.date_to) {
    const to = new Date(request.date_to).getTime();
    filtered = filtered.filter((item) => item.updated_at && new Date(item.updated_at).getTime() <= to);
  }
  return filtered;
}
