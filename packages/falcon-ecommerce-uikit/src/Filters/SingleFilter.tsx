import React from 'react';
import { ThemedComponentProps } from '@deity/falcon-ui';
import { FilterOption } from './FiltersDataProvider';
import { FilterItemLayout, SelectedFilterItem } from './FilterItem';
import { FilterItemList } from './FilterItemList';

export type SingleFilterProps = {
  options: FilterOption[];
  selected?: string;
  onChange: (value?: string) => void;
};
export const SingleFilter: React.SFC<SingleFilterProps & ThemedComponentProps> = ({
  options,
  selected,
  onChange,
  ...rest
}) => {
  const selectedOption = selected !== undefined ? options.find(x => x.value === selected) : undefined;

  return (
    <FilterItemList {...rest as any}>
      {selectedOption && <SelectedFilterItem onClick={() => onChange()}>{selectedOption!.title}</SelectedFilterItem>}
      {!selectedOption &&
        options.map(x => (
          <FilterItemLayout key={x.value} onClick={() => onChange(x.value)}>
            {x.title} ({x.count})
          </FilterItemLayout>
        ))}
    </FilterItemList>
  );
};
