import { NewCategoryRule, Schema } from '@/app/api/schema'
import { z } from 'zod'
import { Field, IconButton, Input, InputGroup, Stack } from '@chakra-ui/react'
import { Field as FormikField, Form, Formik } from 'formik'
import { FieldProps } from 'formik'
import { InfoIcon } from '@/components/icons'
import { PredicateInfoDrawer } from './predicate-info'
import React, { useState } from 'react'
import { CategorySelect } from '../categories/category-select'
import { Button } from '@/components/ui/button'

export interface NewRuleFormProps {
  onSubmit(rule: NewCategoryRule): Promise<boolean>
  initialValues?: Partial<NewCategoryRule>
}

export const NewRuleForm = React.forwardRef<HTMLInputElement, NewRuleFormProps>(
  ({ onSubmit, initialValues }, firstField) => {
    const [predicateInfoOpen, setPredicateInfoOpen] = useState(false)

    return (
      <>
        <Formik
          initialValues={
            {
              name: initialValues?.name || '',
              predicate: initialValues?.predicate || '',
              categoryId: initialValues?.categoryId || 0,
            } as NewCategoryRule
          }
          validate={(values) => {
            const result = Schema.NewCategoryRule.safeParse(values)
            return result.success
              ? {}
              : z.flattenError(result.error).fieldErrors
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
              <Stack gap={4} mb={4}>
                <FormikField name="name">
                  {({ form, field }: FieldProps<string, NewCategoryRule>) => (
                    <Field.Root
                      invalid={!!form.errors.name && !!form.touched.name}
                      required
                    >
                      <Field.Label>Name</Field.Label>
                      <Input {...field} ref={firstField as any} />
                      <Field.ErrorText>{form.errors.name}</Field.ErrorText>
                    </Field.Root>
                  )}
                </FormikField>

                <FormikField name="predicate">
                  {({ form, field }: FieldProps<string, NewCategoryRule>) => (
                    <Field.Root
                      invalid={
                        !!form.errors.predicate && !!form.touched.predicate
                      }
                      required
                    >
                      <Field.Label>Predicate</Field.Label>
                      <InputGroup
                        endAddon={
                          <IconButton
                            colorPalette="blue"
                            size="sm"
                            aria-label="info"
                            variant="ghost"
                            onClick={() => setPredicateInfoOpen(true)}
                          >
                            <InfoIcon />
                          </IconButton>
                        }
                      >
                        <Input {...field} />
                      </InputGroup>
                      <Field.ErrorText>{form.errors.predicate}</Field.ErrorText>
                    </Field.Root>
                  )}
                </FormikField>

                <FormikField name="categoryId">
                  {({ form, field }: FieldProps<string, NewCategoryRule>) => (
                    <Field.Root
                      invalid={
                        !!form.errors.categoryId && !!form.touched.categoryId
                      }
                      required
                    >
                      <Field.Label>Category</Field.Label>
                      <CategorySelect
                        {...field}
                        onChange={(event) => {
                          const id = Number(event.target.value) || 0
                          return form.setFieldValue('categoryId', id)
                        }}
                      />
                      <Field.ErrorText>
                        {form.errors.categoryId}
                      </Field.ErrorText>
                    </Field.Root>
                  )}
                </FormikField>
              </Stack>

              <Button
                mt={4}
                colorPalette="teal"
                loading={props.isSubmitting}
                variant="outline"
                type="submit"
              >
                Save
              </Button>
            </Form>
          )}
        </Formik>
        <PredicateInfoDrawer
          open={predicateInfoOpen}
          setOpen={setPredicateInfoOpen}
        />
      </>
    )
  }
)

NewRuleForm.displayName = 'NewRuleForm'
