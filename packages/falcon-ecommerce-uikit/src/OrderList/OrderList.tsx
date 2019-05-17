import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { T } from '@deity/falcon-i18n';
import { themed, Box, Text, DefaultThemeProps, Link, List, ListItem } from '@deity/falcon-ui';
import { Price, DateFormat } from '../Locale';
import { toGridTemplate } from './../helpers';
import { Order } from '../Order/OrderQuery';

const OrderListItemArea = {
  id: 'id',
  createdAt: 'createdAt',
  shipTo: 'shipTo',
  grandTotal: 'grandTotal',
  status: 'status',
  actions: 'actions'
};

export const OrderList: React.SFC<{ items: Order[] }> = ({ items }) => (
  <OrderListLayout>
    <OrderListHeader />
    <List css={{ listStyle: 'none' }}>
      {items.map(x => (
        <OrderListItem key={x.incrementId} {...x} />
      ))}
    </List>
  </OrderListLayout>
);

export const OrderListLayout = themed({
  tag: Box,
  defaultTheme: {
    orderListLayout: {
      display: 'flex',
      flexDirection: 'column'
    }
  }
});

const orderListItemLayout: DefaultThemeProps = {
  orderListItemLayout: {
    display: 'grid',
    gridGap: {
      sm: 'none',
      md: 'sm'
    },
    py: 'sm',
    borderBottom: 'regular',
    // prettier-ignore
    gridTemplate: {
      xs: toGridTemplate([
        ['1fr'                       ],
        [OrderListItemArea.id        ],
        [OrderListItemArea.createdAt ],
        [OrderListItemArea.shipTo    ],
        [OrderListItemArea.grandTotal],
        [OrderListItemArea.status    ],
        [OrderListItemArea.actions   ]
      ]),
      md: toGridTemplate([
        ['1fr',                '1fr',                       '2fr',                    '1fr',                        '1fr',                    '1fr'                    ],
        [OrderListItemArea.id, OrderListItemArea.createdAt, OrderListItemArea.shipTo, OrderListItemArea.grandTotal, OrderListItemArea.status, OrderListItemArea.actions]
      ])
    }
  }
};

export const OrderListItem: React.SFC<Order> = props => (
  <ListItem defaultTheme={orderListItemLayout}>
    <Box gridArea={OrderListItemArea.id} display="flex" alignContent="flex-start">
      <CellLabel>
        <T id="orderList.idLabel" />
      </CellLabel>
      <Link as={RouterLink} to={`/account/orders/${props.entityId}`}>
        {props.incrementId}
      </Link>
    </Box>
    <Box gridArea={OrderListItemArea.createdAt} display="flex" alignContent="flex-start">
      <CellLabel>
        <T id="orderList.createdAtLabel" />
      </CellLabel>
      <DateFormat value={props.createdAt} display="flex" />
    </Box>
    <Box gridArea={OrderListItemArea.shipTo} display="flex" alignContent="flex-start">
      <CellLabel>
        <T id="orderList.shipToLabel" />
      </CellLabel>
      {`${props.customerFirstname} ${props.customerLastname}`}
    </Box>
    <Box gridArea={OrderListItemArea.grandTotal} display="flex" alignContent="flex-start">
      <CellLabel>
        <T id="orderList.grandTotalLabel" />
      </CellLabel>
      <Price value={props.grandTotal} currency={props.orderCurrencyCode} display="flex" />
    </Box>
    <Box gridArea={OrderListItemArea.status} display="flex" alignContent="flex-start">
      <CellLabel>
        <T id="orderList.statusLabel" />
      </CellLabel>
      <T id="order.status" context={props.status || 'na'} />
    </Box>
    <Box gridArea={OrderListItemArea.actions} display="flex" alignContent="flex-start">
      <Link as={RouterLink} to={`/account/orders/${props.entityId}`}>
        <T id="orderList.viewOrderLink" />
      </Link>
    </Box>
  </ListItem>
);

const CellLabel = themed({
  tag: Text,
  defaultTheme: {
    orderLabel: {
      display: {
        xs: 'inline-flex',
        md: 'none'
      },
      mr: 'xs',
      css: {
        '::after': {
          content: '":"'
        }
      }
    }
  }
});

const orderListHeaderLayout: DefaultThemeProps = {
  orderListHeaderLayout: {
    ...orderListItemLayout.orderListItemLayout,
    fontWeight: 'bold',
    pb: 'xs',
    display: { xs: 'none', sm: 'none', md: 'grid' }
  }
};

export const OrderListHeader = () => (
  <Box defaultTheme={orderListHeaderLayout}>
    <Box gridArea={OrderListItemArea.id}>
      <T id="orderList.idLabel" />
    </Box>
    <Box gridArea={OrderListItemArea.createdAt}>
      <T id="orderList.createdAtLabel" />
    </Box>
    <Box gridArea={OrderListItemArea.shipTo}>
      <T id="orderList.shipToLabel" />
    </Box>
    <Box gridArea={OrderListItemArea.grandTotal}>
      <T id="orderList.grandTotalLabel" />
    </Box>
    <Box gridArea={OrderListItemArea.status}>
      <T id="orderList.statusLabel" />
    </Box>
    <Box gridArea={OrderListItemArea.actions}>
      <T id="orderList.actionsLabel" />
    </Box>
  </Box>
);
