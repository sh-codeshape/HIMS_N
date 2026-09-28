import React from 'react';
import * as LuIcons from 'react-icons/lu';

export default function Icon({ name, size, className, style }) {
  const IconComponent = LuIcons[name];
  if (!IconComponent) return null;
  return <IconComponent size={size} className={className} style={style} />;
}
