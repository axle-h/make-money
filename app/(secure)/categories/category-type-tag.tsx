import { CategoryType, categoryTypeName} from "@/app/api/schema";
import {Tag} from "@chakra-ui/react";
import React from "react";

export interface CategoryTypeTagProps extends Tag.RootProps {
    type: CategoryType
}

export function CategoryTypeTag({ type, ...props }: CategoryTypeTagProps) {
    return (
        <Tag.Root {...props} colorPalette={colorPalette(type)}>
            <Tag.Label>{categoryTypeName(type)}</Tag.Label>
        </Tag.Root>
    )
}

function colorPalette(type: CategoryType) {
    switch (type) {
        case 'BILL':
            return 'orange'
        case 'EXPENSE':
            return 'pink'
        case 'INCOME':
            return 'teal'
        case 'OTHER':
            return 'blue'
        default:
            throw new Error('unknown category type ' + type)
    }
}