export const FOURMEME_PROXY = '0x5c952063c7fc8610ffdb798152d69f0b9550762b';
export const STABLE_AND_BASE_QUOTES = [
  '0x',
  '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  '0x55d398326f99059fF775485246999027B3197955',
  '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  '0x17EAfd08994305D8AcE37EfB82F1523177eC70EE',
  '0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d',
];

const quoteList = STABLE_AND_BASE_QUOTES.map((q) => `"${q}"`).join('\n                      ');

export const NEW_TOKENS_QUERY = `
query SloanNewTokens($limit: Int!) {
  EVM(dataset: realtime, network: bsc) {
    Events(
      where: {
        Transaction: { To: { is: "${FOURMEME_PROXY}" } }
        Log: { Signature: { Name: { is: "TokenCreate" } } }
      }
      limit: { count: $limit }
      orderBy: { descending: Block_Time }
    ) {
      Block {
        Time
        Number
      }
      Arguments {
        Name
        Type
        Value {
          ... on EVM_ABI_Integer_Value_Arg { integer }
          ... on EVM_ABI_Boolean_Value_Arg { bool }
          ... on EVM_ABI_Bytes_Value_Arg { hex }
          ... on EVM_ABI_BigInt_Value_Arg { bigInteger }
          ... on EVM_ABI_Address_Value_Arg { address }
          ... on EVM_ABI_String_Value_Arg { string }
        }
      }
      Transaction {
        Hash
        From
        To
      }
    }
  }
}`;

export const TOP_MARKETCAP_QUERY = `
query SloanTopMarketcap($limit: Int!) {
  EVM(network: bsc, dataset: realtime) {
    DEXTradeByTokens(
      limit: { count: $limit }
      orderBy: { descendingByField: "Marketcap" }
      where: {
        TransactionStatus: { Success: true }
        Trade: {
          Dex: { ProtocolName: { is: "fourmeme_v1" } }
          Side: {
            AmountInUSD: { gt: "20" }
            Currency: { SmartContract: { in: [
                      ${quoteList}
                    ] } }
          }
        }
      }
    ) {
      Trade {
        Currency {
          Name
          Symbol
          SmartContract
        }
        PriceInUSD(maximum: Block_Time)
        Side {
          Currency {
            Name
            Symbol
            SmartContract
          }
        }
      }
      Transaction {
        Hash(maximum: Block_Time)
      }
      Marketcap: calculate(expression: "$Trade_PriceInUSD * 1000000000")
    }
  }
}`;

export const TOP_VOLUME_QUERY = `
query SloanTopVolume($limit: Int!) {
  EVM(network: bsc, dataset: combined) {
    DEXTradeByTokens(
      limit: { count: $limit }
      orderBy: { descendingByField: "buys_1hr" }
      where: {
        Block: { Time: { since_relative: { hours_ago: 24 } } }
        TransactionStatus: { Success: true }
        Trade: {
          Dex: { ProtocolName: { is: "fourmeme_v1" } }
          Side: {
            Currency: { SmartContract: { in: [
                      ${quoteList}
                    ] } }
          }
        }
      }
    ) {
      Trade {
        Currency {
          Name
          Symbol
          SmartContract
        }
        price_24hr: Price(minimum: Block_Time)
        price_1hr: Price(maximum: Block_Time, if: { Block: { Time: { till_relative: { hours_ago: 1 } } } })
        price_5min: Price(maximum: Block_Time, if: { Block: { Time: { till_relative: { minutes_ago: 5 } } } })
        current: Price(maximum: Block_Time)
      }
      buyers_24hr: count(distinct: Transaction_From, if: { Trade: { Side: { Type: { is: buy } } } })
      sellers_24hr: count(distinct: Transaction_From, if: { Trade: { Side: { Type: { is: sell } } } })
      buys_1hr: count(if: { Trade: { Side: { Type: { is: buy } } }, Block: { Time: { till_relative: { hours_ago: 1 } } } })
      buys_24hr: count(if: { Trade: { Side: { Type: { is: buy } } } })
      sells_1hr: count(if: { Trade: { Side: { Type: { is: sell } } }, Block: { Time: { till_relative: { hours_ago: 1 } } } })
      sells_24hr: count(if: { Trade: { Side: { Type: { is: sell } } } })
      volume_1hr: sum(of: Trade_Side_AmountInUSD, if: { Block: { Time: { till_relative: { hours_ago: 1 } } } })
      volume_24hr: sum(of: Trade_Side_AmountInUSD)
      change_24hr: calculate(expression: "( $Trade_current - $Trade_price_24hr ) / $Trade_price_24hr * 100")
      change_1hr: calculate(expression: "( $Trade_current - $Trade_price_1hr ) / $Trade_price_1hr * 100")
      change_5min: calculate(expression: "( $Trade_current - $Trade_price_5min ) / $Trade_price_5min * 100")
    }
  }
}`;

