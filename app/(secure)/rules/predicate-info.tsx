import { Code, Drawer, Table, Text } from "@chakra-ui/react";
import React from "react";
import { Button } from "@/components/ui/button";

export function PredicateInfoDrawer({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen(open: boolean): void;
}) {
  return (
    <Drawer.Root
      open={open}
      placement="end"
      onOpenChange={(e) => setOpen(e.open)}
      size="md"
    >
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content>
          <Drawer.CloseTrigger />
          <Drawer.Header>Transaction Predicate</Drawer.Header>

          <Drawer.Body>
            <Text mb={3}>
              Transaction predicates use a SQL-like WHERE clause syntax e.g.
            </Text>

            <Code mb={3}>
              name LIKE &apos;LIDL%&apos; AND (amount &lt; 0 OR type ==
              &apos;OTHER&apos;)
            </Code>

            <Text mb={3}>
              Will match all transactions whose name starts with `LIDL` and
              amount is less than 0 or the type is equal to `OTHER`.
            </Text>

            <Text mb={3}>Available operators:</Text>

            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Operator</Table.ColumnHeader>
                  <Table.ColumnHeader>Description</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <Table.Row>
                  <Table.Cell>
                    <Code>==</Code>
                  </Table.Cell>
                  <Table.Cell>Equal to</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>
                    <Code>!=</Code>
                  </Table.Cell>
                  <Table.Cell>Not equal to</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>
                    <Code>&gt;</Code>
                  </Table.Cell>
                  <Table.Cell>Greater than</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>
                    <Code>&gt;=</Code>
                  </Table.Cell>
                  <Table.Cell>Greater than or equal to</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>
                    <Code>&lt;</Code>
                  </Table.Cell>
                  <Table.Cell>Less than</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>
                    <Code>&lt;=</Code>
                  </Table.Cell>
                  <Table.Cell>Less than or equal to</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>
                    <Code>LIKE</Code>
                  </Table.Cell>
                  <Table.Cell>Matches string pattern</Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table.Root>

            <Text mb={3}>Transaction field names:</Text>

            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Field</Table.ColumnHeader>
                  <Table.ColumnHeader>Description</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <Table.Row>
                  <Table.Cell>
                    <Code>externalId</Code>
                  </Table.Cell>
                  <Table.Cell>Bank derived ID for this transaction</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>
                    <Code>type</Code>
                  </Table.Cell>
                  <Table.Cell>Transaction type</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>
                    <Code>name</Code>
                  </Table.Cell>
                  <Table.Cell>Transaction name</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>
                    <Code>description</Code>
                  </Table.Cell>
                  <Table.Cell>Transaction description</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>
                    <Code>amount</Code>
                  </Table.Cell>
                  <Table.Cell>
                    Transaction amount; debits are negative
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table.Root>
          </Drawer.Body>

          <Drawer.Footer>
            <Button
              variant="outline"
              colorPalette="blue"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
}
