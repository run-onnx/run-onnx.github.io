/**
 * Synshape Tensor Synthesizer
 * 
 * @copyright Copyright (c) 2026 Michael Barlozewski. All rights reserved.
 * @contact   g.dev/avx
 * 
 * PROPRIETARY & CONFIDENTIAL
 * Unauthorized copying, modification, or distribution of this software 
 * via any medium is strictly prohibited.
 */

import { useRef } from "react";

type noop = (...args: any[]) => any;

export function usePersistFn<T extends noop>(fn: T) {
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  const persistFn = useRef<T>(null);
  if (!persistFn.current) {
    persistFn.current = function (this: unknown, ...args) {
      return fnRef.current!.apply(this, args);
    } as T;
  }

  return persistFn.current!;
}
