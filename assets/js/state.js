/* =============================================================================
   Shared mutable app state. Kept in one object so any module can read/write the
   current page key without circular imports (e.g. the morse toggles need to know
   which page's word to play).
   ============================================================================= */
export const state = {
  currentPageKey: 'home', // drives PAGE_MORSE + active nav
};
