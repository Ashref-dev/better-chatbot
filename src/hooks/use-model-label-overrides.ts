"use client";

import { useEffect, useState } from "react";
import {
  MODEL_LABEL_OVERRIDES_CHANGED_EVENT,
  ModelLabelOverridesMap,
  modelLabelOverridesManager,
} from "lib/ai/model-label-overrides";
import useSWR from "swr";
import { fetcher } from "lib/utils";

export const useModelLabelOverrides = () => {
  const [overrides, setOverrides] = useState<ModelLabelOverridesMap>(
    modelLabelOverridesManager.getAll(),
  );
  const { data: serverOverrides } = useSWR<ModelLabelOverridesMap>(
    "/api/user/model-label-overrides",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    },
  );

  useEffect(() => {
    const sync = () => {
      setOverrides(modelLabelOverridesManager.getAll());
    };

    sync();

    window.addEventListener(MODEL_LABEL_OVERRIDES_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener(MODEL_LABEL_OVERRIDES_CHANGED_EVENT, sync);
    };
  }, []);

  useEffect(() => {
    if (!serverOverrides) return;
    const local = modelLabelOverridesManager.getAll();
    const merged: ModelLabelOverridesMap = { ...serverOverrides };

    for (const [key, localValue] of Object.entries(local)) {
      const serverValue = serverOverrides[key];
      if (
        !serverValue ||
        (localValue.updatedAt ?? 0) > (serverValue.updatedAt ?? 0)
      ) {
        merged[key] = localValue;
      }
    }

    modelLabelOverridesManager.replaceAll(merged, { emit: false });
    setOverrides(merged);
  }, [serverOverrides]);

  return overrides;
};
