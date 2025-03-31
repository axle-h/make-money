import {accountTypeName, NewAccount, Schema} from "@/app/api/schema";
import React from "react";
import {Field as FormikField, Form, Formik} from "formik";
import { Field, Input, NativeSelect, Stack} from "@chakra-ui/react";
import {FieldProps} from "formik/dist/Field";
import {Button} from "@/components/ui/button";

export const NewAccountForm = React.forwardRef(
    ({onSubmit}: { onSubmit(account: NewAccount): Promise<boolean> },
     firstField
) => {
    return (
        <Formik
            initialValues={{bankName: '', sortCode: '', accountNumber: '', accountType: 'CURRENT_ACCOUNT'} as NewAccount}
            validate={values => {
                const result = Schema.NewAccount.safeParse({ ...values, sortCode: values.sortCode || undefined })
                return result.success ? {} : result.error.flatten().fieldErrors
            }}
            onSubmit={async ({ sortCode, ...values }, actions) => {
                if (await onSubmit({ ...values, sortCode: sortCode || undefined })) {
                    actions.setSubmitting(false)
                    actions.resetForm()
                }
            }}
        >
            {(form) => (
                <Form>
                    <Stack gap={6}>
                        <FormikField name='accountType'>
                            {({ field }: FieldProps<string, NewAccount>) => (
                                <Field.Root required>
                                    <Field.Label>Account type</Field.Label>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field {...field} ref={firstField as any} onChange={async event => {
                                            field.onChange(event)
                                            if (event.target.value !== 'CURRENT_ACCOUNT') {
                                                await form.setFieldValue('sortCode', '')
                                            }
                                        }}>
                                            <option value="CURRENT_ACCOUNT">{accountTypeName('CURRENT_ACCOUNT')}</option>
                                            <option value="CREDIT_CARD">{accountTypeName('CREDIT_CARD')}</option>
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                </Field.Root>
                            )}
                        </FormikField>

                        <FormikField name='bankName'>
                            {({ field }: FieldProps<string, NewAccount>) => (
                                <Field.Root invalid={!!form.errors.bankName && form.touched.bankName} required>
                                    <Field.Label>Bank name</Field.Label>
                                    <Input {...field} placeholder="Enter bank name e.g. HSBC" />
                                    <Field.ErrorText>{form.errors.bankName}</Field.ErrorText>
                                </Field.Root>
                            )}
                        </FormikField>

                        {
                            form.values.accountType === 'CURRENT_ACCOUNT' ?
                                (
                                    <FormikField name='sortCode'>
                                        {({ field }: FieldProps<string, NewAccount>) => (
                                            <Field.Root invalid={!!form.errors.sortCode && form.touched.sortCode} required={form.values.accountType === 'CURRENT_ACCOUNT'}>
                                                <Field.Label>Sort code</Field.Label>
                                                <Input
                                                    {...field}
                                                    disabled={form.values.accountType === 'CREDIT_CARD'}
                                                    placeholder="Enter sort code e.g. 123456"
                                                />
                                                <Field.ErrorText>{form.errors.sortCode}</Field.ErrorText>
                                            </Field.Root>
                                        )}
                                    </FormikField>
                                ) : <></>
                        }

                        <FormikField name='accountNumber'>
                            {({ field }: FieldProps<string, NewAccount>) => (
                                <Field.Root invalid={!!form.errors.accountNumber && form.touched.accountNumber} required>
                                    <Field.Label>Account number</Field.Label>
                                    <Input {...field} placeholder="Enter account number e.g. 12345678" />
                                    <Field.ErrorText>{form.errors.accountNumber}</Field.ErrorText>
                                </Field.Root>
                            )}
                        </FormikField>

                        <Button
                            mt={4}
                            colorPalette='teal'
                            variant="outline"
                            loading={form.isSubmitting}
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
NewAccountForm.displayName = 'NewAccountForm'