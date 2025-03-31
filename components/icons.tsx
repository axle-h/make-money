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
    FiSmile,
    FiArrowLeft,
    FiArrowRight,
    FiExternalLink,
    FiMenu,
    FiSun,
    FiMoon,
    FiTrash2,
    FiEye,
    FiPlus,
    FiMinus,
    FiCheck,
    FiEdit,
    FiInfo,
    FiX,
    FiPlusSquare,
    FiSearch,
    FiChevronUp,
    FiChevronDown
} from "react-icons/fi"
import {RiBankLine} from "react-icons/ri"
import {GrTransaction} from "react-icons/gr";
import {Box, BoxProps, Circle, Float, Icon, IconProps, Text} from "@chakra-ui/react"
import {IconType} from "react-icons"
import NextImage from "next/image"
import React from "react";

function toChakraIcon(IconType: IconType) {
    return function ChakraIcon(props: IconProps) {
        return (
            <Icon {...props}>
                <IconType />
            </Icon>
        )
    }
}
export const LoginIcon = toChakraIcon(FiLogIn)
export const LogoutIcon = toChakraIcon(FiLogOut)

export const MenuIcon = toChakraIcon(FiMenu)
export const SunIcon = toChakraIcon(FiSun)
export const MoonIcon = toChakraIcon(FiMoon)

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
export const EmojiIcon = toChakraIcon(FiSmile)
export const ArrowBackIcon = toChakraIcon(FiArrowLeft)
export const ArrowForwardIcon = toChakraIcon(FiArrowRight)
export const ExternalLinkIcon = toChakraIcon(FiExternalLink)
export const DeleteIcon = toChakraIcon(FiTrash2)
export const ViewIcon = toChakraIcon(FiEye)
export const AddIcon = toChakraIcon(FiPlus)
export const CheckIcon = toChakraIcon(FiCheck)
export const EditIcon = toChakraIcon(FiEdit)
export const MinusIcon = toChakraIcon(FiMinus)
export const InfoIcon = toChakraIcon(FiInfo)
export const CloseIcon = toChakraIcon(FiX)
export const PlusSquareIcon = toChakraIcon(FiPlusSquare)
export const SearchIcon = toChakraIcon(FiSearch)
export const TriangleDownIcon = toChakraIcon(FiChevronDown)
export const TriangleUpIcon = toChakraIcon(FiChevronUp)

export function AppIcon(props: BoxProps) {
    return (
        <Box {...props} asChild>
            <NextImage src="/assets/icon.png" alt="make-money" width={40} height={40} unoptimized />
        </Box>
    )
}

export function AppName() {
    return <Text ml={1}><b>MAKE</b> Money</Text>
}

export function FiltersAppliedBadge() {
    return (
        <Float placement="bottom-end" offsetX="1" offsetY="1">
            <Circle
                bg="green.500"
                size="8px"
                outline="0.2em solid"
                outlineColor="bg"
            />
        </Float>
    )
}