import {
  CategoryRule,
  Schema,
  Transaction,
  UpdateTransactionRequest,
} from "@/app/api/schema";
import { Field as FormikField, FieldArray, Form, Formik } from "formik";
import {
  Box,
  ButtonGroup,
  Flex,
  Field,
  IconButton,
  Input,
  List,
  Menu,
  NumberInput,
  Stack,
} from "@chakra-ui/react";
import React from "react";
import { FieldProps } from "formik/dist/Field";
import { FormikHelpers } from "formik/dist/types";
import {
  CodeIcon,
  MoreVerticalIcon,
  AddIcon,
  CheckIcon,
  CloseIcon,
  PlusSquareIcon,
} from "@/components/icons";
import { CategorySelect } from "../categories/category-select";
import { Button } from "@/components/ui/button";

export interface TransactionApproveFormProps {
  transaction: Transaction;
  onSubmit(values: UpdateTransactionRequest): Promise<boolean>;
  onBuildRule(): void;
  onCreateNewCategory(): void;
  ruleMatch?: Pick<CategoryRule, "name" | "categoryId">;
}

export const TransactionApproveForm = React.forwardRef(
  (
    {
      transaction,
      onSubmit,
      ruleMatch,
      onBuildRule,
      onCreateNewCategory,
    }: TransactionApproveFormProps,
    firstField,
  ) => {
    return (
      <Formik
        enableReinitialize
        initialValues={
          {
            notes: transaction.notes || (ruleMatch?.name ?? ""),
            categories:
              transaction.categories.length === 0
                ? [
                    {
                      id: ruleMatch?.categoryId || 0,
                      fraction: 1,
                    },
                  ]
                : transaction.categories,
          } as UpdateTransactionRequest
        }
        validate={(values) => {
          const result = Schema.UpdateTransactionRequest.safeParse(values);
          const errors = result.success
            ? {}
            : result.error.flatten().fieldErrors;
          if (values.categories.length === 0) {
            errors.categories = ["Must have at least one category"];
          }
          return errors;
        }}
        onSubmit={async (values, actions) => {
          const request = { ...values };
          if (!request.notes?.trim()) {
            delete request.notes;
          }
          if (await onSubmit(request)) {
            actions.setSubmitting(false);
            actions.resetForm();
          }
        }}
      >
        {({ values, errors, touched, setFieldValue, isSubmitting }) => (
          <Form>
            <FormikField name="notes">
              {({ field }: FieldProps<string, UpdateTransactionRequest>) => (
                <Field.Root invalid={!!errors.notes && touched.notes} mb={2}>
                  <Input {...field} placeholder="Enter notes..." />
                  <Field.ErrorText>{errors.notes}</Field.ErrorText>
                </Field.Root>
              )}
            </FormikField>

            <FieldArray
              name="categories"
              render={(arrayHelpers) => (
                <>
                  <Stack gap={2} mb={4}>
                    {values.categories.map((category, index) => (
                      <Field.Root
                        key={index}
                        invalid={!!errors.categories && !!touched.categories}
                      >
                        <Flex w="100%">
                          <Box flex={1} mr={1}>
                            <FormikField name={`categories[${index}].id`}>
                              {({
                                field,
                              }: FieldProps<
                                string,
                                UpdateTransactionRequest
                              >) => (
                                <CategorySelect
                                  {...field}
                                  ref={
                                    index === 0
                                      ? (firstField as any)
                                      : undefined
                                  }
                                  onChange={(event) =>
                                    setFieldValue(
                                      `categories[${index}].id`,
                                      Number(event.target.value) || 0,
                                    )
                                  }
                                />
                              )}
                            </FormikField>
                          </Box>
                          {values.categories.length < 2 ? (
                            <></>
                          ) : (
                            <>
                              <Box flexShrink={1} mr={1}>
                                <FormikField
                                  name={`categories[${index}].fraction`}
                                >
                                  {({
                                    field,
                                  }: FieldProps<
                                    string,
                                    UpdateTransactionRequest
                                  >) => (
                                    <NumberInput.Root
                                      step={0.1}
                                      formatOptions={{
                                        maximumSignificantDigits: 2,
                                      }}
                                      min={0.1}
                                      max={1}
                                      maxW={{ base: 28, lg: "initial" }}
                                      {...field}
                                      onValueChange={(e) =>
                                        setFieldValue(
                                          `categories[${index}].fraction`,
                                          e.valueAsNumber,
                                        )
                                      }
                                    >
                                      <NumberInput.Input />
                                      <NumberInput.Control />
                                    </NumberInput.Root>
                                  )}
                                </FormikField>
                              </Box>
                              <IconButton
                                aria-label="remove category"
                                colorPalette="red"
                                variant="outline"
                                onClick={async () => {
                                  await spreadFraction(
                                    values.categories.length - 1,
                                    setFieldValue,
                                  );
                                  arrayHelpers.remove(index);
                                }}
                                disabled={index === 0}
                              >
                                <CloseIcon />
                              </IconButton>
                            </>
                          )}
                        </Flex>
                        <Field.ErrorText>
                          {errors.categories ? (
                            typeof errors.categories === "string" ? (
                              <Box as="span">{errors.categories}</Box>
                            ) : (
                              <List.Root>
                                {errors.categories.map((e, i) => (
                                  <List.Item key={`error-${i}`}>
                                    {e.toString()}
                                  </List.Item>
                                ))}
                              </List.Root>
                            )
                          ) : (
                            <></>
                          )}
                        </Field.ErrorText>
                      </Field.Root>
                    ))}
                  </Stack>

                  <ButtonGroup>
                    <Menu.Root>
                      <Menu.Trigger asChild>
                        <IconButton variant="ghost">
                          <MoreVerticalIcon />
                        </IconButton>
                      </Menu.Trigger>

                      <Menu.Positioner>
                        <Menu.Content>
                          <Menu.Item
                            value="split-categories"
                            onClick={() => {
                              arrayHelpers.push({ id: 0, fraction: 1 });
                              return spreadFraction(
                                values.categories.length + 1,
                                setFieldValue,
                              );
                            }}
                          >
                            <PlusSquareIcon /> Split categories
                          </Menu.Item>
                          <Menu.Item
                            value="create-new-category"
                            onClick={onCreateNewCategory}
                          >
                            <AddIcon /> Create new category
                          </Menu.Item>
                          <Menu.Item value="create-rule" onClick={onBuildRule}>
                            <CodeIcon /> Create rule
                          </Menu.Item>
                        </Menu.Content>
                      </Menu.Positioner>
                    </Menu.Root>

                    <Button
                      colorPalette="yellow"
                      variant="outline"
                      type="submit"
                      loading={isSubmitting}
                    >
                      <CheckIcon /> Approve
                    </Button>
                  </ButtonGroup>
                </>
              )}
            ></FieldArray>
          </Form>
        )}
      </Formik>
    );
  },
);
TransactionApproveForm.displayName = "TransactionApproveForm";

async function spreadFraction(
  newCount: number,
  setFieldValue: FormikHelpers<UpdateTransactionRequest>["setFieldValue"],
) {
  if (newCount < 1) {
    return;
  }
  const newFraction = 1.0 / newCount;
  for (let i = 0; i < newCount; i++) {
    await setFieldValue(`categories[${i}].fraction`, newFraction);
  }
}
