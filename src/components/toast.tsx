'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { toast as sonnerToast } from 'sonner';
import { cn } from '@/lib/utils';
import { CheckCircleFillIcon, WarningIcon } from './icons';

const iconsByType: Record<'success' | 'error', ReactNode> = {
  success: <CheckCircleFillIcon />,
  error: <WarningIcon />,
};

export function toast(props: Omit<ToastProps, 'id'>) {
  return sonnerToast.custom((id) => (
    <Toast id={id} type={props.type} description={props.description} />
  ));
}

function Toast(props: ToastProps) {
  const { id, type, description } = props;

  const descriptionRef = useRef<HTMLDivElement>(null);
  const [multiLine, setMultiLine] = useState(false);

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;

    const update = () => {
      const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight);
      const lines = Math.round(el.scrollHeight / lineHeight);
      setMultiLine(lines > 1);
    };

    update(); // initial check
    const ro = new ResizeObserver(update); // re-check on width changes
    ro.observe(el);

    return () => ro.disconnect();
  }, [description]);

  return (
    <div
      data-testid="toast"
      key={id}
      className={cn(
        'bg-background border shadow-lg p-3 rounded-lg w-full toast-mobile:w-fit flex flex-row gap-3 min-w-[300px] max-w-[356px] mx-auto',
        multiLine ? 'items-start' : 'items-center',
      )}
    >
      <div
        data-type={type}
        className={cn(
          'data-[type=error]:text-red-600 data-[type=success]:text-green-600',
          { 'pt-1': multiLine },
        )}
      >
        {iconsByType[type]}
      </div>
      <div ref={descriptionRef} className="text-foreground text-sm flex-1">
        {description}
      </div>
    </div>
  );
}

interface ToastProps {
  id: string | number;
  type: 'success' | 'error';
  description: string;
}