export const TOP_LIQUIDITY_QUERY = `
query SloanTopLiquidity($limit: Int!) {
  EVM(dataset: combined, network: bsc) {
    BalanceUpdates(
      where: {
        BalanceUpdate: { Address: { is: "${FOURMEME_PROXY}" } }
      }
      orderBy: { descendingByField: "balance" }
      limit: { count: $limit }
    ) {
      Currency {
        Name
        Symbol
        SmartContract
      }
      balance: sum(of: BalanceUpdate_Amount, selectWhere: { gt: "800000000", le: "900000000" })
      BalanceUpdate {
        Address
      }
    }
  }
}`;

export const TOKEN_METADATA_QUERY = `
query SloanTokenMetadata($token: String!) {
  EVM(network: bsc) {
    DEXTradeByTokens(where: { Trade: { Currency: { SmartContract: { is: $token } } } }) {
      Block {
        createdAt: Time(minimum: Block_Time)
      }
      volume: sum(of: Trade_Side_AmountInUSD)
    }
    BalanceUpdates(where: { Currency: { SmartContract: { is: $token } } }) {
      holders: uniq(of: BalanceUpdate_Address, selectWhere: { gt: "0" })
    }
  }
  marketCap: Trading {
    Pairs(
      where: {
        Interval: { Time: { Duration: { eq: 1 } } }
        Market: { Network: { is: "Binance Smart Chain" } }
        Volume: { Usd: { gt: 5 } }
        Token: { Address: { is: $token } }
      }
      orderBy: { descending: Interval_Time_Start }
      limit: { count: 1 }
    ) {
      Price {
        Average {
          Mean
        }
      }
      marketcap: calculate(expression: "Price_Average_Mean * 1000000000")
    }
  }
}`;

export const TOKEN_TRADE_METRICS_QUERY = `
query SloanTradeMetrics($currency: String!, $time_24hr_ago: DateTime!, $time_1hr_ago: DateTime!, $time_5min_ago: DateTime!) {
  EVM(network: bsc, dataset: combined) {
    DEXTradeByTokens(
      where: {
        Trade: {
          Currency: { SmartContract: { is: $currency } }
          Dex: { ProtocolName: { is: "fourmeme_v1" } }
        }
        Block: { Time: { since: $time_24hr_ago } }
      }
    ) {
      Trade {
        Currency {
          Name
          Symbol
          SmartContract
        }
        price_24hr: Price(minimum: Block_Time)
        price_1hr: Price(maximum: Block_Time, if: { Block: { Time: { till_relative: { hours_ago: 1 } } } })
        price_5min: Price(maximum: Block_Time, if: { Block: { Time: { till_relative: { minutes_ago: 5 } } } })
        current: Price(maximum: Block_Time)
      }
      volume_24hr: sum(of: Trade_Side_AmountInUSD)
      volume_1hr: sum(of: Trade_Side_AmountInUSD, if: { Block: { Time: { since: $time_1hr_ago } } })
      volume_5min: sum(of: Trade_Side_AmountInUSD, if: { Block: { Time: { since: $time_5min_ago } } })
      trades_24hr: count
      trades_1hr: count(if: { Block: { Time: { since: $time_1hr_ago } } })
      trades_5min: count(if: { Block: { Time: { since: $time_5min_ago } } })
      change_24hr: calculate(expression: "( $Trade_current - $Trade_price_24hr ) / $Trade_price_24hr * 100")
      change_1hr: calculate(expression: "( $Trade_current - $Trade_price_1hr ) / $Trade_price_1hr * 100")
      change_5min: calculate(expression: "( $Trade_current - $Trade_price_5min ) / $Trade_price_5min * 100")
    }
  }
}`;

export const TOKEN_OHLCV_QUERY = `
query SloanTokenOHLCV($network: evm_network!, $token: String!) {
  EVM(network: $network, dataset: combined) {
    DEXTradeByTokens(
      limit: { count: 24 }
      orderBy: { descendingByField: "Block_Time" }
      where: {
        Trade: {
          Currency: { SmartContract: { is: $token } }
          PriceAsymmetry: { lt: 0.1 }
          Dex: { ProtocolName: { is: "fourmeme_v1" } }
        }
      }
    ) {
      Block {
        Time(interval: { count: 5, in: minutes })
      }
      Trade {
        open: PriceInUSD(minimum: Block_Number)
        close: PriceInUSD(maximum: Block_Number)
        high: PriceInUSD(maximum: Trade_PriceInUSD)
        low: PriceInUSD(minimum: Trade_PriceInUSD)
      }
      volumeUSD: sum(of: Trade_Side_AmountInUSD, selectWhere: { gt: "0" })
    }
  }
}`;

