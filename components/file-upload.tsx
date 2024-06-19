'use client'

import {
    chakra, Button, ButtonProps,
} from '@chakra-ui/react';
import React, {useRef} from 'react'
import {UploadIcon} from "@/components/icons";

export interface FileUploadProps extends ButtonProps {
    onUpload: (file: File) => void
}

export function FileUpload({ onUpload, ...props }: FileUploadProps) {
    return (<>
        <Button
            as={chakra.label}
            htmlFor="file"
            cursor="pointer"
            {...props}
         />

        <chakra.input
            required
            style={{display: 'none'}}
            type="file"
            id="file"
            name="file"
            onChange={(event) => {
                const file = event.target.files?.item(0)
                if (file) {
                    onUpload(file)
                }

                // reset
                event.target.value = ""
                event.target.type = "text"
                event.target.type = "file"
            }}
        />
    </>)
};