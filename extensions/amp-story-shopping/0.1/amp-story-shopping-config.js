import {Layout_Enum} from '#core/dom/layout';

import {Services} from '#service';

import {getElementConfig} from 'extensions/amp-story/1.0/request-utils';

import {
  Action,
  ShoppingConfigDataDef,
} from '../../amp-story/1.0/amp-story-store-service';

/**
 * @typedef {{
 *  items: !Array<!ShoppingConfigDataDef>,
 * }}
 */
let ShoppingConfigDef;

const attributeValidators = {
  'required': new Set([
    'productTagId',
    'brandLabel',
    'productTitle',
    'productPrice',
    'productImages',
    'productDetails',
    'productPriceCurrency',
    'reviewsPage',
  ]),
  'optional': new Set([
    'productColor',
    'productSize',
    'productIcon',
    'productTagText',
    'reviewsData',
    'ctaText',
    'shippingText',
  ]),
};

export class AmpStoryShoppingConfig extends AMP.BaseElement {
  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);
    /** @private @const {?../../amp-story/1.0/amp-story-store-service.AmpStoryStoreService} */
    this.storeService_ = null;

    const validateStringLength = [this.validateStringLength_];
    const validateNumber = [this.validateNumber_];
    const validateURL = [this.validateURL_];

    /** @private @const {!Object<Array<Function>>} */
    this.productValidationConfig_ = {
      /* Required Attrs */
      'productTagId': validateStringLength, // Required. String. Keys to amp-story-shopping-tag nodes.
      'brandLabel': validateStringLength, // Required. String.
      'productTitle': validateStringLength, // Required. String.
      'productPrice': validateNumber, // Required. Number.
      'productImages': validateURL, // Required. String or array of strings.
      'productDetails': validateStringLength, // Required. String.
      'reviewsPage': validateURL, // Required if reviews-data. Links to a page where reviews can be read.
      'productPriceCurrency': validateStringLength, // Required. String. ISO 4217 currency code used to display the correct currency symbol.
      /* Optional Attrs */
      'productColor': validateStringLength, // Optional. String.
      'productSize': validateStringLength, // Optional. String.
      'productIcon': validateURL, // Optional. Links to an image. Defaults to a shopping bag icon.
      'productTagText': validateStringLength, // Optional. String.
      'reviewsData': validateURL, // Optional. Links to review data.
      'ctaText': validateNumber, // Optional. Number. Defaults to “Buy now”. Keys to a CTA text option for i18n.
      'shippingText': validateNumber, // Optional. Number. Keys to a shipping text option for i18n. Shipping text will not be rendered if the string is omitted.
    };
  }

  /**
   * Validates shopping config Attributes
   * @param {!ShoppingConfigDataDef} prouductAttrs
   * @param {?string} attribValidatorType
   * @private
   */
  validateAttributes_(prouductAttrs, attribValidatorType = 'required') {
    for (const attrib of attributeValidators[attribValidatorType]) {
      if (!prouductAttrs[attrib]) {
        console.log('missing ' + attribValidatorType + ' attribute ' + attrib);
      }
    }
  }

  /**
   * Validates string length of shopping config attributes
   * @param {string} str
   * @param {?number} maxLen
   * @private
   */
  validateStringLength_(str, maxLen = 100) {
    if (str.length > maxLen) {
      console.log(
        str + ' length exceeds max length: ' + str.length + ' > ' + maxLen
      );
    }
  }

  /**
   * Validates number in shopping config attributes
   * @param {number} number
   * @private
   */
  validateNumber_(number) {
    if (isNaN(number)) {
      console.log(number + ' is not a number ');
    }
  }

  /**
   * Validates url of shopping config attributes
   * @param {string} url
   * @private
   */
  validateURL_(url) {
    //TODO (need to check if string or araay of strings (use typeof?) for 'productImages' )
  }

  /**
   * Validates shopping config.
   * @param {!ShoppingConfigDataDef} shoppingConfig
   * @private
   */
  validateConfig_(shoppingConfig) {
    for (const attr in shoppingConfig) {
      if (attr in this.productValidationConfig_) {
        /* Valid Attribute, run the function array check here */
        for (const validationFunction of this.productValidationConfig_[attr]) {
          validationFunction(shoppingConfig[attr]);
        }
      } else {
        console.log('invalid product attribute: ' + attr);
      }
      this.validateAttributes_(shoppingConfig);
    }
  }

  /**
   * Keys product data to product-ids and adds them to the store service.
   * @param {!ShoppingConfigDef} shoppingConfig
   * @private
   */
  addShoppingDataFromConfig_(shoppingConfig) {
    const productIDtoProduct = {};
    for (const item of shoppingConfig['items']) {
      this.validateConfig_(item);
      productIDtoProduct[item['productTagId']] = item;
    }
    this.storeService_.dispatch(Action.ADD_SHOPPING_DATA, productIDtoProduct);
  }

  /** @override */
  buildCallback() {
    super.buildCallback();
    return Promise.all([
      Services.storyStoreServiceForOrNull(this.win),
      getElementConfig(this.element),
    ]).then(([storeService, storyConfig]) => {
      this.storeService_ = storeService;
      this.addShoppingDataFromConfig_(storyConfig);
    });
  }

  /** @override */
  isLayoutSupported(layout) {
    return layout === Layout_Enum.NODISPLAY;
  }
}
