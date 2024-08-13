import {categoryTypeName, NewCategory, Schema} from "@/app/api/schema";
import React from "react";
import {Field, Form, Formik} from "formik";
import {
    Button,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Input, Select, SimpleGrid,
    Stack,
    Switch
} from "@chakra-ui/react";
import {FieldProps} from "formik/dist/Field";
import {EmojiPicker} from "@/components/emoji-picker";

export interface NewCategoryFormProps {
    initialValues?: Partial<NewCategory>
    onSubmit(category: NewCategory): Promise<boolean>
}

export const CategoryForm = React.forwardRef(({initialValues, onSubmit}: NewCategoryFormProps, firstField) => {
    const formInitialValues: NewCategory = {
        name: initialValues?.name || '',
        emoji: initialValues?.emoji || '',
        type: initialValues?.type || 'EXPENSE',
        report: initialValues?.report === undefined || initialValues.report,
        subCategory: initialValues?.subCategory === true
    }
    return (
        <Formik
            initialValues={formInitialValues}
            validate={values => {
                const result = Schema.NewCategory.safeParse(values)
                return result.success ? {} : result.error.flatten().fieldErrors
            }}
            onSubmit={async (values, actions) => {
                if (await onSubmit(values)) {
                    actions.setSubmitting(false)
                    actions.resetForm()
                }
            }}
        >
            {(props) => (
                <Form>
                    <Stack spacing={6}>
                        <Field name='name'>
                            {({field, form}: FieldProps<string, NewCategory>) => (
                                <FormControl isInvalid={!!form.errors.name && !!form.touched.name} isRequired>
                                    <FormLabel>Name</FormLabel>
                                    <Input {...field} ref={firstField as any} placeholder="Enter category name"/>
                                    <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                                </FormControl>
                            )}
                        </Field>

                        <Field name='emoji'>
                            {({field, form}: FieldProps<string, NewCategory>) => (
                                <FormControl isInvalid={!!form.errors.emoji && !!form.touched.emoji}>
                                    <FormLabel>Emoji</FormLabel>
                                    <EmojiPicker value={field.value} onChange={e => form.setFieldValue('emoji', e)} />
                                    <FormErrorMessage>{form.errors.emoji}</FormErrorMessage>
                                </FormControl>
                            )}
                        </Field>

                        <Field name='type'>
                            {({field, form}: FieldProps<string, NewCategory>) => (
                                <FormControl isInvalid={!!form.errors.type && !!form.touched.type} isRequired>
                                    <FormLabel>Type</FormLabel>

                                    <Select {...field}>
                                        <option value="EXPENSE">{categoryTypeName('EXPENSE')}</option>
                                        <option value="BILL">{categoryTypeName('BILL')}</option>
                                        <option value="INCOME">{categoryTypeName('INCOME')}</option>
                                        <option value="OTHER">{categoryTypeName('OTHER')}</option>
                                    </Select>

                                    <FormErrorMessage>{form.errors.type}</FormErrorMessage>
                                </FormControl>
                            )}
                        </Field>

                        <FormControl as={SimpleGrid} columns={2}>
                            <FormLabel htmlFor='report'>Include in reports?</FormLabel>
                            <Field name='report'>
                                {({field}: FieldProps<string, NewCategory>) => (
                                    <Switch defaultChecked={formInitialValues.report} {...field} id='report' />
                                )}
                            </Field>

                            <FormLabel htmlFor='subCategory'>Includes sub-category?</FormLabel>
                            <Field name='subCategory'>
                                {({field}: FieldProps<string, NewCategory>) => (
                                    <Switch defaultChecked={formInitialValues.subCategory} {...field} id='subCategory' />
                                )}
                            </Field>
                        </FormControl>

                        <Button
                            mt={4}
                            colorScheme='teal'
                            variant="outline"
                            isLoading={props.isSubmitting}
                            type='submit'
                        >
                            Save
                        </Button>
                    </Stack>
                </Form>
            )}
        </Formik>
    )
})

CategoryForm.displayName = 'CategoryForm'