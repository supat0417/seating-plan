import { PlanProvider, PlanEffects, usePlan } from './ui/state/PlanProvider';
import { I18nProvider } from './ui/i18n/I18nContext';
import { ToastProvider } from './ui/components/Toast';
import { NavigationProvider } from './ui/state/NavigationContext';
import { Topbar } from './ui/features/topbar/Topbar';
import { EditTab } from './ui/features/edit/EditTab';
import { GuestsTab } from './ui/features/guests/GuestsTab';
import { ViewTab } from './ui/features/view/ViewTab';
import { useGlobalKeyboardShortcuts } from './ui/hooks/useGlobalKeyboardShortcuts';

function Shell() {
  const { state } = usePlan();
  useGlobalKeyboardShortcuts();
  return (
    <>
      <Topbar />
      <div id="main">
        {state.mode === 'edit' && <EditTab />}
        {state.mode === 'guests' && <GuestsTab />}
        {state.mode === 'view' && <ViewTab />}
      </div>
    </>
  );
}

function LocalizedRoot() {
  const { state } = usePlan();
  return (
    <I18nProvider lang={state.lang}>
      <PlanEffects />
      <ToastProvider>
        <NavigationProvider>
          <Shell />
        </NavigationProvider>
      </ToastProvider>
    </I18nProvider>
  );
}

export default function App() {
  return (
    <PlanProvider>
      <div className="brand-strip" />
      <div id="app">
        <LocalizedRoot />
      </div>
    </PlanProvider>
  );
}