export const TOKEN_LATEST_BUYS_SELLS_QUERY = `
query SloanLatestBuysSells($currency: String!) {
  EVM(network: bsc, dataset: combined) {
    buys: DEXTrades(
      where: {
        Trade: {
          Buy: { Currency: { SmartContract: { is: $currency } } }
          Dex: { ProtocolName: { is: "fourmeme_v1" } }
        }
      }
      orderBy: { descending: Block_Time }
      limit: { count: 20 }
    ) {
      Block { Time }
      Trade {
        Buy { Amount Buyer Price PriceInUSD Seller }
        Sell { Currency { Name Symbol SmartContract } }
      }
      Transaction { Hash }
    }
    sells: DEXTrades(
      where: {
        Trade: {
          Sell: { Currency: { SmartContract: { is: $currency } } }
          Success: true
          Dex: { ProtocolName: { is: "fourmeme_v1" } }
        }
      }
      orderBy: { descending: Block_Time }
      limit: { count: 20 }
    ) {
      Block { Time }
      Trade {
        Sell { Amount Seller Price PriceInUSD Buyer }
        Buy { Currency { Name Symbol SmartContract } }
      }
      Transaction { Hash }
    }
  }
}`;

export const TOP_TRADERS_QUERY = `
query SloanTopTraders($network: evm_network!, $token: String!) {
  EVM(network: $network, dataset: combined) {
    DEXTradeByTokens(
      orderBy: { descendingByField: "volumeUsd" }
      limit: { count: 100 }
      where: { Trade: { Currency: { SmartContract: { is: $token } }, Dex: { ProtocolName: { is: "fourmeme_v1" } } } }
    ) {
      Trade {
        Buyer
        Dex { OwnerAddress ProtocolFamily ProtocolName }
      }
      buyVolume: sum(of: Trade_Amount, if: { Trade: { Side: { Type: { is: buy } } } })
      sellVolume: sum(of: Trade_Amount, if: { Trade: { Side: { Type: { is: sell } } } })
      volume: sum(of: Trade_Amount)
      volumeUsd: sum(of: Trade_Side_AmountInUSD)
    }
  }
}`;

export const DEV_HOLDING_QUERY = `
query SloanDevHolding($token: String!, $address: String!) {
  EVM(network: bsc) {
    TransactionBalances(
      where: {
        TokenBalance: {
          Address: { is: $address }
          Currency: { SmartContract: { is: $token } }
        }
        TransactionStatus: { Success: true }
      }
      limit: { count: 1 }
      orderBy: { descending: Block_Time }
    ) {
      TokenBalance {
        Address
        Currency { Name Symbol SmartContract }
        Balance: PostBalance
        PostBalanceInUSD
        TotalSupply
        TotalSupplyInUSD
      }
      holding_percentage: calculate(expression: "$TokenBalance_Balance / $TokenBalance_TotalSupply * 100")
    }
  }
}`;

export const TOP_HOLDERS_QUERY = `
query SloanTopHolders($token: String!) {
  EVM(network: bsc) {
    TransactionBalances(
      where: {
        TokenBalance: {
          Currency: { SmartContract: { is: $token } }
        }
        TransactionStatus: { Success: true }
      }
      limit: { count: 10 }
      orderBy: { descendingByField: "holding_percentage" }
    ) {
      TokenBalance {
        Address
        Currency { Name Symbol SmartContract }
        Balance: PostBalance(maximum: Block_Time)
        TotalSupply
      }
      holding_percentage: calculate(expression: "$TokenBalance_Balance / $TokenBalance_TotalSupply * 100")
    }
  }
}`;

export const LIQUIDITY_QUERY = `
query SloanLiquidity($token: String!) {
  EVM(dataset: combined, network: bsc) {
    BalanceUpdates(
      where: {
        BalanceUpdate: { Address: { is: "${FOURMEME_PROXY}" } }
        Currency: { SmartContract: { is: $token } }
      }
      orderBy: { descendingByField: "balance" }
    ) {
      Currency { Name Symbol SmartContract }
      balance: sum(of: BalanceUpdate_Amount)
      BalanceUpdate { Address }
    }
  }
}`;

export const MIGRATIONS_QUERY = `
subscription SloanMigrations {
  EVM(network: bsc) {
    Events(
      where: {
        Log: { Signature: { Name: { in: ["PairCreated"] } } }
        Transaction: { To: { is: "${FOURMEME_PROXY}" } }
      }
    ) {
      Arguments {
        Name
        Value { ... on EVM_ABI_Address_Value_Arg { address } }
      }
      Transaction { Hash }
      Block { Time Number }
    }
  }
}`;

export const LIQUIDITY_ADDED_QUERY = `
query SloanLiquidityAdded($limit: Int!) {
  EVM(dataset: realtime, network: bsc) {
    Events(
      limit: { count: $limit }
      where: {
        LogHeader: { Address: { is: "${FOURMEME_PROXY}" } }
        Log: { Signature: { Name: { is: "LiquidityAdded" } } }
      }
    ) {
      Block { Time Number Hash }
      Receipt { ContractAddress }
      TransactionStatus { Success }
      LogHeader { Address Index Data }
      Transaction { Hash From To }
      Arguments {
        Name
        Value {
          ... on EVM_ABI_Address_Value_Arg { address }
          ... on EVM_ABI_BigInt_Value_Arg { bigInteger }
          ... on EVM_ABI_Integer_Value_Arg { integer }
          ... on EVM_ABI_String_Value_Arg { string }
        }
      }
    }
  }
}`;
