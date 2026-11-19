import type {
  AvailabilityStatus,
  GalleryItem,
  ProductColorOption,
  ProductCondition,
  ProductHighlight,
  ProductSpecs,
  ProductType,
} from "./schema";

export interface SeedCollection {
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  heroImage: string;
  featured: boolean;
  sortOrder: number;
}

export interface SeedVariant {
  sku: string;
  condition: ProductCondition;
  storage: string;
  simType?: string;
  colorNote?: string;
  batteryHealth?: string;
  price: number;
  compareAtPrice?: number;
  availability?: AvailabilityStatus;
  stockQty?: number;
  fromOfficialSheet?: boolean;
  priceNote?: string;
}

export interface SeedReview {
  authorName: string;
  authorLocation: string;
  rating: number;
  title: string;
  body: string;
  variantLabel: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  daysAgo: number;
}

export interface SeedProduct {
  slug: string;
  name: string;
  brand: "Apple";
  productType: ProductType;
  series: string;
  releaseYear: number;
  tagline: string;
  description: string;
  collectionSlug: string;
  badge?: string;
  featured: boolean;
  sortOrder: number;
  gallery: GalleryItem[];
  colors: ProductColorOption[];
  specs: ProductSpecs;
  highlights: ProductHighlight[];
  variants: SeedVariant[];
  reviews: SeedReview[];
}

