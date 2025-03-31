import { Drawer } from "@chakra-ui/react";
import React from "react";
import {Category, NewCategory} from "@/app/api/schema";
import {CategoryForm} from "./category-form";

export interface UpdateCategoryDrawerProps {
    open: boolean
    setOpen(value: boolean): void
    category?: Category
    onSubmit(category: NewCategory): Promise<boolean>,
}

export function CreateOrUpdateCategoryDrawer({open, setOpen, category, onSubmit}: UpdateCategoryDrawerProps) {
    const firstField = React.useRef(null)
    return (
        <Drawer.Root
            lazyMount
            open={open}
            placement='end'
            onOpenChange={(e) => setOpen(e.open)}
            size="md"
            initialFocusEl={() => firstField.current}
        >
            <Drawer.Backdrop />
            <Drawer.Positioner>
                <Drawer.Content>
                    <Drawer.CloseTrigger />
                    <Drawer.Header>
                        {!!category ? 'Update' : 'Create'} Category
                    </Drawer.Header>

                    <Drawer.Body>
                        <CategoryForm
                            onSubmit={async values => {
                                const result = await onSubmit(values)
                                if (result) {
                                    setOpen(false)
                                }
                                return result
                            }}
                            initialValues={{
                                ...category,
                                emoji: category?.emoji || undefined
                            }}
                            ref={firstField}
                        />
                    </Drawer.Body>
                </Drawer.Content>
            </Drawer.Positioner>
        </Drawer.Root>
    )
}