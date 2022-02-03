import {Services} from '#service';

import {user} from '#utils/log';

import {getElementConfig} from 'extensions/amp-story/1.0/request-utils';

import {assertHttpsUrl} from '../../../src/url';
import {
  Action,
  ShoppingConfigDataDef,
} from '../../amp-story/1.0/amp-story-store-service';

/**
 * @typedef {{
 *  items: !Array<!ShoppingConfigDataDef>,
 * }}
 */
let ShoppingConfigResponseDef;

/**
 * Validates string length of shopping config attributes
 * @param {?string} field
 * @param {?string} value
 * @return {!Array<string>}
 */
function validateRequired(field, value) {
  if (value === undefined) {
    throw Error(`Field ${field} is required.`);
  }
}

/**
 * Validates string length of shopping config attributes
 * @param {?string} field
 * @param {?string} str
 * @param {?number} maxLen
 * @return {!Array<string>}
 */
function validateStringLength(field, str, maxLen = 100) {
  if (str !== undefined && str.length > maxLen) {
    throw Error(
      `Length of ${field} exceeds max length: ${str.length} > ${maxLen}`
    );
  }
}

/**
 * Validates number in shopping config attributes
 * @param {?string} field
 * @param {?number} number
 * @return {!Array<string>}
 */
function validateNumber(field, number) {
  if (number !== undefined && isNaN(number)) {
    throw Error(`Value for field ${field} is not a number`);
  }
}

/**
 * Validates url of shopping config attributes
 * @param {?string} field
 * @param {!Array<string>} url
 * @return {!Array<string>}
 */
function validateURL(field, url) {
  if (url === undefined) {
    /* Not a Required Attribute, return.*/
    return;
  }

  const urls = Array.isArray(url) ? url : [url];

  return urls.map((url) => {
    try {
      assertHttpsUrl(url, `amp-story-shopping-config ${field}`);
    } catch (e) {
      return e.message;
    }
  });
}

/** @private @const {!Object<Array<Function>>} */
const productValidationConfig_ = {
  /* Required Attrs */
  'productId': [validateRequired, validateStringLength],
  'productTitle': [validateRequired, validateStringLength],
  'productPrice': [validateRequired, validateNumber],
  'productImages': [validateRequired, validateURL],
  'productPriceCurrency': [validateRequired, validateStringLength],
  /* Optional Attrs */
  'productColor': [validateStringLength],
  'productSize': [validateStringLength],
  'productIcon': [validateURL],
  'productTagText': [validateStringLength],
  'reviewsData': [validateURL],
  'ctaText': [validateNumber],
  'shippingText': [validateNumber],
};

/**
 * Validates shopping config.
 * @param {!ShoppingConfigDataDef} shoppingConfig
 */
function validateConfig(shoppingConfig) {
  Object.keys(productValidationConfig_).forEach((configKey) => {
    const validationFunctions = productValidationConfig_[configKey];
    validationFunctions.forEach((fn) => {
      try {
        fn(configKey, shoppingConfig[configKey]);
      } catch (err) {
        user().warn('ERROR', `amp-story-shopping-config: ${err}`);
      }
    });
  });
}

/** @typedef {!Object<string, !ShoppingConfigDataDef> */
export let KeyedShoppingConfigDef;

/**
 * Gets Shopping config from an <amp-story-page> element.
 * The config is validated and keyed by 'product-tag-id'.
 * @param {!Element} pageElement <amp-story-page>
 * @return {!Promise<!KeyedShoppingConfigDef>}
 */
export function getShoppingConfig(pageElement) {
  const element = pageElement.querySelector('amp-story-shopping-config');
  return getElementConfig(element).then((config) => {
    for (const configItem of config['items']) {
      validateConfig(configItem);
    }
    return keyByProductTagId(config);
  });
}
/**
 * @param {!ShoppingConfigResponseDef} config
 * @return {!KeyedShoppingConfigDef}
 */
function keyByProductTagId(config) {
  const keyed = {};
  for (const item of config.items) {
    keyed[item.productId] = item;
  }
  return keyed;
}

/**
 * @param {!Element} pageElement
 * @param {!KeyedShoppingConfigDef} config
 * @return {!Promise<!ShoppingConfigResponseDef>}
 */
export function storeShoppingConfig(pageElement, config) {
  const win = pageElement.ownerDocument.defaultView;
  return Services.storyStoreServiceForOrNull(win).then((storeService) => {
    storeService?.dispatch(Action.ADD_SHOPPING_DATA, config);
    return config;
  });
}

export class AmpStoryShoppingConfig extends AMP.BaseElement {
  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);
  }
}
