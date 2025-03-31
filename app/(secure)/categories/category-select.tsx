import {NativeSelect} from "@chakra-ui/react";
import React from "react";
import {useCategories} from "@/api-client";
import {Loading} from "@/components/alert";
import {CategoryType, categoryTypeName} from "@/app/api/schema";



export const CategorySelect = React.forwardRef<HTMLSelectElement, NativeSelect.FieldProps>((props, ref) => {
    const {categories, isLoading} = useCategories()
    if (isLoading) {
        return <Loading />
    }

    const categoryOptions = categories
        ?.reduce((grps, { id, name, type }) => {
            const entry = {label: name, value: id}
            if (type in grps) {
                grps[type].push(entry)
            } else {
                grps[type] = [entry]
            }
            return grps
        }, {} as Record<string, { label: string, value: number }[]>) ?? {}

    return (
        <NativeSelect.Root>
            <NativeSelect.Field placeholder="Select category" {...props} ref={ref}>
                {Object.entries(categoryOptions)
                    .sort(([a,], [b,]) => a.localeCompare(b))
                    .map(([grp, cats]) =>
                        (
                            <optgroup key={grp} label={categoryTypeName(grp as CategoryType)}>
                                {cats.map(({value, label}) =>
                                    <option key={value}
                                            value={value}>{label}</option>)}
                            </optgroup>
                        ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
        </NativeSelect.Root>
    )
})

CategorySelect.displayName = 'CategorySelect'