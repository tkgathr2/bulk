import type { ServiceId, ServiceResult, SearchRequest } from "../types/index.js";
import type { TokenData } from "../store/tokens.js";
import { searchSlack } from "./slack.js";
import { searchGmail } from "./gmail.js";
import { searchDrive } from "./drive.js";
import { searchDropbox } from "./dropbox.js";

export async function searchServiceReal(
  serviceId: ServiceId,
  token: TokenData,
  request: SearchRequest
): Promise<ServiceResult> {
  switch (serviceId) {
    case "slack":
      return searchSlack(token.access_token, request);
    case "gmail":
      return searchGmail(token.access_token, request);
    case "drive":
      return searchDrive(token.access_token, request);
    case "dropbox":
      return searchDropbox(token.access_token, request);
    default:
      return {
        status: "error",
        total: null,
        items: [],
        error_code: "unknown_error",
        error_message: `Unknown service: ${serviceId}`,
      };
  }
}
