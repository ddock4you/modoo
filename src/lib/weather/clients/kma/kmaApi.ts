import { fetchJson } from "@/lib/api/http";
import type {
  KmaApiResponse,
  MidLandFcstItem,
  MidTaItem,
  UltraSrtFcstItem,
  UltraSrtNcstItem,
  VilageFcstItem,
} from "./kmaTypes";

export interface KmaApiClientConfig {
  baseUrl: string;
  apiKey: string;
}

function getItemsOrThrow<T>(
  data: KmaApiResponse<T>,
  errorPrefix: string,
  emptyItemsMessage?: string
): T[] {
  const code = data.response?.header?.resultCode;
  const msg = data.response?.header?.resultMsg;

  if (code !== "00") {
    throw new Error(`${errorPrefix}: ${msg || "Unknown error"}`);
  }

  const items = data.response?.body?.items?.item;
  if (!items || !Array.isArray(items) || items.length === 0) {
    if (emptyItemsMessage) throw new Error(emptyItemsMessage);
    return [];
  }

  return items;
}

export async function fetchUltraSrtNcst(
  config: KmaApiClientConfig,
  params: {
    baseDate: string;
    baseTime: string;
    nx: number;
    ny: number;
    numOfRows?: number;
  }
): Promise<UltraSrtNcstItem[]> {
  const q = new URLSearchParams({
    serviceKey: config.apiKey,
    pageNo: "1",
    numOfRows: (params.numOfRows ?? 10).toString(),
    dataType: "JSON",
    base_date: params.baseDate,
    base_time: params.baseTime,
    nx: params.nx.toString(),
    ny: params.ny.toString(),
  });

  const url = `${config.baseUrl}/VilageFcstInfoService_2.0/getUltraSrtNcst?${q}`;
  const data = await fetchJson<KmaApiResponse<UltraSrtNcstItem>>(url);
  return getItemsOrThrow(data, "KMA API Error", "No weather data available");
}

export async function fetchUltraSrtFcst(
  config: KmaApiClientConfig,
  params: {
    baseDate: string;
    baseTime: string;
    nx: number;
    ny: number;
    numOfRows?: number;
  }
): Promise<UltraSrtFcstItem[]> {
  const q = new URLSearchParams({
    serviceKey: config.apiKey,
    pageNo: "1",
    numOfRows: (params.numOfRows ?? 60).toString(),
    dataType: "JSON",
    base_date: params.baseDate,
    base_time: params.baseTime,
    nx: params.nx.toString(),
    ny: params.ny.toString(),
  });

  const url = `${config.baseUrl}/VilageFcstInfoService_2.0/getUltraSrtFcst?${q}`;
  const data = await fetchJson<KmaApiResponse<UltraSrtFcstItem>>(url);
  return getItemsOrThrow(data, "KMA UltraSrtFcst API Error");
}

export async function fetchVilageFcst(
  config: KmaApiClientConfig,
  params: {
    baseDate: string;
    baseTime: string;
    nx: number;
    ny: number;
    numOfRows?: number;
  }
): Promise<VilageFcstItem[]> {
  const q = new URLSearchParams({
    serviceKey: config.apiKey,
    pageNo: "1",
    numOfRows: (params.numOfRows ?? 1000).toString(),
    dataType: "JSON",
    base_date: params.baseDate,
    base_time: params.baseTime,
    nx: params.nx.toString(),
    ny: params.ny.toString(),
  });

  const url = `${config.baseUrl}/VilageFcstInfoService_2.0/getVilageFcst?${q}`;
  const data = await fetchJson<KmaApiResponse<VilageFcstItem>>(url);
  return getItemsOrThrow(data, "KMA VilageFcst API Error");
}

export async function fetchMidTa(
  config: KmaApiClientConfig,
  params: {
    regId: string;
    tmFc: string;
  }
): Promise<MidTaItem[]> {
  const q = new URLSearchParams({
    serviceKey: config.apiKey,
    pageNo: "1",
    numOfRows: "1",
    dataType: "JSON",
    regId: params.regId,
    tmFc: params.tmFc,
  });

  const url = `${config.baseUrl}/MidFcstInfoService/getMidTa?${q}`;
  const data = await fetchJson<KmaApiResponse<MidTaItem>>(url);
  return getItemsOrThrow(data, "KMA MidTa API Error", "KMA MidTa API Error: empty items");
}

export async function fetchMidLandFcst(
  config: KmaApiClientConfig,
  params: {
    regId: string;
    tmFc: string;
  }
): Promise<MidLandFcstItem[]> {
  const q = new URLSearchParams({
    serviceKey: config.apiKey,
    pageNo: "1",
    numOfRows: "1",
    dataType: "JSON",
    regId: params.regId,
    tmFc: params.tmFc,
  });

  const url = `${config.baseUrl}/MidFcstInfoService/getMidLandFcst?${q}`;
  const data = await fetchJson<KmaApiResponse<MidLandFcstItem>>(url);
  return getItemsOrThrow(data, "KMA MidLandFcst API Error", "KMA MidLandFcst API Error: empty items");
}
