'use client'

import {
    FiCode,
    FiCreditCard,
    FiDollarSign,
    FiFilter,
    FiHome,
    FiList,
    FiMoreVertical,
    FiTag,
    FiUpload,
    FiLogIn,
    FiLogOut,
} from "react-icons/fi"
import {RiBankLine} from "react-icons/ri"
import {GrTransaction} from "react-icons/gr";
import {Icon, Text} from "@chakra-ui/react"
import {IconProps} from "@chakra-ui/icons"
import {IconType} from "react-icons"
import {Image, ImageProps} from "@chakra-ui/next-js";
import React from "react";

function toChakraIcon(type: IconType) {
    return function ChakraIcon(props: IconProps) {
        return <Icon as={type} {...props} />
    }
}
export const LoginIcon = toChakraIcon(FiLogIn)
export const LogoutIcon = toChakraIcon(FiLogOut)

export const UploadIcon = toChakraIcon(FiUpload)
export const CreditCardIcon = toChakraIcon(FiCreditCard)
export const HomeIcon = toChakraIcon(FiHome)
export const BankIcon = toChakraIcon(RiBankLine)
export const TransactionIcon = toChakraIcon(GrTransaction)
export const FilterIcon = toChakraIcon(FiFilter)
export const CategoriesIcon = toChakraIcon(FiTag)
export const ListIcon = toChakraIcon(FiList)
export const MoreVerticalIcon = toChakraIcon(FiMoreVertical)
export const CodeIcon = toChakraIcon(FiCode)
export const DollarIcon = toChakraIcon(FiDollarSign)

export function AppIcon(props: Omit<ImageProps, 'src' | 'alt'>) {
    return <Image {...props} src="/assets/icon.png" alt="make-money" width={10} height={10} unoptimized />
}

export function AppName() {
    return <Text ml={1}><b>MAKE</b> Money</Text>
}