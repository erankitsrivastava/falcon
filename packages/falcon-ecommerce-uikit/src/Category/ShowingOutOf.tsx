import React from 'react';
import { Text } from '@deity/falcon-ui';
import { T } from '@deity/falcon-i18n';

export const ShowingOutOf: React.SFC<{ itemsCount: number; totalItems: number }> = ({ itemsCount, totalItems }) => (
  <Text>
    <T id="productList.pagination.showingOutOf" {...{ itemsCount, totalItems }} />
  </Text>
);
