import {NewCategoryRule, Schema} from "@/app/api/schema";
import {
    Button,
    FormControl,
    FormErrorMessage,
    FormLabel,
    IconButton,
    Input,
    InputGroup,
    InputRightElement,
    Stack,
    useDisclosure
} from "@chakra-ui/react";
import {Field, Form, Formik} from "formik";
import {FieldProps} from "formik/dist/Field";
import {InfoIcon} from "@chakra-ui/icons";
import {PredicateInfoDrawer} from "./predicate-info";
import React from "react";
import {CategorySelect} from "../categories/category-select";

export interface NewRuleFormProps {
    onSubmit(rule: NewCategoryRule): Promise<boolean>
    initialValues?: Partial<NewCategoryRule>
}


export const NewRuleForm = React.forwardRef(({onSubmit, initialValues}: NewRuleFormProps, firstField) => {
    const predicateInfoDisclosure = useDisclosure()

    return (
        <>
            <Formik
                initialValues={{
                    name: initialValues?.name || '',
                    predicate: initialValues?.predicate || '',
                    categoryId: initialValues?.categoryId || 0
                } as NewCategoryRule}
                validate={values => {
                    const result = Schema.NewCategoryRule.safeParse(values)
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
                        <Stack spacing={4} mb={4}>
                            <Field name="name">
                                {({form, field}: FieldProps<string, NewCategoryRule>) => (
                                    <FormControl isInvalid={!!form.errors.name && !!form.touched.name} isRequired>
                                        <FormLabel>Name</FormLabel>
                                        <Input {...field} ref={firstField as any} />
                                        <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>

                            <Field name="predicate">
                                {({form, field}: FieldProps<string, NewCategoryRule>) => (
                                    <FormControl isInvalid={!!form.errors.predicate && !!form.touched.predicate} isRequired>
                                        <FormLabel>Predicate</FormLabel>
                                        <InputGroup>
                                            <Input {...field} />
                                            <InputRightElement>
                                                <IconButton
                                                    colorScheme="blue"
                                                    size='sm'
                                                    aria-label="info"
                                                    variant="ghost"
                                                    icon={<InfoIcon/>}
                                                    onClick={predicateInfoDisclosure.onOpen}
                                                />
                                            </InputRightElement>
                                        </InputGroup>
                                        <FormErrorMessage>{form.errors.predicate}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>

                            <Field name="categoryId">
                                {({form, field}: FieldProps<string, NewCategoryRule>) => (
                                    <FormControl isInvalid={!!form.errors.categoryId && !!form.touched.categoryId} isRequired>
                                        <FormLabel>Category</FormLabel>
                                        <CategorySelect
                                            isRequired
                                            {...field}
                                            onChange={event => {
                                                const id = Number(event.target.value) || 0
                                                return form.setFieldValue('categoryId', id)
                                            }}
                                        />
                                        <FormErrorMessage>{form.errors.categoryId}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                        </Stack>

                        <Button
                            mt={4}
                            colorScheme="teal"
                            isLoading={props.isSubmitting}
                            variant="outline"
                            type="submit"
                        >
                            Save
                        </Button>
                    </Form>
                )}
            </Formik>
            <PredicateInfoDrawer {...predicateInfoDisclosure} />
        </>
    )
})

NewRuleForm.displayName = 'NewRuleForm'