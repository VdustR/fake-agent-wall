import * as combobox from '@zag-js/combobox'

/** Keep list navigation and positioning in Zag, and native editing in the input. */
export function createFontInputMachine(getInput: () => HTMLInputElement | null): typeof combobox.machine {
  const actions = combobox.machine.implementations?.actions
  if (!actions) throw new Error('Combobox actions are unavailable')
  return {
    ...combobox.machine,
    implementations: {
      ...combobox.machine.implementations,
      actions: {
        ...actions,
        // This component has no separate trigger. Opening never needs to move focus.
        setInitialFocus() {},
        // Explicit completion returns focus synchronously in the owning component.
        setFinalFocus() {},
        syncInputValue({ context }) {
          const input = getInput()
          const value: string = context.get('inputValue')
          if (input && input.value !== value) input.value = value
        },
      },
    },
  }
}
