export type MaybeArray<T> = T | T[];
type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [P in K]?: T[P];
};
