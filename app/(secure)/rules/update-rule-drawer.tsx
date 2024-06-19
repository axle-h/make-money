import {
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
} from "@chakra-ui/react";
import React from "react";
import { CategoryRule, NewCategoryRule} from "@/app/api/schema";
import {FocusableElement} from "@chakra-ui/utils";
import {NewRuleForm} from "./new-rule-form";

export interface UpdateRuleDrawerProps {
    isOpen: boolean
    onClose(): void
    rule: CategoryRule
    onSubmit(values: NewCategoryRule): Promise<boolean>,
}

export function UpdateRuleDrawer({isOpen, onClose, rule, onSubmit}: UpdateRuleDrawerProps) {
    const firstField = React.useRef<FocusableElement>(null)
    return (
        <Drawer
            isOpen={isOpen}
            placement='right'
            onClose={onClose}
            size="md"
            initialFocusRef={firstField}
        >
            <DrawerOverlay/>
            <DrawerContent>
                <DrawerCloseButton/>
                <DrawerHeader>Update Rule</DrawerHeader>

                <DrawerBody>
                    <NewRuleForm
                        onSubmit={async values => {
                            const result = await onSubmit(values)
                            if (result) {
                                onClose()
                            }
                            return result
                        }}
                        initialValues={{ name: rule.name, predicate: rule.predicate, categoryId: rule.categoryId }}
                        ref={firstField}
                    />
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    )
}