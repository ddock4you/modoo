// KMA API response/item types.

export interface KmaApiResponse<T> {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      dataType: string;
      items: {
        item: T[];
      };
      pageNo: number;
      numOfRows: number;
      totalCount: number;
    };
  };
}

export interface UltraSrtNcstItem {
  baseDate: string;
  baseTime: string;
  category: "T1H" | "REH" | "WSD" | "RN1" | "PTY" | "SKY";
  nx: number;
  ny: number;
  obsrValue: string;
}

export interface UltraSrtFcstItem {
  baseDate: string;
  baseTime: string;
  category: "T1H" | "REH" | "WSD" | "RN1" | "PTY" | "SKY" | "LGT" | "VEC";
  fcstDate: string;
  fcstTime: string;
  fcstValue: string;
  nx: number;
  ny: number;
}

export interface MidTaItem {
  regId: string;
  taMin3: string;
  taMax3: string;
  taMin4: string;
  taMax4: string;
  taMin5: string;
  taMax5: string;
  taMin6: string;
  taMax6: string;
  taMin7: string;
  taMax7: string;
  taMin8: string;
  taMax8: string;
  taMin9: string;
  taMax9: string;
  taMin10: string;
  taMax10: string;
}

export interface MidLandFcstItem {
  regId: string;
  wf3Am: string;
  wf3Pm: string;
  wf4Am: string;
  wf4Pm: string;
  wf5Am: string;
  wf5Pm: string;
  wf6Am: string;
  wf6Pm: string;
  wf7Am: string;
  wf7Pm: string;
  wf8: string;
  wf9: string;
  wf10: string;
  rnSt3Am: string;
  rnSt3Pm: string;
  rnSt4Am: string;
  rnSt4Pm: string;
  rnSt5Am: string;
  rnSt5Pm: string;
  rnSt6Am: string;
  rnSt6Pm: string;
  rnSt7Am: string;
  rnSt7Pm: string;
  rnSt8: string;
  rnSt9: string;
  rnSt10: string;
}

export interface VilageFcstItem {
  baseDate: string;
  baseTime: string;
  category: "POP" | "PTY" | "SKY" | "TMP" | "TMN" | "TMX" | "WSD" | "REH" | "PCP" | "SNO";
  fcstDate: string;
  fcstTime: string;
  fcstValue: string;
  nx: number;
  ny: number;
}

export type DailyGroupedData = Record<string, Partial<Record<VilageFcstItem["category"], string>>>;
