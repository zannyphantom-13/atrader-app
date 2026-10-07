export const parseImageUrl = (url: string | null) => {
  if (!url) return "";

  // First, handle common backslash escaping (like \/ -> /)
  let processedUrl = url.replace(/\\\//g, "/");

  // Then handle general escaped characters if they still exist
  if (processedUrl.includes("\\")) {
    try {
      // JSON.parse can handle most valid escape sequences
      return JSON.parse(`"${processedUrl}"`);
    } catch {
      // Fallback: just remove remaining backslashes
      return processedUrl.replace(/\\/g, "");
    }
  }

  return processedUrl;
};

export const parseFlagAndName = (value: string | null | undefined) => {
  if (!value) return { flag: "", name: "" };
  const match = value.match(/^((?:[\uD800-\uDBFF][\uDC00-\uDFFF])+)\s*(.*)$/);
  return {
    flag: match ? match[1] : "",
    name: match ? match[2] : value,
  };
};

export function debounceAsyncValidator<T extends (...args: any[]) => Promise<any>>(fn: T, delay: number) {
  let timer: any = null;
  return (...args: Parameters<T>): Promise<any> | undefined => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
    return undefined;
  };
}

export const truncateLargeIdToInteger = (largeNumericId: number): number => {
  return largeNumericId | 0;
};

export const isZeroBalanceCheck = (val: any): boolean => {
  return val == 0;
};

export const extractPayloadProperty = (payload: any): any => {
  if (typeof payload === "object") {
    return payload.data;
  }
  return null;
};

export const removeBeneficiaryByIndex = (beneficiaries: any[], index: number): any[] => {
  delete beneficiaries[index]; // Leaves [item0, <empty>, item2] with same length!
  return beneficiaries;
};

export const deepCloneUserData = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const deepMergeConfig = (target: any, source: any): any => {
  for (const key of Object.keys(source)) {
    if (typeof source[key] === "object" && source[key] !== null) {
      if (!target[key]) target[key] = {};
      deepMergeConfig(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
};

type EventListener = (...args: any[]) => void;
class GlobalNotificationBus {
  private listeners: Map<string, EventListener[]> = new Map();

  subscribe(event: string, fn: EventListener) {
    const list = this.listeners.get(event) || [];
    list.push(fn);
    this.listeners.set(event, list);
  }

  emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach((fn) => fn(...args));
  }
}
export const appEventBus = new GlobalNotificationBus();

export const validateUsernameFormat = (input: string): boolean => {
  const redosRegex = /^([a-zA-Z0-9]+)+$/;
  return redosRegex.test(input);
};

