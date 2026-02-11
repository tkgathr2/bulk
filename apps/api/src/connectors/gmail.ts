import type { ResultItem, ServiceResult, SearchRequest } from "../types/index.js";

const GMAIL_MESSAGES_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages";

export async function searchGmail(
  accessToken: string,
  request: SearchRequest
): Promise<ServiceResult> {
  try {
    let gmailQuery = request.query;
    if (request.date_from) {
      gmailQuery += ` after:${request.date_from}`;
    }
    if (request.date_to) {
      gmailQuery += ` before:${request.date_to}`;
    }

    const params = new URLSearchParams({
      q: gmailQuery,
      maxResults: String(request.limit ?? 20),
    });

    const listRes = await fetch(`${GMAIL_MESSAGES_URL}?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (listRes.status === 429) {
      return {
        status: "error",
        total: null,
        items: [],
        error_code: "rate_limited",
        error_message: "Gmail APIのレートリミットに達しました。数分待って再試行してください。",
      };
    }

    if (listRes.status === 401 || listRes.status === 403) {
      return {
        status: "error",
        total: null,
        items: [],
        error_code: "auth_required",
        error_message: "Gmailの認証が無効です。設定画面で再接続してください。",
      };
    }

    if (!listRes.ok) {
      return {
        status: "error",
        total: null,
        items: [],
        error_code: "unknown_error",
        error_message: `Gmail API error: ${listRes.status}`,
      };
    }

    const listData = await listRes.json() as Record<string, unknown>;
    const messageRefs = (listData.messages as Array<Record<string, unknown>>) ?? [];
    const total = (listData.resultSizeEstimate as number) ?? messageRefs.length;

    const items: ResultItem[] = await Promise.all(
      messageRefs.slice(0, request.limit ?? 20).map(async (ref) => {
        const msgRes = await fetch(
          `${GMAIL_MESSAGES_URL}/${ref.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const msg = await msgRes.json() as Record<string, unknown>;
        const headers = ((msg.payload as Record<string, unknown>)?.headers as Array<Record<string, string>>) ?? [];

        const subject = headers.find((h) => h.name === "Subject")?.value ?? "(no subject)";
        const from = headers.find((h) => h.name === "From")?.value ?? "";
        const to = headers.find((h) => h.name === "To")?.value ?? "";

        return {
          id: `gmail-${ref.id}`,
          service: "gmail" as const,
          title: subject,
          snippet: (msg.snippet as string) ?? null,
          updated_at: msg.internalDate
            ? new Date(Number(msg.internalDate)).toISOString()
            : null,
          author: from,
          url: `https://mail.google.com/mail/u/0/#inbox/${ref.id}`,
          kind: "email" as const,
          from,
          to,
          subject,
          raw_metadata: {
            message_id: (ref.id as string) ?? null,
            thread_id: (ref.threadId as string) ?? null,
            label_ids: (msg.labelIds as string[]) ?? [],
            size_estimate: (msg.sizeEstimate as number) ?? null,
            history_id: (msg.historyId as string) ?? null,
          },
        };
      })
    );

    return {
      status: total > items.length ? "partial" : "success",
      total,
      items,
      error_code: null,
      error_message: null,
    };
  } catch (err) {
    return {
      status: "error",
      total: null,
      items: [],
      error_code: "network_error",
      error_message: `Gmail接続エラー: ${err instanceof Error ? err.message : "不明なエラー"}`,
    };
  }
}
