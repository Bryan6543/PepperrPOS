import { readPosGateCookie } from "@/lib/pos-session";

export class PosLockedError extends Error {
  constructor() {
    super("POS_LOCKED");
    this.name = "PosLockedError";
  }
}

export async function requirePosUnlocked(): Promise<void> {
  const ok = await readPosGateCookie();
  if (!ok) throw new PosLockedError();
}
