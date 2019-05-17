import React from 'react';
import { Link } from 'react-router-dom';
import LazyLoad from 'react-lazyload';
import { themed, Image, Text } from '@deity/falcon-ui';
import { Price } from '../Locale';

export const ProductCardLayout = themed({
  tag: Link,
  defaultTheme: {
    card: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: 'secondaryText',

      css: {
        height: '100%',
        textDecoration: 'none',
        overflow: 'hidden',
        cursor: 'pointer'
      }
    }
  }
});

export type ProductCardProps = {
  product: any;
};
export const ProductCard: React.SFC<ProductCardProps> = ({ product }) => (
  <ProductCardLayout to={product.urlPath}>
    <LazyLoad height="100%" offset={150}>
      <Image css={{ flex: '1 1 100%', minHeight: '0%' }} src={product.thumbnail} alt={product.name} />
    </LazyLoad>
    <Text py="xs" ellipsis>
      {product.name}
    </Text>
    <Price fontSize="md" value={product.price} />
  </ProductCardLayout>
);
