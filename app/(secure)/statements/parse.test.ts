import { parseStatementFile } from '@/app/(secure)/statements/parse'

function ofxFile(transactions: string, name = 'statement.ofx') {
  return new File(
    [
      `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>0
<STATUS><CODE>0<SEVERITY>INFO</STATUS>
<STMTRS>
<CURDEF>GBP
<BANKACCTFROM>
<BANKID>112233
<ACCTID>11223312345678
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20240601000000
<DTEND>20240630000000
${transactions}
</BANKTRANLIST>
<LEDGERBAL><BALAMT>100.00<DTASOF>20240630000000</LEDGERBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`,
    ],
    name
  )
}

const TRANSACTION_ONE = `<STMTTRN>
<TRNTYPE>OTHER
<DTPOSTED>20240619000000
<TRNAMT>-4.95
<FITID>2024061932024171155923180040000
<NAME>CO-OP GROUP FOOD
<MEMO>Leicester )))
</STMTTRN>`

const TRANSACTION_TWO = `<STMTTRN>
<TRNTYPE>XFER
<DTPOSTED>20240620000000
<TRNAMT>500.00
<FITID>2024062032024171155923180040001
<NAME>SALARY
<MEMO>ACME LTD
</STMTTRN>`

describe('parseStatementFile', () => {
  describe('ofx', () => {
    it('parses account details', async () => {
      const statement = await parseStatementFile(ofxFile(TRANSACTION_ONE))

      expect(statement.sortCode).toEqual('112233')
      // the account number is prefixed with the sort code in ACCTID
      expect(statement.accountNumber).toEqual('12345678')
    })

    it('parses multiple transactions', async () => {
      const statement = await parseStatementFile(
        ofxFile(`${TRANSACTION_ONE}\n${TRANSACTION_TWO}`)
      )

      expect(statement.transactions).toHaveLength(2)
      // sorted most recent first
      expect(statement.transactions.map((t) => t.externalId)).toEqual([
        '2024062032024171155923180040001',
        '2024061932024171155923180040000',
      ])
    })

    // OFX returns a lone occurrence as an object rather than a single-element
    // array, so this case has to be normalised before mapping over it.
    it('parses a statement with exactly one transaction', async () => {
      const statement = await parseStatementFile(ofxFile(TRANSACTION_ONE))

      expect(statement.transactions).toHaveLength(1)
      expect(statement.transactions[0]).toEqual({
        externalId: '2024061932024171155923180040000',
        type: 'OTHER',
        amount: '-4.95',
        name: 'CO-OP GROUP FOOD',
        // trailing ')' characters are stripped from the memo
        description: 'Leicester',
        date: new Date('2024-06-19T00:00:00.000Z'),
      })
    })

    it('derives the statement date range', async () => {
      const statement = await parseStatementFile(
        ofxFile(`${TRANSACTION_ONE}\n${TRANSACTION_TWO}`)
      )

      expect(statement.startDate).toEqual(new Date('2024-06-01T00:00:00.000Z'))
      expect(statement.endDate).toEqual(new Date('2024-06-30T00:00:00.000Z'))
    })

    it('rejects an unknown file type', async () => {
      await expect(
        parseStatementFile(ofxFile(TRANSACTION_ONE, 'statement.pdf'))
      ).rejects.toThrow('unknown file type')
    })
  })
})
