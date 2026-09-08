import React, { forwardRef } from 'react';

export interface ViewProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  testID?: string;
}

/**
 * React Native / Expo View component
 * Standard container component replacing <div>
 */
export const View = forwardRef<HTMLDivElement, ViewProps>(
  ({ className = '', style, children, testID, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-testid={testID}
        className={className}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }
);
View.displayName = 'View';

export interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  testID?: string;
  numberOfLines?: number;
}

/**
 * React Native / Expo Text component
 * Renders as <span> to allow safe nesting and avoid block-level conflicts.
 */
export const Text = forwardRef<HTMLSpanElement, TextProps>(
  ({ className = '', style, children, testID, numberOfLines, ...props }, ref) => {
    const lineClampStyle = numberOfLines
      ? {
          display: '-webkit-box',
          WebkitLineClamp: numberOfLines,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }
      : {};

    return (
      <span
        ref={ref}
        data-testid={testID}
        className={`block ${className}`}
        style={{ ...lineClampStyle, ...style }}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Text.displayName = 'Text';

export interface TouchableOpacityProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onPress?: () => void;
  activeOpacity?: number;
}

export const TouchableOpacity = forwardRef<HTMLButtonElement, TouchableOpacityProps>(
  ({ className = '', style, children, onPress, onClick, activeOpacity, ...props }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onPress || onClick}
        className={`transition-opacity active:opacity-75 ${className}`}
        style={style}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TouchableOpacity.displayName = 'TouchableOpacity';

export const Pressable = TouchableOpacity;

export interface ScrollViewProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  horizontal?: boolean;
}

export const ScrollView = forwardRef<HTMLDivElement, ScrollViewProps>(
  ({ className = '', style, children, horizontal, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`${horizontal ? 'overflow-x-auto flex-row' : 'overflow-y-auto flex-col'} ${className}`}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ScrollView.displayName = 'ScrollView';

export const StyleSheet = {
  create: <T extends Record<string, React.CSSProperties>>(styles: T): T => styles,
};

export const Platform = {
  OS: 'web' as const,
  select: <T,>(obj: { web?: T; ios?: T; android?: T; default?: T }): T =>
    (obj.web !== undefined ? obj.web : obj.default) as T,
};

