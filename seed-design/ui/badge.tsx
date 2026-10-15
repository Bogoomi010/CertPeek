/**
 * @file ui:badge
 * @requires @karrotmarket/react-monochrome-icon@^1.17.0
 * @requires @seed-design/react@^3.0.0
 **/

import { IconILowercaseSerifCircleLine } from "@karrotmarket/react-monochrome-icon";
import { Badge as SeedBadge, Icon } from "@seed-design/react";
import * as React from "react";

export interface BadgeActionProps
  extends Omit<SeedBadge.ActionProps, "aria-label" | "asChild" | "children"> {
  "aria-label": string;
  render?: (trigger: React.ReactElement) => React.ReactNode;
}

export type BadgeProps = Omit<SeedBadge.RootProps, "asChild" | "children" | "prefix"> & {
  children: React.ReactNode;
  prefix?: React.ReactNode;
  actionProps?: BadgeActionProps;
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, prefix, actionProps, ...props }, ref) => {
    let actionElement: React.ReactElement | null = null;
    let renderAction: BadgeActionProps["render"];

    if (actionProps) {
      const { render, ...seedActionProps } = actionProps;
      renderAction = render;
      actionElement = (
        <SeedBadge.Action {...seedActionProps}>
          <Icon size="full" svg={<IconILowercaseSerifCircleLine />} />
        </SeedBadge.Action>
      );
    }

    return (
      <SeedBadge.Root ref={ref} {...props}>
        {prefix != null ? (
          <SeedBadge.Prefix>
            <Icon size="full" svg={prefix} />
          </SeedBadge.Prefix>
        ) : null}
        <SeedBadge.Label>{children}</SeedBadge.Label>
        {actionElement ? (renderAction ? renderAction(actionElement) : actionElement) : null}
      </SeedBadge.Root>
    );
  },
);
Badge.displayName = "Badge";

/**
 * This file is a snippet from SEED Design, helping you get started quickly with @seed-design/* packages.
 * You can extend this snippet however you want.
 */
