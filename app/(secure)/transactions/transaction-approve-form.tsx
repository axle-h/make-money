
import {
    CategoryRule,
    Schema,
    Transaction,
    UpdateTransactionRequest
} from "@/app/api/schema";
import {Field, FieldArray, Form, Formik} from "formik";
import {
    Box,
    Button,
    ButtonGroup,
    Flex,
    FormControl,
    FormErrorMessage,
    IconButton, Input, List, ListItem, Menu, MenuButton, MenuItem, MenuList,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Stack
} from "@chakra-ui/react";
import {AddIcon, CheckIcon, CloseIcon, PlusSquareIcon} from "@chakra-ui/icons";
import React from "react";
import {FieldProps} from "formik/dist/Field";
import {FormikHelpers} from "formik/dist/types";
import {CodeIcon, MoreVerticalIcon} from "@/components/icons";
import {CategorySelect} from "../categories/category-select";

export interface TransactionApproveFormProps {
    transaction: Transaction
    onSubmit(values: UpdateTransactionRequest): Promise<boolean>
    onBuildRule(): void
    onCreateNewCategory(): void
    ruleMatch?: Pick<CategoryRule, 'name' | 'categoryId'>
}


export const TransactionApproveForm = React.forwardRef(({
    transaction,
    onSubmit,
    ruleMatch,
    onBuildRule,
    onCreateNewCategory
}: TransactionApproveFormProps, firstField) => {
    return (
        <Formik
            enableReinitialize
            initialValues={{
                notes: transaction.notes || (ruleMatch?.name ?? ''),
                categories: transaction.categories.length === 0 ? [{
                    id: ruleMatch?.categoryId || 0,
                    fraction: 1,
                }] : transaction.categories
            } as UpdateTransactionRequest}
            validate={values => {
                const result = Schema.UpdateTransactionRequest.safeParse(values)
                const errors = result.success ? {} : result.error.flatten().fieldErrors
                if (values.categories.length === 0) {
                    errors.categories = ['Must have at least one category']
                }
                return errors
            }}
            onSubmit={async (values, actions) => {
                const request = { ...values }
                if (!request.notes?.trim()) {
                    delete request.notes
                }
                if (await onSubmit(request)) {
                    actions.setSubmitting(false)
                    actions.resetForm()
                }
            }}
        >
            {({values, errors, touched, setFieldValue, isSubmitting}) => (
                <Form>
                    <Field name='notes'>
                        {({ field }: FieldProps<string, UpdateTransactionRequest>) => (
                            <FormControl isInvalid={!!errors.notes && touched.notes} mb={2}>
                                <Input {...field} placeholder="Enter notes..." />
                                <FormErrorMessage>{errors.notes}</FormErrorMessage>
                            </FormControl>
                        )}
                    </Field>

                    <FieldArray
                        name='categories'
                        render={arrayHelpers => (
                            <>
                                <Stack spacing={2} mb={4}>
                                    {values.categories.map((category, index) => (
                                        <FormControl key={index}
                                                     isInvalid={!!errors.categories && !!touched.categories}>
                                            <Flex>
                                                <Box flex={1} mr={1}>
                                                    <Field name={`categories[${index}].id`}>
                                                        {({ field }: FieldProps<string, UpdateTransactionRequest>) => (
                                                            <CategorySelect
                                                                {...field}
                                                                ref={index === 0 ? firstField as any : undefined}
                                                                isRequired
                                                                onChange={event => setFieldValue(`categories[${index}].id`, Number(event.target.value) || 0)}
                                                            />
                                                        )}
                                                    </Field>

                                                </Box>
                                                {values.categories.length < 2 ? <></> : (
                                                    <>
                                                        <Box flexShrink={1} mr={1}>

                                                            <Field name={`categories[${index}].fraction`}>
                                                                {({ field }: FieldProps<string, UpdateTransactionRequest>) => (
                                                                    <NumberInput
                                                                        precision={2} step={0.1}
                                                                        min={0.1} max={1}
                                                                        maxW={{ base: 28, lg: 'initial' }}
                                                                        {...field}
                                                                        onChange={(_, value) => setFieldValue(`categories[${index}].fraction`, value)}
                                                                    >
                                                                        <NumberInputField  />
                                                                        <NumberInputStepper>
                                                                            <NumberIncrementStepper/>
                                                                            <NumberDecrementStepper/>
                                                                        </NumberInputStepper>
                                                                    </NumberInput>
                                                                )}
                                                            </Field>
                                                        </Box>
                                                        <IconButton
                                                            aria-label="remove category"
                                                            icon={<CloseIcon/>}
                                                            colorScheme="red"
                                                            variant="outline"
                                                            onClick={async () => {
                                                                await spreadFraction(values.categories.length - 1, setFieldValue)
                                                                arrayHelpers.remove(index)
                                                            }}
                                                            isDisabled={index === 0}
                                                        />
                                                    </>
                                                )}
                                            </Flex>
                                            <FormErrorMessage>
                                                {errors.categories
                                                    ? typeof errors.categories === 'string'
                                                        ? <Box as="span">{errors.categories}</Box>
                                                        : (
                                                            <List>
                                                                {errors.categories.map((e, i) => <ListItem key={`error-${i}`}>{e.toString()}</ListItem>)}
                                                            </List>
                                                        )
                                                    : <></>
                                                }
                                            </FormErrorMessage>
                                        </FormControl>
                                    ))}

                                </Stack>

                                <ButtonGroup>
                                    <Menu isLazy>
                                        <MenuButton as={IconButton} icon={<MoreVerticalIcon/>} aria-label="Options" variant="ghost"/>
                                        <MenuList>
                                            <MenuItem
                                                icon={<PlusSquareIcon />}
                                                onClick={() => {
                                                    arrayHelpers.push({id: 0, fraction: 1})
                                                    return spreadFraction(values.categories.length + 1, setFieldValue)
                                                }}
                                            >
                                                Split categories
                                            </MenuItem>
                                            <MenuItem icon={<AddIcon />} onClick={onCreateNewCategory}>
                                                Create new category
                                            </MenuItem>
                                            <MenuItem icon={<CodeIcon/>} onClick={onBuildRule}>
                                                Create rule
                                            </MenuItem>
                                        </MenuList>
                                    </Menu>

                                    <Button leftIcon={<CheckIcon/>}
                                            colorScheme="yellow"
                                            variant="outline"
                                            type="submit"
                                            isLoading={isSubmitting}>
                                        Approve
                                    </Button>
                                </ButtonGroup>
                            </>
                        )}
                    >
                    </FieldArray>
                </Form>
            )}
        </Formik>
    )
})
TransactionApproveForm.displayName = 'TransactionApproveForm'

async function spreadFraction(newCount: number, setFieldValue: FormikHelpers<UpdateTransactionRequest>['setFieldValue']) {
    if (newCount < 1) {
        return
    }
    const newFraction = 1.0 / newCount
    for (let i = 0; i < newCount; i++) {
        await setFieldValue(`categories[${i}].fraction`, newFraction)
    }
}