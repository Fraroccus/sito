import React, { forwardRef } from 'react';

// Motion props that should not be passed down to the DOM element
const MOTION_PROP_KEYS = new Set([
  'initial',
  'animate',
  'exit',
  'transition',
  'variants',
  'whileInView',
  'whileHover',
  'whileTap',
  'whileFocus',
  'viewport',
  'layout',
  'layoutId',
  'onAnimationComplete',
  'onAnimationStart',
  'custom',
]);

const elementCache = new Map<string, any>();

function createMotionComponent(tag: string) {
  if (elementCache.has(tag)) {
    return elementCache.get(tag);
  }

  const Component = forwardRef<HTMLElement, any>((props, ref) => {
    const domProps: Record<string, any> = {};
    for (const key of Object.keys(props)) {
      if (!MOTION_PROP_KEYS.has(key)) {
        domProps[key] = props[key];
      }
    }
    return React.createElement(tag, { ...domProps, ref });
  });

  Component.displayName = `motion.${tag}`;
  elementCache.set(tag, Component);
  return Component;
}

export const motion: any = new Proxy({}, {
  get(_target, prop: string) {
    if (typeof prop !== 'string') return undefined;
    return createMotionComponent(prop);
  },
});

export const AnimatePresence: React.FC<{
  children?: React.ReactNode;
  mode?: string;
  initial?: boolean;
}> = ({ children }) => {
  return <>{children}</>;
};

export default motion;
