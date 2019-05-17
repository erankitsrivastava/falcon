import React from 'react';
import { Text, Box, Dropdown, DropdownLabel, DropdownMenu, DropdownMenuItem, themed } from '@deity/falcon-ui';
import { T } from '@deity/falcon-i18n';
import { SortOrder } from '../SortOrders/SortOrdersQuery';

export const SortOrderDropdownLayout = themed({
  tag: Box,
  defaultTheme: {
    sortOrderDropdownLayout: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center'
    }
  }
});

export type SortOrderDropdownProps<TItem extends { name: string } = SortOrder> = {
  items: TItem[];
  value: TItem;
  onChange: (value: TItem) => void;
};
export const SortOrderDropdown: React.SFC<SortOrderDropdownProps> = ({ items, value, onChange }) => (
  <SortOrderDropdownLayout>
    <Text mr="sm">
      <T id="productList.sort.title" />
    </Text>
    <Box display="flex">
      <Dropdown css={{ width: '100%', minWidth: 200 }} onChange={onChange}>
        <DropdownLabel>{value.name}</DropdownLabel>
        <DropdownMenu>
          {items.map((x: any) => (
            <DropdownMenuItem key={x.name} value={x}>
              {x.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    </Box>
  </SortOrderDropdownLayout>
);
