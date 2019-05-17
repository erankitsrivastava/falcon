import React from 'react';
import { Box, themed, ThemedComponentProps } from '@deity/falcon-ui';
import { FilterItemLayout, SelectedFilterItem } from './FilterItem';
import { FilterItemList } from './FilterItemList';
import { SingleFilterProps } from './SingleFilter';

export const ColorTile = themed<{ color: string }, any>({
  tag: Box,
  defaultProps: {
    color: 'black'
  },
  defaultTheme: {
    colorTile: {
      size: 'md',
      borderRadius: 'small',
      border: 'bold',
      borderColor: 'secondaryDark',
      css: ({ color }) => ({
        backgroundColor: color
      })
    }
  }
});

export const ColorFilter: React.SFC<SingleFilterProps & ThemedComponentProps> = ({
  options,
  selected,
  onChange,
  ...rest
}) => {
  const selectedOption = selected !== undefined ? options.find(x => x.value === selected) : undefined;

  return (
    <FilterItemList display="flex" flexWrap="wrap" {...rest as any}>
      {selectedOption && (
        <SelectedFilterItem onClick={() => onChange()}>
          <ColorTile size="lg" color={selectedOption!.value} title={selectedOption!.title} />
        </SelectedFilterItem>
      )}
      {!selectedOption &&
        options.map(x => (
          <FilterItemLayout key={x.value} onClick={() => onChange(x.value)}>
            <ColorTile size="lg" color={x!.value} title={x!.title} />
          </FilterItemLayout>
        ))}
    </FilterItemList>
  );
};
