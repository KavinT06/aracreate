import { cn } from '@/utils/cn.js';

const ScrollArea = ({ className, children }) => {
  return <div className={cn('overflow-y-auto', className)}>{children}</div>;
};

export { ScrollArea };
