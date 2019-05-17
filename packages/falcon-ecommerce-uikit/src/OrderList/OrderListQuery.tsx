import gql from 'graphql-tag';
import { PaginationQuery, Pagination } from './../types';
import { Query, FetchMore } from './../Query';
import { Order } from './../Order';

export const GET_ORDER_LIST = gql`
  query Orders($pagination: PaginationInput) {
    orders(pagination: $pagination) {
      items {
        entityId
        incrementId
        createdAt
        customerFirstname
        customerLastname
        status
        grandTotal
        orderCurrencyCode
      }
      pagination {
        currentPage
        totalItems
        nextPage
      }
    }
  }
`;

export type OrdersData = {
  orders: {
    items: Order[];
    pagination: Pagination;
  };
};

const fetchMore: FetchMore<OrdersData, PaginationQuery> = (data, apolloFetchMore) =>
  apolloFetchMore({
    variables: { pagination: { ...data.orders.pagination, page: data.orders.pagination.nextPage } },
    updateQuery: (prev, { fetchMoreResult }) => {
      if (!fetchMoreResult) {
        return prev;
      }

      return {
        ...prev,
        ...{
          orders: {
            ...prev.orders,
            items: [...prev.orders.items, ...fetchMoreResult.orders.items],
            pagination: { ...fetchMoreResult.orders.pagination }
          }
        }
      };
    }
  });

export class OrderListQuery extends Query<OrdersData, PaginationQuery> {
  static defaultProps = {
    query: GET_ORDER_LIST,
    fetchMore,
    notifyOnNetworkStatusChange: true
  };
}
