import React from 'react';
import { themed } from '../theme';
import { Icon } from './Icon';

type CheckboxInnerDOMProps = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  invalid: boolean;
  icon: JSX.Element;
};
const CheckboxInnerDOM = (props: CheckboxInnerDOMProps) => {
  const { className, icon, invalid, ...rest } = props;

  return (
    <div className={className}>
      <input {...rest} type="checkbox" />
      <div aria-hidden className="-inner-checkbox-frame">
        {icon}
      </div>
    </div>
  );
};

export const Checkbox = themed({
  tag: CheckboxInnerDOM,

  defaultProps: {
    invalid: false,
    icon: (
      <Icon
        src="checkboxCheckmarkIcon"
        className="-inner-checkbox-icon"
        fallback={
          <svg
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="-inner-checkbox-icon"
            fill="none"
            focusable="false"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        }
      />
    )
  },

  defaultTheme: {
    checkbox: {
      size: 'md',

      css: ({ invalid, theme }) => ({
        display: 'inline-flex',
        position: 'relative',
        // checkbox input is not visible but interactive
        input: {
          position: 'absolute',
          top: 0,
          left: 0,
          margin: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          zIndex: 1,
          ':checked + .-inner-checkbox-frame': {
            background: theme.colors.primary,
            borderColor: theme.colors.primary,
            '.-inner-checkbox-icon': {
              opacity: 1
            }
          },

          ':hover + .-inner-checkbox-frame': {
            borderColor: invalid ? theme.colors.error : theme.colors.primaryLight
          },

          ':checked:hover + .-inner-checkbox-frame': {
            background: theme.colors.primaryLight
          }
        },

        '.-inner-checkbox-icon': {
          height: '100%',
          width: '100%',
          stroke: theme.colors.white,
          opacity: 0,
          transitionProperty: 'opacity',
          transitionTimingFunction: theme.easingFunctions.easeIn,
          transitionDuration: theme.transitionDurations.short
        },

        '.-inner-checkbox-frame': {
          height: '100%',
          width: '100%',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          borderRadius: theme.borderRadius.small,
          border: theme.borders.bold,
          borderColor: invalid ? theme.colors.error : theme.colors.secondaryDark,
          transitionProperty: 'border, background',
          transitionTimingFunction: theme.easingFunctions.easeIn,
          transitionDuration: theme.transitionDurations.short
        }
      })
    }
  }
});
