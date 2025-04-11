import { Drawer } from "@chakra-ui/react";
import React from "react";
import { CategoryRule, NewCategoryRule } from "@/app/api/schema";
import { NewRuleForm } from "./new-rule-form";

export interface UpdateRuleDrawerProps {
  open: boolean;
  setOpen(open: boolean): void;
  rule: CategoryRule;
  onSubmit(values: NewCategoryRule): Promise<boolean>;
}

export function UpdateRuleDrawer({
  open,
  setOpen,
  rule,
  onSubmit,
}: UpdateRuleDrawerProps) {
  const firstField = React.useRef<HTMLInputElement>(null);
  return (
    <Drawer.Root
      lazyMount
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      placement="end"
      size="md"
      initialFocusEl={() => firstField.current}
    >
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content>
          <Drawer.CloseTrigger />
          <Drawer.Header>Update Rule</Drawer.Header>

          <Drawer.Body>
            <NewRuleForm
              onSubmit={async (values) => {
                const result = await onSubmit(values);
                if (result) {
                  setOpen(false);
                }
                return result;
              }}
              initialValues={{
                name: rule.name,
                predicate: rule.predicate,
                categoryId: rule.categoryId,
              }}
              ref={firstField}
            />
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
}
