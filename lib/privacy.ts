export type LocationPermission = "off" | "once" | "while-using";

export type LocationSettings = {
  permission: LocationPermission;
  area: string;
  distanceBand: "500m内" | "3km内" | "同城";
  hideHistory: boolean;
};

export const defaultLocationSettings: LocationSettings = {
  permission: "once",
  area: "望京",
  distanceBand: "3km内",
  hideHistory: true,
};

export function publicLocationLabel(settings: LocationSettings): string {
  if (settings.permission === "off") {
    return "纯线上模式";
  }

  return `${settings.area} · ${settings.distanceBand}`;
}

export function locationSafetyCopy(settings: LocationSettings): string {
  if (settings.permission === "off") {
    return "不会使用或展示你的位置信息";
  }

  return "仅验证声场归属，不展示精确位置或移动轨迹";
}
