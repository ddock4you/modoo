import { DayPicker } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { formatYmd, getKstTodayYmd } from "@/features/add-plant-wizard/utils/dateUtils";
import HintIllustration from "@/assets/illustrations/illust2.png";
import "react-day-picker/style.css";

interface Step2CalendarProps {
  wateredDates: Date[];
  onDateSelect: (dates: Date[] | undefined) => void;
  onRemoveDate: (date: Date) => void;
  onSubmit: () => void;
}

export function Step2Calendar({
  wateredDates,
  onDateSelect,
  onRemoveDate,
  onSubmit,
}: Step2CalendarProps) {
  const todayYmd = getKstTodayYmd();

  return (
    <div className="flex flex-col gap-6">
      <div className="px-7 pt-5 pb-9 bg-[#EEF8F5] rounded-b-[20px] flex flex-col gap-5">
        <div>
          <DayPicker
            mode="multiple"
            locale={ko}
            selected={wateredDates}
            onSelect={onDateSelect}
            navLayout="around"
            startMonth={new Date(2024, 6)}
            captionLayout="dropdown"
            modifiers={{
              sunday: (date) => date.getDay() === 0, // 일요일 체크
            }}
            modifiersClassNames={{
              sunday: "text-red-500", // 일요일 빨간색
            }}
            disabled={(date) => formatYmd(date) > todayYmd}
            classNames={{
              // 전체 캘린더 컨테이너 - 중앙 정렬, 최대 너비 제한
              root: `rdp-root bg-white p-4 sm:p-6 relative ${
                wateredDates.length > 0 ? "rounded-b-none rounded-t-xl" : "rounded-xl"
              }`,
              // 월 컨테이너
              months: "rdp-months relative w-full max-w-full!",
              // 개별 월
              month: "rdp-month w-full max-w-full",
              // 월 헤더 (년월 표시)
              month_grid: "rdp-month_grid w-full max-w-full",

              // 요일 헤더 컨테이너 - 7열 그리드
              weekdays: "rdp-weekdays grid grid-cols-7 gap-1 sm:gap-1.5 lg:gap-2 font-bold",
              // 개별 요일 - 첫 번째(일요일)만 빨간색
              weekday: "rdp-weekday text-neutral-500 [&:first-child]:text-red-500",
              // 날짜들 컨테이너
              weeks: "rdp-weeks w-full",
              // 주별 컨테이너 - 7열 그리드
              week: "rdp-week grid grid-cols-7 gap-1 sm:gap-1.5 lg:gap-2",
              // 개별 날짜 버튼 - 정사각형, 균일한 크기, 터치 친화적
              day: "rdp-day aspect-square w-full! h-full! text-sm",
              day_button: "rdp-day_button aspect-square w-full! h-full!",
              // 선택된 날짜 - emerald 테마 (우선순위 높음)
              selected: "rdp-day_selected rounded-full bg-[#00A576]! font-bold text-white",
              // 오늘 날짜 - 강조 (선택되지 않은 경우만)
              today: "rdp-day_today font-bold rounded-full bg-[#DDF4ED]",
              // 비활성화된 날짜
              day_disabled: "rdp-day_disabled text-neutral-300 cursor-not-allowed",
              // 이전 달 버튼 - 터치 영역 확보

              // 캘린더 드롭다운 - 기본 스타일
              caption_label:
                "rdp-month_caption_label w-fit mx-auto text-lg font-bold text-neutral-900",
              chevron: "rdp-chevron w-6 fill-[#959595]!",
              dropdown_root:
                "rdp-dropdown_label flex items-center justify-center gap-2 relative z-10 text-lg",
              dropdown: "rdp-dropdown appearance-none",
              dropdown_month:
                "rdp-dropdown_month bg-white border border-neutral-200 rounded-md px-3 py-1 cursor-pointer hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none",
              dropdown_year:
                "rdp-dropdown_year  bg-white border border-neutral-200 rounded-md px-3 py-1 cursor-pointer hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none",
            }}
          />

          {wateredDates.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs p-6 pt-1 bg-white rounded-b-xl">
              {wateredDates
                .slice()
                .sort((a, b) => a.getTime() - b.getTime())
                .map((d) => (
                  <button
                    key={d.toISOString()}
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-[#dddddd] px-3 py-2 text-[#878281]"
                    onClick={() => onRemoveDate(d)}
                  >
                    {formatYmd(d)}
                    <span className="text-[10px]">✕</span>
                  </button>
                ))}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            className="h-12 w-full rounded-sm bg-[#00A576] font-bold text-base"
            onClick={() => onSubmit()}
          >
            물주기 정보 등록 완료
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-6 rounded-2xl bg-[#EFFBFF] px-7 py-4">
        <img src={HintIllustration} alt="" className="shrink-0" aria-hidden="true" />
        <div className="flex flex-col gap-2">
          <p className="text-lg font-bold text-primary leading-relaxed">
            등록할 사진이 없으신가요?
          </p>
          <p className="text-[#76716F] leading-relaxed text-sm font-medium break-keep">
            물 준 날짜가 기억나지 않아도 괜찮아요. 화분을 등록한 후에도 언제든지 물주기 기록을
            추가할 수 있어요.
          </p>
        </div>
      </div>
    </div>
  );
}
