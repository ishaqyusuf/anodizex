"use client";

import {
  OpenPanelComponent,
  type TrackProperties,
  useOpenPanel,
} from "@openpanel/nextjs";
import { useEffect } from "react";

const isProd = process.env.NODE_ENV === "production";

const Provider = () => (
  <OpenPanelComponent
    clientId={process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID!}
    trackAttributes={true}
    trackScreenViews={isProd}
    trackOutgoingLinks={isProd}
  />
);

type TrackOptions = { event: string } & TrackProperties;
type IdentifyUserOptions = {
  userId: string;
  workspaceId: string;
  workspaceSlug: string;
};
type OpenPanelWithGroups = ReturnType<typeof useOpenPanel> & {
  setGroup?: (id: string) => void;
  upsertGroup?: (group: {
    id: string;
    type: string;
    name?: string;
    properties?: Record<string, unknown>;
  }) => void;
};

const useTrack = () => {
  const { track: openTrack } = useOpenPanel();

  return (options: TrackOptions) => {
    if (!isProd) {
      console.log("Track", options);
      return;
    }

    const { event, ...rest } = options;

    openTrack(event, rest);
  };
};

const useClearIdentity = () => {
  const { clear } = useOpenPanel();

  return () => {
    if (!isProd) {
      console.log("Clear identity");
      return;
    }

    clear();
  };
};

function IdentifyUser({
  userId,
  workspaceId,
  workspaceSlug,
}: IdentifyUserOptions) {
  const {
    identify,
    setGlobalProperties,
    setGroup,
    upsertGroup,
  } = useOpenPanel() as OpenPanelWithGroups;

  useEffect(() => {
    const group = {
      id: workspaceId,
      type: "workspace",
      name: workspaceSlug,
      properties: {
        workspaceId,
        workspaceSlug,
      },
    };

    if (!isProd) {
      console.log("Identify", { profileId: userId });
      console.log("Workspace group", group);
      return;
    }

    identify({ profileId: userId });
    upsertGroup?.(group);
    setGroup?.(workspaceId);
    setGlobalProperties({
      workspaceId,
      workspaceSlug,
    });
  }, [
    identify,
    setGlobalProperties,
    setGroup,
    upsertGroup,
    userId,
    workspaceId,
    workspaceSlug,
  ]);

  return null;
}

export { IdentifyUser, Provider, useClearIdentity, useTrack };
