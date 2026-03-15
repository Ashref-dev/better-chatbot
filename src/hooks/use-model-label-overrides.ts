"use client";

import { useEffect, useState } from "react";
import {
  MODEL_LABEL_OVERRIDES_CHANGED_EVENT,
  ModelLabelOverridesMap,
  modelLabelOverridesManager,
} from "lib/ai/model-label-overrides";

export const useModelLabelOverrides = () => {
  const [overrides, setOverrides] = useState<ModelLabelOverridesMap>({});

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

  return overrides;
};
