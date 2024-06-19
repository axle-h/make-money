import {NewStatement, NewTransaction, Schema} from "@/app/api/schema";
import {parse as parseOfx} from "ofx-js";
import {deserializeQif, QifType} from 'qif-ts'
import {compareDesc} from 'date-fns'
import {UTCDate} from '@date-fns/utc'
import {parseUtcDate} from "@/components/dates";

export interface ParsedStatement extends Omit<NewStatement, 'accountId'> {
    sortCode?: string
    accountNumber?: string
}

type PartialParsedStatement = Partial<Omit<ParsedStatement, 'transactions'>> & Pick<ParsedStatement, 'transactions'>

export const UNKNOWN = 'UNKNOWN'

export async function parseStatementFile(file: File): Promise<ParsedStatement> {
    const match = file.name.match(/.+(\..+)$/)
    if (!match) {
        throw new Error('unknown file type')
    }

    let partial: PartialParsedStatement
    switch (match[1]) {
        case '.ofx':
            partial = await parseOfxFile(await file.text())
            break
        case '.qif':
            partial = await parseQifFile(await file.text())
            break
        default:
            throw new Error('unknown file type')
    }

    const transactions = partial.transactions
        .sort((a, b) => compareDesc(a.date, b.date))

    if (transactions.length === 0) {
        throw new Error('no transactions in statement')
    }

    for (let transaction of transactions) {
        const validation = Schema.NewTransaction.safeParse(transaction)
        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors
            throw new Error(`transaction invalid ${JSON.stringify(errors)} ${JSON.stringify(transaction, undefined, 2)}`)
        }
    }

    return {
        dateUploaded: new UTCDate(),
        transactions: transactions,
        startDate: partial.startDate || transactions[transactions.length - 1].date,
        endDate: partial.endDate || transactions[0].date,
        sortCode: partial.sortCode,
        accountNumber: partial.accountNumber
    }
}

async function parseQifFile(text: string): Promise<PartialParsedStatement> {
    const qif = deserializeQif(text)

    const isCreditCard = qif.type === QifType.Card

    const transactions: NewTransaction[] = (await Promise.all(
        qif.transactions.map(async t => {
            const { date, amount, payee, address, reference } = t
            if (!date || amount === undefined || !payee) {
                throw new Error(`cannot parse qif transaction ${JSON.stringify(t, undefined, 2)}`)
            }

            let type: string
            let name = payee
                .replace(/\s+ON\s+\d{2}[-\/]\d{2}[-\/]\d{4}[,\s]+-?\d+(?:\.\d+)?(?:GBP)?\s*$/i, '')
                .replace(/&amp;/, '&')
                .trim()
            let description = address
                ?.map(a => a.trim())
                .filter(a => !!a)
                .join(' ') || UNKNOWN

            const cardPaymentMatch = name.match(/^CARD\s+PAYMENT\s+TO\s+(.+)/i)
            const xferPaymentMatch = name.match(/^BILL\s+PAYMENT\s+VIA\s+FASTER\s+PAYMENT\s+TO\s+([^,]+)\s+REFERENCE\s+([^,]+)[,\s]+MANDATE/i)
            const xferReceiptMatch = name.match(/FASTER\s+PAYMENTS\s+RECEIPT\s+REF\.(.+)\s+FROM\s+([^,]+)/i)
            const ddMatch = name.match(/DIRECT\s+DEBIT\s+PAYMENT\s+TO\s+(.+)\s+REF\s+([^,]+)[\s,]+MANDATE\s+NO\s+([^,]+)/i)
            const cashMatch = name.match(/CASH\s+WITHDRAWAL\s+AT\s+(.+)\s+ATM\s+([^,]+)[,\s]+([^,]+)/i)
            const giroCreditMatch = name.match(/BANK\s+GIRO\s+CREDIT\s+REF\s+([^,]+), ([^,]+)/i)

            if (cardPaymentMatch) {
                name = cardPaymentMatch[1].trim()
                type = 'OTHER'
            } else if (xferPaymentMatch) {
                name = xferPaymentMatch[1].trim()
                description = xferPaymentMatch[2].trim()
                type = 'XFER'
            } else if (xferReceiptMatch) {
                name = xferReceiptMatch[2].trim()
                description = xferReceiptMatch[1].trim()
                type = 'OTHER'
            } else if (ddMatch) {
                name = ddMatch[1].trim()
                description = `DD ${ddMatch[2].trim()} ${ddMatch[3].trim()}`
                type = 'OTHER'
            } else if (cashMatch) {
                const at = cashMatch[1].trim()
                const atm = cashMatch[2].trim()
                if (at === atm) {
                    name = `CASH ${at}`
                } else {
                    name = `CASH ${at}, ${atm}`
                }
                description = cashMatch[3].trim()
                type = 'ATM'
            } else if (giroCreditMatch) {
                name = giroCreditMatch[1].trim()
                description = giroCreditMatch[2].trim()
                type = 'OTHER'
            } else {
                type = 'OTHER'
            }

            const partial = {
                date: parseQifDate(date),
                amount: amount.toFixed(2),
                type,
                name,
                description
            }

            if (reference) {
                return {
                    ...partial,
                    externalId: reference
                }
            }
            if (!reference && isCreditCard && (amount || 0) > 0) {
                return {
                    ...partial,
                    externalId: `XFER-${date}-${amount}`,
                    type: 'XFER',
                };
            }

            if (qif.type === QifType.Liability) {
                // Liability statements have no reference, so we need to create one
                return {
                    ...partial,
                    externalId: await sha256(`${partial.date.toISOString()}:${partial.amount}:${partial.type}:${partial.name}:${partial.description}`)
                };
            }

            throw new Error(`cannot parse qif transaction ${JSON.stringify(t, undefined, 2)}`)
        })
    )).sort((a, b) => compareDesc(a.date, b.date))

    return { transactions }
}

async function parseOfxFile(text: string): Promise<PartialParsedStatement> {
    const ofx = await parseOfx(text)
    // const currency = ofx.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.CURDEF
    const {BANKID: sortCode, ACCTID} = ofx.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKACCTFROM
    const accountNumber = ACCTID.startsWith(sortCode) ? ACCTID.substring(sortCode.length) : ACCTID
    const {DTSTART: startDate, DTEND: endDate, STMTTRN} = ofx.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST
    const transactions: NewTransaction[] = STMTTRN.map(t => ({
        externalId: t.FITID,
        type: t.TRNTYPE.trim(),
        date: parseOfxDate(t.DTPOSTED),
        amount: t.TRNAMT,
        name: t.NAME.trim(),
        description: t.MEMO.replace(/\s*\)+$/, '').trim()
    }))

    return {
        sortCode,
        accountNumber: accountNumber.trim(),
        startDate: parseOfxDate(startDate),
        endDate: parseOfxDate(endDate),
        transactions
    }
}

function parseOfxDate(date: string) {
    // e.g. 20240626000000
    return parseUtcDate(date, 'yyyyMMddHHmmss')
}

function parseQifDate(date: string) {
    return parseUtcDate(date, 'dd/LL/yyyy')
}

async function sha256(source: string) {
    const sourceBytes = new TextEncoder().encode(source);
    const digest = await crypto.subtle.digest("SHA-256", sourceBytes);
    const resultBytes = [...new Uint8Array(digest)];
    return resultBytes.map(x => x.toString(16).padStart(2, '0')).join("");
}