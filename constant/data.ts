


// ================== onboarding ==================

import { paths } from "@/utils/paths";
import { icons } from "./icon";
import { images } from "./image";


export const networkTypes = [
  { id: "mtn", name: "MTN", icon: icons.mtn },
  { id: "glo", name: "Glo", icon: icons.glo },
  { id: "airtel", name: "Airtel", icon: icons.airtel },
  { id: "9mobile", name: "9Mobile", icon: icons.nineMobile },
]

export const bettingTypes = [
  { id: "sportybet", name: "SportyBet", icon: icons.sportybet },
  { id: "bet365", name: "Bet365", icon: icons.bet365 },
  { id: "bet9ja", name: "Bet9ja", icon: icons.bet9ja },
  { id: "betKing", name: "BetKing", icon: icons.betKing },
  { id: "skybet", name: "SkyBet", icon: icons.skybet },
  { id: "wajegame", name: "WAJEGAME", icon: icons.nineMobile },
]


export const networkMapping = [
  { regex: /^(0702|0704|0803|0806)/, name: "mtn" },
  { regex: /^(0805)/, name: "glo" },
  { regex: /^(0802|0808)/, name: "airtel" },
  { regex: /^(0809|0818)/, name: "9mobile" },
];





export const onBoardingData = [
  {
    id: 1,
    title: "Buy and Sell Gift cards",
    description: "Turn your unused gift cards into instant cash fast, secure, and hassle-free.",
    image: images.onboarding1
  },
  {
    id: 2,
    title: "Trade Cryptocurrencies",
    description: "Convert Bitcoin, Ethereum, and more directly to Naira at competitive rates.",
    image: images.onboarding2
  },
  {
    id: 3,
    title: "Pay Bills and Airtime",
    description: "Top up your phone or settle utility bills, all from one seamless dashboard.",
    image: images.onboarding3
  },
];





export const cryptoData = [
  {
    id: 1,
    title: "Bitcoin",
    abbr: "BTC",
    iconDark: icons.bitcoin,
    iconLight: icons.bitcoin,
    route: `${paths.transfer}`,
  },
  {
    id: 2,
    title: "Ethereum",
    abbr: "ETH",
    iconDark: icons.airtime,
    iconLight: icons.airtime,
    route: `${paths.transfer}`,
  },
  {
    id: 3,
    title: "Solana",
    abbr: "Sol",
    iconDark: icons.Xbox,
    iconLight: icons.Xbox,
    route: `${paths.transfer}`,
  },
  {
    id: 4,
    title: "USDT",
    abbr: "Usdc",
    iconDark: icons.topUp,
    iconLight: icons.topUp,
    route: `${paths.transfer}`,
  },
  {
    id: 5,
    title: "Tron",
    abbr: "TRX",
    iconDark: icons.cableDark,
    iconLight: icons.cable,
    route: `${paths.transfer}`,
  },
  {
    id: 6,
    title: "Litecoin",
    abbr: "LTC",
    iconDark: icons.electricityDark,
    iconLight: icons.electricity,
    route: `${paths.transfer}`,
  },
  {
    id: 7,
    title: "Ripple",
    abbr: "XRP",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.transfer}`,
  }, //DOGE, SHIBAinu, polygon, binancecoin, solana
  {
    id: 8,
    title: "Dogecoin",
    abbr: "DOGE",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.transfer}`,
  },
  {
    id: 9,
    title: "Shiba Inu",
    abbr: "SHIB",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.transfer}`,
  },
  {
    id: 10,
    title: "Polygon",
    abbr: "MATIC",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.transfer}`,
  },
  {
    id: 11,
    title: "Binance Coin",
    abbr: "BNB",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.transfer}`,
  },
  {
    id: 12,
    title: "Solana",
    abbr: "SOL",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.transfer}`,
  },
]




