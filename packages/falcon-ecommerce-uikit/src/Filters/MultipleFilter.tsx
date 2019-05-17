import React from 'react';
import { Label, Checkbox } from '@deity/falcon-ui';
import { FilterOption } from './FiltersDataProvider';
import { FilterItemLayout } from './FilterItem';
import { FilterItemList } from './FilterItemList';

export type MultipleFilterProps = {
  options: FilterOption[];
  selected: string[];
  onChange: (value: string[]) => void;
};

export const MultipleFilter: React.SFC<MultipleFilterProps> = ({ options, selected = [], onChange }) => {
  const handleOnChange = (option: FilterOption, isSelected: boolean) => {
    if (isSelected) {
      onChange([...selected, option.value]);
    } else {
      onChange(selected.filter(value => value !== option.value));
    }
  };

  return (
    <FilterItemList>
      {options.map(x => (
        <FilterItemLayout key={x.value}>
          <Checkbox
            id={`${x.title}-${x.value}`}
            checked={selected.some(value => value === x.value)}
            onChange={e => handleOnChange(x, e.target.checked)}
          />
          <Label ml="sm" htmlFor={`${x.title}-${x.value}`}>
            {x.title} ({x.count})
          </Label>
        </FilterItemLayout>
      ))}
    </FilterItemList>
  );
};
