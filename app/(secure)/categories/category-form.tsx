import {categoryTypeName, NewCategory, Schema} from "@/app/api/schema";
import React from "react";
import {Field as FormikField, Form, Formik} from "formik";
import {
    Field,
    Input,
    NativeSelect,
    SimpleGrid,
    Stack,
    Switch
} from "@chakra-ui/react";
import {FieldProps} from "formik/dist/Field";
import {EmojiPicker} from "@/components/emoji-picker";
import {Button} from "@/components/ui/button";

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
                    <Stack gap={6}>
                        <FormikField name='name'>
                            {({field, form}: FieldProps<string, NewCategory>) => (
                                <Field.Root invalid={!!form.errors.name && !!form.touched.name} required>
                                    <Field.Label>Name</Field.Label>
                                    <Input {...field} ref={firstField as any} placeholder="Enter category name"/>
                                    <Field.ErrorText>{form.errors.name}</Field.ErrorText>
                                </Field.Root>
                            )}
                        </FormikField>

                        <FormikField name='emoji'>
                            {({field, form}: FieldProps<string, NewCategory>) => (
                                <Field.Root invalid={!!form.errors.emoji && !!form.touched.emoji}>
                                    <Field.Label>Emoji</Field.Label>
                                    <EmojiPicker value={field.value} onChange={e => form.setFieldValue('emoji', e)} />
                                    <Field.ErrorText>{form.errors.emoji}</Field.ErrorText>
                                </Field.Root>
                            )}
                        </FormikField>

                        <FormikField name='type'>
                            {({field, form}: FieldProps<string, NewCategory>) => (
                                <Field.Root invalid={!!form.errors.type && !!form.touched.type} required>
                                    <Field.Label>Type</Field.Label>

                                    <NativeSelect.Root>
                                        <NativeSelect.Field {...field}>
                                            <option value="EXPENSE">{categoryTypeName('EXPENSE')}</option>
                                            <option value="BILL">{categoryTypeName('BILL')}</option>
                                            <option value="INCOME">{categoryTypeName('INCOME')}</option>
                                            <option value="OTHER">{categoryTypeName('OTHER')}</option>
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>

                                    <Field.ErrorText>{form.errors.type}</Field.ErrorText>
                                </Field.Root>
                            )}
                        </FormikField>

                        <SimpleGrid columns={2}>
                            <FormikField name='report'>
                                {({field}: FieldProps<string, NewCategory>) => (
                                    <Switch.Root defaultChecked={formInitialValues.report} {...field}>
                                        <Switch.HiddenInput />
                                        <Switch.Control />
                                        <Switch.Label>
                                            Include in reports?
                                        </Switch.Label>
                                    </Switch.Root>
                                )}
                            </FormikField>

                            <FormikField name='subCategory'>
                                {({field}: FieldProps<string, NewCategory>) => (
                                    <Switch.Root defaultChecked={formInitialValues.subCategory} {...field}>
                                        <Switch.HiddenInput />
                                        <Switch.Control />
                                        <Switch.Label>
                                            Includes sub-category?
                                        </Switch.Label>
                                    </Switch.Root>
                                )}
                            </FormikField>
                        </SimpleGrid>

                        <Button
                            mt={4}
                            colorPalette='teal'
                            variant="outline"
                            loading={props.isSubmitting}
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