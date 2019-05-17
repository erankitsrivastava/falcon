import React from 'react';
import { List, themed } from '@deity/falcon-ui';

export const FilterItemList = themed({
  tag: List,
  defaultTheme: {
    filterItemList: {
      css: {
        listStyle: 'none'
      }
    }
  }
});
