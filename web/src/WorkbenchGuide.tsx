import {
  Children,
  cloneElement,
  isValidElement,
  Fragment,
  type ReactNode,
} from "react";
import { DropdownMenu } from "radix-ui";
import { Button } from "@/components/ui/button";
import AgentGuideDialog from "./AgentDialog.jsx";
import type { AgentConnection } from "./agent-api";
export function ActionMenu({
  children,
  label,
  className,
  trigger,
  disabled,
}: {
  children: ReactNode;
  label: string;
  className?: string;
  trigger?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          data-slot="dropdown-menu-trigger"
          variant="ghost"
          size={className === "more-button" ? "icon" : "default"}
          className={className}
          aria-label={label}
          disabled={disabled}
        >
          {trigger || label}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="workbench-menu"
          data-slot="dropdown-menu-content"
          align="end"
          sideOffset={4}
        >
          {Children.map(children, (child, index) => (
            <Fragment>
              {className === "more-button" && index === 3 && (
                <DropdownMenu.Separator className="workbench-menu-separator" />
              )}
              <DropdownMenu.Item asChild>
                {isValidElement<{ className?: string; "data-slot"?: string }>(
                  child,
                )
                  ? cloneElement(child, {
                      "data-slot": "dropdown-menu-item",
                      className: "workbench-menu-item",
                    })
                  : child}
              </DropdownMenu.Item>
            </Fragment>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
export function AgentDialog({
  connection,
  ...props
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection: AgentConnection | null;
}) {
  return <AgentGuideDialog {...props} connection={connection} />;
}