export const giftcardData = [
  {
    id: 1,
    title: "iTunes",
    iconDark: icons.buyGiftCards,
    iconLight: icons.buyGiftCards,
    route: `${paths.giftcards.buyGiftCards}`,
  },
  {
    id: 2,
    title: "Steam",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.giftcards.sellGiftCards}`,
  },
  {
    id: 3,
    title: "Amazon",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.giftcards.sellGiftCards}`,
  },
  {
    id: 4,
    title: "Google Play",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.giftcards.sellGiftCards}`,
  },
  {
    id: 5,
    title: "Apple Store",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.giftcards.sellGiftCards}`,
  },
  {
    id: 6,
    title: "Xbox",
    iconDark: icons.Xbox,
    iconLight: icons.Xbox,
    route: `${paths.giftcards.sellGiftCards}`,
  },
  {
    id: 7,
    title: "Netflix",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.giftcards.sellGiftCards}`,
  },
  {
    id: 8,
    title: "Spotify",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.giftcards.sellGiftCards}`,
  },
  {
    id: 9,
    title: "PayPal",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.giftcards.sellGiftCards}`,
  },
  {
    id: 10,
    title: "Nike",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.giftcards.sellGiftCards}`,
  },
  {
    id: 11,
    title: "Adidas",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.giftcards.sellGiftCards}`,
  },
  {
    id: 12,
    title: "H&M",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.giftcards.sellGiftCards}`,
  },
  {
    id: 13,
    title: "Walmart",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.giftcards.sellGiftCards}`,
  },
  {
    id: 14,
    title: "Best Buy",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.giftcards.sellGiftCards}`,
  },
  {
    id: 15,
    title: "Target",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.giftcards.sellGiftCards}`,
  },
  {
    id: 16,
    title: "Ebay",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.giftcards.sellGiftCards}`,
  },
  {
    id: 17,
    title: "American Express",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.giftcards.sellGiftCards}`,
  },
  {
    id: 18,
    title: "Aliexpress",
    iconDark: icons.sellGiftCardsDark,
    iconLight: icons.sellGiftCards,
    route: `${paths.giftcards.sellGiftCards}`,
  },

]





export const cryptoDatas = [
  {
    id: 1,
    title: "Bitcoin",
    icon: icons.bitcoin,
    type: 'popular',
    abbr: "BTC"
  },
  {
    id: 2,
    title: "Ethereum",
    icon: icons.ethereum,
    type: 'popular',
    abbr: "ETH",
  },
  {
    id: 3,
    title: "Tron",
    icon: icons.tron,
    type: 'popular',
    abbr: "TRX",
  },
  {
    id: 4,
    title: "Solana",
    icon: icons.solana,
    type: 'popular',
    abbr: "SOL",
  },
  {
    id: 5,
    title: "USDT",
    icon: icons.binanceCoin,
    type: 'more',
    abbr: "USDT"
  },
  {
    id: 6,
    title: "Shiba Inu",
    icon: icons.shibaInu,
    type: 'more',
    abbr: "SHIB"
  },
  {
    id: 7,
    title: "Polygon",
    icon: icons.polygon,
    type: 'more',
    abbr: "MATIC"
  },
];



export const giftcardsDatas = [
  { id: 1, title: "iTunes", type: 'popular', icon: icons.itunes },
  { id: 2, title: "Steam", type: 'popular', icon: icons.steam },
  { id: 3, title: "Google Play", type: 'popular', icon: icons.googlePlay },
  { id: 4, title: "Xbox", type: 'popular', icon: icons.Xbox },
  { id: 5, title: "Walmart", type: 'more', icon: icons.walmart },
  { id: 6, title: "American Express", type: 'more', icon: icons.americanExpress },
  { id: 7, title: "Sephora", type: 'more', icon: icons.sephora },
  { id: 8, title: "Visa", type: 'more', icon: icons.visa },
  { id: 9, title: 'googlePlay', type: 'more', icon: icons.googlePlay },
]



export const banksData = [
  {
    id: '1',
    accountnumber: '123456789',
    accountname: 'Aremu Sakamoto',
    name: 'Wema',
    icon: icons.alat,
    abbr: 'ALAT',
    accountType: 'Bank Account',
  },
  {
    id: '2',
    accountnumber: '123456789',
    accountname: 'Aremu Sakamoto',
    name: 'GTBank',
    icon: icons.gtco,
    abbr: 'GTCO',
    accountType: 'Bank Account',
  },
  {
    id: '3',
    accountnumber: '123456789',
    accountname: 'Aremu Sakamoto',
    name: 'First Bank',
    icon: icons.firstbank,
    abbr: 'FIRST',
    accountType: 'Bank Account',
  },
  {
    id: '4',
    accountnumber: '123456789',
    accountname: 'Aremu Sakamoto',
    name: 'Union Bank',
    icon: icons.union,
    abbr: 'UNION',
    accountType: 'Bank Account',
  },
  {
    id: '5',
    accountnumber: '123456789',
    accountname: 'Aremu Sakamoto',
    name: 'Palmpay',
    icon: icons.palmpay,
    accountType: 'Bank Account',
  },
  {
    id: '6',
    accountnumber: '123456789',
    accountname: 'Aremu Sakamoto',
    name: 'Sterling',
    icon: icons.sterling,
    accountType: 'Bank Account',
  },
  {
    id: '7',
    accountnumber: '123456789',
    accountname: 'Aremu Sakamoto',
    name: 'Kuda',
    icon: icons.kuda,
    accountType: 'Bank Account',
  },
]





export const accountsData = [
  {
    id: '1',
    name: 'Aremu Sakamoto',
    accountType: 'Account Number',
    details: null,
    icon: 'Xbox', // You can change this to match your actual icon names
  },
  {
    id: '2',
    name: 'Aremu Sakamoto',
    accountType: 'Bank Account',
    details: 'Zenith bank | 1234567890',
    icon: 'Xbox',
  },
  {
    id: '3',
    name: 'John Doe',
    accountType: 'Bank Account',
    details: 'Access bank | 0987654321',
    icon: 'Xbox',
  },
  {
    id: '4',
    name: 'Jane Smith',
    accountType: 'Account Number',
    details: null,
    icon: 'Xbox',
  },
  {
    id: '5',
    name: 'Michael Johnson',
    accountType: 'Bank Account',
    details: 'GTBank | 1122334455',
    icon: 'Xbox',
  },
  {
    id: '6',
    name: 'Sarah Williams',
    accountType: 'Bank Account',
    details: 'First Bank | 5566778899',
    icon: 'Xbox',
  },
];



export type FilterOption = {
  id: string;
  label: string;
  value: string;
};


export const defaultCategories: FilterOption[] = [
  { id: "data", label: "Data", value: "data" },
  { id: "cable", label: "Cable", value: "cable" },
  { id: "debit", label: "Debit", value: "debit" },
  { id: "deposit", label: "Deposit", value: "credit" },
  { id: "airtime", label: "Airtime", value: "airtime" },
  { id: "crypto", label: "Crypto", value: "crypto" },
  { id: "giftcard", label: "Giftcard", value: "giftcard" },





  { id: "transfer", label: "Transfer", value: "transfer" },
  { id: "betting", label: "Betting", value: "betting" },
  { id: "electricity", label: "Electricity", value: "electricity" },
];



export const filterStatus = [
  { id: "failed", label: "Failed", value: "failed" },
  { id: "pending", label: "Pending", value: "pending" },
  { id: "success", label: "Successful", value: "success" },
];



