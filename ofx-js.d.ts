declare module 'ofx-js' {
    export function parse(file: string): Promise<OfxResult>

    export interface OfxResult {
        OFX: Ofx
        header: Record<string, string>
    }

    export interface Ofx {
        BANKMSGSRSV1: {
            STMTTRNRS: {
                STMTRS: {
                    /**
                     * Currency
                     */
                    CURDEF: string
                    BANKACCTFROM: {
                        /**
                         * Sort code
                         */
                        BANKID: string
                        /**
                         * Sort code + account number
                         */
                        ACCTID: string
                    }
                    BANKTRANLIST: {
                        /**
                         * start of statements e.g. 20230619000000
                         */
                        DTSTART: string
                        /**
                         * end of statements e.g. 20240619000000
                         */
                        DTEND: string
                        STMTTRN: OfxTransaction[]
                    }
                }
            }
        }
    }

    export interface OfxTransaction {
        "TRNTYPE": "OTHER" | "ATM" | "XFER"

        /**
         * date of transaction e.g. "20240619000000"
         */
        "DTPOSTED": string

        /**
         * Transaction amount
         * Debit e.g. "-4.95"
         * Credit e.g. "500.00"
         */
        "TRNAMT": string

        /**
         * Transaction ID e.g. "2024061932024171155923180040000"
         */
        "FITID": string

        /**
         * Transaction name e.g. "CO-OP GROUP FOOD"
         */
        "NAME": string

        /**
         * Transaction detail e.g. Leicester )))
         */
        "MEMO": string
    }
}