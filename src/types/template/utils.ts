export const parseJsonField = <T>(field: unknown): T => {
  if (!field) return {} as T;
  if (typeof field === 'string') {
    try {
      return JSON.parse(field) as T;
    } catch {
      return {} as T;
    }
  }
  return field as T;
};

export const isValidTemplateType = (type: string): boolean => {
  return ['soap-note', 'referral', 'discharge', 'live-session'].includes(type);
};