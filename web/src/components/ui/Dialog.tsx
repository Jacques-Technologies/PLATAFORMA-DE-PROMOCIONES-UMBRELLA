import {
  Root,
  Trigger,
  Portal,
  Overlay,
  Content,
  Title,
  Description,
  Close,
} from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Dialog = Root;
export const DialogTrigger = Trigger;
export const DialogClose = Close;

export const DialogContent = forwardRef<
  ElementRef<typeof Content>,
  ComponentPropsWithoutRef<typeof Content> & { hideClose?: boolean }
>(({ className, children, hideClose, ...props }, ref) => (
  <Portal>
    <Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
    <Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-[min(90vw,520px)] -translate-x-1/2 -translate-y-1/2",
        "rounded-[var(--radius-card)] bg-[var(--color-fondo-3)] p-6 shadow-xl border border-[var(--color-gris-4)]",
        "focus:outline-none",
        className,
      )}
      {...props}
    >
      {children}
      {!hideClose && (
        <Close
          aria-label="Cerrar"
          className="absolute right-4 top-4 rounded-md p-1 text-[var(--color-gris-2)] hover:bg-[var(--color-gris)] hover:text-[var(--color-blanco)]"
        >
          <X className="size-4" />
        </Close>
      )}
    </Content>
  </Portal>
));
DialogContent.displayName = "DialogContent";

export function DialogHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mb-4 flex flex-col gap-1", className)}>{children}</div>;
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mt-6 flex justify-end gap-2", className)}>{children}</div>
  );
}

export const DialogTitle = forwardRef<
  ElementRef<typeof Title>,
  ComponentPropsWithoutRef<typeof Title>
>(({ className, ...props }, ref) => (
  <Title
    ref={ref}
    className={cn("text-lg font-semibold text-[var(--color-blanco)]", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = forwardRef<
  ElementRef<typeof Description>,
  ComponentPropsWithoutRef<typeof Description>
>(({ className, ...props }, ref) => (
  <Description
    ref={ref}
    className={cn("text-sm text-[var(--color-texto-soft)]", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";
