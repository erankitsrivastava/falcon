import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Text, Button } from '@deity/falcon-ui';
import { T } from '@deity/falcon-i18n';

export const NoOrders: React.SFC<{}> = () => (
  <Box display="flex" flexDirection="column" alignItems="center" p="sm">
    <Text fontSize="md" mb="xs">
      <T id="orderList.empty" />
    </Text>
    <Button as={RouterLink} to="/">
      <T id="cart.goShoppingButton" />
    </Button>
  </Box>
);
