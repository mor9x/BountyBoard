type RuntimeEnv = Record<string, string | undefined>;

export function getRuntimeEnv(): RuntimeEnv {
  const nodeEnv =
    typeof process !== "undefined" && process.env
      ? (process.env as RuntimeEnv)
      : {};
  const viteEnv =
    typeof import.meta !== "undefined" && "env" in import.meta
      ? ((import.meta as ImportMeta & { env?: RuntimeEnv }).env ?? {})
      : {};

  return {
    ...nodeEnv,
    ...viteEnv
  };
}

export function env(name: string) {
  const value = getRuntimeEnv()[name];
  return typeof value === "string" && value.length > 0 ? value : null;
}
