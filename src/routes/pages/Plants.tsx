import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { PlantsTab } from "../../components/plants";

export function Plants() {
  const [activeTab, setActiveTab] = useState("plants");

  const tabs = [
    { value: "plants", label: "내 화분 목록" },
    { value: "watering", label: "물주기 기록" },
  ];

  return (
    <div className="bg-background text-foreground">
      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 border-b border-[#76716F]">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                <span
                  className={`inline-flex px-2 py-4 translate-y-0.5 ${
                    activeTab === tab.value ? "text-[#00A576] border-b-4 border-[#00A576]" : ""
                  }`}
                >
                  {tab.label}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="plants" className="mt-6 p-6">
            <PlantsTab />
          </TabsContent>

          <TabsContent value="watering" className="mt-6 p-6">
            {/* 물주기 기록 탭 - 추후 구현 */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-8 text-center">
              <p className="text-lg font-semibold text-white mb-2">물주기 기록</p>
              <p className="text-sm text-muted-foreground">
                물주기 기록 기능을 곧 만나보실 수 있어요.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
