import { flip } from 'svelte/animate'
import { cubicOut } from 'svelte/easing'
import { prefersReducedMotion } from 'svelte/motion'

export function listFlip(node: Element, rects: { from: DOMRect; to: DOMRect }, options: { disabled?: boolean } = {}) {
  return flip(node, rects, { duration: prefersReducedMotion.current || options.disabled ? 0 : 320, easing: cubicOut })
}

/** Stop active movement immediately when the motion preference changes. */
export function listMotion(node: HTMLElement, disabled: () => boolean = () => false) {
  $effect(() => {
    if (prefersReducedMotion.current || disabled()) {
      for (const animation of node.getAnimations({ subtree: true })) animation.cancel()
    }
  })
}
