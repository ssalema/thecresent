export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      /**
       * Inter is the site's face, set on <body> in index.css. Caveat
       * is the handwritten accent the home page lays over its hero and
       * call-to-action photographs — a caption in a human hand, never body
       * copy, so it is an opt-in utility rather than a change to the sans
       * stack. Both faces load from the one link in index.html.
       */
      fontFamily: {
        script: ['Caveat', 'Segoe Script', 'cursive'],
      },

      /**
       * The same Material-style elevation scale the admin panel uses — the two
       * apps are one product, so a card sits at the same height on both sides
       * of the login. e1 rests, e2 is hover, e3 is a lifted surface, e4 is a
       * popover, e5 is a modal.
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
    },
  },
  plugins: [],
}
