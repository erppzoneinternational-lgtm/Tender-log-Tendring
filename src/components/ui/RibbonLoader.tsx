import React from 'react';

interface RibbonLoaderProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RibbonLoader: React.FC<RibbonLoaderProps> = ({
  label = 'Loading P.ZONE Workspace...',
  size = 'md',
}) => {
  const dimensions =
    size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-20 h-20' : 'w-12 h-12';

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-pzone-teal/20 blur-xl animate-pulse" />
        <img
          src="/brand/Favicon.png"
          alt="P.ZONE Ribbon Symbol"
          className={`${dimensions} object-contain animate-ribbon-spin relative z-10`}
        />
      </div>
      {label && (
        <span className="text-sm font-medium text-muted-foreground tracking-wide">
          {label}
        </span>
      )}
    </div>
  );
};
