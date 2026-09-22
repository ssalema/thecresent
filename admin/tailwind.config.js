export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      /**
       * A Material-style elevation scale, tuned for the panel's gray-50 canvas.
       *
       * Tailwind's stock shadows jump straight from a hairline to a heavy blur,
       * which made a resting card and an open dialog read as the same height.
       * These five steps are the only shadows the UI kit uses: e1 rests, e2 is
       * hover, e3 is a lifted/dragged surface, e4 is a popover, e5 is a modal.
       */
      boxShadow: {
        e1: '0 1px 2px 0 rgb(16 24 40 / 0.06), 0 1px 3px 0 rgb(16 24 40 / 0.10)',
        e2: '0 2px 4px -1px rgb(16 24 40 / 0.06), 0 4px 8px -2px rgb(16 24 40 / 0.10)',
        e3: '0 4px 6px -2px rgb(16 24 40 / 0.05), 0 12px 16px -4px rgb(16 24 40 / 0.10)',
        e4: '0 8px 8px -4px rgb(16 24 40 / 0.04), 0 20px 24px -4px rgb(16 24 40 / 0.10)',
        e5: '0 24px 48px -12px rgb(16 24 40 / 0.25)',
      },

      /** Material's motion curves: `standard` for state changes, `emphasized`
          for something entering or leaving the screen. */
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
        emphasized: 'cubic-bezier(0.2, 0.8, 0.3, 1)',
      },

      /* The dialog entrance, defined once. ConfirmDialog, MessageDialog and
         Modal each used to inject their own copy of these keyframes in a
         <style> tag; they all use `animate-overlay-in` / `animate-dialog-in`. */
      keyframes: {
        'overlay-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'dialog-in': {
          from: { opacity: '0', transform: 'translateY(12px) scale(.96)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'overlay-in': 'overlay-in .15s ease-out',
        'dialog-in': 'dialog-in .2s cubic-bezier(0.2, 0.8, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
