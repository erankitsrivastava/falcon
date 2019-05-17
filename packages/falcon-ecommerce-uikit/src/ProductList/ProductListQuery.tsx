import gql from 'graphql-tag';
import { Query } from '../Query';

export const GET_PRODUCT_LIST = gql`
  query Products {
    products {
      items {
        id
        name
        price
        thumbnail
        urlPath
      }
    }
  }
`;

export type Products = {
  items: any[];
};

export class ProductListQuery extends Query<Products> {
  static defaultProps = {
    query: GET_PRODUCT_LIST
  };
}
