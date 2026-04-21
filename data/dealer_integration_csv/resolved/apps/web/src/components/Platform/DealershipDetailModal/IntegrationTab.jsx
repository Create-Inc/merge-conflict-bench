import { Loader2, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useDmsRequestInfo, useClearDmsRequest } from "@/hooks/useDmsRequest";
import {
  useProviderConfig,
  useEnabledByProvider,
} from "@/hooks/useIntegrationProviders";
import { DmsRequestBanner } from "./IntegrationTab/DmsRequestBanner";
import { IntegrationToggles } from "./IntegrationTab/IntegrationToggles";
import { AddIntegrationModal } from "./IntegrationTab/AddIntegrationModal";
import { IntegrationCard } from "./IntegrationTab/IntegrationCard";
import { useIntegrationActions } from "./IntegrationTab/useIntegrationActions";
import { useFrazerEditor } from "./IntegrationTab/useFrazerEditor";
import { useDominionEditor } from "./IntegrationTab/useDominionEditor";
import { useAutosoftEditor } from "./IntegrationTab/useAutosoftEditor";

export function IntegrationTab({ detail, isLoading, dealershipId, queryClient }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [integrationType, setIntegrationType] = useState("");
  const [actionSuccess, setActionSuccess] = useState(null);

  // IMPORTANT:
  // When enabling a provider, the API can return the integration immediately,
  // but the dealership detail query may not have refetched yet.
  // This keeps an optimistic copy so the card + editor can render immediately.
  const [optimisticIntegrations, setOptimisticIntegrations] = useState([]);

  const baseIntegrations = Array.isArray(detail?.integrations)
    ? detail.integrations
    : [];

  const integrations = useMemo(() => {
    const all = [...baseIntegrations, ...(optimisticIntegrations || [])];

    const byId = new Map();
    for (const i of all) {
      if (!i || !i.id) continue;
      byId.set(String(i.id), i);
    }

    return Array.from(byId.values());
  }, [baseIntegrations, optimisticIntegrations]);

  const dmsRequestInfo = useDmsRequestInfo(detail);
  const providerConfig = useProviderConfig();
  const enabledByProvider = useEnabledByProvider(integrations);

  const {
    saving: actionsSaving,
    error: actionsError,
    setError: setActionsError,
    setProviderEnabled,
    handleAddIntegration,
  } = useIntegrationActions(detail, enabledByProvider, queryClient);

  const clearDmsRequestMutation = useClearDmsRequest(
    dealershipId,
    queryClient,
    setActionsError,
    setActionSuccess,
  );

  const frazerEditor = useFrazerEditor(detail, queryClient);
  const dominionEditor = useDominionEditor(detail, queryClient);
  const autosoftEditor = useAutosoftEditor(detail, queryClient);

  const scrollToIntegration = useCallback((integrationId) => {
    if (typeof window === "undefined") return;
    const id = `integration-card-${integrationId}`;
    const el = document.getElementById(id);
    if (!el) return;

    setTimeout(() => {
      try {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch {
        // ignore
      }
    }, 50);
  }, []);

  const openEditorForProvider = (providerKey, integration) => {
    const p = String(providerKey || "").toLowerCase();
    if (!integration) return;

    if (p === "frazer") {
      frazerEditor.openFrazerEditor(integration);
      scrollToIntegration(integration.id);
      return;
    }

    if (p === "dominion") {
      dominionEditor.openDominionEditor(integration);
      scrollToIntegration(integration.id);
      return;
    }

    if (p === "autosoft") {
      autosoftEditor.openAutosoftEditor(integration);
      scrollToIntegration(integration.id);
      return;
    }
  };

  const handleToggleProvider = async (providerKey, enabled) => {
    setActionSuccess(null);

    const createdOrEnabled = await setProviderEnabled(providerKey, enabled);

    if (enabled && createdOrEnabled?.id) {
      setOptimisticIntegrations((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        const existingIdx = next.findIndex(
          (x) => String(x?.id) === String(createdOrEnabled.id),
        );
        if (existingIdx >= 0) {
          next[existingIdx] = createdOrEnabled;
          return next;
        }
        next.push(createdOrEnabled);
        return next;
      });
    }

    if (enabled) {
      const integrationFromList = enabledByProvider.get(providerKey);
      const integrationToEdit = createdOrEnabled || integrationFromList;

      if (integrationToEdit) {
        openEditorForProvider(providerKey, integrationToEdit);
        setActionSuccess("Enabled. Setup opened below.");
      } else {
        setActionSuccess(
          "Enabled. If setup didn't open, try again in a moment (the CRM is refreshing).",
        );
      }
    }
  };

  const handleConfigureProvider = (providerKey, integration) => {
    setActionSuccess(null);
    openEditorForProvider(providerKey, integration);
  };

  const handleMarkDmsRequestHandled = () => {
    if (typeof window === "undefined") return;
    const ok = window.confirm(
      "Mark this DMS request as handled? This will remove the 'DMS Requested' badge in the CRM.",
    );
    if (!ok) return;
    clearDmsRequestMutation.mutate();
  };

  const handleAddClick = async () => {
    try {
      await handleAddIntegration(selectedProvider, integrationType);
      setShowAddModal(false);
      setSelectedProvider("");
      setIntegrationType("");
    } catch {
      // Error is already set by handleAddIntegration
    }
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
    setSelectedProvider("");
    setIntegrationType("");
    setActionsError(null);
  };

  const error =
    actionsError ||
    frazerEditor.error ||
    dominionEditor.error ||
    autosoftEditor.error;

  const saving =
    actionsSaving ||
    frazerEditor.saving ||
    dominionEditor.saving ||
    autosoftEditor.saving;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Integrations (Admin Controlled)
        </h3>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <Plus className="h-4 w-4" />
          Add Integration
        </button>
      </div>

      <DmsRequestBanner
        dmsRequestInfo={dmsRequestInfo}
        onMarkHandled={handleMarkDmsRequestHandled}
        isPending={clearDmsRequestMutation.isPending}
      />

      <p className="text-sm text-gray-600">
        Turn integrations on/off for this dealership. When enabled, they will
        show up in the dealership's Settings → Integrations.
      </p>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      ) : null}

      {actionSuccess ? (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
          {actionSuccess}
        </div>
      ) : null}

      <IntegrationToggles
        providerConfig={providerConfig}
        enabledByProvider={enabledByProvider}
        saving={saving}
        onToggle={handleToggleProvider}
        onConfigure={handleConfigureProvider}
      />

      {integrations.length > 0 ? (
        <div className="space-y-4">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              dealershipId={detail.id}
              editingFrazerId={frazerEditor.editingFrazerId}
              editingDominionId={dominionEditor.editingDominionId}
              editingAutosoftId={autosoftEditor.editingAutosoftId}
              frazerSftp={frazerEditor.frazerSftp}
              dominionApi={dominionEditor.dominionApi}
              dominionSaveSuccess={dominionEditor.success}
              autosoftSftp={autosoftEditor.autosoftSftp}
              saving={saving}
              onOpenFrazerEditor={frazerEditor.openFrazerEditor}
              onOpenDominionEditor={dominionEditor.openDominionEditor}
              onOpenAutosoftEditor={autosoftEditor.openAutosoftEditor}
              onFrazerChange={frazerEditor.setFrazerSftp}
              onDominionChange={dominionEditor.setDominionApi}
              onAutosoftChange={autosoftEditor.setAutosoftSftp}
              onCancelFrazer={() => frazerEditor.setEditingFrazerId(null)}
              onCancelDominion={() => dominionEditor.setEditingDominionId(null)}
              onCancelAutosoft={() => autosoftEditor.setEditingAutosoftId(null)}
              onSaveFrazer={frazerEditor.saveFrazerSettings}
              onSaveDominion={dominionEditor.saveDominionSettings}
              onSaveDominionAndTest={dominionEditor.saveAndTestDominionSettings}
              onSaveAutosoft={autosoftEditor.saveAutosoftSettings}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No integrations enabled yet
        </div>
      )}

      <AddIntegrationModal
        show={showAddModal}
        selectedProvider={selectedProvider}
        integrationType={integrationType}
        saving={saving}
        onProviderChange={setSelectedProvider}
        onTypeChange={setIntegrationType}
        onCancel={handleCancelAdd}
        onAdd={handleAddClick}
      />
    </div>
  );
}
