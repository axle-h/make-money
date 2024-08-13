import {
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
} from "@chakra-ui/react";
import React from "react";
import {Category, NewCategory} from "@/app/api/schema";
import {CategoryForm} from "./category-form";
import {FocusableElement} from "@chakra-ui/utils";

export interface UpdateCategoryDrawerProps {
    isOpen: boolean
    onClose(): void
    category?: Category
    onSubmit(category: NewCategory): Promise<boolean>,
}

export function CreateOrUpdateCategoryDrawer({isOpen, onClose, category, onSubmit}: UpdateCategoryDrawerProps) {
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
                <DrawerHeader>
                    {!!category ? 'Update' : 'Create'} Category
                </DrawerHeader>

                <DrawerBody>
                    <CategoryForm
                        onSubmit={async values => {
                            const result = await onSubmit(values)
                            if (result) {
                                onClose()
                            }
                            return result
                        }}
                        initialValues={{
                            ...category,
                            emoji: category?.emoji || undefined
                        }}
                        ref={firstField}
                    />
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    )
}