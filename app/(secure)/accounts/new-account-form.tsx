import {accountTypeName, NewAccount, Schema} from "@/app/api/schema";
import React from "react";
import {Field, Form, Formik} from "formik";
import { Button, FormControl, FormErrorMessage, FormLabel, Input, Select, Stack} from "@chakra-ui/react";
import {FieldProps} from "formik/dist/Field";

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
                    <Stack spacing={6}>
                        <Field name='accountType'>
                            {({ field }: FieldProps<string, NewAccount>) => (
                                <FormControl isRequired>
                                    <FormLabel>Account type</FormLabel>
                                    <Select {...field} ref={firstField as any} onChange={async event => {
                                        field.onChange(event)
                                        if (event.target.value !== 'CURRENT_ACCOUNT') {
                                            await form.setFieldValue('sortCode', '')
                                        }
                                    }}>
                                        <option value="CURRENT_ACCOUNT">{accountTypeName('CURRENT_ACCOUNT')}</option>
                                        <option value="CREDIT_CARD">{accountTypeName('CREDIT_CARD')}</option>
                                    </Select>
                                </FormControl>
                            )}
                        </Field>

                        <Field name='bankName'>
                            {({ field }: FieldProps<string, NewAccount>) => (
                                <FormControl isInvalid={!!form.errors.bankName && form.touched.bankName} isRequired>
                                    <FormLabel>Bank name</FormLabel>
                                    <Input {...field} placeholder="Enter bank name e.g. HSBC" />
                                    <FormErrorMessage>{form.errors.bankName}</FormErrorMessage>
                                </FormControl>
                            )}
                        </Field>

                        {
                            form.values.accountType === 'CURRENT_ACCOUNT' ?
                                (
                                    <Field name='sortCode'>
                                        {({ field }: FieldProps<string, NewAccount>) => (
                                            <FormControl isInvalid={!!form.errors.sortCode && form.touched.sortCode} isRequired={form.values.accountType === 'CURRENT_ACCOUNT'}>
                                                <FormLabel>Sort code</FormLabel>
                                                <Input
                                                    {...field}
                                                    disabled={form.values.accountType === 'CREDIT_CARD'}
                                                    placeholder="Enter sort code e.g. 123456"
                                                />
                                                <FormErrorMessage>{form.errors.sortCode}</FormErrorMessage>
                                            </FormControl>
                                        )}
                                    </Field>
                                ) : <></>
                        }

                        <Field name='accountNumber'>
                            {({ field }: FieldProps<string, NewAccount>) => (
                                <FormControl isInvalid={!!form.errors.accountNumber && form.touched.accountNumber} isRequired>
                                    <FormLabel>Account number</FormLabel>
                                    <Input {...field} placeholder="Enter account number e.g. 12345678" />
                                    <FormErrorMessage>{form.errors.accountNumber}</FormErrorMessage>
                                </FormControl>
                            )}
                        </Field>

                        <Button
                            mt={4}
                            colorScheme='teal'
                            variant="outline"
                            isLoading={form.isSubmitting}
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