import React from 'react';
import { themed, Box, Text } from '@deity/falcon-ui';
import { T } from '@deity/falcon-i18n';

export const EmptyProductListLayout = themed({
  tag: Box,
  defaultTheme: {
    emptyProductListLayout: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      p: 'sm'
    }
  }
});

export const EmptyProductList: React.SFC<{}> = () => (
  <EmptyProductListLayout>
    <Text fontSize="md" mb="xs">
      <T id="productList.empty" />
    </Text>
  </EmptyProductListLayout>
);