/** Curated real photographs from verified Pexels photographers */
export const P = {
  // iPhone 17 Pro / 17 Pro Max (Orange Cosmique, Blanc Argent, Bleu Profond)
  orangeTriple1: "https://images.pexels.com/photos/34624327/pexels-photo-34624327.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  orangeTriple2: "https://images.pexels.com/photos/34797540/pexels-photo-34797540.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  orangeDual: "https://images.pexels.com/photos/34624326/pexels-photo-34624326.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  silverProHand: "https://images.pexels.com/photos/34018284/pexels-photo-34018284.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  whiteProLaptop: "https://images.pexels.com/photos/31059294/pexels-photo-31059294.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  proWoodTable: "https://images.pexels.com/photos/29020349/pexels-photo-29020349.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  proOfficeHand: "https://images.pexels.com/photos/32141312/pexels-photo-32141312.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",

  // iPhone 15 / 16 Titanium & Unboxing
  ip15ProMaxHand: "https://images.pexels.com/photos/18525573/pexels-photo-18525573.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ip15ProMaxBox: "https://images.pexels.com/photos/18525574/pexels-photo-18525574.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipProDarkDesk: "https://images.pexels.com/photos/30353222/pexels-photo-30353222.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipProMacbook: "https://images.pexels.com/photos/30353223/pexels-photo-30353223.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipProMinimal: "https://images.pexels.com/photos/30353224/pexels-photo-30353224.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipProAutumn: "https://images.pexels.com/photos/40876620/pexels-photo-40876620.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipProCameraClose: "https://images.pexels.com/photos/40130630/pexels-photo-40130630.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",

  // iPhone 14 Series
  ip14ProMaxPair: "https://images.pexels.com/photos/16004744/pexels-photo-16004744.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ip14ProMaxReflect: "https://images.pexels.com/photos/16005007/pexels-photo-16005007.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ip14ScreenTime: "https://images.pexels.com/photos/14979020/pexels-photo-14979020.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ip14GlassReflect: "https://images.pexels.com/photos/18311092/pexels-photo-18311092.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipWhiteBook: "https://images.pexels.com/photos/14557601/pexels-photo-14557601.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",

  // iPhone 13 & Blue Series
  ipBlueDark1: "https://images.pexels.com/photos/14666028/pexels-photo-14666028.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipBlueDark2: "https://images.pexels.com/photos/14666017/pexels-photo-14666017.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipBlueDesk: "https://images.pexels.com/photos/14666034/pexels-photo-14666034.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ip13BlueWood: "https://images.pexels.com/photos/12741170/pexels-photo-12741170.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ip13BlueClose: "https://images.pexels.com/photos/15458049/pexels-photo-15458049.png?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ip13ProBoxGreen: "https://images.pexels.com/photos/13360476/pexels-photo-13360476.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipBlueRound: "https://images.pexels.com/photos/9434650/pexels-photo-9434650.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",

  // iPhone 12 Series & Sealed Boxes
  ip12ProMaxLenses: "https://images.pexels.com/photos/12794487/pexels-photo-12794487.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ip12Table: "https://images.pexels.com/photos/12794488/pexels-photo-12794488.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ip12Box1: "https://images.pexels.com/photos/13570143/pexels-photo-13570143.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ip12Box2: "https://images.pexels.com/photos/13570145/pexels-photo-13570145.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipSealedBox1: "https://images.pexels.com/photos/13570132/pexels-photo-13570132.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipGoldOnBox: "https://images.pexels.com/photos/8183842/pexels-photo-8183842.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipBlackOnBox: "https://images.pexels.com/photos/8381358/pexels-photo-8381358.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipBlackOnBox2: "https://images.pexels.com/photos/8381360/pexels-photo-8381360.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipInWhiteBox: "https://images.pexels.com/photos/5119862/pexels-photo-5119862.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",

  // iPhone 11 & X Series
  ip11ProTriple: "https://images.pexels.com/photos/3571093/pexels-photo-3571093.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ip11ProSilver: "https://images.pexels.com/photos/4071887/pexels-photo-4071887.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ip11ProMaxGreen: "https://images.pexels.com/photos/13367286/pexels-photo-13367286.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ip11WhiteHand: "https://images.pexels.com/photos/10797395/pexels-photo-10797395.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ip11BlackHand: "https://images.pexels.com/photos/4645502/pexels-photo-4645502.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipWhiteStudio: "https://images.pexels.com/photos/3934704/pexels-photo-3934704.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipWhiteBoxUnbox: "https://images.pexels.com/photos/2643698/pexels-photo-2643698.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipXSpaceGray: "https://images.pexels.com/photos/968639/pexels-photo-968639.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipXSilver: "https://images.pexels.com/photos/1647976/pexels-photo-1647976.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipBlackLeather: "https://images.pexels.com/photos/10362039/pexels-photo-10362039.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipDualHold: "https://images.pexels.com/photos/11374459/pexels-photo-11374459.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",

  // Samsung Galaxy S, Z & A
  s25UltraBox: "https://images.pexels.com/photos/30466736/pexels-photo-30466736.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  s25UltraDisplay: "https://images.pexels.com/photos/30466731/pexels-photo-30466731.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  s25UltraDesk: "https://images.pexels.com/photos/30466740/pexels-photo-30466740.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  sUltraSPen: "https://images.pexels.com/photos/30466757/pexels-photo-30466757.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  sUltraHand: "https://images.pexels.com/photos/30466750/pexels-photo-30466750.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  sUltraShelf: "https://images.pexels.com/photos/30466739/pexels-photo-30466739.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  sUltraRear: "https://images.pexels.com/photos/41017698/pexels-photo-41017698.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  sUltraInterior: "https://images.pexels.com/photos/30466737/pexels-photo-30466737.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  zFoldOpen: "https://images.pexels.com/photos/4313857/pexels-photo-4313857.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  zFoldHand: "https://images.pexels.com/photos/19022731/pexels-photo-19022731.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  zFoldCam: "https://images.pexels.com/photos/19022735/pexels-photo-19022735.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  zFlipHand: "https://images.pexels.com/photos/4716356/pexels-photo-4716356.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  samsungSilver: "https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  samsungUnbox: "https://images.pexels.com/photos/41017697/pexels-photo-41017697.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",

  // Apple Equipment & Accessories
  macbookAir1: "https://images.pexels.com/photos/812264/pexels-photo-812264.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  macbookAir2: "https://images.pexels.com/photos/11969081/pexels-photo-11969081.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  macbookAirBox: "https://images.pexels.com/photos/9635252/pexels-photo-9635252.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipadPro1: "https://images.pexels.com/photos/13791392/pexels-photo-13791392.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipadPro2: "https://images.pexels.com/photos/16150336/pexels-photo-16150336.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ipadPro3: "https://images.pexels.com/photos/28870760/pexels-photo-28870760.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  watchUltra1: "https://images.pexels.com/photos/17220094/pexels-photo-17220094.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  watchUltra2: "https://images.pexels.com/photos/17220089/pexels-photo-17220089.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  watchSeries1: "https://images.pexels.com/photos/5081914/pexels-photo-5081914.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  watchSeries2: "https://images.pexels.com/photos/5083218/pexels-photo-5083218.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  airpodsPro1: "https://images.pexels.com/photos/13034999/pexels-photo-13034999.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  airpodsPro2: "https://images.pexels.com/photos/3921845/pexels-photo-3921845.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  airpodsPro3: "https://images.pexels.com/photos/3921817/pexels-photo-3921817.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  airpodsMax1: "https://images.pexels.com/photos/8000618/pexels-photo-8000618.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  airpodsMax2: "https://images.pexels.com/photos/8000610/pexels-photo-8000610.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  airpodsMax3: "https://images.pexels.com/photos/14459030/pexels-photo-14459030.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  chargerApple1: "https://images.pexels.com/photos/3921710/pexels-photo-3921710.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  chargerApple2: "https://images.pexels.com/photos/3921713/pexels-photo-3921713.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  chargerApple3: "https://images.pexels.com/photos/3921708/pexels-photo-3921708.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  magsafe1: "https://images.pexels.com/photos/7742585/pexels-photo-7742585.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  magsafe2: "https://images.pexels.com/photos/10104285/pexels-photo-10104285.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  caseApple1: "https://images.pexels.com/photos/18403789/pexels-photo-18403789.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  caseApple2: "https://images.pexels.com/photos/11938652/pexels-photo-11938652.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",

  // Samsung Accessories
  galaxyBuds1: "https://images.pexels.com/photos/14401717/pexels-photo-14401717.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  galaxyBuds2: "https://images.pexels.com/photos/35599935/pexels-photo-35599935.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  samsungCharger1: "https://images.pexels.com/photos/3921633/pexels-photo-3921633.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  samsungCharger2: "https://images.pexels.com/photos/3921630/pexels-photo-3921630.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",

  // Showroom / Hero
  heroShowroom: "https://images.pexels.com/photos/36680547/pexels-photo-36680547.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  storeInterior: "https://images.pexels.com/photos/11297769/pexels-photo-11297769.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
};
