import {Select, SelectProps} from "@chakra-ui/react";
import React, {RefAttributes} from "react";
import {useCategories} from "@/api-client";
import {Loading} from "@/components/alert";
import {CategoryType, categoryTypeName} from "@/app/api/schema";



export const CategorySelect = React.forwardRef((props: SelectProps & RefAttributes<HTMLSelectElement>, ref) => {
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
        <Select placeholder="Select category" {...props} ref={ref}>
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
        </Select>
    )
})

CategorySelect.displayName = 'CategorySelect'