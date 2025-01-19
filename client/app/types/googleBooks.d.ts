type GoogleBook = {
  kind: string;
  id: string;
  etag: string;
  selfLink: string;
  volumeInfo: GoogleVolumeInfo;
  saleInfo: GoogleSaleInfo;
  accessInfo: GoogleAccessInfo;
  searchInfo?: GoogleSearchInfo; // Optional because it may not always be present
};

type GoogleVolumeInfo = {
  title: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  industryIdentifiers?: IndustryIdentifier[];
  readingModes?: ReadingModes;
  pageCount?: number;
  printType?: string;
  categories?: string[];
  maturityRating?: string;
  allowAnonLogging?: boolean;
  contentVersion?: string;
  panelizationSummary?: PanelizationSummary;
  imageLinks?: ImageLinks;
  language?: string;
  previewLink?: string;
  infoLink?: string;
  canonicalVolumeLink?: string;
};

type GoogleIndustryIdentifier = {
  type: string;
  identifier: string;
};

type GoogleReadingModes = {
  text: boolean;
  image: boolean;
};

type GooglePanelizationSummary = {
  containsEpubBubbles: boolean;
  containsImageBubbles: boolean;
};

type GoogleImageLinks = {
  smallThumbnail?: string;
  thumbnail?: string;
};

type GoogleSaleInfo = {
  country: string;
  saleability: string;
  isEbook: boolean;
};

type GoogleAccessInfo = {
  country: string;
  viewability: string;
  embeddable: boolean;
  publicDomain: boolean;
  textToSpeechPermission: string;
  epub: {
    isAvailable: boolean;
  };
  pdf: {
    isAvailable: boolean;
  };
  webReaderLink?: string;
  accessViewStatus?: string;
  quoteSharingAllowed?: boolean;
};

type GoogleSearchInfo = {
  textSnippet: string;
};
