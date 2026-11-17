"use client";

import { useApi } from "../../_lib/api";
import { DEVICE_LABELS, num, SCREEN_LABELS } from "../../_lib/format";
import { useRange } from "../../_lib/range";
import type { DevicesReport } from "../../_lib/types";
import { Donut } from "../../_components/charts";
import { Async, BarList, Empty, Panel } from "../../_components/ui";

export default function DevicesPage() {
  const r = useRange();
  const rep = useApi<DevicesReport>(`/api/admin/devices?${r.query}`);

  return (
    <Async state={rep} h={320} isEmpty={(d) => d.device.length === 0} empty={<Panel title="Devices"><Empty title="No visits in this period" /></Panel>}>
      {(d) => (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Device category" note="Visitors">
              <Donut size={200} centerLabel="Visitors" slices={d.device.slice(0, 4).map((x) => ({ key: x.name, label: DEVICE_LABELS[x.name] ?? x.name, value: x.visitors }))} />
            </Panel>
            <Panel title="Screen size" note="Width category">
              <BarList
                format={num}
                highlightFirst={false}
                rows={["xs", "sm", "md", "lg", "xl", "unknown"]
                  .map((k) => ({ key: k, label: SCREEN_LABELS[k], value: d.screen.find((x) => x.name === k)?.visitors ?? 0 }))
                  .filter((x) => x.value > 0)}
              />
            </Panel>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Operating systems">
              <BarList format={num} rows={d.os.map((x) => ({ key: x.name, label: x.name, value: x.visitors }))} />
            </Panel>
            <Panel title="Browsers">
              <BarList format={num} rows={d.browser.map((x) => ({ key: x.name, label: x.name, value: x.visitors }))} />
            </Panel>
          </div>
        </div>
      )}
    </Async>
  );
}
