import { CategoryType, categoryTypeName} from "@/app/api/schema";
import {Tag, TagProps} from "@chakra-ui/react";
import React from "react";

export interface CategoryTypeTagProps extends TagProps {
    type: CategoryType
}

export function CategoryTypeTag({ type, ...props }: CategoryTypeTagProps) {
    return (
        <Tag {...props} colorScheme={colorScheme(type)}>
            {categoryTypeName(type)}
        </Tag>
    )
}

function colorScheme(type: CategoryType) {
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