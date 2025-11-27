declare module "@radix-ui/react-alert-dialog" {
  import * as React from "react";

  export interface AlertDialogPortalProps extends React.PropsWithChildren {
    forceMount?: boolean;
  }

  // 느슨한 타입 선언으로 props(open, onOpenChange 등)를 허용
  export const Root: React.ComponentType<any>;
  export const Trigger: React.ComponentType<React.ComponentPropsWithoutRef<"button">>;
  export const Portal: React.ComponentType<AlertDialogPortalProps>;
  export const Overlay: React.ComponentType<React.ComponentPropsWithoutRef<"div">>;
  export const Content: React.ComponentType<React.ComponentPropsWithoutRef<"div">>;
  export const Title: React.ComponentType<React.ComponentPropsWithoutRef<"h2">>;
  export const Description: React.ComponentType<React.ComponentPropsWithoutRef<"p">>;
  export const Action: React.ComponentType<React.ComponentPropsWithoutRef<"button">>;
  export const Cancel: React.ComponentType<React.ComponentPropsWithoutRef<"button">>;
}
