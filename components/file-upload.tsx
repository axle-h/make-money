"use client";

import { chakra } from "@chakra-ui/react";
import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";

export interface FileUploadProps extends ButtonProps {
  onUpload: (file: File) => void;
}

export function FileUpload({ onUpload, children, ...props }: FileUploadProps) {
  return (
    <>
      <Button asChild {...props}>
        <chakra.label htmlFor="file" cursor="pointer">
          {children}
        </chakra.label>
      </Button>

      <chakra.input
        required
        style={{ display: "none" }}
        type="file"
        id="file"
        name="file"
        onChange={(event) => {
          const file = event.target.files?.item(0);
          if (file) {
            onUpload(file);
          }

          // reset
          event.target.value = "";
          event.target.type = "text";
          event.target.type = "file";
        }}
      />
    </>
  );
}
