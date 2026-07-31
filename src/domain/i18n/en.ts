import type { Dictionary } from './types';

const en: Dictionary = {
  eyebrow: 'Floor plan / seating',
  appTitle: 'seating plant',
  tabEdit: 'Edit Floor Plan',
  tabGuests: 'Guest List',
  tabPreview: 'Preview',
  exportBtn: 'Export',
  importBtn: 'Import',
  undoBtnTitle: 'Undo (Ctrl+Z)',
  redoBtnTitle: 'Redo (Ctrl+Shift+Z)',
  searchBtn: 'Search guests',
  searchBtnTitle: 'Search guests from any tab',
  exportBtnTitle: 'Export the floor plan + guest list + theme as data.json (ready to place alongside seating-display.html for deploy)',
  importBtnTitle: 'Import the floor plan + guest list from a file',
  toastExported: 'data.json exported — place it in the same folder as seating-display.html and deploy',
  clearCacheBtn: 'Clear cache',
  clearCacheBtnTitle: 'Delete the floor plan + guest list + theme saved in this browser (export a backup first)',
  confirmClearCache:
    'Clearing the cache will permanently delete the floor plan, guest list, and theme saved in this browser. This cannot be undone. We recommend clicking "Export" to back up first. Continue?',
  toastCacheCleared: 'Cache cleared',
  themeBtn: 'Theme',
  themeBtnTitle: 'Choose a color theme for the seating plan (included in exported files)',
  themeModalTitle: 'Choose a Color Theme',
  themeModalSubtitle: 'The selected theme is saved in exported files and also applied on the seating-display page',
  themeDefaultLabel: 'Default',
  themeCustomLabel: 'Custom',
  themeCustomEditorTitle: 'Customize Theme Colors (60% / 25% / 10% / 5%)',
  themeCustomEditorHint:
    'Pick a color for each proportion using the color picker, or type a hex code (e.g. #1a2b3c) directly — the "Custom" theme activates automatically as soon as you change a color. The app may auto-adjust the brightness of your chosen colors slightly to keep text legible and contrast sufficient.',
  themeRoleDominant: 'Dominant (background)',
  themeRoleSecondary: 'Secondary (borders/surfaces)',
  themeRoleAccent: 'Accent (highlight)',
  themeRoleInk: 'Ink (text/contrast)',
  themeAppliedPreviewTitle: 'The color actually used in the app (after automatic brightness adjustment)',
  langToggleTitle: 'Switch language / เปลี่ยนภาษา',
  helpBtn: 'How to use',
  helpBtnTitle: 'View detailed usage instructions',
  helpTitle: 'How to Use',
  helpSubtitle: 'A detailed guide to the seating plan app',
  helpContent: `
    <p>This app manages an event seating plan across three main tabs, plus a top menu bar available from any tab.</p>

    <h4>1. "Edit Floor Plan" tab</h4>
    <ul>
      <li><b>Arrange layout / Add an object</b> — Drag an icon (Round table, Long table, Stage, Door) from the panel onto the plan, or click an icon to add it automatically at a random position</li>
      <li><b>Move an object</b> — Click and hold an object, then drag it. Gold guide lines snap it to the center or to align with nearby objects automatically</li>
      <li><b>Select multiple</b> — Drag across empty space on the plan to select several objects at once, then drag any selected object to move the whole group together</li>
      <li><b>Resize / rotate</b> — Click a single object to select it; a gold handle appears at the bottom-right corner to resize, and a rotation control appears in the "Details" panel on the right (for Long table, Stage, and Door only)</li>
      <li><b>Edit table name / number / seats per table</b> — Click an object and edit its values in the "Details" panel on the right; changes save automatically</li>
      <li><b>Delete an object</b> — Select it and click "Delete object" in the details panel, or press <kbd>Delete</kbd> on your keyboard</li>
      <li><b>Keyboard shortcuts</b> — <kbd>Ctrl+C</kbd> copy, <kbd>Ctrl+V</kbd> paste, <kbd>Ctrl+Z</kbd> undo, <kbd>Ctrl+Shift+Z</kbd> or <kbd>Ctrl+Y</kbd> redo</li>
      <li><b>Zoom</b> — Use the −/+ buttons, hold <kbd>Ctrl</kbd> and scroll the mouse wheel, or click "Fit to screen" to reset the view</li>
    </ul>

    <h4>2. "Guest List" tab</h4>
    <ul>
      <li><b>Export template</b> — Click "Export template" to download a .csv file automatically pre-filled with every table/object from the current floor plan and a row for every seat. Open it in Excel and fill in only the "Full name" column — rows left blank are skipped when imported</li>
      <li><b>Import from file</b> — Upload a .csv file (including the filled-in template) at "Import from File / Excel"; this replaces the entire guest list with the data in the file (you'll be asked to confirm first if a guest list already exists — and you can undo it with <kbd>Ctrl+Z</kbd> if you imported the wrong file)</li>
      <li><b>Edit in the table</b> — Edit name/table/seat directly in the guest table below, or click "+ Add guest" to add guests one at a time without a file</li>
      <li><b>Remove a guest</b> — Click the ✕ button at the end of a row to remove that guest from the list</li>
    </ul>

    <h4>3. "Preview" tab</h4>
    <ul>
      <li><b>Search guests</b> — Type a name in the search box, then click a result to highlight that table on the plan and open the full guest list for that table</li>
      <li><b>View the floor plan</b> — Click a table directly on the plan to open the list of guests seated there</li>
    </ul>

    <h4>4. Top menu (available on every tab)</h4>
    <ul>
      <li><b>Search guests (magnifier icon)</b> — Search for a guest from any tab, not just Preview. Click a result to jump to the Preview tab and highlight their table automatically</li>
      <li><b>↶ / ↷ Undo / Redo</b> — Available in both the "Edit Floor Plan" and "Guest List" tabs (or press <kbd>Ctrl+Z</kbd> / <kbd>Ctrl+Shift+Z</kbd>), covering both floor plan edits and guest list imports</li>
      <li><b>Export</b> — Export the floor plan + guest list + selected theme together as a single <code>data.json</code> file. Use it as a backup, or place it right next to seating-display.html when deploying (the guest display page loads it automatically)</li>
      <li><b>Import</b> — Import a previously exported .json file, replacing all current floor plan/guest/theme data (you'll always be asked to confirm first)</li>
      <li><b>TH / EN</b> — Switch the whole app's display language between Thai and English; your choice is remembered on this device for next time</li>
    </ul>

    <div class="help-tip">💡 The floor plan and guest list save automatically in this browser as you edit. Click Export regularly to back up your data as a file — it will be lost if you clear your browser cache or switch devices/browsers.</div>
  `,

  panelAddObjectTitle: 'Arrange Layout',
  panelAddObjectHint: 'Drag an icon onto the floor plan, or click to add it at a random position',
  objTypeRound: 'Round table (Chinese-style)',
  objTypeLong: 'Long table',
  objTypeStage: 'Stage',
  objTypeDoor: 'Door',
  labelPrefixRound: 'Round table',
  labelPrefixLong: 'Long table',
  labelPrefixStage: 'Stage',
  labelPrefixDoor: 'Door',
  tableWordPrefix: 'Table',
  zoomOutTitle: 'Zoom out',
  zoomInTitle: 'Zoom in',
  zoomFit: '⤢ Fit to screen',
  zoomFitTitle: 'Fit the zoom level to the screen',
  zoomHint: 'Ctrl + scroll wheel to zoom in/out',
  sidePanelTitle: 'Details',
  sidePanelEmpty: 'Click an object on the plan to edit it',
  sidePanelEmptyMulti: 'Click an object to edit it, or drag to select multiple',
  selectedCount: (n) => `${n} item(s) selected`,
  dragGroupHint: 'Drag the selected objects to move them as a group',
  clearSelection: 'Clear selection',
  deleteAllCount: (n) => `Delete all (${n})`,
  fieldLabel: 'Name / Number',
  fieldLabelTable: 'Table name / number',
  fieldCapacity: 'Seats per table',
  fieldWidth: 'Width (px)',
  fieldHeight: 'Height (px)',
  fieldRotation: 'Rotation (degrees)',
  rotReset: 'Reset',
  deleteObjectBtn: 'Delete object',
  resizeHandleTitle: 'Drag to resize',
  rotateHandleTitle: 'Drag to rotate (turns gold when perfectly square at 0°/90°/180°/270°)',

  panelTemplateTitle: 'Guest Data Template',
  panelTemplateHint:
    'Export a template (.csv, opens in Excel) listing every table/object in the current floor plan with a row for each seat. Just fill in the "Full name" column, then bring the file back and Import it below (rows left without a name are skipped automatically)',
  exportTemplateBtn: 'Export template (Excel/CSV)',
  panelImportTitle: 'Import from File / Excel',
  panelImportHint: "Upload a .csv file (including the template exported above) to replace the entire guest list below with the data in this file (you'll be asked to confirm first if a guest list already exists)",
  panelGuestListTitle: 'Guest List',
  panelGuestListHint: 'Edit name/table/seat directly in the table, or click "+ Add guest" to add guests one at a time without a file',
  statGuestsTotal: 'Total guests',
  statTablesUsed: 'Tables in use',
  statSeatConflicts: 'Seat conflicts',
  dupSeatTitle: 'This seat is already assigned to another guest at this table',
  thName: 'Full name',
  thTable: 'Table',
  thSeat: 'Seat No.',
  emptyValuePlaceholder: '(Empty)',
  deleteGuestTitle: 'Remove this guest',
  noGuestData: 'No guest data yet',
  noGuestDataFiltered: 'No guests match this filter',
  addGuestBtn: '+ Add guest',
  guestFilterPlaceholder: 'Search name or table...',
  allTablesChip: 'All',
  otherTableChip: 'Other / unmatched',
  clearFilterHint: 'Click again to clear the filter',
  noCapTitle: 'Seat capacity has not been set for this table yet',

  panelSearchTitle: 'Search Guests',
  sharedBanner: 'ℹ This data is saved in this browser only — click "Export" above regularly to back it up as a file',
  searchPlaceholder: 'Type a guest name to search...',
  panelFloorplanTitle: 'Floor Plan',
  panelFloorplanHint: 'Click a table to see who is seated there',
  noFloorplanYet: 'No floor plan yet — go to the "Edit Floor Plan" tab to create one',
  noSearchMatch: 'No matching name found',
  modalCloseLabel: 'Close',
  noGuestForTable: 'No guests assigned to this table yet',
  seatInline: (seat) => `Seat ${seat}`,
  capacityFraction: (a, b) => `${a} / ${b} seats`,
  seatsCount: (n) => `${n} seats`,

  alertBadJson: 'Invalid file — could not be read as JSON',
  alertNoDataInFile: 'No floor plan or guest data found in this file',
  alertBadFloorplanFormat: 'The floor plan data in this file is not valid',
  alertBadGuestFormat: 'The guest data in this file is not valid',
  confirmImportPrefix: 'Importing will replace all current data:',
  confirmImportSuffix: 'Do you want to continue?',
  importPartFloorplan: (a, b) => `Floor plan (${a} → ${b} items)`,
  importPartGuests: (a, b) => `Guest list (${a} → ${b} guests)`,
  toastImportSuccess: 'Import successful',
  alertNoTablesForTemplate: 'There are no tables in the floor plan yet — go to the "Edit Floor Plan" tab to create one first',
  toastTemplateExported: (n) => `Template exported (${n} seats)`,
  toastNoValidDataInFile: 'No valid data found in this file',
  toastGuestsImported: (n) => `Imported ${n} guest(s)`,
  confirmCsvReplace: 'A guest list already exists. Importing this file will replace the entire guest list with the data in this file. Continue?',
  alertTableNotFound: (name) => `Could not find table "${name}" in the floor plan (this object hasn't been created in the Edit Floor Plan tab yet)`,

  toastNoUndo: 'Nothing to undo',
  toastUndoDone: 'Undone',
  toastNoRedo: 'Nothing to redo',
  toastRedoDone: 'Redone',
  toastDeleteMulti: (n) => `Deleted ${n} items`,
  toastDeleteOne: 'Object deleted',
  toastCopyNone: 'Please click or drag-select an object before copying',
  toastCopyMulti: (n) => `Copied ${n} items`,
  toastCopyOne: (label) => `Copied "${label}"`,
  toastPasteNone: 'Nothing has been copied yet',
  toastPasteMulti: (n) => `Pasted ${n} items`,
  toastPasteOne: 'Object pasted',
};

export default en;
