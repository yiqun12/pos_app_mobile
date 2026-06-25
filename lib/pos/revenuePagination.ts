export type RevenuePage<T> = {
  rows: T[];
  hasMore: boolean;
};

export function sliceRevenuePage<T>(rows: T[], pageSize: number): RevenuePage<T> {
  return {
    rows: rows.slice(0, pageSize),
    hasMore: rows.length > pageSize,
  };
}
