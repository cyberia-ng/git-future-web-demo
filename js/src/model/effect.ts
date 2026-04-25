import type { Mutator } from "./mutator";

export type Effect<T> = (updateEphemeralState: (mutator: Mutator<T>) => void) => Promise<void>;
